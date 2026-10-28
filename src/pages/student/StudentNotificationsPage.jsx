import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
  FileText,
  Mail,
  ShieldAlert,
  ArrowRight,
  Filter,
  CheckCheck,
} from 'lucide-react';
import AnimatedPage from '../../components/common/AnimatedPage';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// Dedicated Student Official Notices & Summons Dataset
const INITIAL_STUDENT_NOTICES = [
  {
    id: 'NOTIF-STU-01',
    type: 'HEARING_SUMMONS',
    priority: 'URGENT',
    title: 'Formal Summons: Disciplinary Hearing Scheduled',
    message: 'You are summoned to appear before the Proctorial Inquiry Board regarding Case CX-2026-0101. Date: Oct 24, 2026 at 10:30 AM in Conference Hall A.',
    caseId: 'CX-2026-0101',
    caseNumber: 'CX-2026-0101',
    timestamp: '2 hours ago',
    date: 'Oct 24, 2026',
    time: '10:30 AM',
    venue: 'Conference Hall A, Administrative Block',
    read: false,
    requiresAction: true,
    actionUrl: '/cases/CX-2026-0101',
    actionLabel: 'View Hearing Details',
  },
  {
    id: 'NOTIF-STU-02',
    type: 'NOTICE_TO_EXPLAIN',
    priority: 'HIGH',
    title: 'Notice to Explain: Written Defense Required',
    message: 'A formal incident report has been registered concerning conduct during the mid-semester evaluation. Please submit your written defense within 3 days.',
    caseId: 'CX-2026-0101',
    caseNumber: 'CX-2026-0101',
    timestamp: 'Yesterday',
    read: false,
    requiresAction: true,
    actionUrl: '/student/responses',
    actionLabel: 'Submit Explanation Now',
  },
  {
    id: 'NOTIF-STU-03',
    type: 'COUNSELING_INVITE',
    priority: 'INFO',
    title: 'Support Check-in & Mentorship Consultation',
    message: 'Counselor Pooja Nambiar has invited you for a voluntary student wellbeing discussion.',
    caseId: null,
    timestamp: '3 days ago',
    read: true,
    requiresAction: false,
    actionUrl: '/student/support',
    actionLabel: 'Wellbeing Center',
  },
  {
    id: 'NOTIF-STU-04',
    type: 'RESOLUTION_LETTER',
    priority: 'INFO',
    title: 'Case Resolution: CX-2026-0104 Concluded',
    message: 'The residential hostel review regarding curfew violation has been formally closed with remedial counseling fulfilled.',
    caseId: 'CX-2026-0104',
    caseNumber: 'CX-2026-0104',
    timestamp: '5 days ago',
    read: true,
    requiresAction: false,
    actionUrl: '/cases/CX-2026-0104',
    actionLabel: 'View Resolution Order',
  },
];

/**
 * StudentNotificationsPage Component (/student/notifications)
 * Official administrative summons, notices to explain, and hearing calls for students.
 */
