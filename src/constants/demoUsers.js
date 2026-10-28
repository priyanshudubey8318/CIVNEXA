// Institutional Demonstration User Personas for CIVNEXA Frontend (Phase FE-2 / FE-7)
// Provides 8 role-specific personas for frontend evaluation across all system workspaces.
// Real institutional authentication will be integrated in backend development.

import { ROLES } from './roles.js';

export { ROLES };

export const MOCK_USERS = [
  {
    id: 'USR-001',
    name: 'Dr. Vikram Malhotra',
    email: 'vikram.malhotra@civnexa.edu',
    role: 'SUPER_ADMIN',
    roleLabel: 'Super Admin',
    department: 'Institutional IT & Systems',
    title: 'Chief Information & Compliance Officer',
    avatar: 'VM',
    notificationsCount: 4,
  },
  {
    id: 'USR-002',
    name: 'Prof. Ananya Sen',
    email: 'ananya.sen@civnexa.edu',
    role: 'DEAN',
    roleLabel: 'Dean of Student Affairs',
    department: "Dean's Secretariat & Proctorial Board",
    title: 'Dean of Academic Conduct & Student Affairs',
    avatar: 'AS',
    notificationsCount: 7,
  },
  {
    id: 'USR-003',
    name: 'Prof. Sunita Mehta',
    email: 'sunita.mehta@civnexa.edu',
    role: 'HOD',
    roleLabel: 'HOD - Computer Science',
    department: 'Computer Science & Engineering',
    title: 'Head of Department, CSE',
    avatar: 'SM',
    notificationsCount: 5,
  },
  {
    id: 'USR-004',
    name: 'Dr. Ramesh Iyer',
    email: 'ramesh.iyer@civnexa.edu',
    role: 'FACULTY',
    roleLabel: 'Faculty / Invigilator',
    department: 'Computer Science & Engineering',
    title: 'Assistant Professor & Examination Proctor',
    avatar: 'RI',
    notificationsCount: 2,
  },
  {
    id: 'USR-005',
    name: 'Rajesh Verma',
    email: 'rajesh.verma@civnexa.edu',
    role: 'STAFF',
    roleLabel: 'Staff & Hostel Warden',
    department: 'Campus Security & Student Housing',
    title: 'Chief Residential Warden',
    avatar: 'RV',
    notificationsCount: 1,
  },
  {
    id: 'USR-006',
    name: 'Pooja Nambiar',
    email: 'pooja.nambiar@civnexa.edu',
    role: 'COORDINATOR',
    roleLabel: 'Student Counseling Coordinator',
    department: 'Counseling & Wellbeing Center',
    title: 'Senior Counseling Psychologist & Mentor',
    avatar: 'PN',
    notificationsCount: 6,
  },
  {
    id: 'USR-007',
    name: 'Dr. Alok Nath',
    email: 'alok.nath@civnexa.edu',
    role: 'COMMITTEE_MEMBER',
    roleLabel: 'Disciplinary Committee Member',
    department: 'Proctorial Board & Ethics Committee',
    title: 'Associate Professor & Ethics Reviewer',
    avatar: 'AN',
    notificationsCount: 3,
  },
  {
    id: 'USR-008',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@civnexa.edu',
    role: 'STUDENT',
    roleLabel: 'Student (3rd Year CSE)',
    department: 'Computer Science & Engineering',
    title: 'B.Tech Undergraduate Scholar',
    avatar: 'AS',
    notificationsCount: 2,
  },
];

export const DEMO_PERSONAS = MOCK_USERS;
export default MOCK_USERS;
