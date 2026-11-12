@echo off
chcp 65001 >nul
title Simulajá CRM - Parar WhatsApp Server

echo Parando qualquer processo do WAHA WhatsApp em segundo plano...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Encerrando processo na porta 3000 (PID: %%a)...
    taskkill /PID %%a /F >nul 2>nul
)

echo [OK] WhatsApp Server encerrado com sucesso.
pause

