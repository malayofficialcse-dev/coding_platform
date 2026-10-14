#!/usr/bin/env pwsh
# ==========================================================
# Code Campus - Start All Microservices (Windows PowerShell)
# ==========================================================

$services = @(
  @{ Name = "API-Gateway";    Dir = "api-gateway";          Port = 5100; Tag = "[GATEWAY]" },
  @{ Name = "Auth-Service";   Dir = "auth-service";         Port = 5001; Tag = "[AUTH]   " },
  @{ Name = "User-Service";   Dir = "user-service";         Port = 5002; Tag = "[USER]   " },
  @{ Name = "Post-Service";   Dir = "post-service";         Port = 5003; Tag = "[POST]   " },
  @{ Name = "Exam-Service";   Dir = "exam-service";         Port = 5004; Tag = "[EXAM]   " },
  @{ Name = "Course-Service"; Dir = "course-service";       Port = 5005; Tag = "[COURSE] " },
  @{ Name = "Enroll-Service"; Dir = "enrollment-service";   Port = 5006; Tag = "[ENROLL] " },
  @{ Name = "Code-Service";   Dir = "coding-service";       Port = 5007; Tag = "[CODE]   " },
  @{ Name = "Notif-Service";  Dir = "notification-service"; Port = 5008; Tag = "[NOTIF]  " },
  @{ Name = "Chat-Service";   Dir = "chat-service";         Port = 5009; Tag = "[CHAT]   " }
)

# ── Helpers ──────────────────────────────────────────────
function Write-Color { param($Text, $Color); Write-Host $Text -ForegroundColor $Color }

function Show-ProgressBar {
  param($Current, $Total, $Label)
  $width  = 28
  $filled = [math]::Round(($Current / $Total) * $width)
  $empty  = $width - $filled
  $bar    = ("#" * $filled) + ("-" * $empty)
  $pct    = [math]::Round(($Current / $Total) * 100)
  $pctStr = "$pct%".PadLeft(4)
  Write-Host "`r  [" -NoNewline
  Write-Host $bar -ForegroundColor Cyan -NoNewline
  Write-Host "] " -NoNewline
  Write-Host $pctStr -ForegroundColor Yellow -NoNewline
  Write-Host "  $Label           " -NoNewline
}

