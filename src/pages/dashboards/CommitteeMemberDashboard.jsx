import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gavel,
  Calendar,
  FolderLock,
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
} from 'lucide-react';
import RoleDashboardHeader from '../../components/dashboard/RoleDashboardHeader';
import DashboardMetricCard from '../../components/dashboard/DashboardMetricCard';
import UpcomingScheduleList from '../../components/dashboard/UpcomingScheduleList';
import CaseSummaryTable from '../../components/dashboard/CaseSummaryTable';
import QuickActionsPanel from '../../components/dashboard/QuickActionsPanel';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import committeeService from '../../services/committeeService';
import hearingService from '../../services/hearingService';
import evidenceService from '../../services/evidenceService';

export const CommitteeMemberDashboard = ({ onInspectCase = null }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [metrics, setMetrics] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [hearings, setHearings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCommitteeData = async () => {
      setIsLoading(true);
      try {
        const [cMetrics, rQueue, hList] = await Promise.all([
          committeeService.getCommitteeMetrics(currentUser),
          committeeService.getReviewQueue({ currentUser }),
          hearingService.getHearings({ currentUser }),
        ]);

        setMetrics(cMetrics);
        setReviews(rQueue);
        setHearings(hList);
      } catch (err) {
        console.error('Committee dashboard load failed', err);
        toast.error('Failed to load committee workspace metrics.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCommitteeData();
  }, [currentUser]);

  const upcomingHearings = hearings.filter(
    (h) => h.status === 'SCHEDULED' || h.status === 'RESCHEDULED'
  );

  const quickActions = [
    {
      label: 'Deliberation Queue',
      icon: Gavel,
      to: '/committee/reviews',
      color: 'var(--cx-teal-700)',
      description: 'Review assigned proctorial dockets',
      featured: true,
      badge: metrics?.awaitingReview ? `${metrics.awaitingReview} Action` : null,
    },
    {
      label: 'Evidence Vault',
      icon: FolderLock,
      to: '/committee/evidence',
      color: '#DC2626',
      description: 'Tamper-evident chain of custody',
    },
    {
      label: 'Hearing Calendar',
      icon: Calendar,
      to: '/committee/calendar',
      color: '#2563EB',
      description: 'Scheduled board sessions',
    },
    {
      label: 'Submit Recommendation',
      icon: FileCheck2,
      to: '/committee/reviews',
      color: '#059669',
      description: 'Formal sanction proposals',
    },
  ];

  return (
    <div>
      <RoleDashboardHeader
        user={currentUser}
        title={`Disciplinary Committee & Proctorial Board — ${currentUser?.name || 'Committee Member'}`}
        statusPills={[
          { label: 'Assigned to Committee', value: reviews.length, variant: 'primary', icon: Gavel },
          { label: 'Upcoming Hearings', value: upcomingHearings.length, variant: 'warning', icon: Calendar },
          { label: 'Evidence Awaiting Review', value: metrics?.flaggedEvidence ?? 0, variant: 'danger', icon: FolderLock },
          { label: 'Drafted Recommendations', value: metrics?.pendingRecommendations || 0, variant: 'teal', icon: FileCheck2 },
        ]}
      />

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Cases Assigned to Committee"
            value={reviews.length}
            subtitle="Active board dockets"
            trend={{ value: `${metrics?.underReview || 0} under active review`, isPositive: true }}
            icon={Gavel}
            variant="default"
            onClick={() => navigate('/committee/reviews')}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Upcoming Hearings"
            value={upcomingHearings.length}
            subtitle="Scheduled sessions"
            trend={{ value: 'Calendar confirmed', isPositive: true }}
            icon={Calendar}
            variant="warning"
            onClick={() => navigate('/committee/calendar')}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Evidence Vault Records"
            value={metrics ? metrics.flaggedEvidence ?? 0 : '—'}
            subtitle="Flagged or awaiting verification"
            trend={{ value: 'Chain of custody verified', isPositive: true }}
            icon={FolderLock}
            variant="danger"
            onClick={() => navigate('/committee/evidence')}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Recommendations Drafted"
            value={metrics ? metrics.pendingRecommendations : '—'}
            subtitle="Sanction drafts for Dean sign-off"
            trend={{ value: 'Proctorial deliberations', isPositive: true }}
            icon={FileCheck2}
            variant="teal"
            onClick={() => navigate('/committee/reviews')}
          />
        </div>
      </div>

      {/* Quick Actions Panel */}
      <QuickActionsPanel
        actions={quickActions}
        title="Committee Member Quick Actions"
        subtitle="Evaluate evidence, conduct hearing proceedings, and draft formal sanction proposals"
      />

      {/* 2-Column: Upcoming Hearings & Active Reviews */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-6">
          <UpcomingScheduleList
            items={upcomingHearings}
            title="Proctorial Hearings Scheduled"
            subtitle="Hearing calendar and scheduled student appearances"
            viewAllLink="/committee/calendar"
            type="hearings"
          />
        </div>
        <div className="col-12 col-lg-6">
          <CaseSummaryTable
            cases={reviews}
            title="Active Committee Review Queue"
            subtitle="Assigned disciplinary cases requiring deliberation"
            viewAllLink="/committee/reviews"
            onInspectCase={onInspectCase}
          />
        </div>
      </div>
    </div>
  );
};

export default CommitteeMemberDashboard;
