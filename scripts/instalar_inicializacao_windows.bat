@echo off
chcp 65001 >nul
title Simulajá CRM - Ativar WhatsApp Sempre Ligado no Windows

echo ==============================================================================
echo        SIMULAJÁ CRM • ATIVADOR DO WHATSAPP SEMPRE LIGADO (AUTO-START)
echo ==============================================================================
echo.
echo Este utilitário adiciona o WhatsApp do Simulajá para iniciar automaticamente
echo em segundo plano com o Windows (invisível, sem abrir janelas pretas).
echo.

set SCRIPT_DIR=%~dp0
set VBS_TARGET=%SCRIPT_DIR%iniciar_whatsapp_silencioso.vbs
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT_NAME=SimulaJa_WhatsApp_Server.lnk

powershell -NoProfile -Command "$wsh = New-Object -ComObject WScript.Shell; $sc = $wsh.CreateShortcut('%STARTUP_DIR%\%SHORTCUT_NAME%'); $sc.TargetPath = 'wscript.exe'; $sc.Arguments = '\"%VBS_TARGET%\"'; $sc.WorkingDirectory = '%SCRIPT_DIR%..'; $sc.Description = 'Simulajá CRM WhatsApp Server em Segundo Plano'; $sc.Save()"

if %errorlevel% equ 0 (
    echo [SUCESSO] Inicializador registrado na pasta Inicializar do Windows!
    echo.
    echo Destino: %STARTUP_DIR%\%SHORTCUT_NAME%
    echo Toda vez que você ligar o computador, o WhatsApp conectará sozinho em 3 segundos.
    echo.
) else (
    echo [AVISO] Falha ao registrar atalho. Tente executar como Administrador.
)

echo Iniciando o serviço agora mesmo em segundo plano...
wscript.exe "%VBS_TARGET%"
echo [OK] Serviço em execução em segundo plano!
echo.
pause
