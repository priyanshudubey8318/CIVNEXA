import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, ArrowRight, UserCheck, HeartHandshake } from 'lucide-react';

/**
 * UpcomingScheduleList Component
 * Formatted schedule list for committee hearings, counseling sessions, or student summons.
 */
export const UpcomingScheduleList = ({
  items = [],
  title = 'Upcoming Hearings & Sessions',
  subtitle = 'Scheduled proctorial proceedings and counseling appointments',
  viewAllLink = '/committee/calendar',
  emptyMessage = 'No upcoming sessions or hearings scheduled.',
  type = 'hearings', // 'hearings' or 'counseling'
}) => {
  return (
    <div className="cx-card h-100 shadow-sm border-0">
      <div className="cx-card-header d-flex align-items-center justify-content-between p-3 border-bottom">
        <div className="d-flex align-items-center gap-2">
          {type === 'counseling' ? (
            <HeartHandshake size={16} className="text-success" />
          ) : (
            <Calendar size={16} className="text-warning" />
          )}
          <div>
            <h2 className="h6 mb-0 fw-bold text-dark">{title}</h2>
            {subtitle && <p className="text-muted small mb-0" style={{ fontSize: '0.72rem' }}>{subtitle}</p>}
          </div>
        </div>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="text-decoration-none small text-primary fw-medium d-inline-flex align-items-center gap-1"
            style={{ fontSize: '0.75rem' }}
          >
            <span>Full Calendar</span>
            <ArrowRight size={12} />
          </Link>
        )}
      </div>

      <div className="cx-card-body p-0">
        {items.length === 0 ? (
          <div className="p-4 text-center text-muted small">
            <Calendar size={20} className="mb-2 text-secondary opacity-50" />
            <p className="mb-0">{emptyMessage}</p>
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {items.map((item, idx) => (
              <div key={item.id || idx} className="list-group-item p-3 border-bottom-0 border-top">
                <div className="d-flex flex-column flex-sm-row align-items-start justify-content-between gap-2">
                  <div className="min-w-0">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-1.5 py-0.5" style={{ fontSize: '0.68rem' }}>
                        {item.date || 'TBD'}
                      </span>
                      <span className="d-inline-flex align-items-center gap-1 text-muted small" style={{ fontSize: '0.72rem' }}>
                        <Clock size={11} />
                        <span>{item.time || '10:00 AM'}</span>
                      </span>
                      {item.status && (
                        <span className="badge bg-light text-secondary border px-1.5 py-0.5" style={{ fontSize: '0.65rem' }}>
                          {item.status}
                        </span>
                      )}
                    </div>

                    <h3 className="h6 mb-1 fw-bold text-dark text-truncate" style={{ fontSize: '0.825rem' }}>
                      {item.title || item.type || item.reason || 'Scheduled Proceeding'}
                    </h3>

                    <div className="d-flex flex-wrap align-items-center gap-3 text-muted small" style={{ fontSize: '0.72rem' }}>
                      {item.venue && (
                        <span className="d-inline-flex align-items-center gap-1">
                          <MapPin size={11} />
                          <span>{item.venue}</span>
                        </span>
                      )}
                      {(item.studentName || item.student) && (
                        <span className="d-inline-flex align-items-center gap-1">
                          <UserCheck size={11} />
                          <span>Student: {item.studentName || item.student?.name}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {item.caseId && (
                    <Link
                      to={`/cases/${item.caseId}`}
                      className="cx-btn cx-btn-outline cx-btn-sm py-1 px-2 text-decoration-none ms-auto ms-sm-0"
                      style={{ fontSize: '0.72rem' }}
                    >
                      <span>Case Docket</span>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingScheduleList;
