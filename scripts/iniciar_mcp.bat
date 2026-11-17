@echo off
title Servidor MCP SimulaJa e Dewiar App
echo =====================================================================
echo  SIMULAJA CRM - SERVIDOR MCP (Model Context Protocol) v1.1.0
echo  Conectando Dewiar App, Claude, Cursor e Pipelines de Voz ao SimulaJa
echo =====================================================================
echo.

cd /d "C:\Users\Samsung\Documents\Projetos\simulaja"

if not exist "node_modules" (
    echo [AVISO] Pasta node_modules nao encontrada. Instalando dependencias...
    npm install
)

echo [OK] Iniciando Servidor MCP via stdio (JSON-RPC 2.0)...
echo Pressione Ctrl+C para encerrar o servidor.
echo.

node scripts/simulaja-mcp-server.mjs

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] O servidor MCP encerrou com codigo de erro %ERRORLEVEL%.
)

echo.
echo =====================================================================
echo Pressione qualquer tecla para fechar esta janela...
pause > nul
