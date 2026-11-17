# Setup e Integracao Dewiar App e SimulaJa
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host " DEWIAR APP + SIMULAJA CRM - SETUP E INTEGRACAO DE VOZ" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

$projetosDir = "C:\Users\Samsung\Documents\Projetos"
$simulajaDir = "$projetosDir\simulaja"
$dewiarDir = "$projetosDir\dewiar-app"

# 1. Checar pre-requisitos
Write-Host "[1/5] Verificando pre-requisitos do sistema..." -ForegroundColor Yellow
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[ERRO] Git nao foi encontrado no PATH do Windows." -ForegroundColor Red
    return
}
Write-Host "  [OK] Git detectado." -ForegroundColor Green

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "[ERRO] Python nao foi encontrado no PATH do Windows." -ForegroundColor Red
    return
}
Write-Host "  [OK] Python detectado." -ForegroundColor Green

# 2. Clonar repositorio
Write-Host ""
Write-Host "[2/5] Verificando pasta do Dewiar App..." -ForegroundColor Yellow
if (-not (Test-Path $dewiarDir)) {
    Write-Host "  Clonando repositorio oficial do Dewiar App..." -ForegroundColor Cyan
    git clone https://github.com/dwr-git/dewiar-app.git $dewiarDir
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Falha ao clonar repositorio do Dewiar App." -ForegroundColor Red
        return
    }
    Write-Host "  [OK] Repositorio clonado com sucesso em: $dewiarDir" -ForegroundColor Green
} else {
    Write-Host "  [OK] Pasta do Dewiar App ja existe em: $dewiarDir" -ForegroundColor Green
}

# 3. Criar venv
Write-Host ""
Write-Host "[3/5] Configurando ambiente virtual Python (venv)..." -ForegroundColor Yellow
Set-Location $dewiarDir
$venvPath = Join-Path $dewiarDir "venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "  Criando venv..." -ForegroundColor Cyan
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Falha ao criar venv." -ForegroundColor Red
        return
    }
    Write-Host "  [OK] venv criado com sucesso." -ForegroundColor Green
} else {
    Write-Host "  [OK] venv ja existente." -ForegroundColor Green
}

# 4. Instalar dependencias
Write-Host ""
Write-Host "[4/5] Instalando dependencias do Dewiar..." -ForegroundColor Yellow
$reqFile = Join-Path $dewiarDir "requirements.txt"
$pipExe = Join-Path $dewiarDir "venv\Scripts\pip.exe"
$pythonExe = Join-Path $dewiarDir "venv\Scripts\python.exe"

if (Test-Path $reqFile) {
    Write-Host "  Atualizando pip e instalando pacotes..." -ForegroundColor Cyan
    & $pythonExe -m pip install --upgrade pip
    & $pipExe install -r $reqFile
} else {
    Write-Host "  Nenhum requirements.txt na raiz do Dewiar." -ForegroundColor Gray
}

# 5. Configurar MCP
Write-Host ""
Write-Host "[5/5] Vinculando Servidor MCP do SimulaJa..." -ForegroundColor Yellow
$mcpSrc = Join-Path $simulajaDir "dewiar-mcp-config.json"
$mcpDst = Join-Path $dewiarDir "mcp_servers.json"
if (Test-Path $mcpSrc) {
    Copy-Item -Path $mcpSrc -Destination $mcpDst -Force
    Write-Host "  [OK] Configuracao MCP copiada para: $mcpDst" -ForegroundColor Green
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host " INTEGRACAO CONCLUIDA COM SUCESSO!" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Green
