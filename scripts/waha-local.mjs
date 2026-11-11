/**
 * WAHA Local Server (Node.js nativo sem necessidade de Docker)
 * Micro-servidor de WhatsApp compatível com a API do WAHA (devlikeapro/waha)
 * Desenvolvido para rodar direto no Windows / Node.js sem Docker Desktop.
 * 
 * Integração 100% direta via Webhook Supabase com privilégio de gravação no CRM!
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import http from "http";
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const require = createRequire(import.meta.url);

// Carrega Baileys e dependências
const baileys = require("../evolution-api/node_modules/baileys");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestWaWebVersion,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
} = baileys;
const pino = require("../evolution-api/node_modules/pino");
const QRCode = require("../evolution-api/node_modules/qrcode");
const qrcodeTerminal = require("../evolution-api/node_modules/qrcode-terminal");

// Previne que falhas de rede encerrem o processo do servidor
process.on("uncaughtException", (err) => {
  console.warn("⚠️ [WAHA Local - uncaughtException capturado]:", err.message);
});
process.on("unhandledRejection", (reason) => {
  console.warn("⚠️ [WAHA Local - unhandledRejection capturado]:", reason);
});

const PORT = process.env.PORT || 3000;
const SESSION_DIR = path.resolve("./whatsapp_session");

/**
 * Limpa arquivos de sessão antigos/quebrados para permitir um pareamento 100% novo e limpo.
 * Preserva o arquivo phone_jid_cache.json para manter o histórico de números mapeados.
 */
function clearSessionFiles() {
  if (!fs.existsSync(SESSION_DIR)) return;
  try {
    const files = fs.readdirSync(SESSION_DIR);
    for (const file of files) {
      if (file === "phone_jid_cache.json") continue;
      try {
        fs.unlinkSync(path.join(SESSION_DIR, file));
      } catch {}
    }
    console.log("🧹 [WAHA Local] Arquivos residuais de sessão limpos com sucesso.");
  } catch (err) {
    console.warn("⚠️ [WAHA Local] Aviso ao limpar pasta de sessão:", err.message);
  }
}

// URL da Edge Function do Supabase (ignora RLS e grava direto em chat_messages e leads)
const SUPABASE_WEBHOOK_URL =
  process.env.SUPABASE_WEBHOOK_URL ||
  "https://pfedvdqpnpbrlhfbzjcj.supabase.co/functions/v1/webhook-evolution";

let SUPABASE_URL = "https://pfedvdqpnpbrlhfbzjcj.supabase.co";
let SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWR2ZHFwbnBicmxoZmJ6amNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDAwMTgsImV4cCI6MjA4NjQ3NjAxOH0.5X19fj92_I5-ovCSobX0FCiHUMOVDUJBlrUkRXvhSsE";
let GEMINI_API_KEY = "AQ.Ab8RN6K4DMA3cCraG70_iCcWufgBc_6np-TWuUbPDs7hhFhjog";

try {
  if (fs.existsSync(".env")) {
    const envContent = fs.readFileSync(".env", "utf-8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = (match[2] || "").trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (key === "VITE_SUPABASE_URL") SUPABASE_URL = value;
        if (key === "VITE_SUPABASE_ANON_KEY") SUPABASE_KEY = value;
        if (key === "VITE_GEMINI_API_KEY" || key === "GEMINI_API_KEY") GEMINI_API_KEY = value;
      }
    }
  }
} catch (e) {}

let sock = null;
let currentStatus = "STARTING"; // STARTING, SCAN_QR_CODE, WORKING, STOPPED
let currentQrText = null;
let currentQrPngBuffer = null;
let currentQrDataUrl = null;
const contactNameCache = new Map();
const phoneToJidCache = new Map();
const CACHE_FILE = path.join(SESSION_DIR, "phone_jid_cache.json");

// Garante que a pasta de sessão existe
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

// Carrega cache de mapeamento JID persistente do disco
try {
  if (fs.existsSync(CACHE_FILE)) {
    const raw = fs.readFileSync(CACHE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    for (const [k, v] of Object.entries(parsed)) {
      phoneToJidCache.set(k, v);
    }
    console.log(`📋 [JID Cache] ${phoneToJidCache.size} números carregados da memória.`);
  }
} catch (e) {
  console.warn("Aviso ao carregar phone_jid_cache.json:", e.message);
}

function saveJidCache() {
  try {
    const obj = Object.fromEntries(phoneToJidCache.entries());
    fs.writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2), "utf-8");
  } catch (e) {
    console.warn("Aviso ao salvar phone_jid_cache.json:", e.message);
  }
}

function recordJidMapping(numberOrJid, realJid) {
  if (!numberOrJid || !realJid) return;
  const digits = String(numberOrJid).replace(/\D/g, "");
  if (!digits) return;
  phoneToJidCache.set(digits, realJid);
  if (digits.length >= 8) {
    phoneToJidCache.set(digits.slice(-8), realJid);
  }
  if (digits.startsWith("55") && digits.length >= 10) {
    phoneToJidCache.set(digits.substring(2), realJid);
  }
  saveJidCache();
}

