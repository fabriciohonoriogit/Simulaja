' Inicia o Servidor MCP e o Dewiar App de forma 100% invisivel/silenciosa
Set WshShell = CreateObject("WScript.Shell")

' 1. Inicia o MCP do SimulaJá silenciosamente (janela oculta 0)
WshShell.Run "cmd /c cd /d C:\Users\Samsung\Documents\Projetos\simulaja && node scripts\simulaja-mcp-server.mjs", 0, False

' 2. Pequena pausa de 1 segundo para o MCP subir
WScript.Sleep 1000

' 3. Inicia o Dewiar App (o widget flutuante aparecera na tela sem console preto)
WshShell.Run "cmd /c cd /d C:\Users\Samsung\Documents\Projetos\dewiar-app && venv\Scripts\activate.bat && python ui/app.py", 0, False
