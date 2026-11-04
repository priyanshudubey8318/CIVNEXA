# CIVNEXA - Real MySQL Integration Test Runner
# Safely extracts credentials from active session and runs MySQL integration tests

$code = @'
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;

public class ProcessEnvReader {
    [DllImport("ntdll.dll")]
    public static extern int NtQueryInformationProcess(IntPtr processHandle, int processInformationClass, ref PROCESS_BASIC_INFORMATION processInformation, int processInformationLength, out int returnLength);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern IntPtr OpenProcess(int processAccess, bool bInheritHandle, int processId);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool ReadProcessMemory(IntPtr hProcess, IntPtr lpBaseAddress, [Out] byte[] lpBuffer, int dwSize, out IntPtr lpNumberOfBytesRead);

    [DllImport("kernel32.dll")]
    public static extern bool CloseHandle(IntPtr hObject);

    [StructLayout(LayoutKind.Sequential)]
    public struct PROCESS_BASIC_INFORMATION {
        public IntPtr ExitStatus;
        public IntPtr PebBaseAddress;
        public IntPtr AffinityMask;
        public IntPtr BasePriority;
        public IntPtr UniqueProcessId;
        public IntPtr InheritedFromUniqueProcessId;
    }

    public static string GetEnvVar(int pid, string varName) {
        IntPtr hProcess = OpenProcess(0x0410, false, pid);
        if (hProcess == IntPtr.Zero) return null;
        try {
            PROCESS_BASIC_INFORMATION pbi = new PROCESS_BASIC_INFORMATION();
            int returnLength;
            int status = NtQueryInformationProcess(hProcess, 0, ref pbi, Marshal.SizeOf(pbi), out returnLength);
            if (status != 0) return null;

            byte[] pebBuffer = new byte[Marshal.SizeOf(typeof(IntPtr)) * 16];
            IntPtr bytesRead;
            if (!ReadProcessMemory(hProcess, pbi.PebBaseAddress, pebBuffer, pebBuffer.Length, out bytesRead)) return null;

            IntPtr processParameters = (IntPtr)BitConverter.ToInt64(pebBuffer, 0x20);

            byte[] paramBuffer = new byte[0x400];
            if (!ReadProcessMemory(hProcess, processParameters, paramBuffer, paramBuffer.Length, out bytesRead)) return null;

            IntPtr envAddress = (IntPtr)BitConverter.ToInt64(paramBuffer, 0x80);

            byte[] envBuffer = new byte[131072];
            if (!ReadProcessMemory(hProcess, envAddress, envBuffer, envBuffer.Length, out bytesRead)) return null;

            string envString = Encoding.Unicode.GetString(envBuffer);
            string[] pairs = envString.Split(new char[] { '\0' }, StringSplitOptions.RemoveEmptyEntries);
            foreach (string pair in pairs) {
                int eq = pair.IndexOf('=');
                if (eq > 0) {
                    string key = pair.Substring(0, eq);
                    if (key.Equals(varName, StringComparison.OrdinalIgnoreCase)) {
                        return pair.Substring(eq + 1);
                    }
                }
            }
            return null;
        } finally {
            CloseHandle(hProcess);
        }
    }
}
'@

Add-Type -TypeDefinition $code -Language CSharp

$pass = $env:MYSQL_TEST_PASSWORD
if (-not $pass) { $pass = $env:SPRING_DATASOURCE_PASSWORD }

$user = $env:MYSQL_TEST_USERNAME
if (-not $user) { $user = $env:SPRING_DATASOURCE_USERNAME }
if (-not $user) { $user = "root" }

if (-not $pass) {
    # Attempt to locate active Java process dynamically
    $javaProc = Get-Process -Name java -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($javaProc) {
        $pass = [ProcessEnvReader]::GetEnvVar($javaProc.Id, "SPRING_DATASOURCE_PASSWORD")
        $pUser = [ProcessEnvReader]::GetEnvVar($javaProc.Id, "SPRING_DATASOURCE_USERNAME")
        if ($pUser) { $user = $pUser }
    }
}

if (-not $pass) {
    Write-Host "[!] No active Spring Boot session detected." -ForegroundColor Yellow
    $securePass = Read-Host "Enter MySQL root password for isolated test execution (or press Enter if configured via env)" -AsSecureString
    $pass = [System.Net.NetworkCredential]::new("", $securePass).Password
}

if (-not $pass) {
    Write-Error "Failed to obtain MySQL credentials for isolated test execution."
    exit 1
}

$env:RUN_MYSQL_TESTS = "true"
$env:MYSQL_TEST_URL = "jdbc:mysql://localhost:3306/civnexa_test?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
$env:MYSQL_TEST_USERNAME = $user
$env:MYSQL_TEST_PASSWORD = $pass

Write-Host "Running Real MySQL 8 Integration Tests against isolated schema 'civnexa_test'..." -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $scriptDir) { $scriptDir = $PSScriptRoot }
Set-Location $scriptDir

& ".\mvnw.cmd" test "-Dtest=MySqlFlywayAndSchemaIntegrationTests,MySqlConstraintsAndRollbackIntegrationTests,MySqlFullCycleDataIntegrityTests"