export const StudentNotificationsPage = () => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
  const [notices, setNotices] = useState(() => (isTest ? INITIAL_STUDENT_NOTICES : []));
  const [filter, setFilter] = useState('ALL'); // 'ALL', 'UNREAD', 'URGENT'

  const handleMarkAsRead = (id) => {
    setNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    toast.info('Notice marked as acknowledged.');
  };

  const handleMarkAllRead = () => {
    setNotices((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success('All notices marked as read.');
  };

  const filteredNotices = notices.filter((n) => {
    if (filter === 'UNREAD') return !n.read;
    if (filter === 'URGENT') return n.priority === 'URGENT' || n.priority === 'HIGH';
    return true;
  });

  const unreadCount = notices.filter((n) => !n.read).length;

  return (
    <AnimatedPage>
      <PageHeader
        title="Official Student Notices & Hearing Summons"
        subtitle="Mandatory university communications, hearing appearances, and procedural notices."
        breadcrumbs={[{ label: 'Student Portal' }, { label: 'Notices & Summons' }]}
        badge={
          unreadCount > 0 ? (
            <span className="badge bg-danger text-white px-2.5 py-1" style={{ fontSize: '0.75rem' }}>
              {unreadCount} Unread Notice{unreadCount > 1 ? 's' : ''}
            </span>
          ) : (
            <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1" style={{ fontSize: '0.75rem' }}>
              All Notices Acknowledged
            </span>
          )
        }
        actions={
          unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="cx-btn cx-btn-outline"
            >
              <CheckCheck size={15} />
              <span>Mark All as Acknowledged</span>
            </button>
          )
        }
      />

      {/* Filter Tabs */}
      <div className="cx-card mb-4 border-0 shadow-sm">
        <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
          <div className="btn-group btn-group-sm">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`btn ${filter === 'ALL' ? 'btn-teal' : 'btn-outline-secondary'}`}
            >
              All Communications ({notices.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('UNREAD')}
              className={`btn ${filter === 'UNREAD' ? 'btn-teal' : 'btn-outline-secondary'}`}
            >
              Unread / Pending Action ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('URGENT')}
              className={`btn ${filter === 'URGENT' ? 'btn-teal' : 'btn-outline-secondary'}`}
            >
              Urgent Summons
            </button>
          </div>
        </div>

        {/* Notices List */}
        <div className="cx-card-body p-3 p-md-4">
          {filteredNotices.length === 0 ? (
            <div className="text-center p-5 text-muted">
              <CheckCircle size={36} className="text-success mb-2 mx-auto" />
              <h3 className="h6 fw-bold text-dark">You're all caught up</h3>
              <p className="small mb-0">No active notices or pending summons.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {filteredNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="p-3.5 rounded transition-all"
                  style={{
                    backgroundColor: notice.read ? '#FFFFFF' : 'rgba(254, 243, 199, 0.25)',
                    border: '1px solid',
                    borderTopColor: notice.read ? '#E2E8F0' : '#F59E0B',
                    borderRightColor: notice.read ? '#E2E8F0' : '#F59E0B',
                    borderBottomColor: notice.read ? '#E2E8F0' : '#F59E0B',
                    borderLeftWidth: '4px',
                    borderLeftStyle: 'solid',
                    borderLeftColor: notice.priority === 'URGENT'
                      ? '#EF4444'
                      : notice.priority === 'HIGH'
                      ? '#F59E0B'
                      : 'var(--cx-teal-600)',
                  }}
                >
                  <div className="d-flex flex-column flex-md-row align-items-start justify-content-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="d-flex flex-wrap align-items-center gap-2 mb-1.5">
                        {notice.priority === 'URGENT' ? (
                          <span className="badge bg-danger text-white px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                            CRITICAL / URGENT
                          </span>
                        ) : notice.priority === 'HIGH' ? (
                          <span className="badge bg-warning text-dark px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                            PROCEDURAL NOTICE
                          </span>
                        ) : (
                          <span className="badge bg-light text-secondary border px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                            INFORMATIONAL
                          </span>
                        )}

                        <span className="text-muted small d-inline-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                          <Clock size={12} />
                          <span>{notice.timestamp}</span>
                        </span>

                        {!notice.read && (
                          <span className="badge bg-primary text-white" style={{ fontSize: '0.65rem' }}>
                            New
                          </span>
                        )}
                      </div>

                      <h3 className="h6 fw-bold text-dark mb-1">{notice.title}</h3>
                      <p className="text-secondary small mb-2" style={{ fontSize: '0.8rem', lineHeight: '1.45' }}>
                        {notice.message}
                      </p>

                      {notice.venue && (
                        <div className="p-2 bg-light rounded text-dark small d-flex flex-wrap align-items-center gap-3 mb-2" style={{ fontSize: '0.75rem' }}>
                          <span><strong>Hearing Date:</strong> {notice.date} at {notice.time}</span>
                          <span><strong>Venue:</strong> {notice.venue}</span>
                        </div>
                      )}
                    </div>

                    <div className="d-flex flex-wrap align-items-center gap-2 align-self-md-start">
                      {!notice.read && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(notice.id)}
                          className="cx-btn cx-btn-ghost cx-btn-sm"
                          title="Acknowledge Receipt"
                        >
                          <CheckCircle size={13} />
                          <span>Acknowledge</span>
                        </button>
                      )}

                      {notice.actionUrl && (
                        <Link
                          to={notice.actionUrl}
                          className="cx-btn cx-btn-teal cx-btn-sm text-decoration-none"
                        >
                          <span>{notice.actionLabel || 'Respond'}</span>
                          <ArrowRight size={13} />
                        </Link>
                      )}
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

export default StudentNotificationsPage;
