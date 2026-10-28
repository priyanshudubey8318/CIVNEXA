import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  FileCheck,
  ShieldAlert,
  Calendar,
  Eye,
  QrCode,
  Plus,
} from 'lucide-react';
import RoleDashboardHeader from '../../components/dashboard/RoleDashboardHeader';
import DashboardMetricCard from '../../components/dashboard/DashboardMetricCard';
import RecentActivityList from '../../components/dashboard/RecentActivityList';
import QuickActionsPanel from '../../components/dashboard/QuickActionsPanel';
import ChartCard from '../../components/data-display/ChartCard';
import DataTable from '../../components/data-display/DataTable';
import Pagination from '../../components/data-display/Pagination';
import Tabs from '../../components/data-display/Tabs';
import FileUploader from '../../components/forms/FileUploader';
import SearchBar from '../../components/forms/SearchBar';
import FilterPanel from '../../components/forms/FilterPanel';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import caseService from '../../services/caseService';

export const DeanDashboard = ({
  onInspectCase = null,
  onSimulateQr = null,
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('cases'); // 'cases', 'showcase', 'uploader'
  const [stats, setStats] = useState(null);
  const [casesData, setCasesData] = useState({ items: [], total: 0, page: 1, totalPages: 1 });
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & search states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedStats, fetchedCases] = await Promise.all([
        caseService.getCaseStats(),
        caseService.getCases({
          search: searchQuery,
          category: categoryFilter,
          status: statusFilter,
          priority: priorityFilter,
          page: currentPage,
          pageSize: 6,
        }),
      ]);
      setStats(fetchedStats);
      setCasesData(fetchedCases);

      // Extract activities
      const acts = [];
      (fetchedCases.items || []).forEach((c) => {
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
      console.error('DeanDashboard load error', err);
      toast.error('Failed to load Dean institutional data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, categoryFilter, statusFilter, priorityFilter, currentPage]);

  // Chart data
  const categoryChartData = useMemo(() => {
    if (!stats || !stats.categoryDistribution) return { labels: [], datasets: [] };
    const labels = Object.keys(stats.categoryDistribution);
    const dataValues = Object.values(stats.categoryDistribution);
    return {
      labels,
      datasets: [
        {
          label: 'Active Cases',
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
          label: 'Number of Cases',
          data: dataValues,
          backgroundColor: '#1E293B',
          borderRadius: 6,
        },
      ],
    };
  }, [stats]);

  const quickActions = [
    {
      label: 'Review Verification Queue',
      icon: FileCheck,
      to: '/dean/verification',
      color: 'var(--cx-teal-700)',
      description: 'Approve pending case filings',
      badge: stats?.pendingVerification ? `${stats.pendingVerification} Pending` : null,
      featured: true,
    },
    {
      label: 'Escalation Center',
      icon: ShieldAlert,
      to: '/dean/escalations',
      color: '#DC2626',
      description: 'High-priority & statutory matters',
    },
    {
      label: 'Schedule Hearing',
      icon: Calendar,
      to: '/committee/calendar',
      color: '#2563EB',
      description: 'Proctorial board sessions',
    },
    {
      label: 'Student 360 View',
      icon: Shield,
      to: '/hod/student-360',
      color: '#7C3AED',
      description: 'Dossier lookup & history',
    },
  ];

  // Table columns for compatibility
  const tableColumns = [
    {
      key: 'caseNumber',
      title: 'Case Ref',
      sortable: true,
      width: '130px',
      render: (val, row) => (
        <div className="d-flex align-items-center gap-1.5">
          <span className="cx-font-mono fw-bold" style={{ color: 'var(--cx-teal-700)', fontSize: '0.8125rem' }}>
            {val}
          </span>
          {row.isConfidential && (
            <span
              className="badge"
              style={{
                fontSize: '0.65rem',
                backgroundColor: 'var(--cx-confidential-bg)',
                color: 'var(--cx-confidential-text)',
                border: '1px solid var(--cx-confidential-border)',
              }}
              title="Restricted / Confidential Case"
            >
              Restricted
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'title',
      title: 'Incident Summary',
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '280px', fontSize: '0.85rem' }}>
            {val}
          </div>
          <div className="text-muted small d-flex align-items-center gap-2 mt-0.5">
            <span>{row.category}</span>
            <span>•</span>
            <span>{row.departmentCode}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'student',
      title: 'Subject Student',
      sortable: false,
      render: (val) => (
        <div>
          <div className="fw-semibold text-dark" style={{ fontSize: '0.8125rem' }}>
            {val?.name || 'Unassigned'}
          </div>
          <div className="cx-font-mono text-muted" style={{ fontSize: '0.72rem' }}>
            {val?.rollNo || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Workflow Stage',
      sortable: true,
      render: (val) => <StatusBadge status={val} size="sm" />,
    },
    {
      key: 'priority',
      title: 'Severity',
      sortable: true,
      render: (val) => <PriorityBadge priority={val} size="sm" />,
    },
    {
      key: 'actions',
      title: 'Action',
      sortable: false,
      align: 'right',
      render: (_, row) => (
        <button
          type="button"
          onClick={() => onInspectCase && onInspectCase(row)}
          className="cx-btn cx-btn-outline cx-btn-sm py-1 px-2.5"
          title="Inspect Case"
        >
          <Eye size={13} />
          <span>Inspect</span>
        </button>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <RoleDashboardHeader
        user={currentUser}
        title="Institutional Conduct & Support Overview"
        subtitle="Real-time case intelligence, verification pipelines, and departmental metrics."
        statusPills={[
          { label: 'Dean Verification Queue', value: stats?.pendingVerification ?? 0, variant: 'danger', icon: FileCheck },
          { label: 'Active Inquiries', value: stats?.active || 0, variant: 'warning', icon: Clock },
          { label: 'Critical Escalations', value: stats?.critical || 0, variant: 'danger', icon: AlertTriangle },
          { label: 'Compliant Resolutions', value: stats?.resolved || 0, variant: 'teal', icon: CheckCircle2 },
        ]}
        actions={
          <div className="d-flex align-items-center gap-2">
            {onSimulateQr && (
              <button
                type="button"
                onClick={onSimulateQr}
                className="cx-btn cx-btn-outline"
                title="Verify student credential (QR student verification)"
              >
                <QrCode size={16} />
                <span>Verify QR Credential</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/cases/create')}
              className="cx-btn cx-btn-teal"
            >
              <Plus size={16} />
              <span>Report Incident</span>
            </button>
          </div>
        }
      />

      {/* KPI Stat Cards (Maintains exact labels for FE-1 backwards compatibility) */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Total Registered Cases"
            value={stats ? stats.total : '—'}
            subtitle="Campus-wide records"
            trend={{ value: '+4 this month', isPositive: false }}
            icon={FolderKanban}
            variant="default"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Active / In-Review"
            value={stats ? stats.active : '—'}
            subtitle="Pending hearing or review"
            trend={{ value: `${stats?.underReview || 0} urgent review`, isPositive: true }}
            icon={Clock}
            variant="warning"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Critical Priority"
            value={stats ? stats.critical : '—'}
            subtitle="Immediate action required"
            trend={{ value: 'Elevated protocol', isPositive: false }}
            icon={AlertTriangle}
            variant="danger"
            onClick={() => navigate('/dean/escalations')}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Resolved & Closed"
            value={stats ? stats.resolved : '—'}
            subtitle="Completed cases"
            trend={{ value: `${stats?.resolved || 0} cases closed`, isPositive: true }}
            icon={CheckCircle2}
            variant="teal"
          />
        </div>
      </div>

      {/* Quick Actions Panel */}
      <QuickActionsPanel
        actions={quickActions}
        title="Dean Governance Shortcuts"
        subtitle="Verification queues, committee calendars, and sensitive escalations"
      />

      {/* Analytics Visualizations */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-5">
          <ChartCard
            title="Incident Distribution by Category"
            subtitle="Categorical breakdown across conduct, exams, and grievances"
            type="doughnut"
            data={categoryChartData}
            height={260}
          />
        </div>
        <div className="col-12 col-lg-7">
          <ChartCard
            title="Workflow Pipeline by Status"
            subtitle="Distribution of cases progressing through verification stages"
            type="bar"
            data={statusChartData}
            height={260}
          />
        </div>
      </div>

      {/* Active Case Registry & Workspaces (Tabs) */}
      <div className="cx-card mb-4 border-0 shadow-sm">
        <div className="cx-card-header p-3 border-bottom d-flex align-items-center justify-content-between">
          <Tabs
            tabs={[
              { id: 'cases', label: 'Active Case Registry', count: casesData.total },
              { id: 'showcase', label: 'Design System & Controls' },
              { id: 'uploader', label: 'Evidence Uploader' },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {activeTab === 'cases' && (
          <div className="cx-card-body p-0">
            <div className="p-3 border-bottom bg-light bg-opacity-50 d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center justify-content-between gap-3">
              <SearchBar
                value={searchQuery}
                onChange={(q) => {
                  setSearchQuery(q);
                  setCurrentPage(1);
                }}
                onClear={() => setSearchQuery('')}
                placeholder="Search by case ref, student, department..."
              />
              <FilterPanel
                selectedCategory={categoryFilter}
                selectedStatus={statusFilter}
                selectedPriority={priorityFilter}
                onCategoryChange={(val) => {
                  setCategoryFilter(val);
                  setCurrentPage(1);
                }}
                onStatusChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
                onPriorityChange={(val) => {
                  setPriorityFilter(val);
                  setCurrentPage(1);
                }}
                onReset={() => {
                  setCategoryFilter('ALL');
                  setStatusFilter('ALL');
                  setPriorityFilter('ALL');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
              />
            </div>

            <DataTable
              columns={tableColumns}
              data={casesData.items}
              isLoading={isLoading}
              emptyMessage="No cases match the selected filter criteria."
            />

            <Pagination
              currentPage={casesData.page}
              totalPages={casesData.totalPages}
              totalItems={casesData.total}
              pageSize={6}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {activeTab === 'showcase' && (
          <div className="cx-card-body p-4">
            <h2 className="h6 fw-bold mb-2 text-dark">CIVNEXA Design System & Component Library</h2>
            <p className="text-muted small">
              Enterprise component library built with navy/teal foundation, restrained semantic palettes, strict contrast, and subtle micro-animations.
            </p>
          </div>
        )}

        {activeTab === 'uploader' && (
          <div className="cx-card-body p-4">
            <div className="mb-3">
              <h2 className="h6 fw-bold mb-1 text-dark">Secure Evidence & Document Attachment Pipeline</h2>
              <p className="text-muted small">
                Client-side validation with format filters, file size enforcement, drag-and-drop preview, and cancellation.
              </p>
            </div>
            <div style={{ maxWidth: '640px' }}>
              <FileUploader
                onFilesSelected={(files) => {
                  toast.success(`Attached ${files.length} document(s) to case staging buffer.`);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeanDashboard;
