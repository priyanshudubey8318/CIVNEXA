# CIVNEXA — Backend Architecture & Healthcheck Foundation Report (BE-1.1)

**Document Reference:** `BE1_1_BACKEND_FOUNDATION_REPORT.md`  
**Application Name:** CIVNEXA  
**Tagline:** Report. Verify. Support. Resolve.  
**Domain Scope:** Backend Architecture, Spring Boot 3 Scaffold, Security Configuration & Health API  
**Date:** October 28, 2026  
**Status:** **PASS**

---

## 1. Executive Summary

Phase **BE-1.1** initiates the server-side architecture of the CIVNEXA platform. A modular, production-ready Spring Boot 3 backend scaffold has been established in the `/backend` directory alongside the existing React frontend, creating a clean full-stack monorepo.

The backend is built with **Spring Boot 3.4.1** running on **Java 25 (LTS) / Java 21 compatible bytecode**, utilizing the Maven Wrapper (`mvnw.cmd` / `./mvnw`) for reproducible builds across developer workstations and CI/CD pipelines.

### Verification Status: **PASS**

* **Architecture & Build:** Maven project successfully initialized in `backend/` with Maven Wrapper (v3.10.0). Executable Spring Boot JAR (`civnexa-backend-1.0.0-SNAPSHOT.jar`) generated via `mvnw package`.
* **Testing:** 100% test pass rate across backend test suite (3/3 tests passing: Application Context Load, `/api/v1/ping`, `/api/v1/health`).
* **Frontend Integrity:** All 131 existing frontend tests continue to pass with zero regressions.
* **REST API Endpoints:** `/api/v1/ping` and `/api/v1/health` verified with JSON responses, uptime calculation, active profiles, and memory diagnostics.
* **Security & CORS Foundation:** Spring Security 6 configured with stateless session management (`SessionCreationPolicy.STATELESS`), CSRF disabled for REST, BCrypt password encoder, and configurable CORS origins (`localhost:5173`, `localhost:5174`, `localhost:3000`).

---

## 2. Directory Layout & Package Structure

```
backend/
├── pom.xml                                      # Maven project descriptor (Spring Boot 3.4.1)
├── mvnw / mvnw.cmd                              # Maven wrappers (Apache Maven 3.10)
├── .mvn/wrapper/maven-wrapper.properties       # Wrapper configuration
├── README.md                                    # Backend documentation & quickstart
├── .gitignore                                   # Target & IDE exclusion rules
├── src/
│   ├── main/
│   │   ├── java/com/civnexa/
│   │   │   ├── CivnexaBackendApplication.java   # Spring Boot entry point
│   │   │   ├── config/
│   │   │   │   ├── CorsConfig.java              # Configurable CORS filter
│   │   │   │   └── SecurityConfig.java          # Spring Security 6 & RBAC foundation
│   │   │   ├── controller/
│   │   │   │   └── HealthController.java        # /api/v1/ping and /api/v1/health
│   │   │   ├── dto/
│   │   │   │   ├── ApiResponse.java             # Standard envelope (success, message, data, timestamp)
│   │   │   │   └── HealthResponse.java          # System diagnostics payload
│   │   │   └── exception/
│   │   │       ├── ApiException.java            # Base application runtime exception
│   │   │       └── GlobalExceptionHandler.java  # @RestControllerAdvice for validation & errors
│   │   └── resources/
│   │       └── application.yml                  # MySQL 8 datasource, JPA, and JWT configuration
│   └── test/
│       ├── java/com/civnexa/
│       │   ├── CivnexaBackendApplicationTests.java
│       │   └── controller/
│       │       └── HealthControllerTests.java
│       └── resources/
│           └── application.yml                  # Hermetic test configuration (H2 DB)
```

---

## 3. Technology Stack & Key Dependencies

| Dependency | Version / Source | Purpose |
| :--- | :--- | :--- |
| **Spring Boot Starter Web** | 3.4.1 | Embedded Tomcat, Spring MVC REST Controllers |
| **Spring Boot Starter Data JPA** | 3.4.1 | Hibernate ORM 6.6, Spring Data Repositories |
| **Spring Boot Starter Security** | 3.4.1 | Spring Security 6, stateless security filter chain |
| **Spring Boot Starter Validation** | 3.4.1 | Jakarta Bean Validation (`@NotNull`, `@Size`, etc.) |
| **MySQL Connector/J** | 8.3.x (Managed) | Production database driver for MySQL 8.0 |
| **JJWT (Java JWT)** | 0.12.6 | RFC 7519 JSON Web Token issuance and parsing |
| **H2 Database** | 2.3.x (Test Scope) | In-memory database for hermetic automated tests |
| **Spring Boot Starter Test** | 3.4.1 | JUnit 5, Mockito, AssertJ, Spring MockMvc |

---

## 4. Operational Endpoints Implemented

### 4.1 `GET /api/v1/ping`
* **Access:** Public (No authentication required)
* **Response Sample:**
```json
{
  "success": true,
  "message": "CIVNEXA Backend Service Active",
  "data": "PONG",
  "timestamp": "2026-10-28T10:39:07.014Z"
}
```

### 4.2 `GET /api/v1/health`
* **Access:** Public (No authentication required)
* **Response Sample:**
```json
{
  "success": true,
  "message": "System health verification passed",
  "data": {
    "status": "UP",
    "application": "CIVNEXA Backend Service",
    "version": "1.0.0",
    "environment": "default",
    "timestamp": "2026-10-28T10:39:07.020Z",
    "details": {
      "uptimeMs": 2661,
      "uptimeFormatted": "00:00:02",
      "activeProfiles": ["default"],
      "totalMemoryMb": 512,
      "freeMemoryMb": 384,
      "maxMemoryMb": 4096,
      "availableProcessors": 12
    }
  },
  "timestamp": "2026-10-28T10:39:07.020Z"
}
```

---

## 5. Verification Results

### 5.1 Backend Test Execution (Maven)
```text
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.civnexa.CivnexaBackendApplicationTests
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.civnexa.controller.HealthControllerTests
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] BUILD SUCCESS
```

### 5.2 Frontend Regression Test Execution (Vitest)
```text
 Test Files  11 passed (11)
      Tests  131 passed (131)
   Duration  18.64s
```

---

## 6. GitHub Checkpoint

* **Commit:** `feat(backend): initialize Spring Boot 3 architecture, configuration and health API (BE-1.1)`
* **Branch:** `main`
* **Remote:** `origin` (`https://github.com/priyanshudubey8318/CIVNEXA.git`)
* **Push Status:** Ready for push to GitHub

---

## 7. Next Recommended Phase: BE-1.2

With the Spring Boot 3 project scaffold and configuration verified, the recommended next step is:
**Phase BE-1.2: MySQL 8 Schema Design & JPA Entity Model**
* Design and implement JPA Entities: `User`, `Role`, `CaseRecord`, `IncidentReport`, `Grievance`, `Hearing`, `EvidenceItem`, `CounselingReferral`, `AppealRecord`, and `AuditLog`.
* Configure entity relationships, enums, auditing (`@CreatedDate`, `@LastModifiedDate`), and database constraints.
* Verify entity mapping against live MySQL 8 schema.
