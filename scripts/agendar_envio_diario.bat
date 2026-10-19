@echo off
chcp 65001 >nul
title Simulajá CRM - Agendar Prospecção Diária Automática

echo ==============================================================================
echo        SIMULAJÁ CRM • AGENDADOR DE PROSPECÇÃO DIÁRIA POR E-MAIL
echo ==============================================================================
echo.
echo Este assistente irá criar uma Tarefa Agendada no Windows (Task Scheduler)
echo para disparar a esteira diária de e-mails automaticamente de Segunda a Sexta
echo às 09:30 da manhã.
echo.

set SCRIPT_DIR=%~dp0
set NODE_EXE=node
set TASK_NAME=SimulaJa_Prospeccao_Diaria_Email

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

:: Criação do script runner VBS/BAT silencioso
set RUNNER_BAT=%SCRIPT_DIR%run_background.bat
(
echo @echo off
echo cd /d "%SCRIPT_DIR%.."
echo node scripts\prospeccao_diaria_email.mjs ^>^> scripts\logs\cron_output.log 2^>^&1
) > "%RUNNER_BAT%"

echo Registrando tarefa no Windows Task Scheduler...
schtasks /create /tn "%TASK_NAME%" /tr "\"%RUNNER_BAT%\"" /sc weekly /d MON,TUE,WED,THU,FRI /st 09:30 /f

if %errorlevel% equ 0 (
    echo.
    echo ==============================================================================
    echo  [SUCESSO] Tarefa agendada com sucesso!
    echo ==============================================================================
    echo  Horário: 09:30 AM (Segunda a Sexta-feira)
    echo  Comando: node scripts\prospeccao_diaria_email.mjs
    echo  Logs: scripts\logs\prospeccao_AAAA-MM-DD.log
    echo.
    echo  Para cancelar ou pausar no futuro, execute 'scripts\cancelar_agendamento.bat'.
    echo ==============================================================================
) else (
    echo.
    echo [AVISO] Falha ao criar a tarefa. Se solicitou elevação, execute este arquivo
    echo clicando com o botão direito e selecionando 'Executar como Administrador'.
)

echo.
pause
