import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Search,
  Filter,
  Plus,
  QrCode,
  FileCheck,
  Eye,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import AnimatedPage from '../components/common/AnimatedPage';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/data-display/StatCard';
import ChartCard from '../components/data-display/ChartCard';
import DataTable from '../components/data-display/DataTable';
import Pagination from '../components/data-display/Pagination';
import Tabs from '../components/data-display/Tabs';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import SearchBar from '../components/forms/SearchBar';
import FilterPanel from '../components/forms/FilterPanel';
import Modal from '../components/feedback/Modal';
import ConfirmDialog from '../components/feedback/ConfirmDialog';
import FileUploader from '../components/forms/FileUploader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import caseService from '../services/caseService';
import { staggerContainerVariants, staggerItemVariants } from '../animations/motionVariants';

// Role Dashboards (Phase FE-5)
import SuperAdminDashboard from './dashboards/SuperAdminDashboard';
import DeanDashboard from './dashboards/DeanDashboard';
import HodDashboard from './dashboards/HodDashboard';
import FacultyDashboard from './dashboards/FacultyDashboard';
import StaffDashboard from './dashboards/StaffDashboard';
import CoordinatorDashboard from './dashboards/CoordinatorDashboard';
import CommitteeMemberDashboard from './dashboards/CommitteeMemberDashboard';
import StudentDashboard from './dashboards/StudentDashboard';

/**
 * OverviewDemoPage Component
 * Primary Initial Demonstration Screen for CIVNEXA Phase FE-1.
 * Integrates dynamic datasets, reactive KPI metrics, responsive charts,
 * searchable/sortable data table, detailed inspection modal, and interactive design system showcase.
 */
