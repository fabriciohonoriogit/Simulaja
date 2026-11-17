@echo off
title Desativar Inicializacao Automatica com o Windows
set "SHORTCUT=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\JarvisDewiarSimulaja.lnk"

if exist "%SHORTCUT%" (
    del /f /q "%SHORTCUT%"
    echo [OK] Inicializacao automatica removida com sucesso.
) else (
    echo [INFO] A inicializacao automatica nao estava ativada.
)

echo.
pause
