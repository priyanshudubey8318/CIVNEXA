# CIVNEXA — Backend Architecture & Framework Baseline Report (BE-1.1)

**Document Reference:** `BE1_1_BACKEND_FOUNDATION_REPORT.md`  
**Application Name:** CIVNEXA  
**Tagline:** Report. Verify. Support. Resolve.  
**Domain Scope:** Backend Framework Baseline Alignment (Spring Boot 4.1.2 + OpenJDK 25), Security Configuration, Health API & GitHub Checkpoints  
**Date:** October 29, 2026  
**Status:** **PASS (VERIFIED & FINALIZED)**

---

## 1. Executive Summary

Phase **BE-1.1** establishes the verified server-side framework baseline of the CIVNEXA platform. Following framework compatibility evaluation, the backend scaffold has been upgraded to **Spring Boot 4.1.2 (GA)** to align with the host **OpenJDK 25 LTS** runtime while maintaining enterprise **Java 21 LTS target bytecode (`--release 21`)** via the Maven Compiler Plugin.

All project components—REST controllers, response envelopes, Spring Security 7 route guards, exception advisors, and hermetic tests—have been verified and operate with 100% test pass rates across both backend and frontend suites.

---

## 2. GitHub Checkpoint & Repository Accounting

| Checkpoint Property | Value |
| :--- | :--- |
| **GitHub Remote URL** | `https://github.com/priyanshudubey8318/CIVNEXA.git` |
| **Tracked Branch** | `main` |
| **Latest Framework Baseline Commit** | `779819b` (`fix(backend): align Spring Boot baseline with supported Java runtime`) |
| **Preceding BE-1.1 Commits** | `6fd3824`, `be7b2cf`, `d525998` |
| **Remote Push Status** | **Committed and pushed to origin/main** (`refs/heads/main` at `779819b`) |
| **Committed locally but not pushed** | **None (0 commits ahead)** |
| **Uncommitted Working Tree Changes** | **None (Working tree clean)** |

---

## 3. Framework Compatibility & Technology Stack

### 3.1 Framework Selection Rationale
* **Host JVM:** OpenJDK `25.0.4.1` LTS (Temurin-25.0.4.1+1-LTS) on 64-bit Windows.
* **Spring Boot 4.1.2 Baseline:** Spring Boot 4.1.2 natively targets modern Java environments including Java 25. Upgrading from 3.4.1 ensures long-term framework maintenance, eliminates legacy workarounds, and aligns the stack with Spring Framework 7 and Spring Security 7.
* **Bytecode Target:** Explicitly locked to Java 21 LTS (`<release>21</release>`) via `maven-compiler-plugin` 3.15.0, guaranteeing binary portability across standard enterprise deployment targets.

### 3.2 Dependency Inventory & Managed Versions

| Dependency Component | Version | Role in CIVNEXA |
| :--- | :--- | :--- |
| **Spring Boot Parent** | `4.1.2` | Core starter parent and dependency management |
| **Spring Framework** | `7.0.10` | Inversion of control, REST MVC, and test orchestration |
| **Spring Security** | `7.1.2` | Stateless security filter chain, BCrypt password hashing, route guards |
| **Spring Data JPA** | `4.1.2` | Repository layer abstraction |
| **Hibernate ORM** | `7.4.13.Final` | Core persistence provider and schema engine |
| **Jakarta Persistence API** | `3.2.0` | Enterprise entity annotations (`@Entity`, `@Table`, etc.) |
| **Jakarta Validation** | `3.0.2` | Bean validation engine (`@NotNull`, `@Size`, etc.) |
| **Embedded Servlet Container** | Apache Tomcat `11.0.27` | High-performance embedded HTTP/1.1 and HTTP/2 servlet container |
| **MySQL Connector/J** | `9.7.0` (Runtime) | Production JDBC driver for MySQL database integration |
| **H2 Database Engine** | `2.4.240` (Test) | In-memory database for hermetic automated test execution |
| **Spring Boot WebMVC Test** | `4.1.2` (Test) | Modular test starter providing `MockMvc` auto-configuration |
| **JJWT (Java JWT)** | `0.12.6` | RFC 7519 standard JSON Web Token issuance and verification |
| **Apache Maven Wrapper** | `3.10.0` | Bundled zero-install build toolchain |

### 3.3 Spring Boot 4 Migration Findings
1. **Modular WebMVC Testing:** In Spring Boot 4 / Spring Framework 7, MockMvc auto-configuration was modularized out of `spring-boot-test-autoconfigure` into `org.springframework.boot:spring-boot-webmvc-test`. The `@AutoConfigureMockMvc` annotation relocated to `org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc`. Adding the framework-managed `spring-boot-webmvc-test` dependency cleanly resolved MockMvc autowiring in `@SpringBootTest` suites.
2. **Security 7 Compatibility:** Spring Security 7.1.2 seamlessly executes the existing stateless `SecurityFilterChain` definition, enforcing CSRF disabling for REST, stateless session policy, and request matchers without deprecations.
3. **Hibernate 7 Persistence:** Hibernate ORM 7.4.13 automatically detects dialect from JDBC connection metadata for H2 (`H2Dialect`) and MySQL (`MySQLDialect`).

