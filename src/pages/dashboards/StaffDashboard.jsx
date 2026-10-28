import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Building,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  FileText,
  Lock,
  FolderKanban,
} from 'lucide-react';
import RoleDashboardHeader from '../../components/dashboard/RoleDashboardHeader';
import DashboardMetricCard from '../../components/dashboard/DashboardMetricCard';
import CaseSummaryTable from '../../components/dashboard/CaseSummaryTable';
import RecentActivityList from '../../components/dashboard/RecentActivityList';
import QuickActionsPanel from '../../components/dashboard/QuickActionsPanel';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import caseService from '../../services/caseService';

export const StaffDashboard = ({ onInspectCase = null }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [staffCases, setStaffCases] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStaffData = async () => {
      setIsLoading(true);
      try {
        const res = await caseService.getCases({
          pageSize: 50,
          currentUser,
          role: 'STAFF',
        });

        const items = res.items || [];
        setStaffCases(items);

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
        console.error('Staff dashboard load error', err);
        toast.error('Failed to load campus security and hostel logs.');
      } finally {
        setIsLoading(false);
      }
    };

    loadStaffData();
  }, [currentUser]);

  // Specific staff categorizations
  const hostelIncidents = staffCases.filter(
    (c) =>
      c.categoryKey === 'HOSTEL_DISCIPLINE' ||
      c.category?.toLowerCase().includes('hostel') ||
      c.location?.toLowerCase().includes('hostel')
  );

  const securityReports = staffCases.filter(
    (c) =>
      c.categoryKey === 'CAMPUS_SAFETY' ||
      c.category?.toLowerCase().includes('safety') ||
      c.category?.toLowerCase().includes('security')
  );

  const pendingStaffActions = staffCases.filter(
    (c) => c.status === 'PENDING_VERIFICATION' || c.status === 'IN_PROGRESS'
  );

  const resolvedStaffCases = staffCases.filter(
    (c) => c.status === 'RESOLVED' || c.status === 'CLOSED'
  );

  const quickActions = [
    {
      label: 'Report Safety Incident',
      icon: ShieldAlert,
      to: '/cases/create',
      color: '#DC2626',
      description: 'Campus perimeter or security event',
      featured: true,
    },
    {
      label: 'Report Hostel Curfew / Issue',
      icon: Building,
      to: '/cases/create',
      color: 'var(--cx-teal-700)',
      description: 'Residential rule infractions',
    },
    {
      label: 'Campus Grievance Log',
      icon: FileText,
      to: '/grievances',
      color: '#2563EB',
      description: 'Facility & student complaints',
    },
    {
      label: 'All Incident Dockets',
      icon: FolderKanban,
      to: '/cases',
      color: '#059669',
      description: 'Active campus records',
    },
  ];

  return (
    <div>
      <RoleDashboardHeader
        user={currentUser}
        title={`Campus Safety & Residential Discipline Workspace — ${currentUser?.name || 'Chief Residential Warden'}`}
        statusPills={[
          { label: 'Hostel Incidents', value: hostelIncidents.length, variant: 'primary', icon: Building },
          { label: 'Security & Safety Reports', value: securityReports.length, variant: 'danger', icon: ShieldAlert },
          { label: 'Pending Action', value: pendingStaffActions.length, variant: 'warning', icon: Clock },
          { label: 'Resolved Matters', value: resolvedStaffCases.length, variant: 'success', icon: CheckCircle2 },
        ]}
      />

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Hostel Discipline Cases"
            value={hostelIncidents.length}
            subtitle="Residential blocks & curfew"
            trend={{ value: 'Curfew & premise logs', isPositive: true }}
            icon={Building}
            variant="default"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Campus Safety Reports"
            value={securityReports.length}
            subtitle="Perimeter & facility incidents"
            trend={{ value: 'Security patrol logged', isPositive: false }}
            icon={ShieldAlert}
            variant="danger"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Pending Security Verification"
            value={pendingStaffActions.length}
            subtitle="Awaiting administrative review"
            trend={{ value: 'In review queue', isPositive: false }}
            icon={Clock}
            variant="warning"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Resolved & Sanitized"
            value={resolvedStaffCases.length}
            subtitle="Sanctions & warning fulfilled"
            trend={{ value: 'Compliance met', isPositive: true }}
            icon={CheckCircle2}
            variant="teal"
          />
        </div>
      </div>

      {/* Quick Actions Panel */}
      <QuickActionsPanel
        actions={quickActions}
        title="Staff & Warden Quick Actions"
        subtitle="Log security infractions, dormitory curfew violations, or facility safety issues"
      />

      {/* 2-Column: Case Summary & Recent Log */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-xl-8">
          <CaseSummaryTable
            cases={staffCases}
            title="Residential & Campus Safety Incident Log"
            subtitle="Recorded by wardens, hostel superintendents, and campus security officers"
            viewAllLink="/cases"
            onInspectCase={onInspectCase}
          />
        </div>
        <div className="col-12 col-xl-4">
          <RecentActivityList
            activities={activities}
            title="Residential Activity Feed"
            subtitle="Campus safety events and hostel updates"
            maxItems={5}
            viewAllLink="/cases"
          />
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
