import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowRight } from 'lucide-react';

/**
 * QuickActionsPanel Component
 * Fast-access institutional action bar navigating directly into role-authorized workflows.
 */
export const QuickActionsPanel = ({
  actions = [],
  title = 'Quick Workflow Actions',
  subtitle = 'Initiate authorized reporting and governance procedures',
}) => {
  return (
    <div className="cx-card shadow-sm border-0 mb-4">
      <div className="cx-card-header d-flex align-items-center justify-content-between p-3 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <Zap size={16} className="text-warning" />
          <div>
            <h2 className="h6 mb-0 fw-bold text-dark">{title}</h2>
            {subtitle && <p className="text-muted small mb-0" style={{ fontSize: '0.72rem' }}>{subtitle}</p>}
          </div>
        </div>
      </div>

      <div className="cx-card-body p-3">
        <div className="row g-2.5">
          {actions.map((act, idx) => {
            const Icon = act.icon || Zap;
            const btnVariant = act.variant || 'outline';

            const content = (
              <div className="d-flex align-items-center justify-content-between w-100 p-2.5 rounded border text-start h-100 transition-all hover-shadow-sm"
                   style={{
                     backgroundColor: act.featured ? 'var(--cx-teal-50)' : '#FFFFFF',
                     borderColor: act.featured ? 'var(--cx-teal-300)' : '#E2E8F0',
                     textDecoration: 'none',
                   }}>
                <div className="d-flex align-items-center gap-2.5 min-w-0">
                  <div
                    className="rounded d-flex align-items-center justify-content-center text-white"
                    style={{
                      width: '34px',
                      height: '34px',
                      backgroundColor: act.color || 'var(--cx-teal-700)',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="d-flex align-items-center gap-1.5">
                      <span className="fw-bold text-dark small text-truncate" style={{ fontSize: '0.8rem' }}>
                        {act.label}
                      </span>
                      {act.badge && (
                        <span className="badge bg-danger text-white" style={{ fontSize: '0.62rem' }}>
                          {act.badge}
                        </span>
                      )}
                    </div>
                    {act.description && (
                      <p className="text-muted mb-0 small text-truncate" style={{ fontSize: '0.7rem' }}>
                        {act.description}
                      </p>
                    )}
                  </div>
                </div>
                <ArrowRight size={13} className="text-muted ms-2 flex-shrink-0" />
              </div>
            );

            return (
              <div key={idx} className="col-12 col-sm-6 col-lg-3">
                {act.to ? (
                  <Link to={act.to} className="text-decoration-none d-block h-100">
                    {content}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={act.onClick}
                    className="btn p-0 border-0 w-100 text-start h-100 bg-transparent"
                  >
                    {content}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuickActionsPanel;
