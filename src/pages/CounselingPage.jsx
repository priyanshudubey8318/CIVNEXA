import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AnimatedPage from '../components/common/AnimatedPage';
import PageHeader from '../components/common/PageHeader';
import {
  CalendarHeart,
  Clock,
  UserCheck,
  Plus,
  CheckCircle,
  Calendar,
  ClipboardList,
  ArrowRight,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import counselingService from '../services/counselingService';

export const CounselingPage = () => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [referrals, setReferrals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const items = await counselingService.getReferrals({ currentUser });
      setReferrals(items);
    } catch (e) {
      toast.error('Unable to load counseling records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Extract all sessions
  const sessions = [];
  let pendingFollowupsCount = 0;

  referrals.forEach((ref) => {
    (ref.followups || []).forEach((fw) => {
      if (fw.status === 'PENDING') pendingFollowupsCount++;
    });
    (ref.sessions || []).forEach((s) => {
      sessions.push({
        ...s,
        referralId: ref.id,
        caseNumber: ref.caseNumber,
        student: `${ref.studentName} (${ref.studentRoll})`,
        room: s.venue,
        time: `${s.date}, ${s.time}`,
      });
    });
  });

  return (
    <AnimatedPage>
      <PageHeader
        title="Counseling, Mentorship & Student Welfare"
        subtitle="Holistic support, empathetic guidance, and constructive rehabilitation workflows."
        breadcrumbs={[{ label: 'Counseling' }, { label: 'Calendar' }]}
        actions={
          <div className="d-flex align-items-center gap-2">
            <Link to="/counseling/followups" className="cx-btn cx-btn-outline">
              <ClipboardList size={16} />
              <span>Welfare Follow-ups</span>
            </Link>
            <Link to="/counseling/sessions" className="cx-btn cx-btn-teal">
              <Plus size={16} />
              <span>Manage Sessions</span>
            </Link>
          </div>
        }
      />

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="cx-card p-3">
            <div className="d-flex align-items-center gap-2 text-muted small fw-bold">
              <CalendarHeart size={16} style={{ color: 'var(--cx-teal-600)' }} />
              <span>ACTIVE SESSIONS</span>
            </div>
            <div className="h4 fw-bold mt-1 text-dark">{sessions.length} Scheduled</div>
            <div className="small text-muted">Across 8 university departments</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="cx-card p-3">
            <div className="d-flex align-items-center gap-2 text-muted small fw-bold">
              <UserCheck size={16} style={{ color: 'var(--cx-blue-600)' }} />
              <span>ACTIVE REFERRALS</span>
            </div>
            <div className="h4 fw-bold mt-1 text-dark">{referrals.length} Cases</div>
            <div className="small text-muted">Referred for specialized support</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="cx-card p-3">
            <div className="d-flex align-items-center gap-2 text-muted small fw-bold">
              <CheckCircle size={16} style={{ color: 'var(--cx-success)' }} />
              <span>PENDING FOLLOW-UPS</span>
            </div>
            <div className="h4 fw-bold mt-1 text-dark">{pendingFollowupsCount} Monitoring</div>
            <div className="small text-muted">Longitudinal student wellbeing checks</div>
          </div>
        </div>
      </div>

      <div className="cx-card">
        <div className="cx-card-header d-flex justify-content-between align-items-center">
          <h2 className="h6 mb-0 fw-bold">Upcoming Counseling & Mentorship Appointments</h2>
          <Link
            to="/counseling/sessions"
            className="small text-teal text-decoration-none d-flex align-items-center gap-1 hover-underline"
          >
            <span>View All Sessions</span>
            <ArrowRight size={14} />
          </Link>
        </div>
        <div className="cx-card-body p-0">
          {sessions.length === 0 ? (
            <div className="p-5 text-center text-muted">
              <CalendarHeart size={36} className="text-muted mb-2 opacity-50 mx-auto" />
              <h3 className="h6 fw-bold text-dark mb-1">No appointments available</h3>
              <p className="small text-muted mb-0">No active counseling sessions or scheduled follow-ups.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="cx-table">
                <thead>
                  <tr>
                    <th>Session Ref</th>
                    <th>Student</th>
                    <th>Counselor / Mentor</th>
                    <th>Focus Area</th>
                    <th>Scheduled Time</th>
                    <th>Location</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id}>
                      <td className="cx-font-mono fw-bold text-primary small">{s.id}</td>
                      <td className="small fw-semibold text-dark">{s.student}</td>
                      <td className="small">{s.counselor}</td>
                      <td className="small text-muted">{s.type}</td>
                      <td className="small fw-semibold">{s.time}</td>
                      <td className="small text-muted">{s.room}</td>
                      <td>
                        <Link
                          to="/counseling/sessions"
                          className="cx-btn cx-btn-outline cx-btn-sm"
                        >
                          Details
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

export default CounselingPage;
