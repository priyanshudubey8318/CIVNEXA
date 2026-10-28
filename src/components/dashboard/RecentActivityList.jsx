import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Clock, ArrowRight, UserCheck, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

/**
 * RecentActivityList Component
 * Formatted audit and workflow event feed scoped to role context.
 */
export const RecentActivityList = ({
  activities = [],
  title = 'Recent Activity & Audit Feed',
  subtitle = 'System, procedural, and committee actions',
  maxItems = 5,
  viewAllLink = null,
  emptyMessage = 'No recent activity recorded.',
}) => {
  const displayItems = activities.slice(0, maxItems);

  const getEventIcon = (actionText = '') => {
    const act = (actionText || '').toLowerCase();
    if (act.includes('resolved') || act.includes('closed') || act.includes('approved')) {
      return <CheckCircle size={14} className="text-success" />;
    }
    if (act.includes('hearing') || act.includes('deliberation') || act.includes('recommendation')) {
      return <UserCheck size={14} className="text-primary" />;
    }
    if (act.includes('escalated') || act.includes('critical') || act.includes('flagged')) {
      return <AlertTriangle size={14} className="text-danger" />;
    }
    return <FileText size={14} className="text-secondary" />;
  };

  return (
    <div className="cx-card h-100 shadow-sm border-0">
      <div className="cx-card-header d-flex align-items-center justify-content-between p-3 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <Activity size={16} className="text-primary" />
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
            <span>View All</span>
            <ArrowRight size={12} />
          </Link>
        )}
      </div>

      <div className="cx-card-body p-0">
        {displayItems.length === 0 ? (
          <div className="p-4 text-center text-muted small">
            <Clock size={20} className="mb-2 text-secondary opacity-50" />
            <p className="mb-0">{emptyMessage}</p>
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {displayItems.map((item, idx) => (
              <div key={item.id || idx} className="list-group-item p-3 border-bottom-0 border-top">
                <div className="d-flex align-items-start gap-2.5">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center mt-0.5"
                    style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      flexShrink: 0,
                    }}
                  >
                    {getEventIcon(item.action || item.title)}
                  </div>

                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-1 mb-0.5">
                      <span className="fw-semibold text-dark small text-truncate" style={{ fontSize: '0.8rem' }}>
                        {item.action || item.title}
                      </span>
                      <span className="text-muted small d-inline-flex align-items-center gap-1" style={{ fontSize: '0.7rem' }}>
                        <Clock size={11} />
                        <span>
                          {item.timestamp ? new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                        </span>
                      </span>
                    </div>

                    <p className="text-secondary small mb-1 line-clamp-2" style={{ fontSize: '0.75rem', lineHeight: '1.35' }}>
                      {item.description || item.noteText || item.details || item.summary || 'Recorded system transaction.'}
                    </p>

                    <div className="d-flex flex-wrap align-items-center gap-2">
                      {item.caseId && (
                        <Link
                          to={`/cases/${item.caseId}`}
                          className="cx-font-mono text-decoration-none badge bg-light text-secondary border px-1.5 py-0.5"
                          style={{ fontSize: '0.68rem' }}
                        >
                          {item.caseNumber || item.caseId}
                        </Link>
                      )}
                      {item.actor && (
                        <span className="text-muted small" style={{ fontSize: '0.68rem' }}>
                          by <strong className="text-dark">{typeof item.actor === 'string' ? item.actor : item.actor.name}</strong>
                          {typeof item.actor === 'object' && item.actor.role ? ` (${item.actor.role})` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivityList;
