import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartHandshake,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Users,
  FileText,
  UserCheck,
} from 'lucide-react';
import RoleDashboardHeader from '../../components/dashboard/RoleDashboardHeader';
import DashboardMetricCard from '../../components/dashboard/DashboardMetricCard';
import UpcomingScheduleList from '../../components/dashboard/UpcomingScheduleList';
import RecentActivityList from '../../components/dashboard/RecentActivityList';
import QuickActionsPanel from '../../components/dashboard/QuickActionsPanel';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import counselingService from '../../services/counselingService';

export const CoordinatorDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [metrics, setMetrics] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCoordinatorData = async () => {
      setIsLoading(true);
      try {
        const [cMetrics, refList] = await Promise.all([
          counselingService.getCounselingMetrics(),
          counselingService.getReferrals({ currentUser }),
        ]);

        setMetrics(cMetrics);
        setReferrals(refList);

        // Extract upcoming scheduled sessions
        const scheduled = [];
        refList.forEach((r) => {
          (r.sessions || []).forEach((s) => {
            if (s.attendanceStatus === 'SCHEDULED' || s.sessionStatus === 'SCHEDULED') {
              scheduled.push({
                ...s,
                studentName: r.studentName,
                studentRoll: r.studentRoll,
                caseId: r.caseId,
                caseNumber: r.caseNumber,
              });
            }
          });
        });
        setUpcomingSessions(scheduled);

        // Welfare follow-up activities
        const acts = [];
        refList.forEach((r) => {
          (r.followups || []).forEach((f) => {
            acts.push({
              id: f.id,
              action: f.status === 'COMPLETED' ? 'Welfare Follow-up Completed' : 'Pending Welfare Follow-up',
              title: f.objective,
              description: `Student: ${r.studentName} (${r.studentRoll}). Target Date: ${f.date}. Outcome: ${f.outcome || 'Pending check-in.'}`,
              timestamp: f.completedAt || r.referralDate,
              actor: r.counselor,
              caseId: r.caseId,
            });
          });
        });
        acts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setActivities(acts);
      } catch (err) {
        console.error('Coordinator dashboard load failed', err);
        toast.error('Failed to load counseling metrics.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCoordinatorData();
  }, [currentUser]);

  const quickActions = [
    {
      label: 'Schedule Session',
      icon: Calendar,
      to: '/counseling/sessions',
      color: 'var(--cx-teal-700)',
      description: 'Book counseling appointment',
      featured: true,
    },
    {
      label: 'Log Referral Intake',
      icon: Plus,
      to: '/counseling',
      color: '#2563EB',
      description: 'Register student welfare case',
    },
    {
      label: 'Welfare Follow-ups',
      icon: Clock,
      to: '/counseling/followups',
      color: '#F59E0B',
      description: 'Review post-hearing check-ins',
      badge: metrics?.pendingFollowups ? `${metrics.pendingFollowups} Pending` : null,
    },
    {
      label: 'Assigned Cohort',
      icon: Users,
      to: '/coordinator/students',
      color: '#7C3AED',
      description: 'Mentorship cohort directory',
    },
  ];

  return (
    <div>
      <RoleDashboardHeader
        user={currentUser}
        title={`Student Counseling & Mentorship Desk — ${currentUser?.name || 'Counseling Psychologist'}`}
        statusPills={[
          { label: 'Active Referrals', value: metrics?.activeReferrals || 0, variant: 'primary', icon: HeartHandshake },
          { label: 'Upcoming Sessions', value: metrics?.scheduledSessions || upcomingSessions.length, variant: 'teal', icon: Calendar },
          { label: 'Pending Follow-ups', value: metrics?.pendingFollowups || 0, variant: 'warning', icon: Clock },
          { label: 'At-Risk Monitoring', value: metrics?.atRiskCount || 0, variant: 'danger', icon: AlertTriangle },
        ]}
      />

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Active Counseling Referrals"
            value={metrics ? metrics.activeReferrals : '—'}
            subtitle="Students in active support"
            trend={{ value: 'Proctorial & self-intakes', isPositive: true }}
            icon={HeartHandshake}
            variant="teal"
            onClick={() => navigate('/counseling')}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Scheduled Sessions"
            value={metrics ? metrics.scheduledSessions : upcomingSessions.length}
            subtitle="Appointments this week"
            trend={{ value: 'Calendar confirmed', isPositive: true }}
            icon={Calendar}
            variant="primary"
            onClick={() => navigate('/counseling/sessions')}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Pending Welfare Follow-ups"
            value={metrics ? metrics.pendingFollowups : '—'}
            subtitle="Post-session check-ins"
            trend={{ value: 'Monitoring required', isPositive: false }}
            icon={Clock}
            variant="warning"
            onClick={() => navigate('/counseling/followups')}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="At-Risk Priority Students"
            value={metrics ? metrics.atRiskCount : '—'}
            subtitle="Elevated welfare protocol"
            trend={{ value: 'Urgent wellbeing monitoring', isPositive: false }}
            icon={AlertTriangle}
            variant="danger"
          />
        </div>
      </div>

      {/* Quick Actions Panel */}
      <QuickActionsPanel
        actions={quickActions}
        title="Welfare & Counseling Quick Actions"
        subtitle="Manage appointments, post-session follow-ups, and student mentoring cohorts"
      />

      {/* 2-Column: Upcoming Sessions & Follow-up Log */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-7">
          <UpcomingScheduleList
            items={upcomingSessions}
            title="Upcoming Counseling Appointments"
            subtitle="Scheduled behavioral support and reflective mentorship sessions"
            viewAllLink="/counseling/sessions"
            type="counseling"
          />
        </div>
        <div className="col-12 col-lg-5">
          <RecentActivityList
            activities={activities}
            title="Welfare Monitoring Log"
            subtitle="Recent follow-up check-ins and counselor notes"
            maxItems={5}
            viewAllLink="/counseling/followups"
          />
        </div>
      </div>
    </div>
  );
};

export default CoordinatorDashboard;
