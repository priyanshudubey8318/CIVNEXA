# CIVNEXA — Backend Architecture & Healthcheck Foundation Report (BE-1.1)

**Document Reference:** `BE1_1_BACKEND_FOUNDATION_REPORT.md`  
**Application Name:** CIVNEXA  
**Tagline:** Report. Verify. Support. Resolve.  
**Domain Scope:** Backend Architecture, Spring Boot 3 Scaffold, Security Configuration, Health API & GitHub Checkpoints  
**Date:** October 28, 2026  
**Status:** **PASS (VERIFIED & FINALIZED)**

---

## 1. Executive Summary

Phase **BE-1.1** establishes the server-side foundation of the CIVNEXA platform. A modular, production-grade Spring Boot 3 backend scaffold has been initialized in the `/backend` directory within the CIVNEXA monorepo alongside the React frontend.

The backend is built with **Spring Boot 3.4.1** running on **OpenJDK 25 LTS** with strict **Java 21 LTS release target bytecode (`--release 21`)** enforced via the Maven Compiler Plugin. The project utilizes the Maven Wrapper (`mvnw.cmd` / `./mvnw`) for deterministic builds across development environments and automated CI/CD runners.

All public health endpoints have been audited and hardened according to enterprise security guidelines:
- `/api/v1/ping` provides a lightweight, unauthenticated operational heartbeat (`PONG`).
- `/api/v1/health` provides an unauthenticated operational check (`UP`, application name, version, timestamp) stripped of all internal JVM memory diagnostics, CPU core metrics, active profile identifiers, and premature database health claims.
- Public endpoint tests enforce these privacy boundaries by asserting the complete absence of memory metrics, thread metrics, and internal configuration details.
- Spring Security 6 enforces stateless authentication, CSRF protection policies, and route guards that block unauthenticated requests to protected API endpoints.

---

## 2. GitHub Checkpoint & Repository Status

| Checkpoint Property | Value |
| :--- | :--- |
| **Repository Remote URL** | `https://github.com/priyanshudubey8318/CIVNEXA.git` |
| **Tracked Branch** | `main` |
| **Primary BE-1.1 Scaffold Commit** | `d525998` (`feat(backend): initialize Spring Boot 3 architecture, configuration and health API (BE-1.1)`) |
| **Finalization & Hardening Commit** | `be7b2cf` (`fix(backend): align supported Java runtime and minimize public health response`) |
| **Remote Push Status** | **Committed and pushed to origin/main** (`refs/heads/main` at `be7b2cf`) |
| **Committed locally but not pushed** | **None (0 commits ahead)** |
| **Uncommitted Working Tree Changes** | **None (Working tree clean)** |

---

## 3. Technology Stack & Runtime Configuration

| Component | Specification / Version | Rationale & Compatibility Alignment |
| :--- | :--- | :--- |
| **Java Runtime (Installed)** | OpenJDK 25.0.4.1 LTS (Temurin) | Host Java environment on Windows workstation |
| **Bytecode Target Release** | Java 21 LTS (`<release>21</release>`) | Explicitly locked via `maven-compiler-plugin` 3.13 to ensure strict Java 21 LTS bytecode output |
| **Spring Boot Framework** | 3.4.1 (GA) | Latest stable production release of Spring Boot 3 |
| **Spring Framework** | 6.2.1 | Core enterprise application context and MVC framework |
| **Spring Security** | 6.4.2 | Stateless session management (`SessionCreationPolicy.STATELESS`), BCrypt password hashing |
| **Spring Data JPA** | 3.4.1 (Hibernate ORM 6.6.4) | Object-relational mapping foundation; automatic dialect resolution enabled |
| **Jakarta Validation** | 3.0.2 (Hibernate Validator 8.0.2) | JSR-380 validation engine for inbound DTO payloads |
| **JJWT (Java JWT)** | 0.12.6 (`jjwt-api`, `jjwt-impl`, `jjwt-jackson`) | RFC 7519 standard JSON Web Token issuance and verification |
| **MySQL Driver** | `mysql-connector-j` 8.3.0 (Runtime) | Production JDBC driver for MySQL 8.0 connectivity |
| **H2 Database Engine** | 2.3.232 (Test Scope) | Hermetic in-memory database for isolated, reproducible automated tests |
| **Apache Maven Wrapper** | 3.10.0 (Wrapper v3.3.4) | Bundled zero-install build toolchain |

---

## 4. Operational Endpoints & Security Posture

### 4.1 `GET /api/v1/ping`
* **Access Level:** Public (Unauthenticated)
* **Purpose:** Lightweight operational heartbeat for uptime monitors and load balancers.
* **Payload Structure:**
```json
{
  "success": true,
  "message": "CIVNEXA Backend Service Active",
  "data": "PONG",
  "timestamp": "2026-10-28T11:04:35.012Z"
}
```

### 4.2 `GET /api/v1/health`
* **Access Level:** Public (Unauthenticated)
* **Purpose:** High-level operational readiness check.
* **Privacy & Security Enforcement:**
  - **No JVM Memory Leaks:** Removed `totalMemoryMb`, `freeMemoryMb`, `maxMemoryMb`.
  - **No System Metric Leaks:** Removed `availableProcessors`, `uptimeMs`, `uptimeFormatted`.
  - **No Profile/Environment Leaks:** Removed `activeProfiles` and internal profile names.
  - **No Premature Database Claims:** Does not emit synthetic or unverified database statuses prior to BE-1.2 entity persistence.
