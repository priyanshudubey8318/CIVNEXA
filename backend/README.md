# CIVNEXA Backend Service (Spring Boot 3)

The backend service for **CIVNEXA** — Campus Conduct, Grievance, Safety & Student Support Platform.

## Technology Stack

* **Framework:** Spring Boot 3.4.1 (Java 21 / 25 LTS)
* **Build System:** Apache Maven 3.10 with bundled Maven Wrapper (`mvnw.cmd` / `./mvnw`)
* **Persistence:** Spring Data JPA + Hibernate 6.6
* **Database:** MySQL 8.0 (with H2 in-memory test fallback)
* **Security:** Spring Security 6 (Stateless JWT Architecture & RBAC)
* **API Documentation:** RESTful APIs under `/api/v1`

## Project Structure

```
backend/
├── pom.xml                               # Maven project descriptor
├── mvnw / mvnw.cmd                       # Maven wrappers
├── src/
│   ├── main/
│   │   ├── java/com/civnexa/
│   │   │   ├── CivnexaBackendApplication.java # Spring Boot entry point
│   │   │   ├── config/                   # CORS, Security, JPA configuration
│   │   │   ├── controller/               # REST API Controllers (/api/v1/...)
│   │   │   ├── dto/                      # Data Transfer Objects & Response envelopes
│   │   │   ├── exception/                # Global exception handling & API errors
│   │   │   ├── model/                    # JPA Entities (BE-1.2)
│   │   │   ├── repository/               # Spring Data Repositories (BE-1.2)
│   │   │   ├── security/                 # JWT Provider, Auth Filter & Principal (BE-1.3)
│   │   │   └── service/                  # Business logic services (BE-1.4)
│   │   └── resources/
│   │       └── application.yml           # Production & development configuration
│   └── test/
│       ├── java/com/civnexa/
│       │   ├── CivnexaBackendApplicationTests.java
│       │   └── controller/
│       │       └── HealthControllerTests.java
│       └── resources/
│           └── application.yml           # Hermetic test configuration (H2 DB)
```

## Running the Application

### Prerequisites
* Java 21 or 25 LTS installed and configured on PATH
* MySQL 8.0 running locally on port 3306

### Development Server
```bash
cd backend
./mvnw spring-boot:run
```

### Running Tests
```bash
cd backend
./mvnw test
```

### Packaging Runnable JAR
```bash
cd backend
./mvnw package -DskipTests
```

## Core Endpoints (Phase BE-1.1)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/ping` | Lightweight heartbeat returning "PONG" | No |
| `GET` | `/api/v1/health` | Comprehensive diagnostics, memory stats, and uptime | No |
