' Inicia o servidor WAHA WhatsApp do CRM de forma 100% invisível em segundo plano
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Obtém o diretório do projeto
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
projectDir = fso.GetParentFolderName(scriptDir)

' Executa silenciosamente sem abrir janela de prompt (0 = oculto)
WshShell.CurrentDirectory = projectDir
WshShell.Run "node scripts/waha-local.mjs", 0, False

