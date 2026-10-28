# CIVNEXA — Master Frontend Demonstration Guide

This guide provides a comprehensive, step-by-step presentation walkthrough of the complete CIVNEXA frontend application. It covers all 8 role personas, 7 cross-module workflows, security and confidentiality boundaries, and responsive layouts.

---

## Demonstration Overview & Pre-Configured Personas

CIVNEXA uses client-side simulated demonstration sessions with mock state persistence in browser `sessionStorage` and `localStorage`.

### Available Demonstration Roles & Quick Selection
On the Login Screen (`/login`), click any role pill to prefill credentials and launch a session:

| Role | Persona Name | Demonstration Email | Default Password | Primary Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Dr. Vikram Malhotra | `vikram.malhotra@civnexa.edu` | `Admin@12345` | Global university governance, user administration, categories, departments, workflows, audit logs |
| **Dean** | Prof. Ananya Sen | `ananya.sen@civnexa.edu` | `Dean@12345` | Institutional proctorial oversight, case verification queue, escalations, appellate determinations |
| **HOD** | Dr. Rajiv Verma | `rajiv.verma@civnexa.edu` | `Hod@12345` | Departmental conduct supervision (Computer Science), proctorial assignment, Student 360 view |
| **Faculty** | Dr. Priya Nair | `priya.nair@civnexa.edu` | `Faculty@12345` | Classroom incident reporting, exam invigilation logs, rapid student lookup |
| **Staff & Warden**| Col. Rajesh Bakshi | `rajesh.bakshi@civnexa.edu` | `Staff@12345` | Hostel curfew logs, campus security incidents, transit & maintenance reports |
| **Coordinator** | Pooja Nambiar | `pooja.nambiar@civnexa.edu` | `Coord@12345` | Student counseling referrals, mental wellbeing intake, clinical follow-ups |
| **Committee Member**| Dr. Alok Nath | `alok.nath@civnexa.edu` | `Comm@12345` | Disciplinary review queue, cryptographic evidence audit, hearing scheduling & minutes |
| **Student** | Aarav Sharma | `aarav.sharma@civnexa.edu` | `Student@12345` | Student portal, grievance submission (named & anonymous), summons response, appeals |

---

## 11-Step Master Demonstration Walkthrough

### Step 1: Login as Faculty
* **Role:** `FACULTY` (Dr. Priya Nair)
* **Starting URL:** `/login`
* **Actions:**
  1. Click the **Faculty** persona pill on the login screen.
  2. Notice that email and demo password automatically populate.
  3. Click **Sign In to Platform**.
* **Observations:**
  - Welcome notification banner displays user name and role.
  - Redirects to `/`, rendering the Faculty-specific dashboard with submitted cases, pending verifications, and quick action shortcuts.
  - Sidebar dynamically filters to show only Faculty navigation options (5 items).

---

### Step 2: Create a Student Incident Report
* **Role:** `FACULTY` (Dr. Priya Nair)
* **Starting URL:** `/cases/create`
* **Actions:**
  1. From the top navigation or sidebar, click **Report Incident** (`/cases/create`).
  2. Step 1 (Student Identification): Type `CS-2023-042` or select **Aarav Sharma**. Notice academic standing and roll verification appear.
  3. Step 2 (Incident Classification): Select category **Examination Malpractice & UFM**, set priority to **High**, date to current date, location to `Examination Hall 3B`. Enter title: `Unauthorized Electronic Device in Final Examination`.
  4. Step 3 (Evidence Vault): Attach evidence file (e.g. `smartwatch_log.pdf`).
  5. Step 4 (Review & Submit): Review docket details and click **Submit Incident Report**.
* **Observations:**
  - Sequential case reference generated (`CX-2026-0109` or higher).
  - Status is initialized to **Pending Verification**.
  - Case docket appears in case registry and immediately syncs to central verification queue.

---

### Step 3: Submit a Grievance as a Student
* **Role:** Switch to `STUDENT` (Aarav Sharma) via Topbar Persona Dropdown or Logout/Login.
* **Starting URL:** `/grievances/raise`
* **Actions:**
  1. Navigate to `/grievances/raise`.
  2. Change Grievance Category to **Campus Infrastructure & Facilities** or **Campus Safety**.
  3. Toggle **Submit as Confidential Anonymous Grievance**.
  4. Fill Headline: `Campus Transit Bus Breakdown on North Ring Road`.
  5. Enter description details and click **Submit Formal Grievance**.
