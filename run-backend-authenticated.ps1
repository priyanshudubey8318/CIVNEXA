# CIVNEXA - Interactive Backend Startup Script
# Securely captures MySQL credentials in a persistent PowerShell session

$host.UI.RawUI.WindowTitle = "CIVNEXA - Backend & Database Authentication"

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "   CIVNEXA - Campus Conduct, Grievance, Safety and Counseling System" -ForegroundColor White
Write-Host "   Backend Authentication and Secure Startup Session" -ForegroundColor DarkGray
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Capture MySQL password securely from user without printing
$rootSecure = Read-Host "Enter your existing MySQL root password" -AsSecureString

$env:SPRING_DATASOURCE_USERNAME = "root"
$env:SPRING_DATASOURCE_PASSWORD = [System.Net.NetworkCredential]::new("", $rootSecure).Password

# Configure Spring Datasource URL pointing to existing civnexa database
$env:SPRING_DATASOURCE_URL = "jdbc:mysql://localhost:3306/civnexa?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"

# Generate independent cryptographically secure JWT and OTP secrets
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try {
    $jwtBytes = New-Object byte[] 48
    $otpBytes = New-Object byte[] 48
    $rng.GetBytes($jwtBytes)
    $rng.GetBytes($otpBytes)

    $jwtSecret = [System.Convert]::ToBase64String($jwtBytes)
    $env:JWT_SECRET = $jwtSecret
    $env:CIVNEXA_JWT_SECRET = $jwtSecret
    $env:CIVNEXA_OTP_HMAC_SECRET = [System.Convert]::ToBase64String($otpBytes)
} finally {
    $rng.Dispose()
}

# Preserve existing Super Admin and configure server port
$env:CIVNEXA_ENABLE_INITIAL_BOOTSTRAP = "false"
$env:PORT = "8080"
$env:SERVER_PORT = "8080"

Write-Host "`n[+] Environment variables successfully populated in this session." -ForegroundColor Green
Write-Host "[*] Launching Spring Boot backend (context path: /api/v1, port: 8080)..." -ForegroundColor Cyan
Write-Host "    HikariCP will verify database connectivity upon startup." -ForegroundColor DarkGray
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $scriptDir) { $scriptDir = $PSScriptRoot }
if (-not $scriptDir) { $scriptDir = "C:\Users\priyanshu dubey\OneDrive\Desktop\PROJECTS\CIVNEXA" }
$backendDir = Join-Path $scriptDir "backend"

Set-Location $backendDir
& ".\mvnw.cmd" spring-boot:run
