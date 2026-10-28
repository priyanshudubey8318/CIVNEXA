import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  FileCheck,
  UserCheck,
  Users,
  Search,
  Plus,
} from 'lucide-react';
import RoleDashboardHeader from '../../components/dashboard/RoleDashboardHeader';
import DashboardMetricCard from '../../components/dashboard/DashboardMetricCard';
import RecentActivityList from '../../components/dashboard/RecentActivityList';
import CaseSummaryTable from '../../components/dashboard/CaseSummaryTable';
import QuickActionsPanel from '../../components/dashboard/QuickActionsPanel';
import ChartCard from '../../components/data-display/ChartCard';
import Tabs from '../../components/data-display/Tabs';
import FileUploader from '../../components/forms/FileUploader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import caseService from '../../services/caseService';

export const HodDashboard = ({ onInspectCase = null }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('cases'); // 'cases', 'uploader'
  const [deptCases, setDeptCases] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const userDept = currentUser?.department || 'Computer Science & Engineering';

  useEffect(() => {
    const loadHodData = async () => {
      setIsLoading(true);
      try {
        const res = await caseService.getCases({
          pageSize: 50,
          currentUser,
          role: 'HOD',
        });

        const items = res.items || [];
        setDeptCases(items);

        // Department activities
        const acts = [];
        items.forEach((c) => {
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
        console.error('HOD dashboard data load error', err);
        toast.error('Failed to load department conduct cases.');
      } finally {
        setIsLoading(false);
      }
    };

    loadHodData();
  }, [currentUser]);

  // Dynamic calculations scoped to department
  const totalDeptCases = deptCases.length;
  const activeDeptCases = deptCases.filter((c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
  const pendingVerifications = deptCases.filter((c) => c.status === 'PENDING_VERIFICATION').length;
  const resolvedDeptCases = deptCases.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;

  // Department unique students involved in active cases
  const deptStudentsCount = useMemo(() => {
    return new Set(deptCases.map((c) => c.student?.rollNo || c.student?.name).filter(Boolean)).size;
  }, [deptCases]);

  // Filtered cases for summary table
  const displayedCases = useMemo(() => {
    if (activeCategoryFilter === 'ALL') return deptCases;
    return deptCases.filter((c) => c.category === activeCategoryFilter || c.categoryKey === activeCategoryFilter);
  }, [deptCases, activeCategoryFilter]);

  // Department Category Chart
  const categoryCounts = useMemo(() => {
    const counts = {};
    deptCases.forEach((c) => {
      const cat = c.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [deptCases]);

  const categoryChartData = useMemo(() => {
    const labels = Object.keys(categoryCounts);
    const dataValues = Object.values(categoryCounts);
    return {
      labels,
      datasets: [
        {
          label: 'Department Incidents',
          data: dataValues,
          backgroundColor: ['#0F766E', '#2563EB', '#F59E0B', '#EF4444', '#8B5CF6'],
          borderWidth: 2,
          borderColor: '#FFFFFF',
        },
      ],
    };
  }, [categoryCounts]);

  const quickActions = [
    {
      label: 'Report Incident',
      icon: Plus,
      to: '/cases/create',
      color: 'var(--cx-teal-700)',
      description: 'Log exam or conduct infraction',
      featured: true,
    },
    {
      label: 'HOD Verification',
      icon: FileCheck,
      to: '/hod/verification',
      color: '#2563EB',
      description: 'Review pending department filings',
      badge: pendingVerifications > 0 ? `${pendingVerifications} Pending` : null,
    },
    {
      label: 'Student 360 View',
      icon: UserCheck,
      to: '/hod/student-360',
      color: '#7C3AED',
      description: 'Comprehensive student profile',
    },
    {
      label: 'Proctor Assignment',
      icon: Users,
      to: '/hod/assignment',
      color: '#059669',
      description: 'Assign proctors & committee',
    },
  ];

  return (
    <div>
      {/* Header */}
      <RoleDashboardHeader
        user={currentUser}
        title={`Department Conduct & Academic Governance — ${currentUser?.name || 'Head of Department'}`}
        subtitle={`Department of ${userDept}`}
        statusPills={[
          { label: 'Department Cases', value: totalDeptCases, variant: 'primary', icon: FolderKanban },
          { label: 'Active Inquiries', value: activeDeptCases, variant: 'warning', icon: Clock },
          { label: 'Pending HOD Sign-off', value: pendingVerifications, variant: 'danger', icon: FileCheck },
          { label: 'Resolved this Term', value: resolvedDeptCases, variant: 'success', icon: CheckCircle2 },
        ]}
      />

      {/* KPI Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Department Cases"
            value={totalDeptCases}
            subtitle={`${userDept} cases`}
            trend={{ value: `${deptStudentsCount} student records`, isPositive: true }}
            icon={FolderKanban}
            variant="default"
            onClick={() => setActiveCategoryFilter('ALL')}
            isActive={activeCategoryFilter === 'ALL'}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Active Inquiries"
            value={activeDeptCases}
            subtitle="Under investigation or response"
            trend={{ value: 'In review stage', isPositive: false }}
            icon={Clock}
            variant="warning"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Pending HOD Verification"
            value={pendingVerifications}
            subtitle="Filings awaiting your clearance"
            trend={{ value: 'Action required', isPositive: false }}
            icon={FileCheck}
            variant="danger"
            onClick={() => navigate('/hod/verification')}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Resolved this Term"
            value={resolvedDeptCases}
            subtitle="Closed with remedial outcome"
            trend={{ value: 'Compliant resolutions', isPositive: true }}
            icon={CheckCircle2}
            variant="teal"
          />
        </div>
      </div>

      {/* Quick Actions Panel */}
      <QuickActionsPanel
        actions={quickActions}
        title="HOD Operational Actions"
        subtitle="Verification workflows, student dossier lookup, and proctor assignments"
      />

      {/* 2-Column: Department Category Chart & Recent Activity */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-5">
          <ChartCard
            title="Department Incident Breakdown"
            subtitle={`Categorical distribution in ${userDept}`}
            type="doughnut"
            data={categoryChartData}
            height={260}
          />
        </div>
        <div className="col-12 col-lg-7">
          <RecentActivityList
            activities={activities}
            title="Department Workflow Log"
            subtitle={`Recent procedural events in ${userDept}`}
            maxItems={5}
            viewAllLink="/cases"
          />
        </div>
      </div>

      {/* Department Case Workspaces (Tabs) */}
      <div className="cx-card mb-4 border-0 shadow-sm">
        <div className="cx-card-header p-3 border-bottom d-flex align-items-center justify-content-between">
          <Tabs
            tabs={[
              { id: 'cases', label: `Active Department Cases (${displayedCases.length})` },
              { id: 'uploader', label: 'Evidence Uploader' },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {activeTab === 'cases' && (
          <div className="cx-card-body p-0">
            <CaseSummaryTable
              cases={displayedCases}
              title={`Active Department Cases — ${userDept}`}
              subtitle="Direct access to student proceedings and investigation files"
              viewAllLink="/cases"
              onInspectCase={onInspectCase}
            />
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

export default HodDashboard;
