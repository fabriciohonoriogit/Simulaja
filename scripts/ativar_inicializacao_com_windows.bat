@echo off
title Ativar Inicializacao Automatica com o Windows
echo =====================================================================
echo  ATIVAR INICIALIZACAO AUTOMATICA COM O WINDOWS
echo =====================================================================
echo.

set "TARGET=C:\Users\Samsung\Documents\Projetos\simulaja\scripts\iniciar_silencioso.vbs"
set "SHORTCUT=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\JarvisDewiarSimulaja.lnk"

echo Criando atalho na pasta Inicializar do Windows...

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT%'); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"%TARGET%\"'; $s.WindowStyle = 7; $s.Description = 'Jarvis Dewiar SimulaJa Autostart'; $s.Save()"

if exist "%SHORTCUT%" (
    echo.
    echo [SUCESSO] Inicializacao automatica ativada!
    echo Agora, sempre que voce ligar o Windows, o Jarvis/Dewiar e o MCP
    echo iniciarao automaticamente em segundo plano!
) else (
    echo.
    echo [ERRO] Nao foi possivel criar o atalho de inicializacao.
)

echo.
pause
