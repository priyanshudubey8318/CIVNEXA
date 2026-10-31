# CIVNEXA — Campus Conduct, Grievance, Safety & Student Support Management System

CIVNEXA is an institutional-grade, full-stack campus governance platform engineered for universities and higher education institutions. It provides tamper-evident case management, disciplinary and grievance resolution, confidential student counseling, verifiable evidence custody chains, hearing calendar orchestration, AI-driven complaint triage, real-time dynamic QR attendance, and administrative oversight across eight institutional roles.

---

## 🏛️ System Architecture

CIVNEXA is built with an enterprise multi-tier architecture separating concerns between reactive web presentation, transactional REST APIs, and strict relational data governance.

```
+-------------------------------------------------------------------------+
|                           CIVNEXA Frontend                              |
|   React 19 • Vite • Bootstrap 5 • Framer Motion • Lucide • Chart.js     |
|   html5-qrcode (Camera Scanner) • qrcode.react (Scalable SVG Badges)    |
|   Strict in-memory JWT session management (Zero tokens in localStorage) |
+------------------------------------+------------------------------------+
                                     |  REST API / Bearer Auth
                                     v
+-------------------------------------------------------------------------+
|                           CIVNEXA Backend                               |
|   Java 21 • Spring Boot 3.5.7 • Spring Security 6.x • JJWT 0.12.6       |
|   Rate Limiting • BCrypt Cost 12 • Audit Logging • Flyway Migrations     |
|   AI Engine (Gemini 2.5 Flash / Deterministic Fallback)                 |
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
| `STAFF` | Security & Wardens | Hostel curfew breaches, safety incidents, campus security dispatch logging, camera QR scanning. |
| `COORDINATOR` | Welfare & Mental Health | Student counseling intake, mentor referrals, private clinical session notes (AI isolated). |
| `COMMITTEE_MEMBER` | Ethics & Disciplinary Board | Case deliberation, evidence vault review, hearing attendance, sanction proposals. |
| `STUDENT` | Enrolled Scholars | Personal self-registration, grievance filing, response statements, appeal lodging, digital ID card. |

---

## 🔐 Security & Identity Hardening

1. **Student Self-Registration & Hardened HMAC-SHA256 OTP:**
   - Public self-registration provisions student accounts in `PENDING_VERIFICATION` status.
   - Dispatches a 6-digit cryptographic numeric OTP valid for 10 minutes.
   - OTPs are cryptographically hashed using **HMAC-SHA256** with an independent server-side secret (`CIVNEXA_OTP_HMAC_SECRET`).
   - The application enforces at startup that `CIVNEXA_OTP_HMAC_SECRET` is strictly distinct from `CIVNEXA_JWT_SECRET`.
   - Constant-time verification (`MessageDigest.isEqual`) prevents timing side-channels.
   - Enforces a 60-second resend cooldown and a maximum of 5 verification attempts before invalidation.
   - Once verified, the account transitions to `PENDING_APPROVAL` for administrator roster verification.

2. **Zero-Secret Super Admin Bootstrapping:**
   - **No default or hardcoded administrator credentials exist in code or configuration.**
   - Bootstrap is disabled by default (`CIVNEXA_ENABLE_INITIAL_BOOTSTRAP=false`).
   - When enabled, it requires an explicit email address (`CIVNEXA_BOOTSTRAP_ADMIN_EMAIL`).
   - If no password is provided, a cryptographically secure 24-character random password is generated and saved to a secure one-time file (`backend/civnexa-bootstrap-admin.credential`), which is ignored by Git.
   - The root administrator is flagged with `passwordChangeRequired = true`, mandating a password change upon first sign-in.
   - Once any `SUPER_ADMIN` exists in the database, further bootstrap execution is strictly refused.
   - Zero public administrator registration endpoints.

3. **Timing-Discrepancy Mitigation:**
   - Password checking executes BCrypt verification regardless of whether the account exists or its status (`ACTIVE`, `PENDING_VERIFICATION`, `PENDING_APPROVAL`, `INACTIVE`, `SUSPENDED`).
   - Constant-time response behavior prevents user enumeration.

4. **Strict In-Memory JWT Access Tokens:**
   - JWTs are stored in JavaScript memory only (`setAuthToken`) and are never written to `localStorage` or `sessionStorage`.

5. **Authoritative Database Roles:**
   - Every protected request loads user state directly from the database; role claims embedded in the JWT payload are non-authoritative.

---

## 🤖 AI Intelligence Engine

CIVNEXA incorporates an integrated AI subsystem built on a modular `AiProvider` architecture:

```
                      +-------------------+
                      |    AiService      |
                      +---------+---------+
                                |
             +------------------+------------------+
             |                                     |
             v                                     v
