import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Plus } from 'lucide-react';

/**
 * DashboardEmptyState Component
 * Meaningful and constructive empty state for role workspaces.
 */
export const DashboardEmptyState = ({
  title = 'All Records Up to Date',
  description = 'There are no active or pending items requiring attention in this queue.',
  icon: Icon = CheckCircle2,
  action = null,
}) => {
  return (
    <div className="cx-card shadow-sm border-0 text-center p-4 p-md-5">
      <div
        className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
        style={{
          width: '56px',
          height: '56px',
          backgroundColor: 'rgba(15, 118, 110, 0.08)',
          color: 'var(--cx-teal-700)',
        }}
      >
        <Icon size={26} />
      </div>

      <h3 className="h5 fw-bold text-dark mb-1">{title}</h3>
      <p className="text-muted small mb-3 mx-auto" style={{ maxWidth: '440px', fontSize: '0.825rem' }}>
        {description}
      </p>

      {action && (
        <div>
          {action.to ? (
            <Link to={action.to} className="cx-btn cx-btn-teal text-decoration-none">
              {action.icon && <action.icon size={15} />}
              <span>{action.label}</span>
            </Link>
          ) : (
            <button type="button" onClick={action.onClick} className="cx-btn cx-btn-teal">
              {action.icon && <action.icon size={15} />}
              <span>{action.label}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardEmptyState;
