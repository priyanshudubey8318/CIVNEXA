import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileQuestion,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Shield,
  ShieldCheck,
  FileText,
  ArrowRight,
  Info,
} from 'lucide-react';
import AnimatedPage from '../../components/common/AnimatedPage';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import SearchBar from '../../components/forms/SearchBar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import caseService from '../../services/caseService';

/**
 * StudentComplaintsPage Component (/student/complaints)
 * Dedicated student-facing grievance portal showing submitted academic and safety complaints,
 * real-time tracking timeline, anonymity confirmation, and resolution notices.
 */
export const StudentComplaintsPage = () => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [grievances, setGrievances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  const loadGrievances = async () => {
    setIsLoading(true);
    try {
      const res = await caseService.getCases({
        search: searchQuery,
        status: statusFilter,
        pageSize: 50,
        currentUser,
        role: 'STUDENT',
      });

      // Filter for grievances and campus safety
      const filtered = (res.items || []).filter(
        (c) =>
          c.caseNumber.startsWith('GRV') ||
          c.categoryKey === 'ACADEMIC_GRIEVANCE' ||
          c.categoryKey === 'CAMPUS_SAFETY' ||
          c.categoryKey === 'ANTI_RAGGING' ||
          c.categoryKey === 'FACULTY_GRIEVANCE'
      );

      setGrievances(filtered);
    } catch (err) {
      console.error('Failed to load student complaints', err);
      toast.error('Unable to load grievances.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGrievances();
  }, [searchQuery, statusFilter, currentUser]);

  const activeCount = grievances.filter(
    (g) => g.status !== 'RESOLVED' && g.status !== 'CLOSED'
  ).length;
  const resolvedCount = grievances.filter(
    (g) => g.status === 'RESOLVED' || g.status === 'CLOSED'
  ).length;

  return (
    <AnimatedPage>
      <PageHeader
        title="My Submitted Grievances & Campus Complaints"
        subtitle="Track procedural verification, impartial inquiry progress, and resolution notices."
        breadcrumbs={[{ label: 'Student Portal' }, { label: 'My Grievances' }]}
        badge={
          <span className="badge bg-teal-subtle text-teal border border-teal-subtle px-2.5 py-1" style={{ fontSize: '0.75rem' }}>
            {grievances.length} Submitted Complaints
          </span>
        }
        actions={
          <Link to="/grievances/raise" className="cx-btn cx-btn-teal text-decoration-none">
            <Plus size={16} />
            <span>File New Grievance</span>
          </Link>
        }
      />

      {/* KPI Overview */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="cx-card p-3 border-0 shadow-sm bg-white">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted small text-uppercase" style={{ fontSize: '0.7rem' }}>Total Grievances</span>
              <FileQuestion size={18} className="text-teal" />
            </div>
            <div className="h4 fw-bold text-dark cx-font-mono mb-0">{grievances.length}</div>
            <div className="text-muted small" style={{ fontSize: '0.72rem' }}>Filed under student account</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="cx-card p-3 border-0 shadow-sm bg-white">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted small text-uppercase" style={{ fontSize: '0.7rem' }}>Under Active Review</span>
              <Clock size={18} className="text-warning" />
            </div>
            <div className="h4 fw-bold text-warning cx-font-mono mb-0">{activeCount}</div>
            <div className="text-muted small" style={{ fontSize: '0.72rem' }}>With Dean / Proctorial Board</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="cx-card p-3 border-0 shadow-sm bg-white">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted small text-uppercase" style={{ fontSize: '0.7rem' }}>Resolved & Closed</span>
              <CheckCircle2 size={18} className="text-success" />
            </div>
            <div className="h4 fw-bold text-success cx-font-mono mb-0">{resolvedCount}</div>
            <div className="text-muted small" style={{ fontSize: '0.72rem' }}>Remedial action completed</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="cx-card mb-4 border-0 shadow-sm">
        <div className="p-3 border-bottom d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
          <div className="w-100 w-md-50">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
              placeholder="Search complaints by subject, reference..."
            />
          </div>

          <div className="d-flex align-items-center gap-2 w-100 w-md-auto">
            <span className="text-muted small">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select form-select-sm"
              style={{ width: 'auto', minWidth: '140px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="IN_PROGRESS">Under Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        {/* Complaints Listing */}
        <div className="cx-card-body p-3 p-md-4">
          {grievances.length === 0 ? (
            <div className="text-center p-5 text-muted">
              <FileQuestion size={40} className="text-secondary opacity-50 mb-2" />
              <h3 className="h6 fw-bold text-dark">No Grievances Found</h3>
              <p className="small mb-3">You have not submitted any grievance matching the filter criteria.</p>
              <Link to="/grievances/raise" className="cx-btn cx-btn-teal text-decoration-none">
                <Plus size={15} />
                <span>Submit Grievance</span>
              </Link>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {grievances.map((g) => (
                <div
                  key={g.id}
                  className="p-3.5 border rounded bg-white hover-shadow-sm transition-all"
                  style={{
                    borderLeft: g.isAnonymous
                      ? '4px solid #64748B'
                      : '4px solid var(--cx-teal-600)',
                  }}
                >
                  <div className="d-flex flex-column flex-md-row align-items-start justify-content-between gap-2 mb-2">
                    <div>
                      <div className="d-flex flex-wrap align-items-center gap-2 mb-1.5">
                        <span className="cx-font-mono fw-bold text-teal" style={{ fontSize: '0.85rem' }}>
                          {g.caseNumber || g.id}
                        </span>
                        <StatusBadge status={g.status} size="sm" />
                        <PriorityBadge priority={g.priority} size="sm" />

                        {g.isAnonymous ? (
                          <span
                            className="badge bg-secondary-subtle text-secondary border px-2 py-0.5 d-inline-flex align-items-center gap-1"
                            style={{ fontSize: '0.68rem' }}
                            title="Submitted anonymously — your name is not shared"
                          >
                            <Shield size={11} />
                            <span>Anonymous Channel</span>
                          </span>
                        ) : (
                          <span
                            className="badge bg-teal-subtle text-teal border border-teal-subtle px-2 py-0.5 d-inline-flex align-items-center gap-1"
                            style={{ fontSize: '0.68rem' }}
                          >
                            <ShieldCheck size={11} />
                            <span>Formal Identified</span>
                          </span>
                        )}
                      </div>

                      <h3 className="h6 fw-bold text-dark mb-1">{g.title}</h3>
                      <p className="text-muted small mb-0" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                        {g.summary || g.description}
                      </p>
                    </div>

                    <div className="d-flex align-items-center gap-2 align-self-md-start">
                      <Link
                        to={`/cases/${g.id}`}
                        className="cx-btn cx-btn-outline cx-btn-sm text-decoration-none d-inline-flex align-items-center gap-1"
                      >
                        <Eye size={13} />
                        <span>Inspect Docket</span>
                      </Link>
                    </div>
                  </div>

                  {/* Tracking Timeline Bar */}
                  <div className="mt-3 pt-3 border-top bg-light bg-opacity-50 p-2.5 rounded">
                    <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2">
                      <div className="d-flex align-items-center gap-2 text-muted small" style={{ fontSize: '0.75rem' }}>
                        <Clock size={13} className="text-teal" />
                        <span>
                          <strong>Current Stage:</strong> {g.statusLabel || g.status}
                        </span>
                        <span>•</span>
                        <span>
                          Assigned To: {g.assignedTo?.name || 'Dean of Student Affairs'}
                        </span>
                      </div>

                      <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                        Filed on {new Date(g.reportedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
};

export default StudentComplaintsPage;
