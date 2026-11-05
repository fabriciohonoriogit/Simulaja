/**
 * WAHA Local Server (Node.js nativo sem necessidade de Docker)
 * Micro-servidor de WhatsApp compatível com a API do WAHA (devlikeapro/waha)
 * Desenvolvido para rodar direto no Windows / Node.js sem Docker Desktop.
 * 
 * Integração 100% direta via Webhook Supabase com privilégio de gravação no CRM!
 */

import http from "http";
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Carrega Baileys e dependências
const baileys = require("../evolution-api/node_modules/baileys");
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys;
const pino = require("../evolution-api/node_modules/pino");
const QRCode = require("../evolution-api/node_modules/qrcode");
const qrcodeTerminal = require("../evolution-api/node_modules/qrcode-terminal");

const PORT = process.env.PORT || 3000;
const SESSION_DIR = path.resolve("./whatsapp_session");

// URL da Edge Function do Supabase (ignora RLS e grava direto em chat_messages e leads)
const SUPABASE_WEBHOOK_URL =
  process.env.SUPABASE_WEBHOOK_URL ||
  "https://pfedvdqpnpbrlhfbzjcj.supabase.co/functions/v1/webhook-evolution";

let sock = null;
let currentStatus = "STARTING"; // STARTING, SCAN_QR_CODE, WORKING, STOPPED
let currentQrText = null;
let currentQrPngBuffer = null;
let currentQrDataUrl = null;

// Garante que a pasta de sessão existe
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

/**
 * Encaminha todas as mensagens recebidas e enviadas para o Webhook do Supabase
 * para gravação instantânea e sincronização em tempo real com o CRM.
 */
async function forwardToSupabaseWebhook(msg) {
  try {
    const remoteJid = msg.key?.remoteJid;
    if (!remoteJid || remoteJid.includes("@g.us") || remoteJid === "status@broadcast") {
      return; // Ignora grupos e status por enquanto
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
    const isFromMe = Boolean(msg.key?.fromMe);
    const sender = isFromMe ? "Você (celular)" : (msg.pushName || remoteJid.replace(/@.*$/, ""));

    console.log(`📩 [WhatsApp ${isFromMe ? "Enviada" : "Recebida"}]: ${sender}: ${contentText}`);

    const res = await fetch(SUPABASE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "messages.upsert",
        data: msg,
      }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      console.log(`💾 [CRM Sincronizado] Mensagem gravada no CRM com sucesso! Lead ID: ${data.leadId || "OK"}`);
    } else {
      const errText = await res.text().catch(() => "");
      console.error(`❌ [Erro Webhook Supabase ${res.status}]: ${errText.substring(0, 150)}`);
    }
  } catch (err) {
    console.error("❌ Falha ao enviar para webhook do Supabase:", err.message);
  }
}

async function connectToWhatsApp() {
  currentStatus = "STARTING";
  console.log("\n🔄 [WAHA Local] Conectando ao WhatsApp...");

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  let version = [2, 3000, 1015901307];
  try {
    const vInfo = await fetchLatestBaileysVersion();
    if (vInfo?.version) version = vInfo.version;
  } catch (err) {
    // Fallback
  }

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    browser: ["Simulajá CRM", "Chrome", "1.0.0"],
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
      console.log("\n📱 [WAHA Local] Escaneie o QR Code abaixo no seu WhatsApp > Aparelhos Conectados:\n");
      try {
        qrcodeTerminal.generate(qr, { small: true });
      } catch (err) {
        console.log("QR Code String:", qr);
      }
      console.log("👉 Ou acesse o Simulajá > Configurações > Conexão WhatsApp para escanear pela tela do CRM.\n");
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      currentStatus = "STOPPED";
      currentQrText = null;
      currentQrPngBuffer = null;
      currentQrDataUrl = null;

      if (statusCode === 408) {
        console.log("⏳ [WAHA Local] Tempo de leitura do QR Code expirado. Gerando novo código em 2 segundos...");
      } else {
        console.log(`⚠️ [WAHA Local] Conexão encerrada (status: ${statusCode}). Reconectando: ${shouldReconnect}`);
      }

      if (shouldReconnect) {
        setTimeout(connectToWhatsApp, 2500);
      } else {
        console.log("❌ [WAHA Local] Desconectado. Exclua a pasta ./whatsapp_session para novo pareamento.");
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
    const cleanPhone = (body.phoneNumber || "").replace(/\D/g, "");
    if (!cleanPhone) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "phoneNumber é obrigatório" }));
      return;
    }

    try {
      if (!sock) throw new Error("Socket não inicializado");
      const code = await sock.requestPairingCode(cleanPhone);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, code }));
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
    let { chatId, text } = body;

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

    let targetJid = chatId;
    if (!targetJid.includes("@")) {
      targetJid = `${targetJid.replace(/\D/g, "")}@s.whatsapp.net`;
    } else if (targetJid.endsWith("@c.us")) {
      targetJid = targetJid.replace("@c.us", "@s.whatsapp.net");
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

    let targetJid = chatId;
    if (!targetJid.includes("@")) {
      targetJid = `${targetJid.replace(/\D/g, "")}@s.whatsapp.net`;
    } else if (targetJid.endsWith("@c.us")) {
      targetJid = targetJid.replace("@c.us", "@s.whatsapp.net");
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

  // Rota padrão 404
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Endpoint não encontrado", path: pathname }));
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 WAHA Local WhatsApp Server Ativo!`);
  console.log(`📡 URL da API: http://localhost:${PORT}`);
  console.log(`🔌 Status: http://localhost:${PORT}/api/sessions/default`);
  console.log(`📱 QR Code: http://localhost:${PORT}/api/default/auth/qr`);
  console.log(`🛡️  Modo: 100% Node.js nativo (Zero Docker necessário!)`);
  console.log(`💾 Sincronização Automática: Supabase Webhook Ativa!`);
  console.log(`======================================================\n`);
});
