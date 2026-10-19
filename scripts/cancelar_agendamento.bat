@echo off
chcp 65001 >nul
title Simulajá CRM - Cancelar Agendamento de Prospecção

echo ==============================================================================
echo        SIMULAJÁ CRM • CANCELAR TAREFA AGENDADA DE E-MAIL
echo ==============================================================================
echo.

set TASK_NAME=SimulaJa_Prospeccao_Diaria_Email

echo Removendo tarefa agendada '%TASK_NAME%'...
schtasks /delete /tn "%TASK_NAME%" /f

if %errorlevel% equ 0 (
    echo.
    echo [SUCESSO] A tarefa agendada foi removida com sucesso.
    echo O envio diário automático foi pausado.
) else (
    echo.
    echo [AVISO] Nenhuma tarefa com esse nome foi encontrada ou são necessários privilégios de administrador.
)

echo.
pause