* **Payload Structure:**
```json
{
  "success": true,
  "message": "CIVNEXA Backend Service Operational",
  "data": {
    "status": "UP",
    "application": "CIVNEXA Backend Service",
    "version": "1.0.0",
    "timestamp": "2026-10-28T11:04:35.018Z"
  },
  "timestamp": "2026-10-28T11:04:35.018Z"
}
```

### 4.3 Route Guarding & Access Controls
* Public routes (`/ping`, `/health`, `/health/**`, `/auth/**`, `/v3/api-docs/**`) permitted without authentication.
* All other API endpoints (`/cases`, `/admin`, etc.) require valid authentication tokens; unauthenticated requests receive `403 Forbidden` / `401 Unauthorized`.

---

## 5. Verification Suite Results

### 5.1 Backend Automated Tests (JUnit 5 / Spring MockMvc)
* **Execution Command:** `.\mvnw.cmd test`
* **Result:** **5 of 5 tests passed (100% success rate)**
```text
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.civnexa.CivnexaBackendApplicationTests
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.civnexa.controller.HealthControllerTests
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```
* **Test Specifications:**
  1. `CivnexaBackendApplicationTests.contextLoads`: Verifies Spring Boot 3 context bootstrapping.
  2. `HealthControllerTests.testPingEndpoint`: Verifies `/api/v1/ping` returns `PONG`.
  3. `HealthControllerTests.testHealthEndpoint`: Verifies `/api/v1/health` returns `UP` status, application name, version, and timestamp.
  4. `HealthControllerTests.testHealthEndpointDoesNotLeakDiagnostics`: Enforces zero exposure of `details`, `totalMemoryMb`, `freeMemoryMb`, `maxMemoryMb`, `availableProcessors`, `activeProfiles`, `uptimeMs`, `database`, and `environment`.
  5. `HealthControllerTests.testUnauthenticatedAccessDenied`: Verifies unauthenticated access to protected endpoints (`/cases`) is rejected.

### 5.2 Backend Package Build
* **Execution Command:** `.\mvnw.cmd package -DskipTests`
* **Artifact:** `backend/target/civnexa-backend-1.0.0-SNAPSHOT.jar`
* **Result:** **BUILD SUCCESS** (Repackaged Spring Boot executable archive created).

### 5.3 Frontend Regression Verification (Vitest)
* **Execution Command:** `npm.cmd run test`
* **Result:** **11 test files passed, 131 tests passed (100% success rate)**
* **Regressions Detected:** Zero. All role workspaces, navigation guards, cryptographic checksums, and workflow engines remain intact.

### 5.4 Frontend Production Build (Vite)
* **Execution Command:** `npm.cmd run build`
* **Result:** **Built in 20.05s** (Zero errors; clean production chunking).

---

## 6. Monorepo Working Directory Structure

```
c:\Users\priyanshu dubey\OneDrive\Desktop\PROJECTS\CIVNEXA\
├── backend/
│   ├── pom.xml                                  # Java 21 compiler configuration & Spring Boot 3.4.1
│   ├── mvnw / mvnw.cmd                          # Maven wrapper toolchain
│   ├── .mvn/wrapper/maven-wrapper.properties
│   ├── src/main/java/com/civnexa/
│   │   ├── CivnexaBackendApplication.java       # Application entry point
│   │   ├── config/
│   │   │   ├── CorsConfig.java                  # CORS origin mapping
│   │   │   └── SecurityConfig.java              # Stateless filter chain & route guards
│   │   ├── controller/
│   │   │   └── HealthController.java            # Sanitized /ping and /health endpoints
│   │   ├── dto/
│   │   │   ├── ApiResponse.java                 # Generic response envelope
│   │   │   └── HealthResponse.java              # Minimal health schema
│   │   └── exception/
│   │       ├── ApiException.java
│   │       └── GlobalExceptionHandler.java
│   ├── src/main/resources/application.yml       # Production MySQL & JPA configuration
│   └── src/test/                                # Hermetic tests with H2 database
├── src/                                         # React 18 + Vite frontend application
├── package.json
└── BE1_1_BACKEND_FOUNDATION_REPORT.md           # This verification report
```

---

## 7. Next Recommended Phase: BE-1.2

Phase **BE-1.1 is complete, verified, committed, and pushed.**

**Awaiting user authorization for Phase BE-1.2:**
* **Phase BE-1.2: MySQL 8 Schema Design & JPA Entity Model**
  - Implement core domain JPA entities: `User`, `Role`, `CaseRecord`, `IncidentReport`, `Grievance`, `Hearing`, `EvidenceItem`, `CounselingReferral`, `AppealRecord`, and `AuditLog`.
  - Establish entity relationships, foreign keys, cascade types, and audit metadata (`@CreatedDate`, `@LastModifiedDate`).
  - Configure database connection profiles and migration strategies.
