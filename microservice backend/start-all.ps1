#!/usr/bin/env pwsh
# ==========================================================
# Code Campus - Start All Microservices (Windows PowerShell)
# ==========================================================
# Run this script from the "microservice backend" directory:
#   cd "microservice backend"
#   .\start-all.ps1
# ==========================================================

$services = @(
  @{ Name = "API-Gateway";    Dir = "api-gateway";          Port = 5000 },
  @{ Name = "Auth-Service";   Dir = "auth-service";         Port = 5001 },
  @{ Name = "User-Service";   Dir = "user-service";         Port = 5002 },
  @{ Name = "Post-Service";   Dir = "post-service";         Port = 5003 },
  @{ Name = "Exam-Service";   Dir = "exam-service";         Port = 5004 },
  @{ Name = "Course-Service"; Dir = "course-service";       Port = 5005 },
  @{ Name = "Enroll-Service"; Dir = "enrollment-service";   Port = 5006 },
  @{ Name = "Code-Service";   Dir = "coding-service";       Port = 5007 },
  @{ Name = "Notif-Service";  Dir = "notification-service"; Port = 5008 },
  @{ Name = "Chat-Service";   Dir = "chat-service";         Port = 5009 }
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Code Campus - Microservices Launcher" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

foreach ($svc in $services) {
  Write-Host "Starting $($svc.Name) on port $($svc.Port)..." -ForegroundColor Yellow
  $scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
  $serviceDir = Join-Path $scriptRoot $svc.Dir
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$serviceDir'; node src/index.js" -WindowStyle Normal
  Start-Sleep -Milliseconds 400
}

Write-Host ""
Write-Host "All 10 services launched in separate windows!" -ForegroundColor Green
Write-Host "API Gateway available at: http://localhost:5000" -ForegroundColor Green
Write-Host "Check /health endpoint on each service to verify." -ForegroundColor Green
