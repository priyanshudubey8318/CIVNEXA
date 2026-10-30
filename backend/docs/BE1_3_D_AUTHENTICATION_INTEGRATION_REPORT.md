# CIVNEXA — PHASE BE-1.3-D IMPLEMENTATION & VERIFICATION REPORT
## Frontend-Backend Authentication Integration & Security Hardening

**Project:** CIVNEXA — Campus Conduct, Grievance, Safety & Student Support Management System  
**Repository:** `https://github.com/priyanshudubey8318/CIVNEXA.git`  
**Branch:** `main`  
**Phase:** BE-1.3-D (Frontend-Backend Authentication Integration)  
**Date:** 2026-10-30  

---

## 1. Executive Summary

Phase BE-1.3-D establishes the real end-to-end authentication bridge connecting the CIVNEXA React 18 client application to the Spring Boot 4.1.2 / Spring Security 7.1.2 backend service.

All simulated authentication artifacts—including hardcoded mock personas, `Password@123` bypasses, client-side role switching dropdowns, and mock session storage—have been completely eliminated from the production authentication path. Authentication now strictly relies on real backend credentials, HMAC-SHA256 JWT tokens, authoritative database role mappings, and in-memory token state isolation.

### Key Milestones Achieved
1. **Centralized API Client (`src/services/apiClient.js`)**:
   - Environment-driven base URL via `VITE_API_BASE_URL` (default: `http://localhost:8080/api/v1`).
   - Strict in-memory access token storage (`setAuthToken`, `getAuthToken`, `clearAuthToken`).
   - Request interceptor attaching `Authorization: Bearer <inMemoryToken>`.
   - Response interceptor unwrapping data, normalizing errors, and triggering automatic session invalidation upon HTTP 401 Unauthorized.
2. **Backend Authentication Service Integration (`src/services/authService.js`)**:
   - Real endpoint invocations: `/auth/login`, `/auth/register`, `/auth/me`.
   - Handling of institutional registration policy: capturing HTTP 403 Forbidden when public self-registration is disabled and returning clear institutional explanation.
   - Comprehensive user entity mapping from backend `UserResponse` into frontend models.
3. **Authentication Context (`src/context/AuthContext.jsx`)**:
   - Managing `currentUser`, `isAuthenticated`, `isLoading`, and `authError`.
   - Synchronized 401 automatic session cleanup without browser storage leakage.
   - 8 first-class institutional role booleans (`isSuperAdmin`, `isDean`, `isHod`, `isFaculty`, `isStaff`, `isCoordinator`, `isCommitteeMember`, `isStudent`).
4. **Institutional UI Hardening**:
   - Redesigned `LoginPage.jsx` without persona selection buttons or demo credential chips.
   - Added `RegisterPage.jsx` at `/register` with clear institutional provisioning notices.
   - Replaced interactive topbar role switcher with a clean, read-only institutional role badge.
   - Replaced `SettingsPage.jsx` role switching simulation tab with an authoritative "Institutional Role & Permissions" inspector.
5. **Backend Rate Limiting (`LoginRateLimiter.java`)**:
   - Sliding window in-memory rate limiting per client IP (default: 5 attempts per 60 seconds).
   - HTTP 429 Too Many Requests response with reset advisory without account lockout.
6. **100% Test Green Across Both Tiers**:
   - Frontend Vitest suite: **12 test files, 150 tests passing (100%)**.
   - Backend Maven Surefire suite: **109 tests passing, 0 failures, 0 errors**.
   - Vite production build: **Successful in 8.56s**.

---

## 2. Integrated Authentication Flow Architecture

### 2.1 Request Lifecycle & Data Flow

```
[ React Client ] ──(1. Login Request: POST /api/v1/auth/login)──► [ Spring Boot SecurityFilterChain ]
       │                                                                      │
       │                                                               (CORS & Rate Limiter Check)
       │                                                                      │
       │                                                                      ▼
       │                                                            [ AuthController.login() ]
       │                                                                      │
       │                                                                      ▼
       │                                                            [ AuthService.verifyCredentials() ]
       │                                                                      │
       │                                                               (BCrypt Verification + DB Status Check)
       │                                                                      │
       │                                                                      ▼
       │◄──(2. Response: AuthResponse { accessToken, user })──────── [ JwtTokenProvider.generateToken() ]
       │
[ In-Memory Token Reference ]
(Strictly in JS closure; NEVER in localStorage/sessionStorage)
       │
       ├──(3. Protected Request: GET /api/v1/cases with Bearer token)──► [ JwtAuthenticationFilter ]
       │                                                                      │
       │                                                              (Verify Signature & Expiration)
       │                                                                      │
       │                                                                      ▼
       │                                                            [ CivnexaUserPrincipal ]
       │                                                              (Load Fresh DB Role & Status)
       │                                                                      │
       │◄──(4. API Response / 401 Unauthorized)─────────────────────────────────┘
```