* **Observations:**
  - Success banner displays grievance tracking ID (`GRV-2026-XXXX`).
  - Anonymity badge confirms student name and roll number are suppressed to **Anonymous Student Complainant** and **ANON-ROLL**.
  - Open `/student/complaints` to confirm grievance appears in student tracking list.

---

### Step 4: Verify and Assign Case as Dean / HOD
* **Role:** Switch to `DEAN` (Prof. Ananya Sen) or `HOD` (Dr. Rajiv Verma).
* **Starting URL:** `/dean/verification` (or `/hod/verification`)
* **Actions:**
  1. Open the Verification Queue.
  2. Locate the incident reported in Step 2.
  3. Click **Review & Verify**.
  4. Select **Verify & Forward for Hearing / Inquiry**, input proctorial notes, and confirm.
* **Observations:**
  - Case transitions to **Under Investigation** / **Verified**.
  - Timeline records verification actor, timestamp, and formal decision notes.
  - Case moves out of pending intake queue into committee review docket.

---

### Step 5: Inspect Evidence as Disciplinary Committee Member
* **Role:** Switch to `COMMITTEE_MEMBER` (Dr. Alok Nath).
* **Starting URL:** `/committee/reviews` and `/committee/evidence`
* **Actions:**
  1. Navigate to Committee Review Queue (`/committee/reviews`).
  2. Click **Inspect Docket** on the verified case.
  3. Switch to **Evidence Review** tab or navigate to `/committee/evidence`.
  4. Click **Verify Cryptographic Checksum** on an attached piece of evidence.
* **Observations:**
  - SHA-256 Web Crypto verification completes client-side and validates chain of custody against tamper-evident store.
  - Click **Add Deliberation Note** to record committee member remarks on record.

---

### Step 6: Schedule Disciplinary Hearing
* **Role:** `COMMITTEE_MEMBER` (Dr. Alok Nath) or `DEAN`.
* **Starting URL:** `/committee/calendar`
* **Actions:**
  1. Click **Schedule Hearing** button.
  2. Select the case reference, set hearing date, time, and venue (e.g. `Senate Room B, Proctorial Wing`).
  3. Assign committee members and student attendees.
  4. Click **Confirm Hearing Schedule**.
* **Observations:**
  - Hearing appears on calendar grid and scheduled hearings list.
  - Notice generated with hearing reference (`H-2026-XXXX`).
  - Student is formally summoned and case status transitions to **Hearing Scheduled**.

---

### Step 7: Submit Student Explanation
* **Role:** Switch to `STUDENT` (Aarav Sharma).
* **Starting URL:** `/student/responses`
* **Actions:**
  1. Navigate to **Submit Response** (`/student/responses`).
  2. Select the active hearing summons or inquiry requiring explanation.
  3. Enter formal defense statement in the rich text area:
     > *"I was unaware that notes were left inside the desk by the previous candidate. I did not access or possess unauthorized materials during the examination."*
  4. Attach supporting document (e.g., admit card receipt).
  5. Click **Submit Formal Defense**.
* **Observations:**
  - Defense statement is timestamped and attached to permanent case record.
  - Case status updates to **Under Investigation**.
  - Timeline appends a student response badge visible to committee and proctorial reviewers.

---

### Step 8: Record Counseling Attendance & Welfare Follow-up
* **Role:** Switch to `COORDINATOR` (Pooja Nambiar).
* **Starting URL:** `/counseling/sessions` and `/counseling/followups`
* **Actions:**
  1. Open Counseling Sessions (`/counseling/sessions`).
  2. Locate scheduled appointment for the student.
  3. Click **Record Attendance**.
  4. Mark status as **Attended**, enter clinical summary notes, and check **Schedule Welfare Follow-up**.
  5. Navigate to `/counseling/followups` and click **Complete Follow-up** when follow-up goal is met.
