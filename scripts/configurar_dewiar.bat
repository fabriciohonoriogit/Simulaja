@echo off
title Setup e Integracao Dewiar App e SimulaJa
echo =====================================================================
echo  DEWIAR APP + SIMULAJA CRM - SETUP E INTEGRACAO DE VOZ
echo =====================================================================
echo.

set "PROJETOS_DIR=C:\Users\Samsung\Documents\Projetos"
set "SIMULAJA_DIR=%PROJETOS_DIR%\simulaja"
set "DEWIAR_DIR=%PROJETOS_DIR%\dewiar-app"

echo [1/5] Verificando pre-requisitos do sistema...

where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] O comando git nao foi encontrado no PATH do Windows.
    goto FIM
)
echo   [OK] Git detectado com sucesso.

where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] O comando python nao foi encontrado no PATH do Windows.
    goto FIM
)
echo   [OK] Python detectado com sucesso.

echo.
echo [2/5] Verificando pasta do Dewiar App...
if not exist "%DEWIAR_DIR%" (
    echo   Clonando repositorio oficial do Dewiar App...
    git clone https://github.com/dwr-git/dewiar-app.git "%DEWIAR_DIR%"
    if %ERRORLEVEL% NEQ 0 (
        echo [ERRO] Falha ao clonar o repositorio do Dewiar App.
        goto FIM
    )
    echo   [OK] Repositorio clonado em: %DEWIAR_DIR%
) else (
    echo   [OK] Pasta do Dewiar App ja existe em: %DEWIAR_DIR%
)

echo.
echo [3/5] Configurando ambiente virtual Python venv...
cd /d "%DEWIAR_DIR%"

if not exist "venv" (
    echo   Criando ambiente virtual venv...
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo [ERRO] Falha ao criar ambiente virtual Python.
        goto FIM
    )
    echo   [OK] Ambiente virtual criado.
) else (
    echo   [OK] Ambiente virtual ja configurado.
)

echo.
echo [4/5] Instalando dependencias do Dewiar...
call venv\Scripts\activate.bat
if exist "requirements.txt" (
    echo   Instalando pacotes do requirements.txt...
    python -m pip install --upgrade pip
    pip install -r requirements.txt
    if %ERRORLEVEL% NEQ 0 (
        echo [AVISO] Alguns pacotes podem ter gerado avisos, continuando...
    )
) else (
    echo   Nenhum requirements.txt encontrado na raiz do Dewiar.
)

echo.
echo [5/5] Vinculando Servidor MCP do SimulaJa ao Dewiar App...
if exist "%SIMULAJA_DIR%\dewiar-mcp-config.json" (
    copy /y "%SIMULAJA_DIR%\dewiar-mcp-config.json" "%DEWIAR_DIR%\mcp_servers.json" > nul
    echo   [OK] Configuracao MCP do SimulaJa copiada para o Dewiar App!
)

echo.
echo =====================================================================
echo  INTEGRACAO CONCLUIDA COM SUCESSO!
echo  Para iniciar o Dewiar integrado ao SimulaJa:
echo    1. Inicie o MCP do SimulaJa rodando: scripts\iniciar_mcp.bat
echo    2. Inicie o Dewiar rodando: scripts\iniciar_dewiar.bat (ou venv\Scripts\python ui/app.py)
echo =====================================================================

:FIM
echo.
echo Esta janela permanecera aberta. Pressione qualquer tecla para sair...
pause > nul