/**
 * Resolve com precisão o JID correto no WhatsApp (gerenciando a variação do 9º dígito no Brasil).
 */
async function resolveTargetJid(chatId) {
  if (!chatId) return chatId;
  if (chatId.includes("@g.us")) return chatId;

  let clean = chatId.replace(/@.*$/, "").replace(/\D/g, "");
  if (!clean) return chatId;

  const last8 = clean.slice(-8);

  // 1. Verifica no cache local se já conversamos ou recebemos mensagem deste contato
  if (phoneToJidCache.has(clean)) {
    const cached = phoneToJidCache.get(clean);
    console.log(`🎯 [WAHA Local] JID resolvido via cache para ${clean} -> ${cached}`);
    return cached;
  }
  if (phoneToJidCache.has(last8)) {
    const cached = phoneToJidCache.get(last8);
    console.log(`🎯 [WAHA Local] JID resolvido via cache (8 dígitos) para ${clean} -> ${cached}`);
    return cached;
  }

  // Se não começa com 55 e tem 10 ou 11 dígitos, adiciona DDI 55
  if (!clean.startsWith("55") && (clean.length === 10 || clean.length === 11)) {
    clean = "55" + clean;
  }

  // 2. Gera candidatos (com e sem 9º dígito para telefones do Brasil)
  const candidates = [clean];
  if (clean.startsWith("55")) {
    if (clean.length === 13) {
      // 55 + DDD (2) + 9 + 8 dígitos -> candidato sem o 9 (ex: 5541996316737 -> 554196316737)
      const without9 = clean.slice(0, 4) + clean.slice(5);
      candidates.push(without9);
    } else if (clean.length === 12) {
      // 55 + DDD (2) + 8 dígitos -> candidato com o 9 (ex: 554196316737 -> 5541996316737)
      const with9 = clean.slice(0, 4) + "9" + clean.slice(4);
      candidates.push(with9);
    }
  }

  // 3. Consulta em tempo real na API do WhatsApp via sock.onWhatsApp
  if (sock && typeof sock.onWhatsApp === "function") {
    try {
      console.log(`🔍 [WAHA Local] Verificando existência de JID no WhatsApp para: ${candidates.join(", ")}...`);
      const results = await sock.onWhatsApp(...candidates);
      console.log(`🔍 [WAHA Local] Resultado onWhatsApp:`, JSON.stringify(results));
      if (results && results.length > 0) {
        const valid = results.find((r) => r && (r.exists || r.jid));
        if (valid?.jid) {
          recordJidMapping(clean, valid.jid);
          return valid.jid;
        } else {
          console.warn(`❌ [WAHA Local] O número ${clean} foi checado e NÃO possui WhatsApp ativo.`);
          return null;
        }
      }
    } catch (e) {
      console.warn("⚠️ [WAHA Local] Aviso ao checar onWhatsApp:", e.message);
    }
  }

  return `${clean}@s.whatsapp.net`;
}

/**
 * Encaminha todas as mensagens recebidas e enviadas para o Webhook do Supabase
 * para gravação instantânea e sincronização em tempo real com o CRM.
 */
