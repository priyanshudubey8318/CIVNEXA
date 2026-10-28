import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  UserCheck,
  FileText,
  FileQuestion,
} from 'lucide-react';
import RoleDashboardHeader from '../../components/dashboard/RoleDashboardHeader';
import DashboardMetricCard from '../../components/dashboard/DashboardMetricCard';
import CaseSummaryTable from '../../components/dashboard/CaseSummaryTable';
import RecentActivityList from '../../components/dashboard/RecentActivityList';
import QuickActionsPanel from '../../components/dashboard/QuickActionsPanel';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import caseService from '../../services/caseService';

export const FacultyDashboard = ({ onInspectCase = null }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [facultyCases, setFacultyCases] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFacultyData = async () => {
      setIsLoading(true);
      try {
        const res = await caseService.getCases({
          pageSize: 50,
          currentUser,
          role: 'FACULTY',
        });

        const items = res.items || [];
        setFacultyCases(items);

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
        console.error('Faculty dashboard load failed', err);
        toast.error('Unable to load faculty case logs.');
      } finally {
        setIsLoading(false);
      }
    };

    loadFacultyData();
  }, [currentUser]);

  const reportedByMe = facultyCases.filter(
    (c) =>
      c.reporter?.id === currentUser?.id ||
      c.reporter?.name?.toLowerCase() === currentUser?.name?.toLowerCase()
  );
  const pendingResponses = facultyCases.filter((c) => c.status === 'AWAITING_RESPONSE');
  const activeCases = facultyCases.filter((c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED');
  const resolvedCases = facultyCases.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED');

  const quickActions = [
    {
      label: 'Report Exam Incident',
      icon: Plus,
      to: '/cases/create',
      color: '#DC2626',
      description: 'Invigilation & hall report',
      featured: true,
    },
    {
      label: 'Report Conduct Incident',
      icon: AlertTriangle,
      to: '/cases/create',
      color: 'var(--cx-teal-700)',
      description: 'Classroom & behavioral report',
    },
    {
      label: 'Student Directory Lookup',
      icon: Search,
      to: '/faculty/students',
      color: '#2563EB',
      description: 'Rapid roll & photo check',
    },
    {
      label: 'View Case Registry',
      icon: FolderKanban,
      to: '/cases',
      color: '#059669',
      description: 'All accessible dockets',
    },
  ];

  return (
    <div>
      <RoleDashboardHeader
        user={currentUser}
        title={`Faculty & Exam Proctoring Workspace — ${currentUser?.name || 'Faculty Member'}`}
        statusPills={[
          { label: 'Reported by You', value: reportedByMe.length, variant: 'primary', icon: FileText },
          { label: 'Awaiting Student Defense', value: pendingResponses.length, variant: 'warning', icon: Clock },
          { label: 'In Proctorial Review', value: activeCases.length, variant: 'teal', icon: FolderKanban },
          { label: 'Resolved Inquiries', value: resolvedCases.length, variant: 'success', icon: CheckCircle2 },
        ]}
      />

      {/* KPI Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Incidents Logged by You"
            value={reportedByMe.length}
            subtitle="Initiated filings"
            trend={{ value: 'Invigilation & lab logs', isPositive: true }}
            icon={FileText}
            variant="default"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Awaiting Student Response"
            value={pendingResponses.length}
            subtitle="Notice to explain pending"
            trend={{ value: 'Due within 3 days', isPositive: false }}
            icon={Clock}
            variant="warning"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Active Investigations"
            value={activeCases.length}
            subtitle="Under proctorial hearing"
            trend={{ value: 'Department proceedings', isPositive: true }}
            icon={FolderKanban}
            variant="teal"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardMetricCard
            title="Resolved Incidents"
            value={resolvedCases.length}
            subtitle="Concluded determinations"
            trend={{ value: 'Formal sanctions finalized', isPositive: true }}
            icon={CheckCircle2}
            variant="success"
          />
        </div>
      </div>

      {/* Quick Actions Panel */}
      <QuickActionsPanel
        actions={quickActions}
        title="Faculty Operational Actions"
        subtitle="Log exam hall malpractice, general conduct infractions, or verify student enrollment"
      />

      {/* 2-Column: Case Summary & Activity */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-xl-8">
          <CaseSummaryTable
            cases={facultyCases}
            title="Faculty-Related Cases & Reports"
            subtitle="Matters logged by you or involving students in your department"
            viewAllLink="/cases"
            onInspectCase={onInspectCase}
          />
        </div>
        <div className="col-12 col-xl-4">
          <RecentActivityList
            activities={activities}
            title="Faculty Case Activity"
            subtitle="Updates on your submitted reports"
            maxItems={5}
            viewAllLink="/cases"
          />
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
