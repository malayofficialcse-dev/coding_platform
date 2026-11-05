$ErrorActionPreference = "Stop"
$backendRoot = Split-Path -Parent $PSScriptRoot
$securePassword = Read-Host "Enter a unique super-admin password (6+ characters; longer is safer)" -AsSecureString
$passwordPointer = [IntPtr]::Zero
$exitCode = 1

try {
  $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
  $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  if ($password.Length -lt 6) {
    throw "The super-admin password must be at least 6 characters."
  }

  $env:SUPER_ADMIN_PASSWORD = $password
  Push-Location $backendRoot
  try {
    & node .\scripts\seed-super-admin.js
    $exitCode = $LASTEXITCODE
  } finally {
    Pop-Location
  }
} finally {
  Remove-Item Env:SUPER_ADMIN_PASSWORD -ErrorAction SilentlyContinue
  if ($passwordPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
  }
  $password = $null
}

exit $exitCode