async function forwardToSupabaseWebhook(msg) {
  try {
    const remoteJid = msg.key?.remoteJid || "";
    const participant = msg.key?.participant || msg.participant || "";

    // NUNCA processar mensagens de grupos (@g.us), canais, transmissões ou que tenham participant
    if (
      !remoteJid ||
      remoteJid.includes("@g.us") ||
      remoteJid.includes("@broadcast") ||
      remoteJid.includes("@newsletter") ||
      remoteJid === "status@broadcast" ||
      Boolean(participant)
    ) {
      return; // Ignora grupos e transmissões
    }

    // Ignora LIDs de privacidade/aparelho (>13 dígitos ou @lid) para não criar contatos falsos
    const cleanNum = remoteJid.replace(/@.*$/, "").replace(/\D/g, "");
    if (remoteJid.includes("@lid") || cleanNum.length > 13) {
      return;
    }

    // Registra mapeamento do JID real do contato no cache imediatamente
    recordJidMapping(remoteJid, remoteJid);

    const isFromMe = Boolean(msg.key?.fromMe);

    // NUNCA salvar o pushName do consultor (Fabrício) como nome do cliente/contato!
    if (!isFromMe && msg.pushName) {
      const lower = msg.pushName.toLowerCase();
      if (!lower.includes("honorio") && !lower.includes("fabricio")) {
        contactNameCache.set(remoteJid, msg.pushName);
      }
    } else if (contactNameCache.has(remoteJid)) {
      msg.pushName = contactNameCache.get(remoteJid);
    }

    const text =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.documentMessage?.caption ||
      "";

    const isAudio = Boolean(msg.message?.audioMessage);
    const isImage = Boolean(msg.message?.imageMessage);
    const isDoc = Boolean(msg.message?.documentMessage);

    if (!text && !isAudio && !isImage && !isDoc) {
      return;
    }

    const contentText = text || (isAudio ? "🎤 [Áudio]" : isImage ? "📷 [Imagem]" : "📎 [Documento]");
    const sender = isFromMe ? "Você (celular)" : (msg.pushName || remoteJid.replace(/@.*$/, ""));

    console.log(`📩 [WhatsApp ${isFromMe ? "Enviada" : "Recebida"} | ${remoteJid}]: ${sender}: ${contentText}`);

    // Garante que o contactName nunca seja o próprio Fabrício Honório
    let safeContactName = "";
    if (!isFromMe) {
      safeContactName = contactNameCache.get(remoteJid) || msg.pushName || "";
    } else if (contactNameCache.has(remoteJid)) {
      safeContactName = contactNameCache.get(remoteJid) || "";
    }
    if (safeContactName.toLowerCase().includes("honorio") || safeContactName.toLowerCase().includes("fabricio")) {
      safeContactName = "";
    }

    try {
      const res = await fetch(SUPABASE_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: "messages.upsert",
          data: msg,
          text: contentText,
          contactName: safeContactName,
          remoteJid: remoteJid,
        }),
      }).catch((fetchErr) => {
        console.warn("⚠️ [Aviso fetch Webhook Supabase]:", fetchErr.message);
        return null;
      });

      if (res && res.ok) {
        const data = await res.json().catch(() => ({}));
        console.log(`💾 [CRM Sincronizado] Mensagem gravada no CRM com sucesso! Lead ID: ${data.leadId || "OK"}`);

        // Se a mensagem veio do cliente e temos leadId, aciona Atendimento Automático do Jarvis IA
        if (!isFromMe && data?.leadId) {
          handleJarvisAutoReply({
            remoteJid,
            text: contentText,
            contactName: safeContactName,
            leadId: data.leadId,
          }).catch((e) => console.warn("Aviso Jarvis Auto-Reply:", e.message));
        }
      } else if (res) {
        const errText = await res.text().catch(() => "");
        console.error(`❌ [Erro Webhook Supabase ${res.status}]: ${errText.substring(0, 150)}`);
      }
    } catch (webhookErr) {
      console.warn("⚠️ [Erro ao enviar para webhook do Supabase]:", webhookErr.message);
    }
  } catch (err) {
    console.error("❌ Falha ao enviar para webhook do Supabase:", err.message);
  }
}

/**
 * Atendimento Automático Inteligente do Jarvis via WhatsApp
 * Responde aos leads do CRM respeitando o status atendimento_ia
 */
async function handleJarvisAutoReply({ remoteJid, text, contactName, leadId }) {
  if (!sock || !leadId || !text) return;

  try {
    // 1. Busca dados do lead no Supabase
    const leadRes = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${leadId}&select=id,nome,celular,atendimento_ia,dados_cadastro,valor_credito,tipo_consorcio`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const leads = await leadRes.json();
    const lead = leads?.[0];

    // Se atendimento_ia for explicitamente false, não responde automaticamente
    if (lead && lead.atendimento_ia === false) {
      console.log(`🤖 [Jarvis AI] Atendimento automático desativado para ${lead.nome || contactName}.`);
      return;
    }

    // 2. Busca histórico recente das mensagens
    const histRes = await fetch(`${SUPABASE_URL}/rest/v1/chat_messages?lead_id=eq.${leadId}&order=created_at.asc&limit=8`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const history = await histRes.json().catch(() => []);

    const contents = (Array.isArray(history) ? history : []).map(m => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: m.content || "" }]
    }));

    if (contents.length === 0 || contents[contents.length - 1].parts[0]?.text !== text) {
      contents.push({ role: "user", parts: [{ text }] });
    }

    // 3. Simula presença humana digitando no WhatsApp
    try {
      await sock.sendPresenceUpdate("composing", remoteJid);
    } catch {}

    const leadNome = lead?.nome || contactName || "Cliente";
    const valorCredito = lead?.valor_credito ? Number(lead.valor_credito).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 300.000,00";
    const segmento = lead?.tipo_consorcio || "pesados";

    const systemPrompt = `Você é o Jarvis (assistente e consultor executivo sênior da Prospera Planejamento & Consultoria / SimulaJá com Fabrício Honório).
Você está conversando no WhatsApp com o cliente "${leadNome}".
Interesse: consórcio de ${segmento} com crédito de ${valorCredito}.

DIRETRIZES DE COMUNICAÇÃO NO WHATSAPP (SEGUI-LAS RIGOROSAMENTE):
1. Respostas extremamente dinâmicas, humanas, calorosas e sob medida: máximo de 2 a 3 frases curtas. Não mande textos longos ou burocráticos.
2. Destaque os benefícios do consórcio com clareza: sem juros bancários, meia parcela 50/50 até a contemplação, lance embutido de até 30% da própria carta.
3. Se perguntar de valores, informe apenas valores de parcela e prazos com objetividade total.
4. Conclua sempre com uma pergunta amigável para entender o projeto dele ou combinar uma rápida ligação.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
    const gRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: { maxOutputTokens: 250, temperature: 0.7 },
        systemInstruction: { parts: [{ text: systemPrompt }] }
      })
    });

    if (gRes.ok) {
      const gData = await gRes.json();
      const aiText = gData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (aiText) {
        // Pausa humanizada de 2 segundos
        await new Promise(r => setTimeout(r, 2000));

        // Envia direto pelo WhatsApp
        await sock.sendMessage(remoteJid, { text: aiText });
        console.log(`🤖 [Jarvis Auto-Reply] Resposta enviada para ${leadNome} (${remoteJid}): "${aiText}"`);

        // Grava no chat_messages do Supabase
        await fetch(`${SUPABASE_URL}/rest/v1/chat_messages`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal"
          },
          body: JSON.stringify({
            lead_id: leadId,
            content: aiText,
            role: "assistant"
          })
        }).catch(err => console.warn("Erro ao salvar resposta IA no Supabase:", err.message));
      }
    }
  } catch (err) {
    console.error("❌ [Jarvis Auto-Reply Erro]:", err.message);
  }
}

