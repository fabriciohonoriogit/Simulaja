@echo off
title Iniciar Dewiar App + SimulaJa CRM
echo =====================================================================
echo  DEWIAR APP + SIMULAJA CRM • ASSISTENTE DE VOZ & WIDGET
echo =====================================================================
echo.

set "DEWIAR_DIR=C:\Users\Samsung\Documents\Projetos\dewiar-app"

if not exist "%DEWIAR_DIR%\venv\Scripts\python.exe" (
    echo [ERRO] Ambiente virtual do Dewiar nao encontrado.
    echo Execute primeiro: scripts\configurar_dewiar.bat
    goto FIM
)

cd /d "%DEWIAR_DIR%"

echo [1/2] Ativando ambiente virtual...
call venv\Scripts\activate.bat

echo [2/2] Iniciando interface do Dewiar App (Widget / Studio)...
echo.
python ui/app.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [AVISO] Dewiar encerrou com codigo %ERRORLEVEL%.
)

:FIM
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause > nul