+------------------------+             +------------------------+
|    GeminiAiProvider    |  (Fallback) |   RuleBasedAiProvider  |
|  Gemini 2.5 Flash REST | ----------->| Deterministic In-Memory|
+------------------------+             +------------------------+
```

1. **Smart Complaint Classification & Departmental Routing:**
   - Analyzes incident descriptions and suggests appropriate incident category (Ragging, Academic Misconduct, Harassment, Hostel Violation, Facilities Grievance, General Grievance).
   - Recommends severity level (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) and target university department.
   - Requires human review and confirmation before applying to submission forms.
2. **Duplicate Complaint Detection:**
   - Tokenized Jaccard similarity scanner compares incoming grievance text against existing active cases.
   - Identifies potential duplicate or correlated filings across the institution to reduce administrative load.
3. **Automated Case Summarization:**
   - Generates executive incident synopses with structured key findings, chronological timelines, and preserved document citations.
   - Integrated directly in the Case Detail view for committee members and deans.
4. **Institutional RAG Question Answering:**
   - Grounded knowledge retrieval over university regulatory documents:
     - *University Student Code of Conduct & Academic Integrity Handbook*
     - *UGC Regulation on Curbing the Menace of Ragging in Higher Educational Institutions*
     - *Internal Complaints Committee (ICC) Policy on Prevention of Sexual Harassment*
     - *Proctorial Board Standard Operating Procedures & Disciplinary Protocol*
   - Grounded status badge and verbatim regulatory section citations returned with every answer.
   - Administrators can upload additional university policy circulars (`POST /api/v1/ai/knowledge/upload`).
5. **Counseling Clinical Privacy Isolation Guardrail:**
   - **Strict Privacy Rule:** Confidential student mental health counseling session notes are systematically blocked from being transmitted to external AI providers, preserving therapist-student confidentiality under FERPA and mental health compliance protocols.

---

## 📷 Real QR Scanner & Student Digital ID

CIVNEXA features a full-stack, real camera-driven QR ecosystem:

1. **Student Digital ID Card (`/student/digital-id`):**
   - High-contrast, scalable SVG QR code (`qrcode.react`) embedding an authenticatable student token (`DIGI-STU-...`).
   - Displays real-time institutional status (Active / Verified), roll number, academic department, and token copy utility.
2. **Real Camera Scanner (`/scanner`):**
   - Built on `html5-qrcode` to access the device's actual video camera (webcam on desktop or rear/front camera on mobile).
   - Real-time video preview reticle with camera device dropdown selector.
   - Fallback manual token entry for low-light or damaged camera lenses.
   - Automatically parses and routes scanned tokens:
     - `DIGI-STU-`: Student identity verification, academic standing, and disciplinary status check.
     - `CX-TRK-`: Case tracking lookup showing current milestones and investigation status.
     - `EVD-CUST-`: Evidence vault chain-of-custody transfer with custody action logging (Transfer, Check-Out, Return, Lock).
3. **Dynamic Event & Disciplinary Hearing Attendance:**
   - Rotating 60-second challenge codes displayed in full-screen presentation mode (`/attendance/session/:sessionCode`).
   - Synchronized progress bar and real-time attendee roster.
   - **Duplicate Check-In Prevention:** Enforced at both the service layer and the database layer via unique constraint `uk_session_student (session_id, student_id)`.

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

To run all automated verification tests:

```powershell
.\run-local.ps1 -TestOnly
```

### First-Time Administrator Setup (PowerShell)

Because CIVNEXA contains **no default or hardcoded credentials**, initialize the root administrator account via:

```powershell
# Option A: Supply your own institutional administrator password
.\run-local.ps1 -EnableBootstrap -BootstrapAdminEmail "admin@institution.edu" -BootstrapAdminPassword "SecureAdmin@Pass2026!"

# Option B: Auto-generate a cryptographically secure 24-character password
.\run-local.ps1 -EnableBootstrap -BootstrapAdminEmail "admin@institution.edu"
# (Password will be written to backend/civnexa-bootstrap-admin.credential)
```

Upon first sign-in, the system prompts the administrator to set a permanent private password.

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

The project features **100% test coverage** across both backend and frontend components (**298 total automated tests**):

### Run All Tests via PowerShell

```powershell
.\run-local.ps1 -TestOnly
```

### Backend Tests (143 Tests)

```bash
cd backend
.\mvnw.cmd test
```

Key test suites:
- `AuthServiceIntegrationTests` (22 tests): Constant-time password validation, role transitions, account lockouts, timing discrepancy mitigations.
- `EmailVerificationIntegrationTests` (5 tests): HMAC-SHA256 OTP generation, verification, resend cooldowns, attempt throttling, secret distinctness.
- `AiServiceIntegrationTests` (7 tests): Complaint classification, duplicate detection Jaccard thresholds, case summarization, RAG queries, clinical notes isolation.
- `QrServiceIntegrationTests` (8 tests): Student card issuance/revocation, dynamic attendance session rotation, transactional duplicate check-in prevention, custody chain logging.
- `UserImportServiceTests`: Multipart roster parsing (.xlsx, .csv, .json), SHA-256 checksum calculation, rollback safety.
- `CampusWorkflowIntegrationTests`: End-to-end incident filing, evidence custody logging, hearing scheduling, appeals.

### Frontend Tests (155 Tests in 13 Suites)

```bash
cmd.exe /c "npm test"
```

Key test suites:
- `ai-and-qr-features.test.jsx`: Student digital ID rendering, real camera QR scanner initialization, attendance session projector, AI assistant RAG chat, case synopsis modal.
- `auth-integration.test.jsx`: Login flows, token handling, route protection, password change enforcement.
- `case-management.test.jsx`: Incident creation wizard, verification queue, student responses.
- `committee-hearing-counseling.test.jsx`: Evidence vault SHA-256 checks, hearing minutes, clinical logs.
- `appeals-reports-admin.test.jsx`: Appellate reviews, user management, department administration, audit trails.
- `roles-navigation.test.jsx`: Institutional role-based permission routes and navigation items across all 8 roles.

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

CIVNEXA is designed in accordance with campus safety, FERPA, and higher-education data governance standards. Institutional records, custody chains, and audit trails are cryptographically tracked and immutably preserved.
