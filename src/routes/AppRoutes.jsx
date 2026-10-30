import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import VerifyEmailPage from '../pages/auth/VerifyEmailPage';
import PendingApprovalPage from '../pages/auth/PendingApprovalPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import OverviewDemoPage from '../pages/OverviewDemoPage';
import CasesPage from '../pages/CasesPage';
import CaseCreatePage from '../pages/CaseCreatePage';
import CaseDetailPage from '../pages/CaseDetailPage';
import VerificationQueuePage from '../pages/VerificationQueuePage';
import GrievancesPage from '../pages/GrievancesPage';
import GrievanceSubmitPage from '../pages/GrievanceSubmitPage';
import StudentResponsesPage from '../pages/StudentResponsesPage';
import CounselingPage from '../pages/CounselingPage';
import CommitteeDashboardPage from '../pages/committee/CommitteeDashboardPage';
import EvidenceVaultPage from '../pages/committee/EvidenceVaultPage';
import HearingCalendarPage from '../pages/committee/HearingCalendarPage';
import CounselingSessionsPage from '../pages/counseling/CounselingSessionsPage';
import CounselingFollowupsPage from '../pages/counseling/CounselingFollowupsPage';
import CounselingHistoryPage from '../pages/counseling/CounselingHistoryPage';
import PoliciesPage from '../pages/PoliciesPage';
import ReportsPage from '../pages/ReportsPage';
import SettingsPage from '../pages/SettingsPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import NotFoundPage from '../pages/NotFoundPage';
import RolePlaceholderPage from '../pages/RolePlaceholderPage';
import StudentProfilePage from '../pages/student/StudentProfilePage';
import StudentComplaintsPage from '../pages/student/StudentComplaintsPage';
import StudentNotificationsPage from '../pages/student/StudentNotificationsPage';
import StudentSupportPage from '../pages/student/StudentSupportPage';
import StudentAppealsPage from '../pages/student/StudentAppealsPage';
import Student360Page from '../pages/hod/Student360Page';
import AppellateReviewPage from '../pages/appeals/AppellateReviewPage';
import UserManagementPage from '../pages/admin/UserManagementPage';
import RolePermissionsPage from '../pages/admin/RolePermissionsPage';
import DepartmentManagementPage from '../pages/admin/DepartmentManagementPage';
import CategoryManagementPage from '../pages/admin/CategoryManagementPage';
import WorkflowConfigurationPage from '../pages/admin/WorkflowConfigurationPage';
import AuditLogsPage from '../pages/admin/AuditLogsPage';
import RequireAuth from './guards/RequireAuth';
import RequireRole from './guards/RequireRole';
import PublicOnlyRoute from './guards/PublicOnlyRoute';
import { ROUTE_PERMISSIONS } from './navigationConfig';

/**
 * AppRoutes Component
 * Central declarative route architecture supporting authentication layouts,
 * route guards, role authorization boundaries, and core feature views.
 */
