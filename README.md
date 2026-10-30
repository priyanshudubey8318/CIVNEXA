# CIVNEXA — Campus Conduct, Grievance, Safety & Student Support Management System

CIVNEXA is an institutional-grade, full-stack campus governance platform engineered for universities and higher education institutions. It provides tamper-evident case management, disciplinary and grievance resolution, confidential student counseling, verifiable evidence custody chains, hearing calendar orchestration, and administrative oversight across eight institutional roles.

---

## 🏛️ System Architecture

CIVNEXA is built with an enterprise multi-tier architecture separating concerns between reactive web presentation, transactional REST APIs, and strict relational data governance.

```
+-------------------------------------------------------------------------+
|                           CIVNEXA Frontend                              |
|   React 19 • Vite • Bootstrap 5 • Framer Motion • Lucide • Chart.js     |
|   Strict in-memory JWT session management (Zero tokens in localStorage) |
+------------------------------------+------------------------------------+
                                     |  REST API / Bearer Auth
                                     v
+-------------------------------------------------------------------------+
|                           CIVNEXA Backend                               |
|   Java 21 • Spring Boot 3.5.7 • Spring Security 6.x • JJWT 0.12.6       |
|   Rate Limiting • BCrypt Cost 12 • Audit Logging • Flyway Migrations     |
+-------------------+--------------------------------+--------------------+
                    |                                |
                    v                                v
+-----------------------------------+  +----------------------------------+
|           MySQL 8 Database        |  |          Mailpit / SMTP          |
|  Strict Constraints & Migrations  |  |  Institutional Email & OTPs      |
+-----------------------------------+  +----------------------------------+
```

### Institutional Role Hierarchy

| Role Key | Institutional Scope | Core Capabilities & Permissions |
|---|---|---|
| `SUPER_ADMIN` | University IT & Systems | Global system governance, bulk roster import, user provisioning, audit log inspection. |
| `DEAN` | Dean of Student Affairs | Campus-wide disciplinary oversight, verification queue clearance, appellate reviews. |
| `HOD` | Academic Department Head | Departmental case triage, proctorial assignment, student 360 profile reviews. |
| `FACULTY` | Professors & Instructors | Incident and academic misconduct reporting, invigilation evidence submission. |
| `STAFF` | Security & Wardens | Hostel curfew breaches, safety incidents, campus security dispatch logging. |
| `COORDINATOR` | Welfare & Mental Health | Student counseling intake, mentor referrals, private clinical session notes. |
| `COMMITTEE_MEMBER` | Ethics & Disciplinary Board | Case deliberation, evidence vault review, hearing attendance, sanction proposals. |
| `STUDENT` | Enrolled Scholars | Personal self-registration, grievance filing, response statements, appeal lodging. |

---

## 🔐 Security & Identity Features

1. **Student Self-Registration & OTP Verification:**
   - Public self-registration provisions student accounts in `PENDING_VERIFICATION` status.
   - Dispatches a 6-digit cryptographic numeric OTP valid for 10 minutes.
   - OTPs are salted and hashed with SHA-256 before storage.
   - Enforces a 60-second resend cooldown and a maximum of 5 verification attempts.
   - Once verified, the account transitions to `PENDING_APPROVAL` for administrator roster verification.
2. **Timing-Discrepancy Mitigation:**
   - Password checking executes BCrypt verification regardless of whether the account exists or its status (`ACTIVE`, `PENDING_VERIFICATION`, `PENDING_APPROVAL`, `INACTIVE`, `SUSPENDED`).
   - Constant-time response behavior prevents user enumeration.
3. **Strict In-Memory JWT Access Tokens:**
   - JWTs are stored in JavaScript memory only (`setAuthToken`) and are never written to `localStorage` or `sessionStorage`.
4. **Authoritative Database Roles:**
   - Every protected request loads user state directly from the database; role claims embedded in the JWT payload are non-authoritative.
5. **Super Admin Zero-Secret Bootstrapping:**
   - Super Admin accounts are bootstrapped automatically on first startup via environment variables (`CIVNEXA_INITIAL_ADMIN_EMAIL` / `CIVNEXA_INITIAL_ADMIN_PASSWORD`). No hardcoded credentials exist.

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Java Development Kit (JDK):** Version 21 or newer
- **Node.js:** Version 18 or newer
- **Docker & Docker Compose:** For running MySQL 8 and Mailpit locally

### Automated One-Click Start (PowerShell)

On Windows, run the provided bootstrap script:

```powershell
.\run-local.ps1
```

This script:
1. Validates Java 21, Node.js 18, and Docker prerequisites.
2. Launches MySQL 8 and Mailpit via `docker-compose.dev.yml`.
3. Verifies frontend and backend dependencies.
4. Starts the Spring Boot backend on `http://localhost:8080`.
5. Starts the Vite React frontend on `http://localhost:5173`.

### Manual Startup

#### 1. Supporting Infrastructure

```bash
docker compose -f docker-compose.dev.yml up -d
```
- **MySQL 8:** `localhost:3306` (Database: `civnexa_db`, User: `civnexa`, Pass: `civnexa_secret`)
- **Mailpit Web UI:** [http://localhost:8025](http://localhost:8025) (SMTP on `localhost:1025`)

#### 2. Start Backend

```bash
cd backend
.\mvnw.cmd spring-boot:run
```
Backend API will be available at: `http://localhost:8080/api/v1`

#### 3. Start Frontend

```bash
npm install
npm run dev
```
Frontend web interface will be available at: `http://localhost:5173`

---

## 🧪 Comprehensive Verification & Test Suite

The project features 100% test coverage across both backend and frontend components (273 total automated tests):

### Run All Tests via PowerShell

```powershell
.\run-local.ps1 -TestOnly
```

### Backend Tests (123 Tests)

```bash
cd backend
.\mvnw.cmd test
```

Includes:
- `AuthServiceIntegrationTests`: Constant-time password validation, role transitions, account lockouts.
- `EmailVerificationIntegrationTests`: Salted OTP generation, verification, resend cooldowns, attempt throttling.
- `UserImportServiceTests`: Multipart roster parsing (.xlsx, .csv, .json), SHA-256 checksum calculation, rollback safety.
- `CampusWorkflowIntegrationTests`: End-to-end incident filing, evidence custody logging, hearing scheduling, appeals.

### Frontend Tests (150 Tests)

```bash
cmd.exe /c "npx vitest run"
```

Includes:
- `auth-integration.test.jsx`: Login flows, token handling, route protection.
- `case-management.test.jsx`: Incident creation wizard, verification queue, student responses.
- `committee-hearing-counseling.test.jsx`: Evidence vault SHA-256 checks, hearing minutes, clinical logs.
- `appeals-reports-admin.test.jsx`: Appellate reviews, user management, department administration, audit trails.

---

## 📂 Bulk User Import Specification

Administrators can bulk-import user rosters in **Excel (`.xlsx`)**, **CSV (`.csv`)**, or **JSON (`.json`)** format via the Admin Console or `POST /api/v1/admin/imports`.

### CSV Structure Example

```csv
email,role,first_name,last_name,department,institutional_id
rohit.kumar@civnexa.edu,STUDENT,Rohit,Kumar,Computer Science & Engineering,22CSE055
priya.patel@civnexa.edu,FACULTY,Priya,Patel,Mechanical Engineering,FAC-9012
```

The server automatically computes an immutable SHA-256 checksum for audit compliance and returns row-by-row success/failure logs.

---

## 📜 License & Compliance

CIVNEXA is designed in accordance with campus safety, FERPA, and higher-education data governance standards. Institutional records and audit trails are cryptographically tracked and immutably preserved.
