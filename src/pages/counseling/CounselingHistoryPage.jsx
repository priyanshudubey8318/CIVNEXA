import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  Search,
  Filter,
  CheckCircle2,
  CalendarHeart,
  Clock,
  User,
  FileText,
  Lock,
} from 'lucide-react';
import AnimatedPage from '../../components/common/AnimatedPage';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import counselingService from '../../services/counselingService';

export const CounselingHistoryPage = () => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [referrals, setReferrals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const items = await counselingService.getReferrals({
        currentUser,
        searchQuery,
      });
      setReferrals(items);
    } catch (err) {
      toast.error('Unable to load counseling archive.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [searchQuery, currentUser]);

  const completedSessions = [];
  referrals.forEach((ref) => {
    (ref.sessions || [])
      .filter((s) => s.sessionStatus === 'COMPLETED')
      .forEach((sess) => {
        completedSessions.push({
          ...sess,
          referralId: ref.id,
          caseNumber: ref.caseNumber,
          studentName: ref.studentName,
          studentRoll: ref.studentRoll,
          studentDepartment: ref.studentDepartment,
          reason: ref.reason,
        });
      });
  });

  return (
    <AnimatedPage>
      <PageHeader
        title="Historical Counseling & Welfare Records"
        subtitle="Archived counseling interventions, longitudinal student rehabilitation progress, and past session dossiers."
        breadcrumbs={[{ label: 'Counseling' }, { label: 'History Archive' }]}
        badge={
          <span className="badge bg-secondary-subtle text-secondary border px-2 py-1 d-inline-flex align-items-center gap-1.5">
            <Archive size={13} />
            <span>{historyList.length} Archived Records</span>
          </span>
        }
      />

      {/* Filter and Search Bar */}
      <div className="cx-card p-3 mb-4">
        <div className="input-group">
          <span className="input-group-text bg-white">
            <Search size={16} className="text-muted" />
          </span>
          <input
            type="text"
            className="cx-input rounded-start-0"
            placeholder="Search archive by student name, roll number, case reference, or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Historical Sessions Archive */}
      <div className="cx-card mb-4">
        <div className="cx-card-header d-flex align-items-center justify-content-between">
          <h2 className="h6 mb-0 fw-bold">Concluded Counseling Interventions ({completedSessions.length})</h2>
          <span className="small text-muted">Statutory Retained Records</span>
        </div>

        <div className="cx-card-body p-0">
          {isLoading ? (
            <div className="p-5 text-center text-muted">
              <div className="spinner-border text-teal mb-3" role="status" />
              <div>Loading archived records...</div>
            </div>
          ) : completedSessions.length === 0 ? (
            <div className="p-5 text-center text-muted">
              <Archive size={36} className="text-muted mb-2 opacity-50 mx-auto" />
              <h3 className="h6 fw-bold text-dark">No Concluded Records</h3>
              <p className="small text-muted mb-0">Completed student welfare sessions will appear in this archive.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="cx-table">
                <thead>
                  <tr>
                    <th>Student & Department</th>
                    <th>Related Docket</th>
                    <th>Concluded Date</th>
                    <th>Session Focus</th>
                    <th>Counselor</th>
                    <th>Session Notes / Outcome</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {completedSessions.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="fw-bold text-dark">{s.studentName}</div>
                        <div className="small text-muted font-monospace">{s.studentRoll}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          {s.studentDepartment}
                        </div>
                      </td>
                      <td>
                        <Link
                          to={`/cases/${s.caseNumber}`}
                          className="cx-font-mono fw-bold text-decoration-none hover-underline text-teal"
                        >
                          {s.caseNumber}
                        </Link>
                      </td>
                      <td>
                        <div className="small fw-semibold text-dark font-monospace">{s.date}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          {s.time} ({s.venue})
                        </div>
                      </td>
                      <td>
                        <div className="small fw-semibold text-dark">{s.type}</div>
                      </td>
                      <td>
                        <div className="small text-dark">{s.counselor}</div>
                      </td>
                      <td>
                        <div className="small text-muted" style={{ maxWidth: '300px' }}>
                          {s.summary}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-success-subtle text-success">Concluded</span>
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

export default CounselingHistoryPage;
