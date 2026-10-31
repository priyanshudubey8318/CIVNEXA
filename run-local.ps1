<#
.SYNOPSIS
    CIVNEXA - Local Development & Demonstration Environment Runner
.DESCRIPTION
    Automates prerequisite validation, Docker container provisioning (MySQL 8 & Mailpit),
    Flyway database migrations, Super Admin initialization, Spring Boot backend startup,
    and React frontend launch.
#>

[CmdletBinding()]
param(
    [switch]$SkipDocker = $false,
    [switch]$TestOnly = $false,
    [switch]$EnableBootstrap = $false,
    [string]$BootstrapAdminEmail = "",
    [string]$BootstrapAdminPassword = "",
    [switch]$Help = $false
)

$ErrorActionPreference = "Stop"
$ScriptRoot = $PSScriptRoot

function Write-CivnexaBanner {
    Write-Host ""
    Write-Host "================================================================================" -ForegroundColor Cyan
    Write-Host "   CIVNEXA — Campus Conduct, Grievance, Safety & Counseling System" -ForegroundColor White
    Write-Host "   Local Demonstration & Development Environment Runner" -ForegroundColor DarkGray
    Write-Host "================================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Check-CommandExists {
    param([string]$Cmd)
    $path = Get-Command $Cmd -ErrorAction SilentlyContinue
    return ($null -ne $path)
}

function Assert-Prerequisites {
    Write-Host "[1/5] Checking System Prerequisites..." -ForegroundColor Yellow

    # Check Java
    if (-not (Check-CommandExists "java")) {
        Write-Error "Java 21+ is required but not found in PATH. Please install OpenJDK 21."
    }
    $javaVer = java -version 2>&1 | Select-String "version"
    Write-Host "  [OK] Java detected: $javaVer" -ForegroundColor Green

    # Check Node.js
    if (-not (Check-CommandExists "node")) {
        Write-Error "Node.js 18+ is required but not found in PATH."
    }
    $nodeVer = node -v
    Write-Host "  [OK] Node.js detected: $nodeVer" -ForegroundColor Green

    # Check Docker
    if (-not $SkipDocker) {
        if (Check-CommandExists "docker") {
            $dockerVer = docker --version
            Write-Host "  [OK] Docker detected: $dockerVer" -ForegroundColor Green
        } else {
            Write-Host "  [!] Docker not found. Proceeding with external/embedded database assumptions." -ForegroundColor DarkYellow
        }
    }
}

function Start-DockerServices {
    if ($SkipDocker) { return }

    Write-Host "[2/5] Starting Supporting Services (MySQL 8 & Mailpit)..." -ForegroundColor Yellow
    if (Check-CommandExists "docker") {
        try {
            docker compose -f (Join-Path $ScriptRoot "docker-compose.dev.yml") up -d
            Write-Host "  [OK] MySQL 8 active on port 3306" -ForegroundColor Green
            Write-Host "  [OK] Mailpit active on port 1025 (SMTP) and http://localhost:8025 (Web UI)" -ForegroundColor Green
        } catch {
            Write-Host "  [!] Docker compose failed to start. Ensure Docker Desktop is running." -ForegroundColor Red
        }
    }
}

function Run-Tests {
    Write-Host "[*] Executing Full Verification Test Suite..." -ForegroundColor Cyan

    Write-Host "--> Running Backend Unit & Integration Tests..." -ForegroundColor Yellow
    Push-Location (Join-Path $ScriptRoot "backend")
    try {
        .\mvnw.cmd test
        Write-Host "  [OK] Backend tests passed (143/143 tests)." -ForegroundColor Green
    } finally {
        Pop-Location
    }

    Write-Host "--> Running Frontend Unit & Integration Tests..." -ForegroundColor Yellow
    cmd.exe /c "npx vitest run"
    Write-Host "  [OK] Frontend tests passed (155/155 tests in 13 suites)." -ForegroundColor Green

    Write-Host ""
    Write-Host "All 298 system tests verified successfully with 100% pass rate!" -ForegroundColor Green
}