* **Observations:**
  - Attendance rate and follow-up metrics update across coordinator dashboard.
  - Note: In accordance with clinical confidentiality, psychotherapy notes are visible only to authorized counselors, suppressing clinical details from academic proctorial lists.

---

### Step 9: Submit and Review an Appeal
* **Role:** Switch to `STUDENT` (Aarav Sharma) -> then `DEAN` (Prof. Ananya Sen).
* **Starting URL:** `/student/appeals` -> `/appeals/review`
* **Actions:**
  1. As Student: Open `/student/appeals`. Click **Lodge Formal Appeal**.
  2. Select completed case, select ground: **Procedural Irregularity** or **New Evidence**.
  3. Enter detailed explanation (>20 chars) and relief sought. Click **Submit Appeal Docket**.
  4. As Dean: Switch to Dean and navigate to `/appeals/review`.
  5. Open the submitted appeal docket, review original sanction, and click **Record Final Determination**.
  6. Select outcome: **Sanction Modified** or **Decision Upheld**, enter justification, and authorize.
* **Observations:**
  - Appeal status updates to **Sanction Modified** / **Upheld**.
  - Original case decision is strictly preserved with `decisionPreserved: true` in historical audit logs.

---

### Step 10: Generate Filtered Institutional Report & CSV Export
* **Role:** Switch to `DEAN` (Prof. Ananya Sen) or `SUPER_ADMIN` (Dr. Vikram Malhotra).
* **Starting URL:** `/reports`
* **Actions:**
  1. Navigate to Institutional Reports (`/reports`).
  2. Select Report Type: **Case Overview & Operational Summary** or select a compliance template: **Examination Malpractice & UFM Invigilation Audit**.
  3. Notice compliance template disclaimer: *"Configurable institutional ombudsman template..."*.
  4. Apply category filter: `Examination Incident` and status filter: `All`.
  5. Click **Export CSV Report**.
* **Observations:**
  - Browser downloads a UTF-8 character-escaped CSV file containing filtered operational records matching active metrics.
  - Student identity fields conform to confidentiality rules (masked for non-administrative roles).

---

### Step 11: Inspect Administrative Configuration as Super Admin
* **Role:** Switch to `SUPER_ADMIN` (Dr. Vikram Malhotra).
* **Starting URL:** `/admin/users`, `/admin/departments`, `/admin/audit`
* **Actions:**
  1. Open User Management (`/admin/users`) — inspect 8 role accounts and status toggles.
  2. Open Department Management (`/admin/departments`) — view 5 academic departments and proctor assignments.
  3. Open System Audit Logs (`/admin/audit`) — inspect chronological, immutable audit entries capturing logins, case edits, status changes, and exports.
* **Observations:**
  - Full system health, audit trail integrity, and governance controls are verified.

---

## Simulated vs. Planned Production Systems

| Feature Area | Demonstration Implementation | Planned Production Backend Integration |
| :--- | :--- | :--- |
| **Authentication** | Client-side mock session in `sessionStorage` with pre-defined persona pills. | Spring Security 6 with JWT Bearer tokens, HTTP-only refresh cookies, and SSO integration (SAML/OAuth2). |
| **Data Storage** | In-memory datasets with browser `localStorage` synchronization. | MySQL 8.0 relational database with ACID transactions and schema migrations (Flyway). |
| **Security & Authorization** | React Router client-side route guards and UI masking. | Server-side method security (`@PreAuthorize`), role-based SQL queries, and field-level encryption for clinical records. |
| **Evidence Files** | Client-side mock file uploads with Web Crypto API SHA-256 hash calculation. | S3-compatible cloud object storage (AWS S3 or GCS) with presigned URLs and immutable storage policies. |
| **Audit Logs** | Client-side reactive append-only array persisted to `localStorage`. | Server-side write-once audit log table with digital signatures and external SIEM ingestion. |

---

## Demonstration Reset Procedure

To return the entire application to its original pristine state at any point during a demonstration:
1. Open the browser DevTools Console (`F12`).
2. Run:
   ```javascript
   window.localStorage.clear();
   window.sessionStorage.clear();
   window.location.href = '/login';
   ```
3. The application will reboot into initial pristine demonstration mode.
