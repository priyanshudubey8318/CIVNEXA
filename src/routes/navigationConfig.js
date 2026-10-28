// Centralized Role-Based Navigation Configuration for CIVNEXA (Phase FE-2)
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Building2,
  FolderTree,
  GitFork,
  FileText,
  BarChart3,
  History,
  Settings,
  FolderKanban,
  CheckSquare,
  ShieldAlert,
  AlertTriangle,
  GraduationCap,
  UserCheck,
  FilePlus,
  Search,
  Inbox,
  UserPlus,
  CalendarHeart,
  Calendar,
  Clock,
  Archive,
  Scale,
  ClipboardList,
  Eye,
  Milestone,
  User,
  HelpCircle,
  Bell,
  MessageSquare,
} from 'lucide-react';

export const ROLE_NAVIGATION = {
  SUPER_ADMIN: [
    { id: 'overview', label: 'System Overview', path: '/dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', path: '/admin/users', icon: Users },
    { id: 'roles', label: 'Role & Permissions', path: '/admin/roles', icon: ShieldCheck },
    { id: 'departments', label: 'Department Management', path: '/admin/departments', icon: Building2 },
    { id: 'categories', label: 'Category Management', path: '/admin/categories', icon: FolderTree },
    { id: 'workflows', label: 'Workflow Configuration', path: '/admin/workflows', icon: GitFork },
    { id: 'policies', label: 'Policy Management', path: '/policies', icon: FileText },
    { id: 'reports', label: 'System Reports', path: '/reports', icon: BarChart3 },
    { id: 'audit', label: 'System Audit Logs', path: '/admin/audit', icon: History },
    { id: 'settings', label: 'System Governance', path: '/settings', icon: Settings },
  ],

  DEAN: [
    { id: 'overview', label: 'Institutional Overview', path: '/dashboard', icon: LayoutDashboard },
    { id: 'cases', label: 'Case Registry', path: '/cases', icon: FolderKanban, badge: '8 Active' },
    { id: 'verification', label: 'Verification Queue', path: '/dean/verification', icon: CheckSquare },
    { id: 'grievances', label: 'Grievance Management', path: '/grievances', icon: ShieldAlert },
    { id: 'escalations', label: 'Proctorial Escalations', path: '/dean/escalations', icon: AlertTriangle },
    { id: 'department-analytics', label: 'Department Analytics', path: '/reports', icon: BarChart3 },
    { id: 'reports', label: 'Institutional Reports', path: '/reports', icon: FileText },
  ],

  HOD: [
    { id: 'overview', label: 'Department Overview', path: '/dashboard', icon: LayoutDashboard },
    { id: 'cases', label: 'Department Cases', path: '/cases', icon: FolderKanban },
    { id: 'students', label: 'Student Directory', path: '/hod/students', icon: GraduationCap },
    { id: 'student-360', label: 'Student 360 View', path: '/hod/student-360', icon: UserCheck },
    { id: 'verification', label: 'Case Verification', path: '/hod/verification', icon: CheckSquare },
    { id: 'assignment', label: 'Case Assignment', path: '/hod/assignment', icon: UserPlus },
    { id: 'counseling', label: 'Counseling Overview', path: '/counseling', icon: CalendarHeart },
    { id: 'reports', label: 'Department Reports', path: '/reports', icon: BarChart3 },
  ],

  FACULTY: [
    { id: 'overview', label: 'Faculty Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { id: 'create-incident', label: 'Report Incident', path: '/cases/create', icon: FilePlus },
    { id: 'student-lookup', label: 'Student Lookup', path: '/faculty/students', icon: Search },
    { id: 'my-cases', label: 'My Submitted Cases', path: '/cases?tab=submitted', icon: Inbox },
    { id: 'assigned-cases', label: 'Assigned Cases', path: '/cases?tab=assigned', icon: FolderKanban },
  ],

  STAFF: [
    { id: 'overview', label: 'Staff Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { id: 'create-incident', label: 'Report Incident', path: '/cases/create', icon: FilePlus },
    { id: 'my-cases', label: 'My Submitted Cases', path: '/cases?tab=submitted', icon: Inbox },
    { id: 'assigned-cases', label: 'Assigned Cases', path: '/cases?tab=assigned', icon: FolderKanban },
  ],

  COORDINATOR: [
    { id: 'overview', label: 'Coordinator Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Assigned Students', path: '/coordinator/students', icon: GraduationCap },
    { id: 'calendar', label: 'Counseling Calendar', path: '/counseling', icon: Calendar },
    { id: 'sessions', label: 'Counseling Sessions', path: '/counseling/sessions', icon: Clock },
    { id: 'followups', label: 'Welfare Follow-ups', path: '/counseling/followups', icon: ClipboardList },
    { id: 'history', label: 'Counseling History', path: '/counseling/history', icon: Archive },
  ],

  COMMITTEE_MEMBER: [
    { id: 'overview', label: 'Committee Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { id: 'assigned-cases', label: 'Assigned Cases', path: '/cases?tab=assigned', icon: FolderKanban },
    { id: 'reviews', label: 'Review Queue', path: '/committee/reviews', icon: Scale },
    { id: 'evidence', label: 'Evidence Review', path: '/committee/evidence', icon: Eye },
    { id: 'timeline', label: 'Case Timeline', path: '/committee/timeline', icon: Milestone },
  ],

  STUDENT: [
    { id: 'overview', label: 'Student Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'My Student Profile', path: '/student/profile', icon: User },
    { id: 'cases', label: 'My Cases', path: '/cases', icon: FolderKanban },
    { id: 'raise-grievance', label: 'Raise a Grievance', path: '/grievances/raise', icon: ShieldAlert },
    { id: 'complaints', label: 'My Complaints', path: '/student/complaints', icon: MessageSquare },
    { id: 'submit-response', label: 'Submit Response', path: '/student/responses', icon: CheckSquare },
    { id: 'appeals', label: 'Appeals & Reconsideration', path: '/student/appeals', icon: Scale },
    { id: 'counseling', label: 'Counseling & Wellbeing', path: '/counseling', icon: CalendarHeart },
    { id: 'notifications', label: 'Notifications', path: '/student/notifications', icon: Bell },
    { id: 'policies', label: 'Institutional Policies', path: '/policies', icon: FileText },
    { id: 'support', label: 'Campus Support', path: '/student/support', icon: HelpCircle },
  ],
};

/**
 * Returns navigation items for a given role key.
 */
export const getNavigationForRole = (roleKey) => {
  return ROLE_NAVIGATION[roleKey] || ROLE_NAVIGATION.DEAN;
};

/**
 * Map of routes to their restricted roles (if restricted).
 * Unlisted routes are open to all authenticated roles.
 */
export const ROUTE_PERMISSIONS = {
  '/appeals/review': ['SUPER_ADMIN', 'DEAN', 'COMMITTEE_MEMBER'],
  '/admin/users': ['SUPER_ADMIN'],
  '/admin/roles': ['SUPER_ADMIN'],
  '/admin/departments': ['SUPER_ADMIN'],
  '/admin/categories': ['SUPER_ADMIN'],
  '/admin/workflows': ['SUPER_ADMIN'],
  '/admin/audit': ['SUPER_ADMIN'],
  '/dean/verification': ['SUPER_ADMIN', 'DEAN'],
  '/dean/escalations': ['SUPER_ADMIN', 'DEAN'],
  '/hod/students': ['SUPER_ADMIN', 'DEAN', 'HOD'],
  '/hod/student-360': ['SUPER_ADMIN', 'DEAN', 'HOD'],
  '/hod/verification': ['SUPER_ADMIN', 'DEAN', 'HOD'],
  '/hod/assignment': ['SUPER_ADMIN', 'DEAN', 'HOD'],
  '/faculty/students': ['SUPER_ADMIN', 'DEAN', 'HOD', 'FACULTY'],
  '/coordinator/students': ['SUPER_ADMIN', 'DEAN', 'COORDINATOR'],
  '/counseling/sessions': ['SUPER_ADMIN', 'DEAN', 'COORDINATOR'],
  '/counseling/followups': ['SUPER_ADMIN', 'DEAN', 'COORDINATOR'],
  '/counseling/history': ['SUPER_ADMIN', 'DEAN', 'COORDINATOR'],
  '/committee/reviews': ['SUPER_ADMIN', 'DEAN', 'COMMITTEE_MEMBER'],
  '/committee/evidence': ['SUPER_ADMIN', 'DEAN', 'COMMITTEE_MEMBER'],
  '/committee/timeline': ['SUPER_ADMIN', 'DEAN', 'COMMITTEE_MEMBER'],
  '/committee/calendar': ['SUPER_ADMIN', 'DEAN', 'COMMITTEE_MEMBER'],
  '/student/profile': ['STUDENT'],
  '/student/complaints': ['STUDENT'],
  '/student/responses': ['STUDENT'],
  '/student/appeals': ['STUDENT'],
  '/student/notifications': ['STUDENT'],
  '/student/support': ['STUDENT'],
};

export default ROLE_NAVIGATION;
