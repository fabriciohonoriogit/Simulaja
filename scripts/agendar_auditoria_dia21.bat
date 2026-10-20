@echo off
chcp 65001 >nul
title Simulajá CRM - Jarvis Auditoria de Inadimplência Magalu (Dia 21)

echo ==============================================================================
echo        SIMULAJÁ CRM • JARVIS AUDITORIA DE INADIMPLÊNCIA (PORTAL MAGALU)
echo ==============================================================================
echo.
echo Este assistente irá agendar a execução automática da auditoria no Windows
echo para rodar a partir do DIA 21 DE CADA MÊS às 09:00 da manhã.
echo.
echo Fluxo executado pelo Jarvis no Portal Magalu:
echo   1. Acessa o Portal Consórcio Magalu com as credenciais salvas.
echo   2. Consulta cota por cota em: Atendimento ^> Posição do Consorciado ^> Emissão de Cobrança.
echo   3. Analisa a tabela 'Pendências': identifica parcelas vencidas no dia 20 com Vl. devido ^> 0.
echo   4. Cadastra o cliente na aba Inadimplentes e gera o relatório diário.
echo   5. Prepara o aviso humanizado com 2ª via / PIX para você CONFIRMAR o disparo no CRM.
echo.

set SCRIPT_DIR=%~dp0
set TASK_NAME=SimulaJa_Auditoria_Inadimplentes_Dia21

echo Diretório do Script: %SCRIPT_DIR%
echo Nome da Tarefa: %TASK_NAME%
echo.

:: Verificar se o Node.js está acessível
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] O comando 'node' não foi encontrado no PATH do Windows.
    echo Por favor, certifique-se de que o Node.js está instalado.
    pause
    exit /b 1
)

:: Criação do script runner para background
set RUNNER_BAT=%SCRIPT_DIR%run_auditoria_background.bat
(
echo @echo off
echo cd /d "%SCRIPT_DIR%.."
echo node scripts\auditoria_inadimplentes_magalu.mjs ^>^> scripts\logs\auditoria_cron.log 2^>^&1
) > "%RUNNER_BAT%"

echo Registrando tarefa no Windows Task Scheduler para todo dia 21 às 09:00 AM...
schtasks /create /tn "%TASK_NAME%" /tr "\"%RUNNER_BAT%\"" /sc monthly /d 21 /st 09:00 /f

if %errorlevel% equ 0 (
    echo.
    echo ==============================================================================
    echo  [SUCESSO] Tarefa de Auditoria agendada com sucesso!
    echo ==============================================================================
    echo  Frequência: Mensal (Todo dia 21)
    echo  Horário: 09:00 AM
    echo  Comando: node scripts\auditoria_inadimplentes_magalu.mjs
    echo  Logs: scripts\logs\auditoria_magalu_AAAA-MM-DD.log
    echo.
    echo  Você também pode disparar a qualquer momento pelo botão no painel do CRM!
    echo ==============================================================================
) else (
    echo.
    echo [AVISO] Se solicitou elevação, execute este arquivo clicando com o
    echo botão direito e selecionando 'Executar como Administrador'.
)

echo.
pause
