import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Users,
  FileCheck,
  FileText,
  UserPlus,
  ShieldAlert,
  BarChart3,
  Layers,
} from 'lucide-react';
import RoleDashboardHeader from '../../components/dashboard/RoleDashboardHeader';
import DashboardMetricCard from '../../components/dashboard/DashboardMetricCard';
import RecentActivityList from '../../components/dashboard/RecentActivityList';
import CaseSummaryTable from '../../components/dashboard/CaseSummaryTable';
import QuickActionsPanel from '../../components/dashboard/QuickActionsPanel';
import ChartCard from '../../components/data-display/ChartCard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import caseService from '../../services/caseService';

export const SuperAdminDashboard = ({ onInspectCase = null }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [stats, setStats] = useState(null);
  const [cases, setCases] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, casesData] = await Promise.all([
        caseService.getCaseStats(),
        caseService.getCases({ pageSize: 20 }),
      ]);
      setStats(statsData);
      setCases(casesData.items || []);

      // Extract system audit activities
      const acts = [];
      (casesData.items || []).forEach((c) => {
        (c.activities || []).forEach((a) => {
          acts.push({
            ...a,
            caseId: c.id,
            caseNumber: c.caseNumber,
          });
        });
      });
      acts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setActivities(acts);
    } catch (err) {
      console.error('SuperAdminDashboard load failed', err);
      toast.error('Failed to load administrative analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter cases when category is clicked
  const filteredCases = useMemo(() => {
    if (activeCategoryFilter === 'ALL') return cases;
    return cases.filter(
      (c) =>
        c.category === activeCategoryFilter ||
        c.categoryKey === activeCategoryFilter
    );
  }, [cases, activeCategoryFilter]);

  // Unique registered students involved in cases or active roster
  const totalStudentsCount = useMemo(() => {
    const studentRolls = new Set(cases.map((c) => c.student?.rollNo || c.student?.name).filter(Boolean));
    return studentRolls.size;
  }, [cases]);

  // Chart data
  const categoryChartData = useMemo(() => {
    if (!stats || !stats.categoryDistribution) return { labels: [], datasets: [] };
    const labels = Object.keys(stats.categoryDistribution);
    const dataValues = Object.values(stats.categoryDistribution);
    return {
      labels,
      datasets: [
        {
          label: 'Registered Incidents',
          data: dataValues,
          backgroundColor: [
            '#0F766E', // teal
            '#2563EB', // blue
            '#F59E0B', // amber
            '#EF4444', // red
            '#8B5CF6', // purple
            '#64748B', // slate
            '#10B981', // emerald
          ],
          borderWidth: 2,
          borderColor: '#FFFFFF',
        },
      ],
    };
  }, [stats]);

  const statusChartData = useMemo(() => {
    if (!stats || !stats.statusDistribution) return { labels: [], datasets: [] };
    const labels = Object.keys(stats.statusDistribution);
    const dataValues = Object.values(stats.statusDistribution);
    return {
      labels,
      datasets: [
        {
          label: 'Cases in Stage',
          data: dataValues,
          backgroundColor: '#1E293B',
          borderRadius: 6,
        },
      ],
    };
  }, [stats]);

  // Handle chart click to filter
  const handleChartElementClick = (categoryLabel) => {
    if (categoryLabel) {
      setActiveCategoryFilter((prev) => (prev === categoryLabel ? 'ALL' : categoryLabel));
      toast.info(`Filtered view by category: ${categoryLabel}`);
    }
  };

  const quickActions = [
    {
      label: 'Create Case',
      icon: FolderKanban,
      to: '/cases/create',
      color: 'var(--cx-teal-700)',
      description: 'Log new incident docket',
      featured: true,
    },
    {
      label: 'User Directory',
      icon: UserPlus,
      to: '/admin/users',
      color: '#2563EB',
      description: 'Manage accounts & roles',
    },
    {
      label: 'Export Reports',
      icon: BarChart3,
      to: '/reports',
      color: '#7C3AED',
      description: 'Institutional analytics',
    },
    {
      label: 'Conduct Policies',
      icon: FileText,
      to: '/policies',
      color: '#059669',
      description: 'Review statutory rules',
    },
  ];

  return (
    <div>
      {/* Header */}
      <RoleDashboardHeader
        user={currentUser}
        title="Institutional Conduct & Support Overview"
        subtitle={`Global Governance Console — ${currentUser?.name || 'Super Admin'}`}
        statusPills={[
          { label: 'Campus-wide Cases', value: stats?.total || 0, variant: 'primary', icon: FolderKanban },
          { label: 'Active Inquiries', value: stats?.active || 0, variant: 'warning', icon: Clock },
          { label: 'Registered Students', value: totalStudentsCount, variant: 'teal', icon: Users },
          { label: 'Resolved Matters', value: stats?.resolved || 0, variant: 'success', icon: CheckCircle2 },
        ]}
      />

      {/* KPI Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Total University Cases"
            value={stats ? stats.total : '—'}
            subtitle="Campus-wide incident records"
            trend={{ value: 'Full university scope', isPositive: true }}
            icon={FolderKanban}
            variant="default"
            onClick={() => setActiveCategoryFilter('ALL')}
            isActive={activeCategoryFilter === 'ALL'}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Active Investigations"
            value={stats ? stats.active : '—'}
            subtitle="Under review or hearing"
            trend={{ value: `${stats?.underReview || 0} urgent reviews`, isPositive: false }}
            icon={Clock}
            variant="warning"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Verification Backlog"
            value={stats ? stats.pendingVerification ?? 0 : '—'}
            subtitle="Pending Dean or HOD sign-off"
            trend={{ value: 'Action required', isPositive: false }}
            icon={FileCheck}
            variant="danger"
            onClick={() => navigate('/dean/verification')}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Total Enrolled Students"
            value={totalStudentsCount}
            subtitle="Active student directory"
            trend={{ value: `${totalStudentsCount} student records`, isPositive: true }}
            icon={Users}
            variant="teal"
          />
        </div>
      </div>

      {/* Quick Actions Panel */}
      <QuickActionsPanel
        actions={quickActions}
        title="Super Admin Quick Actions"
        subtitle="Global platform provisioning, user governance, and case management"
      />

      {/* Interactive Charts with Filter Capability */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-5">
          <div className="position-relative">
            <ChartCard
              title="University Incident Distribution"
              subtitle="Breakdown by conduct, exam, and safety categories (Click segment to filter)"
              type="doughnut"
              data={categoryChartData}
              height={260}
            />
            {activeCategoryFilter !== 'ALL' && (
              <div className="p-2 bg-light border-top text-center">
                <span className="small text-teal fw-medium me-2">Filtered: {activeCategoryFilter}</span>
                <button
                  type="button"
                  onClick={() => setActiveCategoryFilter('ALL')}
                  className="btn btn-link btn-sm p-0 text-decoration-none"
                >
                  Clear Filter
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="col-12 col-lg-7">
          <ChartCard
            title="Workflow Stage Distribution"
            subtitle="Real-time progression through verification, hearings, and resolution"
            type="bar"
            data={statusChartData}
            height={260}
          />
        </div>
      </div>

      {/* 2-Column: Case Summary & Audit Log Feed */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-xl-8">
          <CaseSummaryTable
            cases={filteredCases}
            title={activeCategoryFilter !== 'ALL' ? `Filtered Cases: ${activeCategoryFilter}` : 'University-wide Case Registry'}
            subtitle="Direct administrative docket access"
            viewAllLink="/cases"
            onInspectCase={onInspectCase}
          />
        </div>
        <div className="col-12 col-xl-4">
          <RecentActivityList
            activities={activities}
            title="System Activity Feed"
            subtitle="Recent administrative events and case activity"
            maxItems={6}
            viewAllLink="/cases"
          />
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
