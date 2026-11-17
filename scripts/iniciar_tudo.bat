@echo off
title Iniciar Simulaja MCP e Dewiar App
echo =====================================================================
echo  INICIANDO ECOSSISTEMA JARVIS: SIMULAJA MCP + DEWIAR APP
echo =====================================================================
echo.

set "SIMULAJA_DIR=C:\Users\Samsung\Documents\Projetos\simulaja"
set "DEWIAR_DIR=C:\Users\Samsung\Documents\Projetos\dewiar-app"

echo [1/2] Iniciando Servidor MCP do SimulaJa em segundo plano...
cd /d "%SIMULAJA_DIR%"
start "SimulaJa MCP Server" /min cmd /c "node scripts/simulaja-mcp-server.mjs"

echo [2/2] Iniciando Dewiar App com Jarvis Squad...
cd /d "%DEWIAR_DIR%"
call venv\Scripts\activate.bat
python ui/app.py