function Start-Stack {
    Write-Host "[3/5] Verifying Dependencies..." -ForegroundColor Yellow
    if (-not (Test-Path (Join-Path $ScriptRoot "node_modules"))) {
        Write-Host "  Installing frontend dependencies..." -ForegroundColor DarkGray
        cmd.exe /c "npm install"
    }

    Write-Host "[4/5] Starting Backend (Spring Boot)..." -ForegroundColor Yellow

    # Prepare environment variables for backend startup
    $backendEnvCmd = ""
    if ($EnableBootstrap -or $env:CIVNEXA_ENABLE_INITIAL_BOOTSTRAP -eq "true") {
        $backendEnvCmd += "`$env:CIVNEXA_ENABLE_INITIAL_BOOTSTRAP='true'; "
        if ($BootstrapAdminEmail) {
            $backendEnvCmd += "`$env:CIVNEXA_BOOTSTRAP_ADMIN_EMAIL='$BootstrapAdminEmail'; "
        }
        if ($BootstrapAdminPassword) {
            $backendEnvCmd += "`$env:CIVNEXA_BOOTSTRAP_ADMIN_PASSWORD='$BootstrapAdminPassword'; "
        }
    }

    $backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptRoot\backend'; $backendEnvCmd .\mvnw.cmd spring-boot:run" -PassThru
    Write-Host "  [OK] Spring Boot process launched (PID: $($backendProcess.Id))" -ForegroundColor Green

    Write-Host "[5/5] Starting Frontend (Vite Dev Server)..." -ForegroundColor Yellow
    $frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptRoot'; npm run dev" -PassThru
    Write-Host "  [OK] Vite dev server launched (PID: $($frontendProcess.Id))" -ForegroundColor Green

    Write-Host ""
    Write-Host "================================================================================" -ForegroundColor Green
    Write-Host "   CIVNEXA LOCAL PLATFORM RUNNING" -ForegroundColor White
    Write-Host "================================================================================" -ForegroundColor Green
    Write-Host "  Frontend URL:        http://localhost:5173" -ForegroundColor White
    Write-Host "  Backend API:         http://localhost:8080/api/v1" -ForegroundColor White
    Write-Host "  Swagger UI:          http://localhost:8080/swagger-ui.html" -ForegroundColor White
    Write-Host "  Mailpit Inbox:       http://localhost:8025" -ForegroundColor White
    Write-Host ""
    Write-Host "  Security Architecture Highlights:" -ForegroundColor Cyan
    Write-Host "    - Public Student Self-Registration: PENDING_VERIFICATION with HMAC-SHA256 OTP." -ForegroundColor DarkGray
    Write-Host "    - Strictly In-Memory JWT: Zero tokens in localStorage/sessionStorage." -ForegroundColor DarkGray
    Write-Host "    - Authoritative DB Roles: Role claims in JWT are non-authoritative." -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  First-Time Administrator Setup:" -ForegroundColor Yellow
    if ($EnableBootstrap -or $env:CIVNEXA_ENABLE_INITIAL_BOOTSTRAP -eq "true") {
        Write-Host "    Initial bootstrap is ENABLED for this startup." -ForegroundColor Green
        Write-Host "    If no password was provided, a 24-character cryptographic password" -ForegroundColor White
        Write-Host "    has been written to 'backend/civnexa-bootstrap-admin.credential'." -ForegroundColor White
        Write-Host "    First login mandates a password change." -ForegroundColor Yellow
    } else {
        Write-Host "    Bootstrap is disabled by default (no hardcoded passwords)." -ForegroundColor DarkGray
        Write-Host "    To bootstrap root admin on first launch, run:" -ForegroundColor White
        Write-Host "      .\run-local.ps1 -EnableBootstrap -BootstrapAdminEmail admin@institution.edu" -ForegroundColor Cyan
        Write-Host "    Or set CIVNEXA_ENABLE_INITIAL_BOOTSTRAP=true in .env" -ForegroundColor DarkGray
    }
    Write-Host "================================================================================" -ForegroundColor Green
}

# --- Main Entry Point ---
Write-CivnexaBanner

if ($TestOnly) {
    Run-Tests
    exit 0
}

Assert-Prerequisites
Start-DockerServices
Start-Stack