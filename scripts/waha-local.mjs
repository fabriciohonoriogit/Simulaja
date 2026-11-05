/**
 * WAHA Local Server (Node.js nativo sem necessidade de Docker)
 * Micro-servidor de WhatsApp compatível com a API do WAHA (devlikeapro/waha)
 * Desenvolvido para rodar direto no Windows / Node.js sem Docker Desktop.
 * 
 * Inclui SINCRONIZAÇÃO BIDIRECIONAL EM TEMPO REAL com o banco Supabase do CRM!
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

// Configura Supabase com WebSocket compatível com Node.js
const { createClient } = require("@supabase/supabase-js");
const ws = require("../evolution-api/node_modules/ws");
globalThis.WebSocket = ws;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://pfedvdqpnpbrlhfbzjcj.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWR2ZHFwbnBicmxoZmJ6amNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDAwMTgsImV4cCI6MjA4NjQ3NjAxOH0.5X19fj92_I5-ovCSobX0FCiHUMOVDUJBlrUkRXvhSsE";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const PORT = process.env.PORT || 3000;
const SESSION_DIR = path.resolve("./whatsapp_session");

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
 * Sincroniza mensagens recebidas e enviadas diretamente com a tabela chat_messages do CRM
 */
async function syncMessageToCRM(msg) {
  try {
    const remoteJid = msg.key?.remoteJid;
    if (!remoteJid || remoteJid.includes("@g.us") || remoteJid === "status@broadcast") {
      return; // Ignora mensagens de grupos e status por enquanto
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
    const rawNumber = remoteJid.replace(/@.*$/, "").replace(/\D/g, "");
    const last8 = rawNumber.slice(-8);

    console.log(`📩 [WhatsApp ${isFromMe ? "Enviada" : "Recebida"} | ${rawNumber}]: ${contentText}`);

    // 1. Busca o lead pelo telefone no Supabase
    let lead = null;
    const { data: leads, error: leadErr } = await supabase
      .from("leads")
      .select("id, nome, celular, organizacao_id")
      .ilike("celular", `%${last8}%`)
      .limit(1);

    if (leads && leads.length > 0) {
      lead = leads[0];
    } else {
      // Tenta buscar pelo nome push se disponível
      if (msg.pushName) {
        const { data: nameLeads } = await supabase
          .from("leads")
          .select("id, nome, celular, organizacao_id")
          .ilike("nome", `%${msg.pushName}%`)
          .limit(1);
        if (nameLeads && nameLeads.length > 0) {
          lead = nameLeads[0];
        }
      }
    }

    // Se não encontrou o lead, cadastra automaticamente para a conversa não sumir
    if (!lead && !isFromMe) {
      const contactName = msg.pushName || `Contato ${rawNumber.slice(-4)}`;
      console.log(`✨ [WAHA Local] Criando lead automático para novo contato: ${contactName} (${rawNumber})`);
      const { data: newLead, error: createLeadErr } = await supabase
        .from("leads")
        .insert({
          nome: contactName,
          celular: rawNumber,
          origem: "WhatsApp Orgânico",
          status: "novo",
        })
        .select()
        .single();

      if (!createLeadErr && newLead) {
        lead = newLead;
      }
    }

    if (lead) {
      // 2. Grava a mensagem na tabela chat_messages do CRM
      const role = isFromMe ? "assistant" : "user";
      const { error: insertErr } = await supabase.from("chat_messages").insert({
        lead_id: lead.id,
        content: contentText,
        role: role,
        created_at: new Date(msg.messageTimestamp ? Number(msg.messageTimestamp) * 1000 : Date.now()).toISOString(),
      });

      if (!insertErr) {
        console.log(`💾 [CRM Sincronizado] Mensagem vinculada com sucesso ao Lead: ${lead.nome} (${lead.id})`);
        // Atualiza updated_at do lead para que ele suba para o topo no Kanban e no Inbox
        await supabase
          .from("leads")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", lead.id);
      } else {
        console.error("❌ Erro ao gravar mensagem no Supabase:", insertErr.message);
      }
    } else {
      console.log(`ℹ️ [WAHA Local] Mensagem de ${rawNumber} não vinculada a nenhum Lead.`);
    }
  } catch (err) {
    console.error("❌ Erro ao sincronizar mensagem com o CRM:", err);
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

  // Escuta todas as mensagens recebidas e enviadas e sincroniza automaticamente com o Supabase
  sock.ev.on("messages.upsert", async (m) => {
    for (const msg of m.messages) {
      if (!msg?.message) continue;
      await syncMessageToCRM(msg);
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

    if (!chatId.includes("@")) {
      chatId = `${chatId.replace(/\D/g, "")}@s.whatsapp.net`;
    } else if (chatId.endsWith("@c.us")) {
      chatId = chatId.replace("@c.us", "@s.whatsapp.net");
    }

    try {
      const result = await sock.sendMessage(chatId, { text });
      console.log(`📤 [Mensagem Enviada para ${chatId}]: ${text.substring(0, 60)}...`);
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

    if (!chatId.includes("@")) {
      chatId = `${chatId.replace(/\D/g, "")}@s.whatsapp.net`;
    } else if (chatId.endsWith("@c.us")) {
      chatId = chatId.replace("@c.us", "@s.whatsapp.net");
    }

    try {
      const isPdf = (file.filename || "").toLowerCase().endsWith(".pdf") || file.url.toLowerCase().includes(".pdf");
      const msgPayload = isPdf
        ? { document: { url: file.url }, fileName: file.filename || "documento.pdf", caption: caption || "" }
        : { image: { url: file.url }, caption: caption || "" };

      const result = await sock.sendMessage(chatId, msgPayload);
      console.log(`📎 [Arquivo Enviado para ${chatId}]: ${file.filename || file.url}`);
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
  console.log(`💾 Sincronização Automática: Supabase chat_messages Ativa!`);
  console.log(`======================================================\n`);
});