### 2.2 Security Invariants & Principles
- **In-Memory JWT Access Token:** The client stores the access token purely in JavaScript memory within `apiClient.js`. Closing the browser or refreshing the page clears the token, mitigating XSS token harvesting vectors.
- **Authoritative Database Roles:** Granted Spring Security authorities are derived strictly from the MySQL database record on each request, completely ignoring any mutable claims or frontend representations.
- **Sliding Window Rate Limiting:** The backend tracks client IP attempts in `LoginRateLimiter.java` using atomic timestamps. Exceeding thresholds returns HTTP 429 without locking user accounts in the database.
- **Fail-Safe Policy Rejection:** If public self-registration is disabled, `/auth/register` returns HTTP 403 Forbidden, and the UI instructs students that accounts are managed by institutional registrars.

---

## 3. Local Execution & Development Setup Guide

### 3.1 Prerequisites
- **Java Development Kit:** OpenJDK 21 or later (`java -version`).
- **Node.js:** v18.0.0 or later with npm (`node -v`, `npm -v`).
- **MySQL Database Server:** v8.0 or v9.0 running on `localhost:3306`.
- **Git:** Version control client.

### 3.2 Tier 1 — Spring Boot Backend Setup

1. **Configure Environment Variables:**
   Create an environment configuration or export:
   ```bash
   # Minimum 32-character HMAC secret key (REQUIRED in production)
   export JWT_SECRET="CivnexaCampusConductManagementSystemProductionJwtSecretKey2026!"
   
   # Database connection credentials
   export DB_URL="jdbc:mysql://localhost:3306/civnexa_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
   export DB_USERNAME="civnexa_user"
   export DB_PASSWORD="civnexa_secure_password"
   ```

2. **Run Database Migrations & Start Backend:**
   ```bash
   cd backend
   
   # Verify tests pass against in-memory H2
   ./mvnw test
   
   # Start the Spring Boot application (context path: /api/v1, port: 8080)
   ./mvnw spring-boot:run
   ```
   *The backend will be available at:* `http://localhost:8080/api/v1`  
   *Health Check:* `http://localhost:8080/api/v1/health`  
   *Swagger Docs:* `http://localhost:8080/api/v1/swagger-ui.html`

### 3.3 Tier 2 — React Frontend Setup

1. **Configure Environment Variables:**
   In the root directory, create or edit `.env.development`:
   ```properties
   # Points to Spring Boot backend context path
   VITE_API_BASE_URL=http://localhost:8080/api/v1
   VITE_API_TIMEOUT=15000
   ```

2. **Install Dependencies & Start Vite Development Server:**
   ```bash
   # From project root
   npm install
   
   # Run Vitest verification suite
   npm test
   
   # Launch development server
   npm run dev
   ```
   *The frontend client will be available at:* `http://localhost:5173`

---

## 4. Verification Evidence & Test Results

### 4.1 Frontend Test Suite Execution (Vitest v5.0.5)

```
Test Files  12 passed (12)
     Tests  150 passed (150)
  Duration  32.07s
```

