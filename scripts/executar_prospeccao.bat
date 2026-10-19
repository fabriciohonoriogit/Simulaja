@echo off
chcp 65001 >nul
title Simulajá CRM - Executar Prospecção Diária Manualmente

echo ==============================================================================
echo        SIMULAJÁ CRM • DISPARADOR DIÁRIO DE PROSPECÇÃO POR E-MAIL
echo ==============================================================================
echo.

cd /d "%~dp0.."

echo Iniciando processo de prospecção do dia...
echo.
node scripts\prospeccao_diaria_email.mjs

echo.
echo Execução finalizada. Pressione qualquer tecla para fechar.
pause >nul