export const OverviewDemoPage = () => {
  const { currentRole, currentUser } = useAuth();
  const toast = useToast();

  // View mode: 'role_dashboard' (default) or 'legacy_showcase' (FE-1 demo)
  const [viewMode, setViewMode] = useState('role_dashboard');

  // State
  const [activeTab, setActiveTab] = useState('cases'); // 'cases', 'showcase', 'uploader', 'qr'
  const [stats, setStats] = useState(null);
  const [casesData, setCasesData] = useState({ items: [], total: 0, page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal inspection state
  const [selectedCase, setSelectedCase] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrScannedStudent, setQrScannedStudent] = useState(null);
  const [qrSearchInput, setQrSearchInput] = useState('');
  const [qrLookupError, setQrLookupError] = useState('');

  const cases = casesData?.items || [];

  // Render role dashboard based on active persona
  const renderRoleDashboard = () => {
    const roleKey = currentUser?.role;
    switch (roleKey) {
      case 'SUPER_ADMIN':
        return <SuperAdminDashboard onInspectCase={(c) => { setSelectedCase(c); setIsDetailModalOpen(true); }} />;
      case 'DEAN':
        return (
          <DeanDashboard
            onInspectCase={(c) => { setSelectedCase(c); setIsDetailModalOpen(true); }}
            onSimulateQr={handleSimulateQrScan}
          />
        );
      case 'HOD':
        return <HodDashboard onInspectCase={(c) => { setSelectedCase(c); setIsDetailModalOpen(true); }} />;
      case 'FACULTY':
        return <FacultyDashboard onInspectCase={(c) => { setSelectedCase(c); setIsDetailModalOpen(true); }} />;
      case 'STAFF':
        return <StaffDashboard onInspectCase={(c) => { setSelectedCase(c); setIsDetailModalOpen(true); }} />;
      case 'COORDINATOR':
        return <CoordinatorDashboard />;
      case 'COMMITTEE_MEMBER':
        return <CommitteeMemberDashboard onInspectCase={(c) => { setSelectedCase(c); setIsDetailModalOpen(true); }} />;
      case 'STUDENT':
        return <StudentDashboard onInspectCase={(c) => { setSelectedCase(c); setIsDetailModalOpen(true); }} />;
      default:
        return (
          <DeanDashboard
            onInspectCase={(c) => { setSelectedCase(c); setIsDetailModalOpen(true); }}
            onSimulateQr={handleSimulateQrScan}
          />
        );
    }
  };

  // Fetch stats and cases from modular service
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
    } catch (err) {
      toast.error('Failed to load case data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, categoryFilter, statusFilter, priorityFilter, currentPage]);

  // Handle case status update
  const handleInitiateStatusChange = (newStatus, newStatusLabel) => {
    setPendingStatusUpdate({ newStatus, newStatusLabel });
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedCase || !pendingStatusUpdate) return;
    try {
      const updated = await caseService.updateCaseStatus(
        selectedCase.id,
        pendingStatusUpdate.newStatus,
        pendingStatusUpdate.newStatusLabel
      );
      setSelectedCase(updated);
      setIsConfirmDialogOpen(false);
      setPendingStatusUpdate(null);
      toast.success(`Case ${updated.caseNumber} status updated to ${updated.statusLabel}`);
      loadData();
    } catch (err) {
      toast.error('Failed to update case status');
    }
  };

  // Reset demo mock data
  const handleResetData = () => {
    caseService.resetMockData();
    setSearchQuery('');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setCurrentPage(1);
    toast.info('Demonstration datasets reset to initial clean state.');
    loadData();
  };

  // QR scan verification
  const handleSimulateQrScan = (studentOrEvent = null) => {
    setIsQrModalOpen(true);
    setQrLookupError('');

    // If a click event object was passed by onClick, disregard it as a student argument
    const explicitStudent =
      studentOrEvent && typeof studentOrEvent.preventDefault !== 'function' && !studentOrEvent.nativeEvent
        ? studentOrEvent
        : null;

    const activeCases = cases.length > 0 ? cases : (caseService.getCurrentCasesSync ? caseService.getCurrentCasesSync() : []);

    // Resolve student: explicit argument -> selectedCase student -> first registered case student
    const studentToVerify =
      explicitStudent?.student ||
      (explicitStudent && (explicitStudent.name || explicitStudent.rollNo) ? explicitStudent : null) ||
      selectedCase?.student ||
      (activeCases.find((c) => c.student)?.student) ||
      (activeCases[0]?.student ? activeCases[0].student : null);

    if (studentToVerify && (studentToVerify.name || studentToVerify.rollNo)) {
      const studentRoll = studentToVerify.rollNo || '22CSE041';
      const studentName = studentToVerify.name || 'Enrolled Student';
      const studentDept = studentToVerify.department || 'Academic Department';

      // Dynamically calculate disciplinary status from actual case store
      const relatedCases = activeCases.filter(
        (c) => c.student?.rollNo === studentRoll || c.student?.name === studentName
      );

      const conductStatus =
        relatedCases.length > 0
          ? `${relatedCases.length} Registered Incident(s) on file (${relatedCases[0].status || 'Under Review'})`
          : 'Good Conduct Standing — No disciplinary infractions recorded';

      const lastIncidentSummary =
        relatedCases.length > 0
          ? `${relatedCases[0].caseNumber || relatedCases[0].id} (${relatedCases[0].title || relatedCases[0].category || 'Inquiry'})`
          : 'No recorded incidents';

      const deptCode = studentDept.split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase() || 'GEN';

      setQrScannedStudent({
        id: studentToVerify.id || `STU-${studentRoll}`,
        name: studentName,
        rollNo: studentRoll,
        department: studentDept,
        academicYear: studentToVerify.year || studentToVerify.course || studentToVerify.semester || 'Undergraduate Standing',
        status: 'Enrolled — Active Standing',
        hallTicket: studentToVerify.hallTicket || `HT-2026-${deptCode}-${studentRoll.slice(-3)}`,
        disciplinaryStatus: conductStatus,
        lastIncident: lastIncidentSummary,
        hasInfractions: relatedCases.length > 0,
      });
    } else {
      setQrScannedStudent(null);
    }
  };

  const handleManualQrLookup = (query) => {
    if (!query || !query.trim()) {
      setQrLookupError('Please enter a student name, roll number, or hall ticket.');
      return;
    }
    const q = query.trim().toLowerCase();
    const matchedCase = cases.find(
      (c) =>
        c.student?.rollNo?.toLowerCase().includes(q) ||
        c.student?.name?.toLowerCase().includes(q)
    );

    if (matchedCase && matchedCase.student) {
      handleSimulateQrScan(matchedCase.student);
      setQrLookupError('');
    } else {
      const rollClean = query.trim().toUpperCase();
      const syntheticStudent = {
        id: `STU-${rollClean}`,
        name: `Student (${rollClean})`,
        rollNo: rollClean,
        department: 'Academic Division',
        year: 'Enrolled Scholar',
      };
      handleSimulateQrScan(syntheticStudent);
      setQrLookupError('');
    }
  };

  // Chart Data preparation
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

  // Columns for DataTable
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
            {val.name}
          </div>
          <div className="cx-font-mono text-muted" style={{ fontSize: '0.72rem' }}>
            {val.rollNo}
          </div>
        </div>
      ),
    },
    {
      key: 'priority',
      title: 'Priority',
      sortable: true,
      width: '110px',
      render: (val) => <PriorityBadge priority={val} />,
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      width: '140px',
      render: (val, row) => <StatusBadge status={val} label={row.statusLabel} />,
    },
    {
      key: 'actions',
      title: 'Actions',
      sortable: false,
      width: '100px',
      render: (_, row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCase(row);
            setIsDetailModalOpen(true);
          }}
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
    <AnimatedPage>
      {/* Platform View Switcher */}
      <div className="d-flex align-items-center justify-content-between mb-3 px-1">
        <span className="badge bg-light text-secondary border px-2.5 py-1" style={{ fontSize: '0.72rem' }}>
          Active View: <strong>{viewMode === 'role_dashboard' ? `Role Dashboard (${currentUser?.roleLabel || currentUser?.role || 'Dean'})` : 'CIVNEXA Platform Overview'}</strong>
        </span>
        <button
          type="button"
          onClick={() => setViewMode(viewMode === 'role_dashboard' ? 'legacy_showcase' : 'role_dashboard')}
          className="btn btn-sm btn-outline-secondary py-1 px-2.5 d-inline-flex align-items-center gap-1.5"
          style={{ fontSize: '0.75rem' }}
        >
          <Layers size={13} />
          <span>{viewMode === 'role_dashboard' ? 'Switch to Full Platform Overview' : 'Switch to Dedicated Role Dashboard'}</span>
        </button>
      </div>

      {viewMode === 'role_dashboard' ? (
        renderRoleDashboard()
      ) : (
        <>
          {/* Page Header */}
          <PageHeader
            title="Institutional Conduct & Support Overview"
            subtitle="Campus case metrics, verification pipelines, and departmental summaries."
            breadcrumbs={[{ label: 'Dashboard' }, { label: 'Institutional Overview' }]}
            badge={
              <span className="badge bg-white border text-primary px-2.5 py-1" style={{ fontSize: '0.75rem' }}>
                Institutional Overview
              </span>
            }
            actions={
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  onClick={handleSimulateQrScan}
                  className="cx-btn cx-btn-outline"
                  title="Verify student credential (QR student verification)"
                >
                  <QrCode size={16} />
                  <span>Verify QR Credential</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.success('Incident reported successfully.');
                    loadData();
                  }}
                  className="cx-btn cx-btn-teal"
                >
                  <Plus size={16} />
                  <span>Report Incident</span>
                </button>
              </div>
            }
          />

      {/* KPI Stat Cards (Animated Stagger) */}
      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
        className="row g-3 mb-4"
      >
        <motion.div variants={staggerItemVariants} className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Total Registered Cases"
            value={stats ? stats.total : '—'}
            subtitle="Campus-wide records"
            trend={{ value: '+4 this month', isPositive: false }}
            icon={FolderKanban}
            variant="default"
          />
        </motion.div>
        <motion.div variants={staggerItemVariants} className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Active / In-Review"
            value={stats ? stats.active : '—'}
            subtitle="Pending hearing or review"
            trend={{ value: `${stats?.underReview || 0} urgent review`, isPositive: true }}
            icon={Clock}
            variant="warning"
          />
        </motion.div>
        <motion.div variants={staggerItemVariants} className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Critical Priority"
            value={stats ? stats.critical : '—'}
            subtitle="Immediate action required"
            trend={{ value: 'Elevated protocol', isPositive: false }}
            icon={AlertTriangle}
            variant="danger"
          />
        </motion.div>
        <motion.div variants={staggerItemVariants} className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Resolved & Closed"
            value={stats ? stats.resolved : '—'}
            subtitle="Resolution compliance met"
            trend={{ value: '94% on-time resolution', isPositive: true }}
            icon={CheckCircle2}
            variant="teal"
          />
        </motion.div>
      </motion.div>

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

      {/* Main Interactive Workspaces (Tabs) */}
      <div className="cx-card mb-4">
        <div className="cx-card-header d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
          <div>
            <Tabs
              tabs={[
                { id: 'cases', label: 'Active Case Registry', count: stats?.total || 8 },
                { id: 'showcase', label: 'Design System & Controls' },
                { id: 'uploader', label: 'Evidence Uploader Demo' },
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              onClick={handleResetData}
              className="cx-btn cx-btn-ghost cx-btn-sm text-muted"
              title="Reset demonstration data to default state"
            >
              <RefreshCw size={13} />
              <span>Reset Demonstration Store</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Live Case Registry */}
        {activeTab === 'cases' && (
          <div className="cx-card-body p-0">
            {/* Filter Bar */}
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
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Cases Table */}
            <DataTable
              columns={tableColumns}
              data={casesData.items}
              isLoading={isLoading}
              onRowClick={(row) => {
                setSelectedCase(row);
                setIsDetailModalOpen(true);
              }}
              emptyTitle="No matching cases found"
              emptyDescription="Try clearing filters or searching with a different case ID or student name."
              emptyAction={
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('ALL');
                    setStatusFilter('ALL');
                    setPriorityFilter('ALL');
                  }}
                  className="cx-btn cx-btn-primary cx-btn-sm"
                >
                  Clear All Filters
                </button>
              }
            />

            {/* Pagination */}
            <Pagination
              currentPage={casesData.page}
              totalPages={casesData.totalPages}
              totalItems={casesData.total}
              pageSize={casesData.pageSize}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        )}

        {/* Tab 2: Design System Showcase */}
        {activeTab === 'showcase' && (
          <div className="cx-card-body p-4">
            <div className="mb-4">
              <h2 className="h6 fw-bold mb-2 text-dark">CIVNEXA Design System & Component Library</h2>
              <p className="text-muted small">
                Enterprise component library built with navy/teal foundation, restrained semantic palettes,
                strict contrast, and subtle micro-animations.
              </p>
            </div>

            <div className="row g-4">
              {/* Buttons */}
              <div className="col-12 col-md-6">
                <div className="p-3 border rounded-3 bg-light">
                  <div className="fw-bold mb-3 small text-muted text-uppercase">Interactive Buttons</div>
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toast.success('Primary button clicked')}
                      className="cx-btn cx-btn-primary"
                    >
                      Primary Navy
                    </button>
                    <button
                      type="button"
                      onClick={() => toast.info('Teal accent button clicked')}
                      className="cx-btn cx-btn-teal"
                    >
                      Teal Accent
                    </button>
                    <button
                      type="button"
                      onClick={() => toast.warning('Outline button clicked')}
                      className="cx-btn cx-btn-outline"
                    >
                      Outline Surface
                    </button>
                    <button
                      type="button"
                      onClick={() => toast.error('Danger button action triggered')}
                      className="cx-btn cx-btn-danger"
                    >
                      Danger Action
                    </button>
                    <button
                      type="button"
                      onClick={() => toast.info('Ghost button pressed')}
                      className="cx-btn cx-btn-ghost"
                    >
                      Ghost Button
                    </button>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="col-12 col-md-6">
                <div className="p-3 border rounded-3 bg-light">
                  <div className="fw-bold mb-3 small text-muted text-uppercase">Status & Priority Badges</div>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <StatusBadge status="SUBMITTED" />
                    <StatusBadge status="UNDER_REVIEW" />
                    <StatusBadge status="INVESTIGATION" />
                    <StatusBadge status="HEARING_SCHEDULED" />
                    <StatusBadge status="RESOLVED" />
                    <StatusBadge status="APPEALED" />
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <PriorityBadge priority="CRITICAL" />
                    <PriorityBadge priority="HIGH" />
                    <PriorityBadge priority="MEDIUM" />
                    <PriorityBadge priority="LOW" />
                  </div>
                </div>
              </div>

              {/* Toast Trigger Demonstrations */}
              <div className="col-12 col-md-6">
                <div className="p-3 border rounded-3 bg-light">
                  <div className="fw-bold mb-3 small text-muted text-uppercase">Toast Notification Triggers</div>
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toast.success('Hearing schedule notified to appellant.', 'Notice Delivered')}
                      className="cx-btn cx-btn-sm cx-btn-outline"
                    >
                      Trigger Success Toast
                    </button>
                    <button
                      type="button"
                      onClick={() => toast.warning('Evidence upload exceeds recommended size.', 'Warning')}
                      className="cx-btn cx-btn-sm cx-btn-outline"
                    >
                      Trigger Warning Toast
                    </button>
                    <button
                      type="button"
                      onClick={() => toast.error('Action requires Dean level authorization.', 'Access Restricted')}
                      className="cx-btn cx-btn-sm cx-btn-outline"
                    >
                      Trigger Error Toast
                    </button>
                    <button
                      type="button"
                      onClick={() => toast.info('New examination invigilation incident submitted.', 'Case Update')}
                      className="cx-btn cx-btn-sm cx-btn-outline"
                    >
                      Trigger Info Toast
                    </button>
                  </div>
                </div>
              </div>

              {/* Dialog Triggers */}
              <div className="col-12 col-md-6">
                <div className="p-3 border rounded-3 bg-light">
                  <div className="fw-bold mb-3 small text-muted text-uppercase">Interactive Modals & Dialogs</div>
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCase(casesData.items[0]);
                        setIsDetailModalOpen(true);
                      }}
                      className="cx-btn cx-btn-sm cx-btn-primary"
                    >
                      Open Case Inspection Modal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCase(casesData.items[0]);
                        handleInitiateStatusChange('RESOLVED', 'Resolved');
                      }}
                      className="cx-btn cx-btn-sm cx-btn-outline"
                    >
                      Open Confirm Dialog
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Evidence Uploader Demo */}
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
      </>
      )}

      {/* Case Details Inspection Modal */}
      {selectedCase && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Case File: ${selectedCase.caseNumber}`}
          subtitle={`Reported on ${new Date(selectedCase.reportedAt).toLocaleDateString()} • ${selectedCase.category}`}
          maxWidth={680}
          footer={
            <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2 w-100">
              <div className="d-flex align-items-center gap-1.5">
                <span className="small text-muted">Update Workflow:</span>
                {selectedCase.status !== 'RESOLVED' ? (
                  <button
                    type="button"
                    onClick={() => handleInitiateStatusChange('RESOLVED', 'Resolved')}
                    className="cx-btn cx-btn-sm cx-btn-teal"
                  >
                    <CheckCircle2 size={13} />
                    <span>Mark as Resolved</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleInitiateStatusChange('UNDER_REVIEW', 'Under Review')}
                    className="cx-btn cx-btn-sm cx-btn-outline"
                  >
                    <span>Reopen Inquiry</span>
                  </button>
                )}
                {selectedCase.status !== 'HEARING_SCHEDULED' && (
                  <button
                    type="button"
                    onClick={() => handleInitiateStatusChange('HEARING_SCHEDULED', 'Hearing Scheduled')}
                    className="cx-btn cx-btn-sm cx-btn-outline"
                  >
                    <span>Schedule Hearing</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="cx-btn cx-btn-outline cx-btn-sm"
              >
                Close File
              </button>
            </div>
          }
        >
          <div className="d-flex flex-column gap-3">
            {/* Header info pills */}
            <div className="d-flex flex-wrap align-items-center justify-content-between p-3 rounded-2 bg-light border gap-2">
              <div className="d-flex align-items-center gap-2">
                <StatusBadge status={selectedCase.status} label={selectedCase.statusLabel} />
                <PriorityBadge priority={selectedCase.priority} />
              </div>
              {selectedCase.isConfidential && (
                <div
                  className="d-flex align-items-center gap-1.5 px-2 py-1 rounded text-purple"
                  style={{
                    backgroundColor: 'var(--cx-confidential-bg)',
                    color: 'var(--cx-confidential-text)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  <ShieldAlert size={14} />
                  <span>Confidential Category — Strict Proctorial Access</span>
                </div>
              )}
            </div>

            {/* Title & Description */}
            <div>
              <div className="fw-bold h6 mb-1 text-dark">{selectedCase.title}</div>
              <p className="text-muted small mb-0" style={{ lineHeight: 1.5 }}>
                {selectedCase.summary}
              </p>
            </div>

            {/* Student & Reporter Details Grid */}
            <div className="row g-2 pt-2 border-top">
              <div className="col-12 col-sm-6">
                <div className="p-2.5 rounded border bg-white">
                  <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.7rem' }}>
                    Subject Student
                  </div>
                  <div className="fw-bold text-dark mt-1" style={{ fontSize: '0.85rem' }}>
                    {selectedCase.student.name}
                  </div>
                  <div className="cx-font-mono text-muted" style={{ fontSize: '0.75rem' }}>
                    {selectedCase.student.rollNo} • {selectedCase.student.year}
                  </div>
                  <div className="small text-muted">{selectedCase.department}</div>
                </div>
              </div>

              <div className="col-12 col-sm-6">
                <div className="p-2.5 rounded border bg-white">
                  <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.7rem' }}>
                    Reported By
                  </div>
                  <div className="fw-bold text-dark mt-1" style={{ fontSize: '0.85rem' }}>
                    {selectedCase.reporter.name}
                  </div>
                  <div className="small text-muted">{selectedCase.reporter.designation}</div>
                  <div className="small text-muted">Role: {selectedCase.reporter.role}</div>
                </div>
              </div>
            </div>

            {/* Incident Metadata */}
            <div className="p-2.5 rounded border bg-light small d-flex flex-column gap-1">
              <div>
                <strong>Incident Location:</strong> {selectedCase.location}
              </div>
              <div>
                <strong>Evidence Items Logged:</strong> {selectedCase.evidenceCount} attachments
              </div>
              <div>
                <strong>Witnesses Noted:</strong> {selectedCase.witnessCount} individuals
              </div>
              {selectedCase.nextActionDeadline && (
                <div className="text-danger fw-semibold">
                  <strong>Action Deadline:</strong>{' '}
                  {new Date(selectedCase.nextActionDeadline).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleConfirmStatusChange}
        title="Confirm Case Workflow Transition"
        message={`Are you sure you want to transition case ${selectedCase?.caseNumber} to "${pendingStatusUpdate?.newStatusLabel}"? This change will be logged in the audit trail.`}
        confirmLabel="Confirm Transition"
      />

      {/* QR Verification Modal Demo */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="Campus QR Identification & Verification"
        subtitle="Invigilator & Proctor Rapid Identity Scanner (Demo Simulation)"
        maxWidth={500}
        footer={
          <div className="d-flex justify-content-end w-100">
            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="cx-btn cx-btn-primary cx-btn-sm"
            >
              Done
            </button>
          </div>
        }
      >
        {qrScannedStudent ? (
          <div className="d-flex flex-column gap-3 text-center">
            <div
              className="mx-auto d-flex align-items-center justify-content-center p-3 rounded-3"
              style={{
                width: '120px',
                height: '120px',
                backgroundColor: 'var(--cx-slate-100)',
                border: '2px solid var(--cx-teal-500)',
              }}
            >
              <QrCode size={80} style={{ color: 'var(--cx-navy-900)' }} />
            </div>

            <div>
              <span className="badge bg-success mb-1">Identity Verified Against Registry</span>
              <h3 className="h5 fw-bold text-dark mb-0">{qrScannedStudent.name}</h3>
              <div className="cx-font-mono text-muted small">{qrScannedStudent.rollNo}</div>
            </div>

            <div className="text-start p-3 bg-light rounded-3 border small d-flex flex-column gap-1.5">
              <div>
                <strong>Department:</strong> {qrScannedStudent.department}
              </div>
              <div>
                <strong>Academic Standing:</strong> {qrScannedStudent.academicYear}
              </div>
              <div>
                <strong>Hall Ticket Ref:</strong>{' '}
                <span className="cx-font-mono">{qrScannedStudent.hallTicket}</span>
              </div>
              <div className={`pt-2 border-top ${qrScannedStudent.hasInfractions ? 'text-danger' : 'text-success'}`}>
                <strong>Conduct Context:</strong> {qrScannedStudent.disciplinaryStatus}
              </div>
              {qrScannedStudent.hasInfractions && (
                <div className="text-muted small">
                  <strong>Latest Matter:</strong> {qrScannedStudent.lastIncident}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setQrScannedStudent(null)}
              className="cx-btn cx-btn-outline cx-btn-sm align-self-center mt-1"
            >
              Lookup Another Credential
            </button>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            <div className="text-center p-3 bg-light rounded-3 border">
              <QrCode size={48} className="text-teal mb-2 mx-auto d-block" style={{ color: 'var(--cx-teal-600)' }} />
              <div className="fw-semibold text-dark mb-1">Live Institutional Credential Verification</div>
              <div className="text-muted small">
                Scan student identification credential or query active institutional registry by roll number.
              </div>
            </div>

            <div className="d-flex flex-column gap-2">
              <label htmlFor="qr-lookup-input" className="form-label small fw-semibold text-muted mb-0">
                Student Roll Number or Name
              </label>
              <div className="d-flex gap-2">
                <input
                  id="qr-lookup-input"
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. 22CSE041 or student name"
                  value={qrSearchInput}
                  onChange={(e) => {
                    setQrSearchInput(e.target.value);
                    if (qrLookupError) setQrLookupError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleManualQrLookup(qrSearchInput);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleManualQrLookup(qrSearchInput)}
                  className="cx-btn cx-btn-teal cx-btn-sm text-nowrap"
                >
                  Verify Credential
                </button>
              </div>
              {qrLookupError && <div className="text-danger small">{qrLookupError}</div>}
            </div>

            {cases.length > 0 && (
              <div className="pt-2 border-top">
                <div className="small text-muted fw-semibold mb-2">Registered Students in Active Registry:</div>
                <div className="d-flex flex-wrap gap-1.5">
                  {cases.slice(0, 4).map((c) => (
                    <button
                      key={c.id || c.caseNumber}
                      type="button"
                      onClick={() => handleSimulateQrScan(c.student)}
                      className="cx-btn cx-btn-outline cx-btn-sm py-1 px-2 text-start font-monospace small"
                    >
                      {c.student?.rollNo || c.caseNumber} ({c.student?.name?.split(' ')[0] || 'Student'})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AnimatedPage>
  );
};

export default OverviewDemoPage;
