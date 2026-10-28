import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AnimatedPage from '../components/common/AnimatedPage';
import PageHeader from '../components/common/PageHeader';
import { ShieldAlert, Lock, CheckCircle2, AlertCircle, FileText, Plus, Eye, Search } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import caseService from '../services/caseService';

export const GrievancesPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser } = useAuth();

  const [grievanceCases, setGrievanceCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadGrievances = async () => {
    setIsLoading(true);
    try {
      const res = await caseService.getCases({
        search: searchQuery,
        pageSize: 20,
        currentUser,
      });

      // Filter for grievances and campus safety
      const filtered = res.items.filter(
        (c) =>
          c.categoryKey === 'ACADEMIC_GRIEVANCE' ||
          c.categoryKey === 'CAMPUS_SAFETY' ||
          c.categoryKey === 'ANTI_RAGGING' ||
          c.categoryKey === 'FACULTY_GRIEVANCE' ||
          c.caseNumber.startsWith('GRV')
      );
      setGrievanceCases(filtered);
    } catch (e) {
      toast.error('Unable to retrieve grievances data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGrievances();
  }, [searchQuery, currentUser]);

  return (
    <AnimatedPage>
      <PageHeader
        title="Grievance Redressal & Campus Safety"
        subtitle="Confidential grievance submission, proctorial investigation, and anti-ragging response."
        breadcrumbs={[{ label: 'Grievances' }, { label: 'Overview' }]}
        badge={
          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
            Active Grievance Records
          </span>
        }
        actions={
          <Link to="/grievances/raise" className="cx-btn cx-btn-teal text-decoration-none">
            <Plus size={16} />
            <span>Raise Confidential Grievance</span>
          </Link>
        }
      />

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="cx-card p-3 border-start border-4 border-danger">
            <div className="small text-muted fw-bold">ANTI-RAGGING CELL</div>
            <div className="h4 fw-bold mt-1 text-dark">Zero Tolerance</div>
            <div className="small text-muted">24/7 National & University Helpline Monitoring</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="cx-card p-3 border-start border-4 border-info">
            <div className="small text-muted fw-bold">ACADEMIC GRIEVANCES</div>
            <div className="h4 fw-bold mt-1 text-dark">7-Day SLA</div>
            <div className="small text-muted">Transparent re-evaluation and faculty hearing process</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="cx-card p-3 border-start border-4 border-purple" style={{ borderColor: 'var(--cx-confidential)' }}>
            <div className="small text-muted fw-bold">INTERNAL COMPLAINTS COMMITTEE (ICC)</div>
            <div className="h4 fw-bold mt-1 text-dark">Strict Privacy</div>
            <div className="small text-muted">Restricted access protocol & encrypted records</div>
          </div>
        </div>
      </div>

      <div className="cx-card">
        <div className="cx-card-header d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-3">
          <div>
            <h2 className="h6 mb-0 fw-bold">Active Grievance & Safety Inquiries</h2>
            <span className="small text-muted">
              Showing <strong>{grievanceCases.length}</strong> registered submissions
            </span>
          </div>

          <div className="position-relative" style={{ minWidth: '280px' }}>
            <input
              type="text"
              className="cx-input ps-5"
              placeholder="Search grievances..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
          </div>
        </div>

        <div className="cx-card-body p-0">
          {isLoading ? (
            <div className="p-5 text-center text-muted">
              <div className="spinner-border text-teal mb-3" role="status" />
              <div>Loading registered grievances...</div>
            </div>
          ) : grievanceCases.length === 0 ? (
            <div className="p-5 text-center text-muted">
              <CheckCircle2 size={36} className="text-success mb-2 mx-auto" />
              <div className="fw-semibold text-dark mb-2">No grievances submitted</div>
              <div>
                <Link to="/grievances/raise" className="cx-btn cx-btn-teal cx-btn-sm text-decoration-none d-inline-flex align-items-center gap-1">
                  <Plus size={14} />
                  <span>Submit Grievance</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="cx-table">
                <thead>
                  <tr>
                    <th>Grievance ID</th>
                    <th>Subject</th>
                    <th>Category</th>
                    <th>Department</th>
                    <th>Date</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {grievanceCases.map((g) => (
                    <tr key={g.id}>
                      <td>
                        <Link
                          to={`/cases/${g.caseNumber}`}
                          className="cx-font-mono fw-bold text-decoration-none"
                          style={{ color: 'var(--cx-teal-700)' }}
                        >
                          {g.caseNumber}
                        </Link>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '320px' }}>
                          {g.title}
                        </div>
                        {g.isConfidential && (
                          <div className="small text-purple d-flex align-items-center gap-1 mt-0.5">
                            <Lock size={11} />
                            <span>Confidential Channel</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="small text-muted">{g.category}</span>
                      </td>
                      <td>
                        <span className="small font-monospace">{g.departmentCode || 'CSE'}</span>
                      </td>
                      <td className="small text-muted font-monospace">
                        {new Date(g.reportedAt || g.incidentDate).toLocaleDateString()}
                      </td>
                      <td>
                        <PriorityBadge priority={g.priority} />
                      </td>
                      <td>
                        <StatusBadge status={g.status} label={g.statusLabel} />
                      </td>
                      <td>
                        <Link
                          to={`/cases/${g.caseNumber}`}
                          className="cx-btn cx-btn-outline cx-btn-sm py-1 px-2.5 d-inline-flex align-items-center gap-1 text-decoration-none"
                        >
                          <Eye size={13} />
                          <span>Inspect</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
};

export default GrievancesPage;
