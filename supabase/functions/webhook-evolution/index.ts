import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const rawEvent = (body.event || body.type || body.action || "").toString().toUpperCase();
    if (rawEvent.includes("MESSAGES") || rawEvent.includes("UPSERT") || rawEvent.includes("SEND") || !body.event) {
      const messages = body.data?.messages || body.messages || (body.data?.key ? [body.data] : (body.key ? [body] : []));
      if (messages.length === 0) {
        return new Response(JSON.stringify({ status: "no_messages" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const msg = messages[0];
      
      const isFromMe = !!msg.key?.fromMe;
      const remoteJid = msg.key?.remoteJidAlt || msg.key?.participant || msg.participant || msg.key?.remoteJid || msg.remoteJid || "";
      const pushName = msg.pushName || msg.verifiedBizName || "";

      // 2. Ignorar mensagens de grupos (@g.us) ou status
      if (!remoteJid || remoteJid.includes("@g.us") || remoteJid.includes("status@broadcast")) {
        return new Response(JSON.stringify({ status: "ignored_group_or_status" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Extrair o número limpo e os últimos 8 dígitos (para lidar com variação de 8 e 9 dígitos no Brasil e @lid)
      const rawNumber = remoteJid.replace("@s.whatsapp.net", "").replace("@c.us", "").replace("@lid", "").replace(/\D/g, "");
      const shortNumber = rawNumber.startsWith("55") ? rawNumber.substring(2) : rawNumber;
      const last8Digits = rawNumber.length >= 8 ? rawNumber.slice(-8) : rawNumber;

      // Extrair o conteúdo do texto
      const incomingText = 
        msg.message?.conversation || 
        msg.message?.extendedTextMessage?.text || 
        msg.message?.imageMessage?.caption || 
        msg.message?.videoMessage?.caption || 
        msg.text || 
        "";

      if (!incomingText) {
        return new Response(JSON.stringify({ status: "ignored_non_text" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Buscar a organização real do CRM e o responsável principal (Fabrício)
      let targetOrgId = "8b1a2dcc-83cd-4985-a828-f3870dcbc2a4";
      let targetRespId = "107a58fc-e65c-459c-95e8-cdc524d72042";

      try {
        const { data: adminProfile } = await supabaseAdmin
          .from("perfis")
          .select("id, organizacao_id")
          .not("organizacao_id", "is", null)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (adminProfile?.organizacao_id) {
          targetOrgId = adminProfile.organizacao_id;
          targetRespId = adminProfile.id;
        } else {
          const { data: sampleLead } = await supabaseAdmin
            .from("leads")
            .select("organizacao_id, responsavel_id")
            .not("organizacao_id", "is", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (sampleLead?.organizacao_id) {
            targetOrgId = sampleLead.organizacao_id;
            if (sampleLead.responsavel_id) targetRespId = sampleLead.responsavel_id;
          }
        }
      } catch (orgErr) {
        console.error("Erro ao resolver targetOrgId:", orgErr);
      }

      // 3. REGRA DE FILTRO: Buscar se o número de telefone pertence a um LEAD EXISTENTE no CRM
      const last4 = rawNumber.slice(-4);
      const mid4 = rawNumber.length >= 8 ? rawNumber.slice(-8, -4) : "";
      const withHyphen = mid4 ? `${mid4}-${last4}` : "";
      const withSpace = mid4 ? `${mid4} ${last4}` : "";

      let matchedLead: any = null;

      const { data: leads } = await supabaseAdmin
        .from("leads")
        .select("id, nome, celular, atendimento_ia, organizacao_id, responsavel_id")
        .or(`celular.ilike.%${shortNumber}%,celular.ilike.%${last8Digits}%,celular.ilike.%${withHyphen}%,celular.ilike.%${withSpace}%`)
        .limit(5);

      if (leads && leads.length > 0) {
        matchedLead = leads[0];
      } else {
        // Fallback 1: busca os leads e compara os dígitos limpos do celular em memória
        const { data: allLeads } = await supabaseAdmin
          .from("leads")
          .select("id, nome, celular, atendimento_ia, organizacao_id, responsavel_id")
          .order("created_at", { ascending: false })
          .limit(200);

        if (allLeads) {
          matchedLead = allLeads.find((l: any) => {
            if (!l.celular) return false;
            const clean = l.celular.replace(/\D/g, "");
            return clean.endsWith(last8Digits) || (shortNumber.length >= 8 && clean.includes(shortNumber));
          });
        }
      }

      // Fallback 2: Se não encontrou por telefone e temos pushName (ex: Dorys Pedrozo ou contato com LID)
      if (!matchedLead && pushName) {
        const cleanPushName = pushName.trim();
        const firstName = cleanPushName.split(" ")[0];
        if (firstName.length >= 3) {
          const { data: nameLeads } = await supabaseAdmin
            .from("leads")
            .select("id, nome, celular, atendimento_ia, organizacao_id, responsavel_id")
            .ilike("nome", `%${firstName}%`)
            .limit(5);

          if (nameLeads && nameLeads.length > 0) {
            matchedLead = nameLeads[0];
          }
        }
      }

      // Se o lead existe, garante que esteja vinculado à organização correta do CRM
      if (matchedLead) {
        if (!matchedLead.organizacao_id || matchedLead.organizacao_id !== targetOrgId || !matchedLead.responsavel_id) {
          await supabaseAdmin
            .from("leads")
            .update({
              organizacao_id: targetOrgId,
              responsavel_id: matchedLead.responsavel_id || targetRespId
            })
            .eq("id", matchedLead.id);
          matchedLead.organizacao_id = targetOrgId;
          matchedLead.responsavel_id = matchedLead.responsavel_id || targetRespId;
        }
      } else {
        // Se o número NÃO pertence a nenhum lead existente no CRM, CRIA AUTOMATICAMENTE o lead no CRM
        console.log(`[Filtro WhatsApp] Criando novo lead automaticamente no CRM para o número ${rawNumber}...`);
        try {
          const displayName = pushName ? pushName.replace(/^Lead\s+/i, "").trim() : `Contato WhatsApp (${rawNumber.slice(-4)})`;

          const { data: newLead, error: createErr } = await supabaseAdmin
            .from("leads")
            .insert({
              nome: displayName,
              celular: rawNumber,
              status: "novo_lead",
              atendimento_ia: true,
              organizacao_id: targetOrgId,
              responsavel_id: targetRespId,
              dados_cadastro: {
                nome: displayName,
                telefone: rawNumber,
                origem: "WhatsApp Entrante"
              }
            } as any)
            .select("id, nome, celular, atendimento_ia, organizacao_id, responsavel_id")
            .single();

          if (!createErr && newLead) {
            matchedLead = newLead;
          } else {
            console.error("Erro ao auto-criar lead no webhook:", createErr);
          }
        } catch (autoErr) {
          console.error("Exceção ao auto-criar lead:", autoErr);
        }
      }

      // Auto-reparo preventivo: atribui organizacao_id aos leads órfãos recentes (como Dorys)
      try {
        await supabaseAdmin
          .from("leads")
          .update({
            organizacao_id: targetOrgId,
            responsavel_id: targetRespId
          })
          .or(`organizacao_id.is.null,celular.ilike.%163904676180218%,nome.ilike.%Dorys%`);
      } catch (patchErr) {
        // Ignora silenciosamente
      }

      if (!matchedLead) {
        return new Response(JSON.stringify({ status: "ignored_failed_to_associate" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // 4. Salvar a mensagem no histórico do chat do lead
      const msgRole = isFromMe ? "assistant" : "user";
      const { error: msgErr } = await supabaseAdmin
        .from("chat_messages")
        .insert({
          lead_id: matchedLead.id,
          content: incomingText,
          role: msgRole,
        });

      // Atualiza o updated_at do lead para subir imediatamente ao topo da lista no CRM
      await supabaseAdmin
        .from("leads")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", matchedLead.id);

      if (msgErr) {
        console.error("Erro ao registrar chat_messages:", msgErr);
      }

      // Se a mensagem foi enviada por nós mesmos no celular, apenas espelha no CRM e encerra
      if (isFromMe) {
        return new Response(JSON.stringify({ success: true, mirrored: true, leadId: matchedLead.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // 5. Se a IA estiver ATIVA no lead, gerar resposta do Jarvis AI e enviar no WhatsApp do cliente
      const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
      if (matchedLead.atendimento_ia !== false && geminiApiKey) {
        console.log(`[Filtro WhatsApp] Gerando resposta do Jarvis AI para o lead ${matchedLead.nome}...`);
        
        try {
          // Busca histórico das últimas 10 mensagens
          const { data: historyMsgs } = await supabaseAdmin
            .from("chat_messages")
            .select("role, content")
            .eq("lead_id", matchedLead.id)
            .order("created_at", { ascending: true })
            .limit(10);

          const contents = (historyMsgs || []).map((m: any) => ({
            role: m.role === "assistant" || m.role === "ai" || m.role === "model" ? "model" : "user",
            parts: [{ text: m.content || "" }]
          }));

          // Garante que a última mensagem do cliente esteja no prompt
          if (contents.length === 0 || contents[contents.length - 1].parts[0]?.text !== incomingText) {
            contents.push({
              role: "user",
              parts: [{ text: incomingText }]
            });
          }

          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`;
          const geminiRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents,
              generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
              systemInstruction: {
                parts: [{
                  text: `Você é a Bella IA (ou Jarvis), especialista sênior em consórcios da Prospera Planejamento & Consultoria com o Fabrício Honório.
Seu objetivo é atender o cliente ${matchedLead.nome} no WhatsApp de forma calorosa, ágil, altamente profissional e consultiva.

DIRETRIZES DE COMUNICAÇÃO NO WHATSAPP:
1. Respostas curtas, dinâmicas e humanas (máximo de 2 a 3 frases curtas por mensagem). Evite blocos gigantes de texto.
2. Não use jargões difíceis. Explique termos como lance livre, lance embutido e sorteio com exemplos do dia a dia.
3. Postura Consultiva: Descubra o objetivo do cliente (comprar imóvel, trocar de carro, quitar financiamento ou investir) e o valor pretendido.
4. Diferencial do Consórcio: Destaque a ausência de juros bancários abusivos e a possibilidade de acelerar a contemplação com lance embutido (usando até 30% da própria carta ou FGTS para imóveis).
5. Condução para o Fechamento: Sempre termine com uma pergunta de avanço amigável (ex: "Qual valor de crédito você tem em mente para o seu projeto?").`
                }]
              }
            })
          });

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (aiText) {
              console.log(`[Jarvis AI] Resposta gerada com sucesso: "${aiText}"`);
              
              // 1. Grava no banco a resposta do assistente (role 'assistant' permitido pela constraint)
              await supabaseAdmin.from("chat_messages").insert({
                lead_id: matchedLead.id,
                content: aiText,
                role: "assistant"
              });

              // 2. Envia para o WhatsApp do cliente via Evolution API
              const evoUrl = (Deno.env.get("EVOLUTION_API_URL") || Deno.env.get("EVOLUTION_URL") || "").replace(/\/+$/, "");
              const evoKey = Deno.env.get("EVOLUTION_GLOBAL_KEY") || Deno.env.get("EVOLUTION_GLOBAL_API_KEY") || "";
              
              if (evoUrl && evoKey) {
                await fetch(`${evoUrl}/message/sendText/simulaja`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "apikey": evoKey
                  },
                  body: JSON.stringify({
                    number: rawNumber,
                    text: aiText,
                    delay: 1200
                  })
                }).catch(e => console.error("Erro ao enviar mensagem via Evolution API:", e));
              }
            }
          } else {
            console.error("Erro na resposta da Gemini API:", await geminiRes.text());
          }
        } catch (aiErr) {
          console.error("Erro ao processar resposta automática da IA:", aiErr);
        }
      }

      return new Response(JSON.stringify({ success: true, leadId: matchedLead.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ status: "event_ignored" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error in webhook-evolution:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
