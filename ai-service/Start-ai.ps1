#!/usr/bin/env pwsh
# ==========================================================
# Code Campus - Start AI Service (FastAPI + LangChain)
# ==========================================================

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptRoot

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Code Campus AI Service Launcher" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan

# Use the project's supported local Python version instead of silently falling
# back to a global interpreter that may not have the service dependencies.
$venvPath = Join-Path $scriptRoot ".venv"
$venvPython = Join-Path $venvPath "Scripts\python.exe"
$legacyVenvPython = Join-Path $scriptRoot "venv\Scripts\python.exe"

if (Test-Path $legacyVenvPython) {
    $venvPython = $legacyVenvPython
} elseif (-not (Test-Path $venvPython)) {
    $launcher = Get-Command py.exe -ErrorAction SilentlyContinue
    if (-not $launcher) {
        throw "Python 3.12 or 3.11 is required. Install Python and the Windows py launcher, then run this script again."
    }

    $createdVenv = $false
    foreach ($version in @("3.12", "3.11")) {
        & $launcher.Source "-$version" --version *> $null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Creating .venv with Python $version..." -ForegroundColor Green
            & $launcher.Source "-$version" -m venv $venvPath
            if ($LASTEXITCODE -ne 0) {
                throw "Could not create the virtual environment with Python $version."
            }
            $createdVenv = $true
            break
        }
    }

    if (-not $createdVenv) {
        throw "Python 3.12 or 3.11 was not found. Install one of these versions, then run this script again."
    }
}

$pythonVersion = & $venvPython --version
if ($pythonVersion -notmatch "Python 3\.(11|12)\.") {
    throw "The AI service uses Python 3.11 or 3.12. Found '$pythonVersion' at '$venvPython'. Remove or rename that venv, then run this script again."
}

Write-Host "Installing/checking AI service dependencies..." -ForegroundColor Green
& $venvPython -m pip install -r (Join-Path $scriptRoot "requirements.txt")
if ($LASTEXITCODE -ne 0) {
    Write-Host "On Windows, chroma-hnswlib may need Microsoft C++ Build Tools (Desktop development with C++)." -ForegroundColor Yellow
    Write-Host "Alternatively, start Docker Desktop and run the AI service from its Dockerfile." -ForegroundColor Yellow
    throw "Dependency installation failed. Resolve the pip error above, then run this script again."
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
& $venvPython -m uvicorn src.main:app --host 0.0.0.0 --port 5011 --reload
