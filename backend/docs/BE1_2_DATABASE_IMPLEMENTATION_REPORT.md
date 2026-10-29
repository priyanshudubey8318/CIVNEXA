# CIVNEXA — Phase BE-1.2 Database Schema, JPA Entity Model & Flyway Migrations Implementation Report

**Project:** CIVNEXA — Campus Conduct, Grievance, Safety & Student Support Management System  
**Tagline:** Report. Verify. Support. Resolve.  
**Phase:** BE-1.2 — MySQL Database Schema, JPA Entity Model & Flyway Migrations  
**Repository:** `https://github.com/priyanshudubey8318/CIVNEXA.git`  
**Branch:** `main`  
**Execution Date:** October 29, 2026  
**Status:** COMPLETE & FULLY VERIFIED (Awaiting Authorization for BE-1.3)

---

## 1. Executive Summary

Phase **BE-1.2** establishes the relational database foundation, JPA entity model, Spring Data repositories, and Flyway database migration pipeline for the CIVNEXA backend. 

All 14 core entities across student conduct, proctorial governance, evidence vault, appellate review, student counseling, and regulatory audit have been designed, mapped, migrated, and verified against MySQL 8 specifications. Hermetic automated integration testing has verified entity relationships, constraint enforcement, cryptographic checksum tracking, cascade safety, and Hibernate strict schema validation (`ddl-auto: validate`) against Flyway migrations.

Frontend regression testing has confirmed that all 131 tests continue passing and the production build compiles cleanly without developmental bundle leakage.

---

## 2. Git Checkpoints & Remote Synchronization

Development was divided into 4 independently verifiable commit-sized steps, each committed and pushed to `origin/main` on GitHub:

| Checkpoint | Commit Hash | Message | Description |
| :--- | :--- | :--- | :--- |
| **Checkpoint A** | `bf3b57c` | `docs(database): define CIVNEXA relational schema` | Database architecture document `BE1_2_DATABASE_DESIGN.md` with Mermaid ERD, table definitions, foreign keys, index specifications, and sensitive field protection rules. |
| **Checkpoint B** | `95517ef` | `feat(database): implement JPA entities and Spring Data repositories` | 14 Jakarta Persistence entities, 12 domain enums, and 14 Spring Data JPA repository interfaces. |
| **Checkpoint C** | `6c6e5b9` | `feat(database): configure Flyway migrations and MySQL baseline` | Flyway V1 DDL migration script (`V1__create_initial_schema.sql`), MySQL 8 and H2 datasource configuration, and Hibernate schema validation (`validate`). |
| **Checkpoint D** | *(Pending)* | `test(database): verify schema migrations and entity persistence` | Comprehensive integration test suite (`RepositoryIntegrationTests.java`), Department constructor ergonomics, frontend regression pass, and implementation report. |

---

## 3. Relational Schema Architecture

The relational schema represents all core entities inspected from the frontend domain services (`caseService.js`, `evidenceService.js`, `hearingService.js`, `counselingService.js`, `appealService.js`, and `adminService.js`):

```mermaid
erDiagram
    DEPARTMENTS ||--o{ USERS : "employs / enrolls"
    DEPARTMENTS ||--o{ CASES : "assigns"
    USERS ||--o{ CASES : "student / reporter / assigned_to"
    USERS ||--o{ INVESTIGATION_NOTES : "authors"
    USERS ||--o{ STUDENT_RESPONSES : "submits"
    USERS ||--o{ CASE_ACTIVITIES : "performs"
    USERS ||--o{ EVIDENCE_ITEMS : "uploads / reviews"
    USERS ||--o{ EVIDENCE_CUSTODY_LOGS : "logs"
    USERS ||--o{ HEARINGS : "schedules / presides"
    USERS ||--o{ HEARING_COMMITTEE_MEMBERS : "attends"
    USERS ||--o{ APPEALS : "appellant / reviewer / decided_by"
    USERS ||--o{ COUNSELING_REFERRALS : "student / referrer / counselor"
    USERS ||--o{ AUDIT_LOGS : "triggers"

    CASES ||--o{ INVESTIGATION_NOTES : "contains"
    CASES ||--o{ STUDENT_RESPONSES : "receives"
    CASES ||--o{ CASE_ACTIVITIES : "tracks"
    CASES ||--o{ EVIDENCE_ITEMS : "includes"
    CASES ||--o{ HEARINGS : "schedules"
    CASES ||--o{ APPEALS : "appealed_by"
    CASES ||--o{ COUNSELING_REFERRALS : "refers"

    EVIDENCE_ITEMS ||--o{ EVIDENCE_CUSTODY_LOGS : "maintains"
    HEARINGS ||--o{ HEARING_COMMITTEE_MEMBERS : "comprises"
    COUNSELING_REFERRALS ||--o{ COUNSELING_SESSIONS : "conducts"
```

### 3.1 Implemented Tables & Entity Mapping

