import os
import json
import sys
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Garante que a pasta 3cerebros está no path do Python se necessário
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from cerebros import Brain

PORT = 8008

class BrainHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query_params = parse_qs(parsed.query)

        if path == '/context':
            query = query_params.get('query', [''])[0]
            who = query_params.get('who', ['vendedor'])[0]
            try:
                context = brain.build_context(query, who)
                self.send_json({"context": context})
            except Exception as e:
                self.send_json({"error": str(e)}, 500)

        elif path == '/recall':
            query = query_params.get('query', [''])[0]
            sector = query_params.get('sector', [''])[0]
            limit = int(query_params.get('limit', [10])[0])
            try:
                results = brain.recall(query, sector or None, limit)
                self.send_json({"results": results})
            except Exception as e:
                self.send_json({"error": str(e)}, 500)

        elif path == '/stats':
            try:
                stats = brain.stats()
                self.send_json({"stats": stats})
            except Exception as e:
                self.send_json({"error": str(e)}, 500)

        elif path == '/obsidian/status':
            try:
                base_dir = os.path.expanduser("~/.cerebros")
                inbox_files = len(os.listdir(os.path.join(base_dir, "0-inbox"))) if os.path.exists(os.path.join(base_dir, "0-inbox")) else 0
                proj_files = len(os.listdir(os.path.join(base_dir, "1-projeto"))) if os.path.exists(os.path.join(base_dir, "1-projeto")) else 0
                self_files = len(os.listdir(os.path.join(base_dir, "2-self"))) if os.path.exists(os.path.join(base_dir, "2-self")) else 0
                know_files = len(os.listdir(os.path.join(base_dir, "3-conhecimento"))) if os.path.exists(os.path.join(base_dir, "3-conhecimento")) else 0
                
                total_md = proj_files + self_files + know_files + inbox_files
                self.send_json({
                    "openjarvis_protocol": "v1.2",
                    "obsidian_vault": base_dir,
                    "total_notes": total_md,
                    "sectors": {
                        "inbox": inbox_files,
                        "projeto": proj_files,
                        "self": self_files,
                        "conhecimento": know_files
                    },
                    "soul_file": os.path.exists(os.path.join(base_dir, "2-self", "SOUL.md")),
                    "policy_file": os.path.exists(os.path.join(base_dir, "POLICY.md"))
                })
            except Exception as e:
                self.send_json({"error": str(e)}, 500)

        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # Leitura do corpo do POST
        content_length = int(self.headers.get('Content-Length', 0))
        try:
            body = self.rfile.read(content_length).decode('utf-8')
        except UnicodeDecodeError:
            body = self.rfile.read(content_length).decode('latin-1', errors='replace')
        try:
            data = json.loads(body) if body else {}
        except Exception:
            data = {}

        if path == '/reset':
            try:
                stats = brain.stats()
                self.send_json({"success": True, "message": "Sistema Jarvis resetado com sucesso", "stats": stats})
            except Exception as e:
                self.send_json({"error": str(e)}, 500)

        elif path == '/obsidian/sync':
            try:
                res = brain.run_jobs()
                self.send_json({"success": True, "sync": "Obsidian Vault + OpenJarvis sincronizado", "jobs": res})
            except Exception as e:
                self.send_json({"error": str(e)}, 500)

        elif path == '/observe':
            who = data.get('who', 'vendedor')
            user_msg = data.get('user_msg', '')
            ai_reply = data.get('ai_reply', '')
            if not user_msg:
                self.send_json({"error": "user_msg é obrigatório"}, 400)
                return

            try:
                sector = brain.observe(who, user_msg, ai_reply)
                self.send_json({"success": True, "sector": sector})
            except Exception as e:
                self.send_json({"error": str(e)}, 500)

        elif path == '/remember':
            content = data.get('content', '')
            sector = data.get('sector', 'conhecimento')
            category = data.get('category', 'fact')
            who = data.get('who', 'vendedor')
            if not content:
                self.send_json({"error": "content é obrigatório"}, 400)
                return

            try:
                rid = brain.remember(content, sector, category, who)
                self.send_json({"success": True, "id": rid})
            except Exception as e:
                self.send_json({"error": str(e)}, 500)

        elif path == '/note':
            content = data.get('content', '')
            if not content:
                self.send_json({"error": "content é obrigatório"}, 400)
                return

            try:
                note_path = brain.note(content)
                self.send_json({"success": True, "path": str(note_path)})
            except Exception as e:
                self.send_json({"error": str(e)}, 500)

        elif path == '/jobs':
            try:
                res = brain.run_jobs()
                self.send_json({"success": True, "jobs": res})
            except Exception as e:
                self.send_json({"error": str(e)}, 500)

        elif path == '/hermes/chat':
            prompt = data.get('prompt', '')
            who = data.get('who', 'vendedor')
            model = data.get('model', 'gemini-2.5-flash')
            if not prompt:
                self.send_json({"error": "prompt é obrigatório"}, 400)
                return

            try:
                context = brain.build_context(prompt, who)
                full_prompt = f"Contexto de Memória CRM/3cerebros:\n{context}\n\nComando do Usuário:\n{prompt}"

                hermes_dir = os.path.join(os.path.dirname(__file__), "hermes-agent")
                cmd = [
                    "uv", "run", "python", "cli.py",
                    "--provider", "google-ai-studio",
                    "--model", model,
                    "--oneshot",
                    "-q", full_prompt
                ]

                process = subprocess.run(
                    cmd,
                    cwd=hermes_dir,
                    capture_output=True,
                    text=True,
                    encoding='utf-8',
                    errors='replace'
                )

                output = process.stdout.strip()
                if not output and process.stderr:
                    output = process.stderr.strip()

                try:
                    brain.observe(who, prompt, output)
                except Exception:
                    pass

                self.send_json({
                    "success": True,
                    "response": output,
                    "model": model,
                    "context_used": bool(context)
                })
            except Exception as e:
                self.send_json({"error": str(e)}, 500)

        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    # Inicializa o cérebro em ~/.cerebros
    brain = Brain()
    soul_path = os.path.expanduser("~/.cerebros/2-self/SOUL.md")
    if not os.path.exists(soul_path) or os.path.getsize(soul_path) == 0:
        print("[*] Inicializando onboarding do 3cerebros...")
        brain.interview(answers={
            "name": "Jarvis CRM",
            "tone": "direto, confiante, levemente espirituoso, braço direito experiente do gestor",
            "mission": "ajudar a bater metas, organizar leads e ser autoridade em consórcio pro time comercial",
            "values": "proatividade, precisão nos números, sinceridade nas vendas, nunca inventar dado",
            "red_lines": "nunca mentir taxas, nunca garantir contemplação, nunca mover leads sem ordem clara do vendedor",
            "autonomy": "equilibrado",
            "allow_messages": "y",
            "allow_shell": "n",
        })
        print("[*] Onboarding finalizado!")
    
    # Pre-popula memórias estáticas que o CRM requer (clientes EP, QV8) para manter informações antigas
    print("[*] Injetando memórias de referência padrão (Clientes EP, QV8 e Regras Consórcio Magalu)...")
    brain.remember(
        "Se perguntarem quais são os clientes EP (ou EP do mês de junho), responda que são: Emily Oliveira da Luz, João Batista Pereira, Alessandro Moreira e Leonardo Alves de Arruda.", 
        sector="conhecimento", category="reference"
    )
    brain.remember(
        "Se perguntarem sobre o índice QV8 (Qualidade da Venda no Oitavo Mês) de junho: a meta era 71.00%, mas o Resultado Atual foi 100.00% (Meta Atingida), com Crédito Gerado de R$ 310.000,00.",
        sector="conhecimento", category="reference"
    )
    brain.remember(
        "Regras do Consórcio Magalu: O cliente pode utilizar até 30% da própria carta de crédito como Lance Embutido para aumentar as chances de contemplação sem desembolsar dinheiro do bolso no ato.",
        sector="conhecimento", category="rules"
    )
    brain.remember(
        "Regras da ABAC e Banco Central: O consórcio é isento de juros, possuindo apenas taxa de administração diluída e fundo de reserva. A contemplação ocorre mensalmente por sorteio ou lance.",
        sector="conhecimento", category="rules"
    )

    server = HTTPServer(('localhost', PORT), BrainHandler)
    print(f"[+] Servidor 3cerebros ativo na porta {PORT}...")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        brain.close()
        print("[-] Servidor encerrado.")