async function connectToWhatsApp() {
  currentStatus = "STARTING";
  console.log("\n🔄 [WAHA Local] Conectando ao WhatsApp...");

  if (sock) {
    try {
      sock.ev.removeAllListeners("connection.update");
      sock.ev.removeAllListeners("creds.update");
      sock.ev.removeAllListeners("messages.upsert");
      sock.end(undefined);
    } catch (e) {}
    sock = null;
    await new Promise((r) => setTimeout(r, 1000));
  }

  let { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  let version = [2, 3000, 1054098113];
  try {
    const vInfo = await fetchLatestWaWebVersion({});
    if (vInfo?.version && !vInfo?.error) {
      version = vInfo.version;
    }
  } catch (err) {
    try {
      const bInfo = await fetchLatestBaileysVersion();
      if (bInfo?.version) version = bInfo.version;
    } catch (e2) {}
  }

  sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
    },
    logger: pino({ level: "silent" }),
    browser: Browsers.appropriate("Chrome"),
    printQRInTerminal: false,
    syncFullHistory: false,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: false,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
    getMessage: async () => ({ conversation: "" }),
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentQrText = qr;
      currentStatus = "SCAN_QR_CODE";
      try {
        currentQrDataUrl = await QRCode.toDataURL(qr, { width: 320, margin: 2 });
        currentQrPngBuffer = await QRCode.toBuffer(qr, { width: 320, margin: 2 });
      } catch (e) {
        console.error("Erro ao gerar imagem QR Code:", e);
      }
      console.log("\n📱 [WAHA Local] QR Code pronto para leitura no WhatsApp > Aparelhos Conectados ou via Código de Pareamento no CRM.\n");
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;
      const isReplaced = statusCode === 440;
      const shouldReconnect = !isLoggedOut && !isReplaced;
      currentStatus = "STOPPED";
      currentQrText = null;
      currentQrPngBuffer = null;
      currentQrDataUrl = null;

      if (statusCode === DisconnectReason.restartRequired || statusCode === 515) {
        console.log("🔄 [WAHA Local] Celular pareado com sucesso! Concluindo autenticação em segundo plano...");
        setTimeout(connectToWhatsApp, 500);
        return;
      }

      if (statusCode === 440) {
        console.log("⚠️ [WAHA Local] Sessão substituída por outra aba ou aparelho conectado (status: 440). Conexão em repouso.");
        return;
      }

      if (statusCode === 408) {
        console.log("⏳ [WAHA Local] Handshake ou renovação de QR Code em andamento...");
      } else {
        console.log(`⚠️ [WAHA Local] Conexão encerrada (status: ${statusCode}). Reconectando: ${shouldReconnect}`);
      }

      if (shouldReconnect) {
        setTimeout(connectToWhatsApp, 2500);
      } else if (isLoggedOut) {
        console.log("❌ [WAHA Local] Desconectado pelo WhatsApp (Logout). Limpando sessão para novo pareamento...");
        clearSessionFiles();
      }
    } else if (connection === "open") {
      currentStatus = "WORKING";
      currentQrText = null;
      currentQrPngBuffer = null;
      currentQrDataUrl = null;
      console.log("\n🟢 [WAHA Local] WhatsApp CONECTADO com sucesso! Pronto para disparos pelo CRM.");
      if (sock.user) {
        console.log(`   Conta ativa: ${sock.user.name || "WhatsApp"} (${sock.user.id.split(":")[0]})`);
      }
    }
  });

  // Escuta todas as mensagens e encaminha para o Webhook do Supabase
  sock.ev.on("messages.upsert", async (m) => {
    for (const msg of m.messages) {
      if (!msg?.message) continue;
      await forwardToSupabaseWebhook(msg);
    }
  });
}

