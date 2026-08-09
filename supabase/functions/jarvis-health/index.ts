// Endpoint de diagnóstico rápido do Jarvis.
// Não substitui o jarvis-ai — só testa se as chaves estão presentes e
// se a API do Gemini (e opcionalmente da OpenAI) respondem, sem gastar
// tokens de uma conversa real.
//
// Chame via: GET/POST {SUPABASE_URL}/functions/v1/jarvis-health

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const result: Record<string, unknown> = {
    gemini_key_present: false,
    gemini_reachable: false,
    openai_key_present: false,
    openai_reachable: false,
    error_detail: null as string | null,
  };

  try {
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    result.gemini_key_present = Boolean(geminiKey);

    if (geminiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "ping" }] }],
            generationConfig: { maxOutputTokens: 5 },
          }),
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.candidates?.[0]) {
          result.gemini_reachable = true;
        } else {
          result.error_detail = `Gemini respondeu status=${res.status} statusText=${res.statusText} error=${JSON.stringify(data?.error) ?? "sem detalhe"}`;
        }
      } catch (e: any) {
        result.error_detail = `Exceção de rede ao chamar o Gemini: ${e?.message || e}`;
      }
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    result.openai_key_present = Boolean(openaiKey);

    if (openaiKey) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 5,
          }),
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.choices?.[0]) {
          result.openai_reachable = true;
        } else if (!result.error_detail) {
          result.error_detail = `OpenAI respondeu status=${res.status} statusText=${res.statusText} error=${JSON.stringify(data?.error) ?? "sem detalhe"}`;
        }
      } catch (e: any) {
        if (!result.error_detail) {
          result.error_detail = `Exceção de rede ao chamar a OpenAI: ${e?.message || e}`;
        }
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    result.error_detail = `Erro interno no health check: ${err?.message || err}`;
    return new Response(JSON.stringify(result), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
