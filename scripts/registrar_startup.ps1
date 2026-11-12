$wsh = New-Object -ComObject WScript.Shell
$startupPath = [System.Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startupPath "SimulaJa_WhatsApp_Server.lnk"
$vbsPath = "c:\Users\Samsung\Documents\Projetos\simulaja\scripts\iniciar_whatsapp_silencioso.vbs"

$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$vbsPath`""
$shortcut.WorkingDirectory = "c:\Users\Samsung\Documents\Projetos\simulaja"
$shortcut.Description = "SimulaJa CRM WhatsApp Server em Segundo Plano"
$shortcut.Save()

Write-Host "SUCESSO: Atalho criado em $shortcutPath"
