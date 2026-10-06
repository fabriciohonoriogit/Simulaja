#!/usr/bin/env python3
"""
gmail_integration.py
Script auxiliar do Jarvis para verificação e sumarização de e-mails importantes no Gmail.
Suporta leitura via IMAP (com Senha de App) ou mock demonstrativo se não houver credenciais.
"""

import os
import sys
import json
import imaplib
import email
from email.header import decode_header
import argparse
from datetime import datetime

# Tenta carregar dotenv se disponível
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def decodificar_texto(header_val):
    if not header_val:
        return ""
    partes = decode_header(header_val)
    resultado = ""
    for texto, encoding in partes:
        if isinstance(texto, bytes):
            resultado += texto.decode(encoding or 'utf-8', errors='replace')
        else:
            resultado += str(texto)
    return resultado

def buscar_emails_reais_imap(usuario, senha, limite=5):
    """
    Conecta ao servidor IMAP do Gmail e busca as últimas mensagens da caixa de entrada.
    """
    try:
        senha_limpa = senha.replace(" ", "")
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(usuario, senha_limpa)
        mail.select("inbox")

        # Busca e-mails recentes (opcionalmente não lidos ou todos)
        status, data = mail.search(None, "ALL")
        if status != "OK":
            return None

        email_ids = data[0].split()
        ultimos_ids = email_ids[-limite:]
        ultimos_ids.reverse()

        mensagens = []
        for e_id in ultimos_ids:
            status, msg_data = mail.fetch(e_id, "(RFC822)")
            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    assunto = decodificar_texto(msg.get("Subject"))
                    remetente = decodificar_texto(msg.get("From"))
                    data_envio = msg.get("Date", "")

                    # Extrai corpo simples se possível
                    corpo = ""
                    if msg.is_multipart():
                        for part in msg.walk():
                            content_type = part.get_content_type()
                            if content_type == "text/plain":
                                try:
                                    corpo = part.get_payload(decode=True).decode('utf-8', errors='replace')
                                    break
                                except Exception:
                                    pass
                    else:
                        try:
                            corpo = msg.get_payload(decode=True).decode('utf-8', errors='replace')
                        except Exception:
                            pass

                    mensagens.append({
                        "id": e_id.decode('utf-8'),
                        "remetente": remetente,
                        "assunto": assunto,
                        "data": data_envio,
                        "categoria": "Gmail Inbox",
                        "prioridade": "Alta" if ("urgente" in assunto.lower() or "boleto" in assunto.lower() or "comprovante" in assunto.lower()) else "Normal",
                        "resumo": (corpo[:200] + "...") if corpo else "Sem prévia do texto."
                    })

        mail.logout()
        return mensagens
    except Exception as e:
        print(f"[Aviso IMAP] Não foi possível conectar via IMAP: {e}", file=sys.stderr)
        return None

def buscar_emails_importantes(usuario=None, limite=5):
    """
    Tenta conexão real IMAP. Se não houver credenciais válidas, retorna dados demonstrativos.
    """
    email_usuario = usuario or os.getenv("GMAIL_USER")
    senha_app = os.getenv("GMAIL_APP_PASSWORD")

    if email_usuario and senha_app and "sua-senha" not in senha_app:
        mensagens_reais = buscar_emails_reais_imap(email_usuario, senha_app, limite)
        if mensagens_reais is not None:
            return {
                "status": "sucesso",
                "modo": "conexao_real_imap",
                "conta": email_usuario,
                "total_importantes": len(mensagens_reais),
                "mensagens": mensagens_reais
            }

    # Fallback demonstrativo se não houver credenciais configuradas no .env
    emails_demonstrativos = [
        {
            "id": "msg_001",
            "remetente": "Marcos Silva <marcos.silva@email.com>",
            "assunto": "Comprovante de pagamento - Cota 1234 Magalu",
            "data": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "categoria": "Financeiro / Cliente",
            "prioridade": "Alta",
            "resumo": "Cliente enviou o comprovante do pagamento da parcela referente a Outubro/2026."
        },
        {
            "id": "msg_002",
            "remetente": "Consórcio Magalu <atendimento@consorciomagalu.com.br>",
            "assunto": "Resultado da Assembleia - Grupo 4050",
            "data": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "categoria": "Administradora",
            "prioridade": "Média",
            "resumo": "Aviso de contemplação por lance e sorteio da assembleia realizada ontem."
        }
    ]

    return {
        "status": "sucesso",
        "modo": "demonstracao",
        "conta": email_usuario or os.getenv("GMAIL_USER", "gn_prosperaplan@consorciomagalu.com.br"),
        "total_importantes": len(emails_demonstrativos),
        "mensagens": emails_demonstrativos[:limite]
    }

def main():
    parser = argparse.ArgumentParser(description="Módulo Jarvis - Conector Gmail")
    parser.add_argument("--user", help="E-mail do Gmail cadastrado")
    parser.add_argument("--limit", type=int, default=5, help="Quantidade máxima de e-mails a retornar")
    parser.add_argument("--check-important", action="store_true", help="Buscar apenas mensagens classificadas como importantes")

    args = parser.parse_args()

    dados = buscar_emails_importantes(args.user, args.limit)
    print(json.dumps(dados, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
