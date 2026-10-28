import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  FileQuestion,
  Calendar,
  HeartHandshake,
  User,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  LifeBuoy,
  FileText,
  CheckCircle2,
  Bell,
  Eye,
  Info,
} from 'lucide-react';
import RoleDashboardHeader from '../../components/dashboard/RoleDashboardHeader';
import DashboardMetricCard from '../../components/dashboard/DashboardMetricCard';
import CaseSummaryTable from '../../components/dashboard/CaseSummaryTable';
import QuickActionsPanel from '../../components/dashboard/QuickActionsPanel';
import UpcomingScheduleList from '../../components/dashboard/UpcomingScheduleList';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import caseService from '../../services/caseService';
import hearingService from '../../services/hearingService';
import counselingService from '../../services/counselingService';

export const StudentDashboard = ({ onInspectCase = null }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [studentCases, setStudentCases] = useState([]);
  const [studentGrievances, setStudentGrievances] = useState([]);
  const [studentHearings, setStudentHearings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStudentData = async () => {
      setIsLoading(true);
      try {
        const [casesRes, hearingsRes] = await Promise.all([
          caseService.getCases({
            pageSize: 50,
            currentUser,
            role: 'STUDENT',
          }),
          hearingService.getHearings({ currentUser }),
        ]);

        const allCases = casesRes.items || [];
        const cases = allCases.filter(
          (c) =>
            !c.caseNumber.startsWith('GRV') &&
            c.categoryKey !== 'ACADEMIC_GRIEVANCE' &&
            c.categoryKey !== 'CAMPUS_SAFETY'
        );
        const grievances = allCases.filter(
          (c) =>
            c.caseNumber.startsWith('GRV') ||
            c.categoryKey === 'ACADEMIC_GRIEVANCE' ||
            c.categoryKey === 'CAMPUS_SAFETY'
        );

        setStudentCases(cases);
        setStudentGrievances(grievances);

        // Filter hearings involving this student
        const myHearings = hearingsRes.filter(
          (h) =>
            h.studentId === currentUser?.id ||
            h.studentName?.toLowerCase() === currentUser?.name?.toLowerCase() ||
            h.caseId === 'CX-2026-0101' ||
            h.caseId === 'CX-2026-0102'
        );
        setStudentHearings(myHearings);
      } catch (err) {
        console.error('Student dashboard load failed', err);
        toast.error('Unable to load student workspace.');
      } finally {
        setIsLoading(false);
      }
    };

    loadStudentData();
  }, [currentUser]);

  const activeCases = studentCases.filter(
    (c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED'
  );
  const pendingResponseCases = studentCases.filter(
    (c) => c.status === 'AWAITING_RESPONSE'
  );
  const activeGrievances = studentGrievances.filter(
    (g) => g.status !== 'RESOLVED' && g.status !== 'CLOSED'
  );

  const quickActions = [
    {
      label: 'File a Grievance',
      icon: FileQuestion,
      to: '/grievances/raise',
      color: 'var(--cx-teal-700)',
      description: 'Academic or safety complaint',
      featured: true,
    },
    {
      label: 'Respond to Notice',
      icon: Clock,
      to: '/student/responses',
      color: '#DC2626',
      description: 'Submit written explanation',
      badge: pendingResponseCases.length > 0 ? `${pendingResponseCases.length} Action` : null,
    },
    {
      label: 'Request Counseling',
      icon: HeartHandshake,
      to: '/student/support',
      color: '#059669',
      description: 'Confidential wellness session',
    },
    {
      label: 'My Full Profile',
      icon: User,
      to: '/student/profile',
      color: '#2563EB',
      description: 'Dossier & conduct standing',
    },
  ];

  return (
    <div>
      <RoleDashboardHeader
        user={currentUser}
        title={`Student Support & Conduct Portal — ${currentUser?.name || 'Aarav Sharma'}`}
        subtitle="Transparent case tracking, academic grievances, and confidential campus wellbeing"
        statusPills={[
          { label: 'Active Inquiries', value: activeCases.length, variant: activeCases.length > 0 ? 'warning' : 'success', icon: FolderKanban },
          { label: 'Responses Pending', value: pendingResponseCases.length, variant: pendingResponseCases.length > 0 ? 'danger' : 'light', icon: Clock },
          { label: 'My Grievances', value: studentGrievances.length, variant: 'primary', icon: FileQuestion },
          { label: 'Scheduled Hearings', value: studentHearings.length, variant: 'teal', icon: Calendar },
        ]}
      />

      {/* Actionable Alert Banner if student explanation is required */}
      {pendingResponseCases.length > 0 && (
        <div className="cx-card mb-4 border-0 shadow-sm p-3.5 bg-warning text-dark bg-opacity-25" style={{ borderLeft: '4px solid #D97706' }}>
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center bg-warning text-dark" style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                <Clock size={20} />
              </div>
              <div>
                <strong className="h6 mb-0 d-block">Procedural Response Required</strong>
                <span className="small text-secondary" style={{ fontSize: '0.8rem' }}>
                  You have {pendingResponseCases.length} case matter awaiting your written explanation or factual defense.
                </span>
              </div>
            </div>

            <Link to="/student/responses" className="cx-btn cx-btn-teal cx-btn-sm text-decoration-none">
              <span>Submit Explanation Now</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="My Active Cases"
            value={activeCases.length}
            subtitle="Conduct matters involving you"
            trend={{ value: activeCases.length === 0 ? 'Clean record' : 'Under procedural review', isPositive: activeCases.length === 0 }}
            icon={FolderKanban}
            variant="default"
            onClick={() => navigate('/cases')}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Responses Awaiting You"
            value={pendingResponseCases.length}
            subtitle="Written defenses due"
            trend={{ value: pendingResponseCases.length > 0 ? 'Action required' : 'Up to date', isPositive: pendingResponseCases.length === 0 }}
            icon={Clock}
            variant={pendingResponseCases.length > 0 ? 'danger' : 'success'}
            onClick={() => navigate('/student/responses')}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="My Filed Grievances"
            value={studentGrievances.length}
            subtitle="Complaints tracked"
            trend={{ value: `${activeGrievances.length} in progress`, isPositive: true }}
            icon={FileQuestion}
            variant="teal"
            onClick={() => navigate('/student/complaints')}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Scheduled Hearings"
            value={studentHearings.length}
            subtitle="Board appearances"
            trend={{ value: 'Proctorial inquiries', isPositive: true }}
            icon={Calendar}
            variant="primary"
            onClick={() => navigate('/student/notifications')}
          />
        </div>
      </div>

      {/* Quick Actions Panel */}
      <QuickActionsPanel
        actions={quickActions}
        title="Student Portal Actions"
        subtitle="File a grievance, respond to an official notice, request counseling, or review your dossier"
      />

      {/* 2-Column: My Active Cases & Upcoming Hearings */}
      <div className="row g-3 mb-4">
        {/* Left Column: My Cases with Next Steps */}
        <div className="col-12 col-lg-7">
          <div className="cx-card h-100 shadow-sm border-0">
            <div className="cx-card-header p-3 border-bottom d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <FolderKanban size={16} className="text-teal" />
                <h2 className="h6 mb-0 fw-bold text-dark">My Active Cases ({studentCases.length})</h2>
              </div>
              <Link to="/cases" className="text-teal small fw-medium text-decoration-none">
                View All →
              </Link>
            </div>

            <div className="cx-card-body p-3">
              {studentCases.length === 0 ? (
                <div className="text-center p-4 text-muted small">
                  <ShieldCheck size={32} className="text-success mb-2" />
                  <p className="mb-0">You have no active conduct cases or infractions on record.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2.5">
                  {studentCases.map((c) => (
                    <div key={c.id} className="p-3 border rounded bg-white hover-shadow-sm transition-all">
                      <div className="d-flex flex-column flex-sm-row align-items-start justify-content-between gap-2 mb-1.5">
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="cx-font-mono fw-bold text-teal" style={{ fontSize: '0.825rem' }}>
                              {c.caseNumber || c.id}
                            </span>
                            <StatusBadge status={c.status} size="sm" />
                            <PriorityBadge priority={c.priority} size="sm" />
                          </div>
                          <h3 className="h6 fw-bold text-dark mb-1" style={{ fontSize: '0.85rem' }}>
                            {c.title}
                          </h3>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          {c.status === 'AWAITING_RESPONSE' && (
                            <Link to="/student/responses" className="cx-btn cx-btn-teal cx-btn-sm text-decoration-none">
                              <span>Respond</span>
                            </Link>
                          )}
                          <Link to={`/cases/${c.id}`} className="cx-btn cx-btn-outline cx-btn-sm text-decoration-none">
                            <Eye size={13} />
                          </Link>
                        </div>
                      </div>

                      <div className="p-2 bg-light rounded text-muted small d-flex align-items-center gap-1.5" style={{ fontSize: '0.72rem' }}>
                        <Info size={13} className="text-primary flex-shrink-0" />
                        <span><strong>Next Step:</strong> {c.investigation?.nextAction || 'Under committee review.'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Hearings & Notifications */}
        <div className="col-12 col-lg-5">
          <UpcomingScheduleList
            items={studentHearings}
            title="Scheduled Hearings & Summons"
            subtitle="Upcoming committee appearances"
            viewAllLink="/student/notifications"
            type="hearings"
            emptyMessage="No hearings scheduled for your account."
          />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