---

## 4. Operational Endpoints & Security Posture

### 4.1 `GET /api/v1/ping`
* **Access Level:** Public (Unauthenticated)
* **Response Payload:**
```json
{
  "success": true,
  "message": "CIVNEXA Backend Service Active",
  "data": "PONG",
  "timestamp": "2026-10-29T03:58:25.526Z"
}
```

### 4.2 `GET /api/v1/health`
* **Access Level:** Public (Unauthenticated)
* **Privacy & Security Enforcement:**
  - **Zero JVM Metrics:** Stripped of `totalMemoryMb`, `freeMemoryMb`, `maxMemoryMb`.
  - **Zero Hardware Metrics:** Stripped of `availableProcessors`, `uptimeMs`, `uptimeFormatted`.
  - **Zero Configuration Leaks:** Stripped of `activeProfiles` and runtime environment names.
  - **No Premature Database Claims:** Database health is not claimed prior to BE-1.2 entity persistence.
* **Response Payload:**
```json
{
  "success": true,
  "message": "CIVNEXA Backend Service Operational",
  "data": {
    "status": "UP",
    "application": "CIVNEXA Backend Service",
    "version": "1.0.0",
    "timestamp": "2026-10-29T03:58:25.526Z"
  },
  "timestamp": "2026-10-29T03:58:25.526Z"
}
```

### 4.3 Route Guarding
* Public endpoints (`/ping`, `/health`, `/health/**`, `/auth/**`, `/v3/api-docs/**`) allow unauthenticated access.
* Protected API endpoints (`/cases`, `/admin`, etc.) reject unauthenticated requests with `403 Forbidden`.

---

## 5. Verification Suite Results

### 5.1 Backend Automated Tests (JUnit 5 / Spring MockMvc)
* **Execution Command:** `.\mvnw.cmd test`
* **Execution Environment:** Spring Boot 4.1.2, Java 25.0.4.1 LTS
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
  1. `CivnexaBackendApplicationTests.contextLoads`: Verifies Spring Boot 4.1.2 application context bootstrapping.
  2. `HealthControllerTests.testPingEndpoint`: Verifies `/api/v1/ping` returns `PONG`.
  3. `HealthControllerTests.testHealthEndpoint`: Verifies `/api/v1/health` returns operational `UP` status.
  4. `HealthControllerTests.testHealthEndpointDoesNotLeakDiagnostics`: Verifies zero leakage of memory, processor count, active profiles, or database state.
  5. `HealthControllerTests.testUnauthenticatedAccessDenied`: Verifies unauthenticated access to protected endpoints (`/cases`) returns `403 Forbidden`.

### 5.2 Backend Package Build
* **Execution Command:** `.\mvnw.cmd package`
* **Artifact:** `backend/target/civnexa-backend-1.0.0-SNAPSHOT.jar`
* **Result:** **BUILD SUCCESS** (Spring Boot executable fat JAR produced).

### 5.3 Frontend Regression Verification (Vitest)
* **Execution Command:** `npm.cmd run test`
* **Result:** **11 test files passed, 131 tests passed (100% success rate)**
* **Regressions Detected:** Zero. All role workspaces, navigation guards, cryptographic checksums, and workflow engines remain intact.

### 5.4 Frontend Production Build (Vite)
* **Execution Command:** `npm.cmd run build`
* **Result:** **Built in 23.24s** (Zero errors; clean production chunking).

---

## 6. Files Changed in this Step

* [`backend/pom.xml`](file:///c:/Users/priyanshu%20dubey/OneDrive/Desktop/PROJECTS/CIVNEXA/backend/pom.xml): Upgraded parent to Spring Boot `4.1.2`, added managed `spring-boot-webmvc-test` dependency.
* [`backend/src/test/java/com/civnexa/controller/HealthControllerTests.java`](file:///c:/Users/priyanshu%20dubey/OneDrive/Desktop/PROJECTS/CIVNEXA/backend/src/test/java/com/civnexa/controller/HealthControllerTests.java): Updated `@AutoConfigureMockMvc` import package to `org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc`.

---

## 7. Remaining Limitations & Non-Implemented Scope

To maintain rigorous phase boundaries:
- **No Database Entities:** `User`, `CaseRecord`, `IncidentReport`, etc., are deliberately not implemented in BE-1.1.
- **No Live Database Connections:** Database schema and migrations are deferred to Phase BE-1.2.
- **No Business Endpoints:** Case management, grievance filing, and counseling APIs remain simulated on the frontend until subsequent backend phases.

---

## 8. Next Recommended Phase: BE-1.2

Phase **BE-1.1 framework compatibility correction is complete, verified, committed, and pushed.**

**Awaiting user authorization for Phase BE-1.2:**
* **Phase BE-1.2: MySQL 8 Schema Design & JPA Entity Model**
  - Implement core domain JPA entities: `User`, `Role`, `CaseRecord`, `IncidentReport`, `Grievance`, `Hearing`, `EvidenceItem`, `CounselingReferral`, `AppealRecord`, and `AuditLog`.
  - Establish entity relationships, foreign keys, cascade types, and audit metadata (`@CreatedDate`, `@LastModifiedDate`).
  - Configure database connection profiles and migration strategies.
