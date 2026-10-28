// Institutional Student Directory Dataset for CIVNEXA (Phase FE-2 / FE-7)
// Provides configurable directory records for incident intake, student lookup, and conduct dossier review.
// Backing database integration will be implemented in the backend phase.

export const STUDENT_DIRECTORY = [
  {
    id: 'STU-8821',
    name: 'Aarav Sharma',
    rollNo: '22CSE041',
    enrollmentNo: 'ENR-2022-CSE-0041',
    email: 'aarav.sharma@civnexa.edu',
    department: 'Computer Science & Engineering',
    departmentCode: 'CSE',
    course: 'B.Tech Computer Science',
    semester: 'Semester 5 (3rd Year)',
    section: 'Section A',
    cgpa: 7.82,
    hostel: 'Block B, Room 304',
    phone: '+91 98765 43210',
    avatar: 'AS',
  },
  {
    id: 'STU-7492',
    name: 'Rohan Varma',
    rollNo: '23ME112',
    enrollmentNo: 'ENR-2023-ME-0112',
    email: 'rohan.varma@civnexa.edu',
    department: 'Mechanical Engineering',
    departmentCode: 'ME',
    course: 'B.Tech Mechanical Engineering',
    semester: 'Semester 3 (2nd Year)',
    section: 'Section B',
    cgpa: 8.14,
    hostel: 'Block A, Room 112',
    phone: '+91 98765 43211',
    avatar: 'RV',
  },
  {
    id: 'STU-5520',
    name: 'Priya Nair',
    rollNo: '21ME019',
    enrollmentNo: 'ENR-2021-ME-0019',
    email: 'priya.nair@civnexa.edu',
    department: 'Mechanical Engineering',
    departmentCode: 'ME',
    course: 'B.Tech Mechanical Engineering',
    semester: 'Semester 7 (4th Year)',
    section: 'Section A',
    cgpa: 9.05,
    hostel: 'Girls Hostel 2, Room 201',
    phone: '+91 98765 43212',
    avatar: 'PN',
  },
  {
    id: 'STU-6340',
    name: 'Tanmay Deshmukh',
    rollNo: '22ECE088',
    enrollmentNo: 'ENR-2022-ECE-0088',
    email: 'tanmay.d@civnexa.edu',
    department: 'Electronics & Communication',
    departmentCode: 'ECE',
    course: 'B.Tech Electronics & Communication',
    semester: 'Semester 5 (3rd Year)',
    section: 'Section C',
    cgpa: 6.95,
    hostel: 'Day Scholar (Local Resident)',
    phone: '+91 98765 43213',
    avatar: 'TD',
  },
  {
    id: 'STU-4411',
    name: 'Karan Patel',
    rollNo: '23CE033',
    enrollmentNo: 'ENR-2023-CE-0033',
    email: 'karan.patel@civnexa.edu',
    department: 'Civil Engineering',
    departmentCode: 'CE',
    course: 'B.Tech Civil Engineering',
    semester: 'Semester 3 (2nd Year)',
    section: 'Section A',
    cgpa: 7.4,
    hostel: 'Block 4, Room 408',
    phone: '+91 98765 43214',
    avatar: 'KP',
  },
  {
    id: 'STU-9102',
    name: 'Ananya Roy',
    rollNo: '24BT015',
    enrollmentNo: 'ENR-2024-BT-0015',
    email: 'ananya.roy@civnexa.edu',
    department: 'Biotechnology',
    departmentCode: 'BT',
    course: 'B.Tech Biotechnology',
    semester: 'Semester 1 (1st Year)',
    section: 'Section A',
    cgpa: 8.7,
    hostel: 'Girls Hostel 1, Room 105',
    phone: '+91 98765 43215',
    avatar: 'AR',
  },
  {
    id: 'STU-3329',
    name: 'Siddharth Sen',
    rollNo: '22EE054',
    enrollmentNo: 'ENR-2022-EE-0054',
    email: 'siddharth.s@civnexa.edu',
    department: 'Electrical Engineering',
    departmentCode: 'EE',
    course: 'B.Tech Electrical Engineering',
    semester: 'Semester 5 (3rd Year)',
    section: 'Section B',
    cgpa: 7.15,
    hostel: 'Block C, Room 220',
    phone: '+91 98765 43216',
    avatar: 'SS',
  },
  {
    id: 'STU-7012',
    name: 'Devendra Rao',
    rollNo: '21EE077',
    enrollmentNo: 'ENR-2021-EE-0077',
    email: 'devendra.r@civnexa.edu',
    department: 'Electrical Engineering',
    departmentCode: 'EE',
    course: 'B.Tech Electrical Engineering',
    semester: 'Semester 7 (4th Year)',
    section: 'Section A',
    cgpa: 7.91,
    hostel: 'Day Scholar',
    phone: '+91 98765 43217',
    avatar: 'DR',
  },
  {
    id: 'STU-1823',
    name: 'Meera Krishnan',
    rollNo: '23CSE102',
    enrollmentNo: 'ENR-2023-CSE-0102',
    email: 'meera.k@civnexa.edu',
    department: 'Computer Science & Engineering',
    departmentCode: 'CSE',
    course: 'B.Tech Computer Science',
    semester: 'Semester 3 (2nd Year)',
    section: 'Section B',
    cgpa: 9.32,
    hostel: 'Girls Hostel 2, Room 310',
    phone: '+91 98765 43218',
    avatar: 'MK',
  },
  {
    id: 'STU-2940',
    name: 'Vikramaditya Chauhan',
    rollNo: '22ME076',
    enrollmentNo: 'ENR-2022-ME-0076',
    email: 'vikram.c@civnexa.edu',
    department: 'Mechanical Engineering',
    departmentCode: 'ME',
    course: 'B.Tech Mechanical Engineering',
    semester: 'Semester 5 (3rd Year)',
    section: 'Section A',
    cgpa: 7.6,
    hostel: 'Block B, Room 115',
    phone: '+91 98765 43219',
    avatar: 'VC',
  },
];

export const MOCK_STUDENTS = STUDENT_DIRECTORY;

/**
 * Search student records by query string against Roll No, Enrollment No, Name, Email, or ID
 */
export const searchStudents = (query) => {
  if (!query || query.trim() === '') return [];
  const q = query.toLowerCase().trim();
  return STUDENT_DIRECTORY.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.rollNo.toLowerCase().includes(q) ||
      s.enrollmentNo.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q)
  );
};

export default STUDENT_DIRECTORY;