| Test Suite File | Tests | Status | Scope |
|---|---|---|---|
| `src/test/auth-integration.test.jsx` | 20 | **PASSED** | apiClient, authService, AuthContext, RouteGuards, LoginPage 401/429/Network errors |
| `src/test/auth.test.jsx` | 7 | **PASSED** | Form validation, password visibility, backend login, logout |
| `src/test/roles-navigation.test.jsx` | 6 | **PASSED** | Route guards, unauthorized redirects, per-role sidebar specs |
| `src/test/landing-page-and-contrast.test.jsx` | 8 | **PASSED** | Guest navigation, public landing page, contrast quality |
| `src/test/appeals-reports-admin.test.jsx` | 16 | **PASSED** | Appeals, reporting, admin console |
| `src/test/routes.test.jsx` | 10 | **PASSED** | Route inventory and routing bounds |
| `src/test/integration-fe7.test.jsx` | 16 | **PASSED** | Master frontend integration, workflow bounds |
| `src/test/role-dashboards-student.test.jsx` | 15 | **PASSED** | Role-specific dashboards across all 8 roles |
| `src/test/interactions.test.jsx` | 9 | **PASSED** | Core UI interactions, active role badge |
| `src/test/case-management.test.jsx` | 14 | **PASSED** | Case creation, grievance, verification queue |
| `src/test/committee-hearing-counseling.test.jsx` | 20 | **PASSED** | Committee reviews, evidence vault, counseling |
| `src/test/service.test.js` | 9 | **PASSED** | Service layer contracts |
| **Total** | **150** | **PASSED** | **100% Clean Green** |

### 4.2 Backend Test Suite Execution (Maven Surefire 3.5.6)

```
[INFO] Results:
[INFO] 
[INFO] Tests run: 109, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

| Test Class | Tests | Status | Scope |
|---|---|---|---|
| `CivnexaBackendApplicationTests` | 1 | **PASSED** | Spring application context startup |
| `HealthControllerTests` | 1 | **PASSED** | `/health` and `/ping` availability |
| `PasswordValidatorTests` | 13 | **PASSED** | NIST SP 800-63B password complexity rules |
| `LoginRateLimiterTests` | 6 | **PASSED** | In-memory sliding window rate limiting & window resets |
| `JwtPropertiesTests` | 2 | **PASSED** | Configuration binding and zero predictable defaults |
| `JwtTokenProviderTests` | 13 | **PASSED** | HMAC-SHA256 generation, validation, expiration |
| `JwtSecurityHandlersTests` | 9 | **PASSED** | EntryPoint 401, AccessDeniedHandler 403, Filter chain |
| `AuthControllerTests` | 18 | **PASSED** | `/login`, `/register`, `/me`, HTTP 429, validation |
| `AuthServiceIntegrationTests` | 24 | **PASSED** | DB verification, PENDING_VERIFICATION lifecycle, BCrypt dummy work |
| `RoleAuthorizationTests` | 7 | **PASSED** | PreAuthorize checks and DB role mapping |
| `RepositoryIntegrationTests` | 15 | **PASSED** | Flyway migrations V1, V2, V3 and JPA constraints |
| **Total** | **109** | **PASSED** | **100% Clean Green** |

---

## 5. Troubleshooting Guide

| Issue | Symptom | Root Cause | Remediation |
|---|---|---|---|
| **CORS Error** | Browser console: `Access to XMLHttpRequest blocked by CORS policy` | Frontend origin not present in backend allowed origins list | Ensure backend `civnexa.cors.allowed-origins` includes `http://localhost:5173`. Verified in `CorsConfig.java`. |
| **Session Loss on Refresh** | User is prompted to log in again after reloading browser | By design under the strict in-memory JWT security model | In-memory token management prevents cross-tab/persistent token compromise. Re-authentication on reload is intended. |
| **HTTP 429 Too Many Requests** | Error banner: `"Too many login attempts. Please wait before trying again."` | Exceeded 5 failed login attempts within 60 seconds from client IP | Wait 60 seconds for the sliding rate-limit window to expire. Accounts are never permanently locked. |
| **HTTP 403 On Registration** | Warning banner: `"Public registration is disabled by institutional policy."` | Backend `civnexa.security.registration.enabled` set to `false` | Normal institutional policy. Provision accounts through institutional administrator or toggle config for staging. |
| **Network Error** | Error banner: `"Unable to connect to CIVNEXA authentication service."` | Backend is offline or port 8080 is blocked | Start backend service with `./mvnw spring-boot:run` and verify `http://localhost:8080/api/v1/health` responds 200 OK. |

---

## 6. Conclusion & Next Steps

Phase BE-1.3-D is complete and verified against all architectural and security requirements:
- Real backend JWT authentication is operational.
- All 8 institutional roles are loaded and validated authoritatively.
- In-memory token storage prevents credential leakage.
- Rate limiting protects authentication endpoints against brute force attacks.
- Both frontend (150 tests) and backend (109 tests) suites pass with 100% success.