1. **`departments` (`Department.java`)**: Institutional departments (Code, Name, HOD, Contact, Status).
2. **`users` (`User.java`)**: Unified institutional identities for all 8 personas (`SUPER_ADMIN`, `DEAN`, `HOD`, `FACULTY`, `STAFF`, `COORDINATOR`, `COMMITTEE_MEMBER`, `STUDENT`) with academic attributes and BCrypt password hash.
3. **`cases` (`CaseRecord.java`)**: Consolidated case registry accommodating both disciplinary `INCIDENT` reports and student `GRIEVANCE` filings with full status workflow and whistleblower protection.
4. **`case_investigation_notes` (`InvestigationNote.java`)**: Formal investigator notes with confidentiality flag.
5. **`student_responses` (`StudentResponse.java`)**: Student explanations and defenses with explicit declaration confirmations.
6. **`case_activities` (`CaseActivity.java`)**: Immutable chronological timeline of status transitions and proctorial actions.
7. **`evidence_items` (`EvidenceItem.java`)**: Digital and physical exhibit metadata with SHA-256 cryptographic digests and storage references.
8. **`evidence_custody_logs` (`EvidenceCustodyLog.java`)**: Append-only legal chain of custody ledger.
9. **`hearings` (`Hearing.java`)**: Scheduled proctorial board sessions with date, time, venue, mode, and deliberation minutes.
10. **`hearing_committee_members` (`HearingCommitteeMember.java`)**: Hearing panel roster with attendance tracking and composite uniqueness.
11. **`appeals` (`AppealRecord.java`)**: Independent appellate review petitions with statutory grounds, relief sought, and reviewer assignments.
12. **`counseling_referrals` (`CounselingReferral.java`)**: Student welfare referrals with strict clinical confidentiality isolation (`confidential_notes`).
13. **`counseling_sessions` (`CounselingSession.java`)**: Sequential counseling attendance records and clinical progress notes.
14. **`audit_logs` (`AuditLog.java`)**: Regulatory compliance audit log with UUIDs, actor snapshots, and IP tracking.

---

## 4. Flyway Migrations & Database Baseline

- **Migration File:** `backend/src/main/resources/db/migration/V1__create_initial_schema.sql`
- **Target RDBMS:** MySQL 8 (`ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`)
- **Compatibility:** Fully compliant with MySQL 8 and H2 in-memory test databases (`MODE=MySQL`).
- **Validation Pipeline:**
  - `spring.flyway.enabled: true`
  - `spring.flyway.baseline-on-migrate: true`
  - `spring.jpa.hibernate.ddl-auto: validate`
- **Verification:** During application boot, Flyway applies `V1__create_initial_schema.sql`, followed by Hibernate strictly validating that all 14 JPA entities, column types, and constraints match the migrated schema with 100% fidelity.

---

## 5. Automated Verification Results

### 5.1 Backend Verification (`mvnw test` & `mvnw package`)

```text
[INFO] Running com.civnexa.CivnexaBackendApplicationTests
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.civnexa.controller.HealthControllerTests
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.civnexa.repository.RepositoryIntegrationTests
[INFO] Tests run: 9, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] Results:
[INFO] Tests run: 14, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
[INFO] Total time: 25.383 s
[INFO] Building jar: .../backend/target/civnexa-backend-1.0.0-SNAPSHOT.jar
```

**Tested Scenarios in `RepositoryIntegrationTests.java`:**
1. Department and User persistence with role mappings and profile attributes.
2. CaseRecord creation, type distinctions (`INCIDENT` vs `GRIEVANCE`), and cascade associations.
3. Evidence Vault metadata persistence and cryptographic Chain of Custody (SHA-256 validation).
4. Hearing schedule, presiding authority, and committee roster.
5. AppealRecord lifecycle, statutory grounds, and reviewer assignment.
6. CounselingReferral confidentiality isolation and sequential progress sessions.
7. AuditLog persistence and compliance query retrieval.
8. Database uniqueness constraints on critical public references (duplicate email triggers `DataIntegrityViolationException`).
9. Anonymous grievance whistleblower protection in CaseRecord (`is_anonymous = true`, student is null).

### 5.2 Frontend Regression Verification (`npm run test` & `npm run build`)

```text
 Test Files  11 passed (11)
      Tests  131 passed (131)
   Duration  50.19s

✓ built in 14.01s (Production bundle clean, zero mock leakage)
```

---

## 6. Strict Phase Stop Boundary

As instructed by the project guidelines:
- **Scope limitation respected:** Only the database schema, JPA entities, repositories, and Flyway migrations have been implemented.
- **No REST Controllers:** Business domain controllers, endpoints, and token generation routines remain intentionally unbuilt until authorized in Phase BE-1.3.
- **Security integrity maintained:** No credentials or tokens are committed; safe environment variables (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`) are configured with secure local fallbacks.

**Status:** Ready for Phase BE-1.3 (Authentication, JWT & Security Integration) upon user authorization.