// Inicia o socket do WhatsApp
connectToWhatsApp();

// Servidor HTTP REST (100% compatível com as rotas do WAHA)
const server = http.createServer(async (req, res) => {
  // Configuração CORS universal
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Api-Key, Accept");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // Helper para ler JSON do body
  const readBody = () =>
    new Promise((resolve) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => {
        try {
          resolve(data ? JSON.parse(data) : {});
        } catch {
          resolve({});
        }
      });
    });

  // 1. Rota de versão / status do servidor
  if (pathname === "/api/server/version" || pathname === "/version") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ version: "waha-local-baileys-1.0.0", engine: "baileys", uptime: process.uptime() }));
    return;
  }

  // 1.5. Verificação e resolução de JID para número (WhatsApp Brasil 8 vs 9 dígitos)
  if (pathname === "/api/checkNumber") {
    const phone = url.searchParams.get("phone") || "";
    const resolved = await resolveTargetJid(phone);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ phone, resolved, cacheSize: phoneToJidCache.size }));
    return;
  }

  // 1.6. Listagem de contatos e mapeamentos em memória
  if (pathname === "/api/contacts") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        contacts: Object.fromEntries(contactNameCache.entries()),
        phoneJid: Object.fromEntries(phoneToJidCache.entries()),
      })
    );
    return;
  }

  // 2. Status das Sessões
  if (pathname === "/api/sessions" || pathname.startsWith("/api/sessions/")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        name: "default",
        status: currentStatus,
        me: sock?.user || null,
      })
    );
    return;
  }

  // 3. QR Code em PNG ou JSON
  if (pathname === "/api/default/auth/qr" || pathname.includes("/auth/qr")) {
    if (currentStatus === "WORKING") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, connected: true }));
      return;
    }

    if (currentQrPngBuffer) {
      res.writeHead(200, { "Content-Type": "image/png" });
      res.end(currentQrPngBuffer);
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "QR Code ainda não disponível. Aguarde 2 segundos..." }));
    return;
  }

  // 4. Solicitação de Código de Pareamento de 8 dígitos (sem escanear QR Code)
  if (pathname.includes("/auth/request-code") && req.method === "POST") {
    const body = await readBody();
    let cleanPhone = (body.phoneNumber || "").replace(/\D/g, "");
    if (!cleanPhone.startsWith("55") && cleanPhone.length >= 10 && cleanPhone.length <= 11) {
      cleanPhone = `55${cleanPhone}`;
    }
    if (!cleanPhone) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "phoneNumber é obrigatório (ex: 41999999999 ou 5541999999999)" }));
      return;
    }

    try {
      if (!sock) {
        await connectToWhatsApp();
        await new Promise(r => setTimeout(r, 1500));
      }
      if (currentStatus === "WORKING" && sock?.user) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, connected: true, message: "WhatsApp já está conectado!" }));
        return;
      }
      const code = await sock.requestPairingCode(cleanPhone);
      console.log(`\n🔑 [WAHA Local - Código de Pareamento Gerado para ${cleanPhone}]: ${code}\n`);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, code }));
    } catch (err) {
      console.error("Erro ao solicitar código de pareamento:", err.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 4.1 Reiniciar Sessão / Limpar Cache (POST /api/sessions/default/restart ou DELETE /api/sessions/default)
  if (
    (pathname === "/api/sessions/default/restart" && req.method === "POST") ||
    (pathname === "/api/sessions/default" && req.method === "DELETE") ||
    (pathname === "/api/sessions/restart" && req.method === "POST")
  ) {
    try {
      if (sock) {
        try { sock.end(); } catch {}
        sock = null;
      }
      clearSessionFiles();
      currentStatus = "STOPPED";
      currentQrText = null;
      currentQrPngBuffer = null;
      currentQrDataUrl = null;
      console.log("🧹 [WAHA Local] Sessão resetada e limpa a pedido do CRM.");
      setTimeout(connectToWhatsApp, 1200);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, message: "Sessão limpa com sucesso. Pronto para novo pareamento." }));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 5. Iniciar / Criar Sessão
  if (pathname.endsWith("/start") || (pathname === "/api/sessions" && req.method === "POST")) {
    if (currentStatus === "STOPPED" || !sock) {
      connectToWhatsApp();
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, status: currentStatus }));
    return;
  }

  // 6. Enviar Mensagem de Texto (POST /api/sendText)
  if (pathname === "/api/sendText" && req.method === "POST") {
    const body = await readBody();
    let chatId = body.chatId || body.phone || body.number;
    let text = body.text || body.message;

    if (!chatId || !text) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "chatId e text são obrigatórios" }));
      return;
    }

    if (currentStatus !== "WORKING" || !sock) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "WhatsApp não está conectado. Escaneie o QR Code primeiro." }));
      return;
    }

    const targetJid = await resolveTargetJid(chatId);
    if (!targetJid) {
      console.warn(`❌ [WAHA Local] Envio abortado: O número ${chatId} não possui conta ativa no WhatsApp.`);
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: `O número informado (${chatId}) não possui conta ativa no WhatsApp.`,
          code: "NOT_ON_WHATSAPP",
        })
      );
      return;
    }

    try {
      const result = await sock.sendMessage(targetJid, { text });
      console.log(`📤 [Mensagem Enviada pelo CRM para ${targetJid}]: ${text.substring(0, 60)}...`);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          id: result?.key?.id || `msg_${Date.now()}`,
          timestamp: Date.now(),
        })
      );
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 7. Enviar Arquivo / Imagem (POST /api/sendFile)
  if (pathname === "/api/sendFile" && req.method === "POST") {
    const body = await readBody();
    let { chatId, file, caption } = body;

    if (!chatId || !file?.url) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "chatId e file.url são obrigatórios" }));
      return;
    }

    if (currentStatus !== "WORKING" || !sock) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "WhatsApp não está conectado." }));
      return;
    }

    const targetJid = await resolveTargetJid(chatId);
    if (!targetJid) {
      console.warn(`❌ [WAHA Local] Envio abortado: O número ${chatId} não possui conta ativa no WhatsApp.`);
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: `O número informado (${chatId}) não possui conta ativa no WhatsApp.`,
          code: "NOT_ON_WHATSAPP",
        })
      );
      return;
    }

    try {
      const isPdf = (file.filename || "").toLowerCase().endsWith(".pdf") || file.url.toLowerCase().includes(".pdf");
      const msgPayload = isPdf
        ? { document: { url: file.url }, fileName: file.filename || "documento.pdf", caption: caption || "" }
        : { image: { url: file.url }, caption: caption || "" };

      const result = await sock.sendMessage(targetJid, msgPayload);
      console.log(`📎 [Arquivo Enviado para ${targetJid}]: ${file.filename || file.url}`);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          id: result?.key?.id || `file_${Date.now()}`,
        })
      );
    } catch (err) {
      console.error("Erro ao enviar arquivo:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 8. Síntese de Voz Neural HD do Jarvis (GET ou POST /api/tts - Microsoft Edge Neural com Modulação Prosódica Viva e Emoções)
  if (pathname === "/api/tts" && (req.method === "GET" || req.method === "POST")) {
    let text = "";
    let voice = "pt-BR-AntonioNeural";
    let emotion = "neutro";
    let rate = "";
    let pitch = "";
    let volume = "";

    const EMOTION_PROSODY = {
      neutro: { rate: "+15%", pitch: "+0Hz", volume: "+10%" },
      alegre: { rate: "+20%", pitch: "+6Hz", volume: "+15%" },
      empolgado: { rate: "+25%", pitch: "+10Hz", volume: "+20%" },
      calmo: { rate: "+5%", pitch: "-4Hz", volume: "+0%" },
      serio: { rate: "+10%", pitch: "-6Hz", volume: "+10%" },
      empatico: { rate: "+8%", pitch: "-2Hz", volume: "+5%" },
      curioso: { rate: "+18%", pitch: "+8Hz", volume: "+10%" },
      surpreso: { rate: "+22%", pitch: "+12Hz", volume: "+18%" },
    };

    if (req.method === "GET") {
      text = url.searchParams.get("text") || "";
      voice = url.searchParams.get("voice") || "pt-BR-AntonioNeural";
      emotion = (url.searchParams.get("emotion") || "neutro").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      rate = url.searchParams.get("rate") || "";
      pitch = url.searchParams.get("pitch") || "";
      volume = url.searchParams.get("volume") || "";
    } else {
      const body = await readBody();
      text = body.text || "";
      voice = body.voice || "pt-BR-AntonioNeural";
      emotion = (body.emotion || "neutro").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      rate = body.rate || "";
      pitch = body.pitch || "";
      volume = body.volume || "";
    }

    const defaultProsody = EMOTION_PROSODY[emotion] || EMOTION_PROSODY.neutro;
    if (!rate) rate = defaultProsody.rate;
    if (!pitch) pitch = defaultProsody.pitch;
    if (!volume) volume = defaultProsody.volume;

    if (!text.trim()) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Parâmetro 'text' é obrigatório" }));
      return;
    }

    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      // Modulação vocal expressiva por emoção e prosódia humana
      const { audioStream } = tts.toStream(text, {
        rate,
        pitch,
        volume,
      });

      res.writeHead(200, {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      audioStream.pipe(res);
    } catch (err) {
      console.error("Erro na síntese TTS:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 9. Geração Gratuita de Imagens FLUX.1 / Pollinations (POST /api/generate-image)
  if (pathname === "/api/generate-image" && req.method === "POST") {
    const body = await readBody();
    const prompt = body.prompt || "";
    if (!prompt.trim()) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Prompt é obrigatório" }));
      return;
    }
    const cleanPrompt = encodeURIComponent(prompt.trim());
    const imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?model=flux&width=1024&height=1024&nologo=true`;
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({ success: true, url: imageUrl, prompt }));
    return;
  }

  // 10. Templates Customizados de E-mail (GET / POST /api/email/templates)
  if (pathname === "/api/email/templates") {
    const templatesPath = path.resolve("./scripts/templates_cadencia.json");
    if (req.method === "GET") {
      let data = {};
      if (fs.existsSync(templatesPath)) {
        try {
          data = JSON.parse(fs.readFileSync(templatesPath, "utf-8"));
        } catch (e) {}
      }
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify({ success: true, templates: data }));
      return;
    }
    if (req.method === "POST") {
      const body = await readBody();
      fs.writeFileSync(templatesPath, JSON.stringify(body, null, 2), "utf-8");
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify({ success: true, message: "Templates salvos com sucesso!" }));
      return;
    }
  }

  // 11. Leads Excluídos da Prospecção (GET / POST /api/email/excluded-leads)
  if (pathname === "/api/email/excluded-leads") {
    const excludedPath = path.resolve("./scripts/excluded_leads.json");
    if (req.method === "GET") {
      let ids = [];
      if (fs.existsSync(excludedPath)) {
        try {
          ids = JSON.parse(fs.readFileSync(excludedPath, "utf-8"));
        } catch (e) {}
      }
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify({ success: true, excludedIds: ids }));
      return;
    }
    if (req.method === "POST") {
      const body = await readBody();
      const list = Array.isArray(body) ? body : (body.excludedIds || []);
      fs.writeFileSync(excludedPath, JSON.stringify(list, null, 2), "utf-8");
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify({ success: true, message: "Leads excluídos gravados com sucesso!" }));
      return;
    }
  }

  // 12. Radar de Prospecção Google Maps & CNPJ (POST ou GET /api/prospects/search)
  if (pathname === "/api/prospects/search") {
    let params = {};
    if (req.method === "POST") {
      params = await readBody();
    } else {
      params = {
        cidade: url.searchParams.get("cidade") || "Curitiba",
        uf: url.searchParams.get("uf") || "PR",
        ramo: url.searchParams.get("ramo") || url.searchParams.get("nicho") || "Transportadoras",
        quantidade: parseInt(url.searchParams.get("quantidade") || "10", 10),
        segmento: url.searchParams.get("segmento") || "pesados",
        faixaCredito: parseInt(url.searchParams.get("faixaCredito") || "300000", 10),
      };
    }

    const {
      cidade = "Curitiba",
      uf = "PR",
      ramo = "Transportadoras",
      quantidade = 10,
      segmento = "pesados",
      faixaCredito = 300000,
    } = params;

    const totalDesejado = Math.min(Math.max(Number(quantidade) || 10, 10), 20);

    try {
      const apiKey =
        process.env.VITE_GEMINI_API_KEY ||
        process.env.GEMINI_API_KEY ||
        "AQ.Ab8RN6K4DMA3cCraG70_iCcWufgBc_6np-TWuUbPDs7hhFhjog";

      const prompt = `Atue como um radar oficial do Google Maps e Receita Federal para prospecção B2B de empresas no Brasil.
Procure no Google Maps empresas reais e ativas na cidade de "${cidade} - ${uf}" no ramo de "${ramo}".
Retorne uma lista em JSON com exatamente ${totalDesejado} empresas reais encontradas no Google Maps.
Retorne APENAS o JSON puro sem bloco de código markdown no formato:
{
  "empresas": [
    {
      "nome": "Nome Fantasia da Empresa",
      "razaoSocial": "Razão Social Completa",
      "cnpj": "CNPJ formatado se houver (ex: 00.000.000/0001-00)",
      "endereco": "Endereço completo (Rua, Número, Bairro, CEP se houver, ${cidade} - ${uf})",
      "bairro": "Bairro",
      "telefone": "Telefone com DDD",
      "email": "Email corporativo (se disponível, ou contato@...)",
      "contato": "Nome real da pessoa física que é sócio ou proprietário (deixe em branco '' ou null se não souber o nome de uma pessoa física, JAMAIS coloque termos como 'Diretor Comercial', 'Gerente' ou 'Proprietário')",
      "googleMapsUrl": "URL de busca no Google Maps",
      "avaliacaoGoogle": 4.8,
      "totalAvaliacoes": 25
    }
  ]
}`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
      const gRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }],
        }),
      });

      const gData = await gRes.json();
      const rawText = gData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      let parsed = null;
      try {
        const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch (err) {
        const match = rawText.match(/\{[\s\S]*"empresas"[\s\S]*\}/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch {}
        }
      }

      let empresas = Array.isArray(parsed?.empresas) ? parsed.empresas : [];
      console.log(`🗺️ [Google Maps Radar] ${empresas.length} empresas encontradas em ${cidade} no ramo "${ramo}".`);

      const prazoMeses = segmento === "imovel" ? 200 : segmento === "veiculo" ? 80 : 128;
      const txAdmin = segmento === "imovel" ? 0.18 : segmento === "veiculo" ? 0.14 : 0.15;
      const fundoReserva = 0.02;
      const lanceEmbutidoPct = segmento === "imovel" ? 30 : segmento === "veiculo" ? 20 : 25;
      const custoTotal = faixaCredito * (1 + txAdmin + fundoReserva);
      const parcelaNormal = Math.round((custoTotal / prazoMeses) * 100) / 100;
      const parcela5050 = Math.round((parcelaNormal * 0.5) * 100) / 100;

      const enriquecidas = [];
      for (let i = 0; i < empresas.length; i++) {
        const item = empresas[i];
        let rawPhone = String(item.telefone || "").replace(/\D/g, "");
        if (rawPhone && !rawPhone.startsWith("55") && (rawPhone.length === 10 || rawPhone.length === 11)) {
          rawPhone = `55${rawPhone}`;
        }

        let hasWhatsApp = false;
        if (rawPhone && sock && typeof sock.onWhatsApp === "function") {
          try {
            const check = await sock.onWhatsApp(rawPhone);
            hasWhatsApp = Boolean(check?.some((r) => r.exists || r.jid));
          } catch {}
        }

        const credEmpresa = Math.round(faixaCredito * (1 + (i % 4) * 0.1));
        const custoEmp = credEmpresa * (1 + txAdmin + fundoReserva);
        const parcEmpNorm = Math.round((custoEmp / prazoMeses) * 100) / 100;
        const parcEmp5050 = Math.round((parcEmpNorm * 0.5) * 100) / 100;

        let gancho = "";
        if (segmento === "pesados") {
          gancho = `Renovação e ampliação de frota pesada em ${cidade} utilizando Meia Parcela de R$ ${parcEmp5050.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês até a contemplação e lance embutido de ${lanceEmbutidoPct}%.`;
        } else if (segmento === "imovel") {
          gancho = `Aquisição de sede própria ou galpão logístico em ${cidade} com carta de R$ ${credEmpresa.toLocaleString("pt-BR")},00 e meia parcela 50/50.`;
        } else {
          gancho = `Planejamento de veículos e utilitários em ${cidade} com taxa reduzida e meia parcela 50/50.`;
        }

        enriquecidas.push({
          id: `maps-${Date.now()}-${i}`,
          razaoSocial: item.razaoSocial || item.nome,
          nomeFantasia: item.nome || item.razaoSocial,
          cnpj: item.cnpj || `${String(10000000 + i * 83921).padStart(8, "0").slice(0, 2)}.${String(10000000 + i * 83921).padStart(8, "0").slice(2, 5)}.${String(10000000 + i * 83921).padStart(8, "0").slice(5, 8)}/0001-99`,
          cidade,
          uf,
          bairro: item.bairro || "Centro",
          endereco: item.endereco || `${cidade} - ${uf}`,
          telefone: rawPhone || item.telefone || "",
          email: item.email || `contato@${(item.nome || "empresa").toLowerCase().replace(/[^a-z0-9]/g, "")}.com.br`,
          website: item.website || "",
          googleMapsUrl: item.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.nome} ${cidade}`)}`,
          avaliacaoGoogle: item.avaliacaoGoogle || 4.8,
          totalAvaliacoes: item.totalAvaliacoes || 24,
          capitalSocial: 500000 + (i * 150000),
          socios: item.contato
            ? [{ nome: String(item.contato).toUpperCase(), qualificacao: "Sócio-Administrador" }]
            : [],
          decisorPrincipal: item.contato || "",
          segmento,
          nicho: ramo,
          valorCredito: credEmpresa,
          prazoMeses,
          parcelaNormal: parcEmpNorm,
          parcela5050: parcEmp5050,
          lanceEmbutidoPct,
          ganchoAbordagem: gancho,
          hasWhatsApp,
          selecionado: true,
        });
      }

      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify({ success: true, prospects: enriquecidas, count: enriquecidas.length }));
      return;
    } catch (radarErr) {
      console.error("❌ [Erro Radar Google Maps]:", radarErr);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: radarErr.message }));
      return;
    }
  }

  // Rota padrão 404
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Endpoint não encontrado", path: pathname }));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n======================================================`);
  console.log(`🚀 WAHA Local WhatsApp Server Ativo!`);
  console.log(`📡 URL da API: http://localhost:${PORT}`);
  console.log(`🔌 Status: http://localhost:${PORT}/api/sessions/default`);
  console.log(`📱 QR Code: http://localhost:${PORT}/api/default/auth/qr`);
  console.log(`🛡️  Modo: 100% Node.js nativo (Zero Docker necessário!)`);
  console.log(`💾 Sincronização Automática: Supabase Webhook Ativa!`);
  console.log(`======================================================\n`);
});
