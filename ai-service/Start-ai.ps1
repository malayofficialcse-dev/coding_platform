#!/usr/bin/env pwsh
# ==========================================================
# Code Campus - Start AI Service (FastAPI + LangChain)
# ==========================================================

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptRoot

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Code Campus AI Service Launcher" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan

# Check if virtual environment exists
if (Test-Path "$scriptRoot\venv\Scripts\activate.ps1") {
    Write-Host "Activating virtual environment..." -ForegroundColor Green
    & "$scriptRoot\venv\Scripts\Activate.ps1"
} else {
    Write-Host "No venv detected in ai-service/venv. Using global Python environment." -ForegroundColor Gray
}

# Check if OPENAI_API_KEY is configured
$envFile = "$scriptRoot\.env"
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    if ($content -match "OPENAI_API_KEY=sk-your-openai-api-key-here") {
        Write-Host ""
        Write-Host "⚠️  WARNING: OPENAI_API_KEY is still set to placeholder in ai-service/.env!" -ForegroundColor Yellow
        Write-Host "   Please open ai-service/.env and replace 'sk-your-openai-api-key-here' with your real OpenAI API key." -ForegroundColor Yellow
        Write-Host ""
    }
}

# Ensure port 5011 is free
$staleConns = Get-NetTCPConnection -LocalPort 5011 -ErrorAction SilentlyContinue
if ($staleConns) {
    $pids = $staleConns | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($p in $pids) {
        if ($p -and $p -ne 0) {
            Write-Host "Freeing port 5011 (terminating stale process PID $p)..." -ForegroundColor Yellow
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Milliseconds 800
}

Write-Host "Starting AI Service on port 5011 (http://localhost:5011)..." -ForegroundColor Cyan
python -m uvicorn src.main:app --host 0.0.0.0 --port 5011 --reload