function Show-Spinner {
  param($Label)
  $frames = @("|", "/", "-", "\", "|", "/", "-", "\")
  for ($i = 0; $i -lt 8; $i++) {
    Write-Host "`r  " -NoNewline
    Write-Host $frames[$i] -ForegroundColor Magenta -NoNewline
    Write-Host "  $Label               " -NoNewline
    Start-Sleep -Milliseconds 55
  }
}

# ── Clear & Banner ───────────────────────────────────────
Clear-Host
Write-Host ""
Write-Color "  +==================================================+" "DarkCyan"
Write-Color "  |                                                  |" "DarkCyan"
Write-Host  "  |" -ForegroundColor DarkCyan -NoNewline
Write-Host  "     ___  ___  ___  ___    ___  _   _  ___ _   _    " -ForegroundColor Cyan -NoNewline
Write-Color "|" "DarkCyan"
Write-Host  "  |" -ForegroundColor DarkCyan -NoNewline
Write-Host  "    / __|| _ \|   \| __|  / __|| | | |/ __| | | |   " -ForegroundColor Cyan -NoNewline
Write-Color "|" "DarkCyan"
Write-Host  "  |" -ForegroundColor DarkCyan -NoNewline
Write-Host  "   | (__ |   /| |) | _|  | (__ | |_| |\__ \ |_| |   " -ForegroundColor White -NoNewline
Write-Color "|" "DarkCyan"
Write-Host  "  |" -ForegroundColor DarkCyan -NoNewline
Write-Host  "    \___||_|_\|___/|___|  \___||_|\__/ |___/\___/    " -ForegroundColor DarkCyan -NoNewline
Write-Color "|" "DarkCyan"
Write-Color "  |                                                  |" "DarkCyan"
Write-Host  "  |" -ForegroundColor DarkCyan -NoNewline
Write-Host  "        M I C R O S E R V I C E S   L A U N C H E R  " -ForegroundColor Yellow -NoNewline
Write-Color "|" "DarkCyan"
Write-Color "  |                                                  |" "DarkCyan"
Write-Color "  +==================================================+" "DarkCyan"
Write-Host ""

$ts = Get-Date -Format "dddd, dd MMMM yyyy   HH:mm:ss"
Write-Host "  >> " -ForegroundColor DarkCyan -NoNewline
Write-Color $ts "DarkGray"
Write-Host ""
Write-Color "  ----------------------------------------------------" "DarkGray"
Write-Host ""

# ── Launch Services ──────────────────────────────────────
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$total      = $services.Count

for ($idx = 0; $idx -lt $total; $idx++) {
  $svc        = $services[$idx]
  $serviceDir = Join-Path $scriptRoot $svc.Dir

  Show-Spinner "Preparing $($svc.Name)..."

  Start-Process powershell `
    -ArgumentList "-NoExit", "-Command", `
      "`$host.UI.RawUI.WindowTitle = '$($svc.Name) | Port $($svc.Port)'; Set-Location '$serviceDir'; node src/index.js" `
    -WindowStyle Normal

  Show-ProgressBar ($idx + 1) $total "$($svc.Tag) $($svc.Name)  ->  :$($svc.Port)"
  Write-Host ""

  Start-Sleep -Milliseconds 350
}

# ── Final Summary Table ───────────────────────────────────
Write-Host ""
Write-Color "  ----------------------------------------------------" "DarkGray"
Write-Host ""
Write-Host "  >> " -ForegroundColor Green -NoNewline
Write-Color "All $total services launched successfully!" "Green"
Write-Host ""

Write-Color "  +-----------------------------+--------+--------------------------------+" "DarkGray"
Write-Host  "  | " -NoNewline -ForegroundColor DarkGray
Write-Host  "Service Name                " -NoNewline -ForegroundColor White
Write-Host  "| " -NoNewline -ForegroundColor DarkGray
Write-Host  "Port   " -NoNewline -ForegroundColor White
Write-Host  "| " -NoNewline -ForegroundColor DarkGray
Write-Host  "Health Check URL               " -NoNewline -ForegroundColor White
Write-Color " |" "DarkGray"
Write-Color "  +-----------------------------+--------+--------------------------------+" "DarkGray"

foreach ($svc in $services) {
  $nameCol   = $svc.Name.PadRight(28)
  $portCol   = (":$($svc.Port)").PadRight(7)
  $healthUrl = "http://localhost:$($svc.Port)/health"
  $healthCol = $healthUrl.PadRight(31)

  Write-Host "  | " -NoNewline -ForegroundColor DarkGray
  Write-Host $nameCol -NoNewline -ForegroundColor Cyan
  Write-Host " | " -NoNewline -ForegroundColor DarkGray
  Write-Host $portCol -NoNewline -ForegroundColor Yellow
  Write-Host " | " -NoNewline -ForegroundColor DarkGray
  Write-Host $healthCol -NoNewline -ForegroundColor DarkCyan
  Write-Color "|" "DarkGray"
}

Write-Color "  +-----------------------------+--------+--------------------------------+" "DarkGray"
Write-Host ""
Write-Host "  >> " -ForegroundColor Cyan -NoNewline
Write-Host "API Gateway  ->  " -NoNewline -ForegroundColor Gray
Write-Color "http://localhost:5100" "Cyan"
Write-Host ""
Write-Host "  >> " -ForegroundColor DarkGray -NoNewline
Write-Color "Tip: Each service window is titled with its name and port." "DarkGray"
Write-Host ""
Write-Color "  ----------------------------------------------------" "DarkGray"
Write-Host ""