export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Landing Page (Default Entry Point) */}
      <Route path="/" element={<LandingPage />} />

      {/* Public Guest-Only Authentication Views */}
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/pending-approval" element={<PendingApprovalPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
      </Route>

      {/* Protected Application Workspace */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          {/* Universal Workspaces */}
          <Route path="dashboard" element={<OverviewDemoPage />} />
          <Route path="cases" element={<CasesPage />} />
          <Route path="cases/create" element={<CaseCreatePage />} />
          <Route path="cases/:caseId" element={<CaseDetailPage />} />
          <Route path="grievances" element={<GrievancesPage />} />
          <Route path="grievances/raise" element={<GrievanceSubmitPage />} />
          <Route path="counseling" element={<CounselingPage />} />
          <Route path="policies" element={<PoliciesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="unauthorized" element={<UnauthorizedPage />} />

          {/* Super Admin Restricted Modules */}
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/admin/users']} />}>
            <Route path="admin/users" element={<UserManagementPage />} />
          </Route>
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/admin/roles']} />}>
            <Route path="admin/roles" element={<RolePermissionsPage />} />
          </Route>
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/admin/departments']} />}>
            <Route path="admin/departments" element={<DepartmentManagementPage />} />
          </Route>
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/admin/categories']} />}>
            <Route path="admin/categories" element={<CategoryManagementPage />} />
          </Route>
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/admin/workflows']} />}>
            <Route path="admin/workflows" element={<WorkflowConfigurationPage />} />
          </Route>
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/admin/audit']} />}>
            <Route path="admin/audit" element={<AuditLogsPage />} />
          </Route>

          {/* Dean / Central Admin Restricted Modules */}
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/dean/verification']} />}>
            <Route path="dean/verification" element={<VerificationQueuePage />} />
          </Route>
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/dean/escalations']} />}>
            <Route path="dean/escalations" element={<AppellateReviewPage />} />
          </Route>

          {/* Appellate Review Workspace */}
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/appeals/review']} />}>
            <Route path="appeals/review" element={<AppellateReviewPage />} />
          </Route>

          {/* HOD Restricted Modules */}
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/hod/students']} />}>
            <Route
              path="hod/students"
              element={<RolePlaceholderPage title="Department Student Directory" />}
            />
          </Route>
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/hod/student-360']} />}>
            <Route path="hod/student-360" element={<Student360Page />} />
          </Route>
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/hod/verification']} />}>
            <Route path="hod/verification" element={<VerificationQueuePage />} />
          </Route>
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/hod/assignment']} />}>
            <Route
              path="hod/assignment"
              element={<RolePlaceholderPage title="Proctor & Committee Assignment" />}
            />
          </Route>

          {/* Faculty Modules */}
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/faculty/students']} />}>
            <Route
              path="faculty/students"
              element={<RolePlaceholderPage title="Student Directory" />}
            />
          </Route>

          {/* Coordinator / Mentor Modules */}
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/coordinator/students']} />}>
            <Route
              path="coordinator/students"
              element={<RolePlaceholderPage title="Mentorship Directory" />}
            />
          </Route>
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/counseling/sessions']} />}>
            <Route path="counseling/sessions" element={<CounselingSessionsPage />} />
          </Route>
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/counseling/followups']} />}>
            <Route path="counseling/followups" element={<CounselingFollowupsPage />} />
          </Route>
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/counseling/history']} />}>
            <Route path="counseling/history" element={<CounselingHistoryPage />} />
          </Route>

          {/* Committee Member Modules */}
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/committee/reviews']} />}>
            <Route path="committee/reviews" element={<CommitteeDashboardPage />} />
          </Route>
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/committee/evidence']} />}>
            <Route path="committee/evidence" element={<EvidenceVaultPage />} />
          </Route>
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/committee/timeline']} />}>
            <Route path="committee/timeline" element={<HearingCalendarPage />} />
          </Route>
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/committee/calendar']} />}>
            <Route path="committee/calendar" element={<HearingCalendarPage />} />
          </Route>

          {/* Student Dedicated Modules */}
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/student/profile']} />}>
            <Route path="student/profile" element={<StudentProfilePage />} />
          </Route>
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/student/complaints']} />}>
            <Route path="student/complaints" element={<StudentComplaintsPage />} />
          </Route>
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/student/responses']} />}>
            <Route path="student/responses" element={<StudentResponsesPage />} />
          </Route>
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/student/appeals']} />}>
            <Route path="student/appeals" element={<StudentAppealsPage />} />
          </Route>
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/student/notifications']} />}>
            <Route path="student/notifications" element={<StudentNotificationsPage />} />
          </Route>
          <Route element={<RequireRole allowedRoles={ROUTE_PERMISSIONS['/student/support']} />}>
            <Route path="student/support" element={<StudentSupportPage />} />
          </Route>

          {/* 404 Catch-All */}
          <Route path="404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
