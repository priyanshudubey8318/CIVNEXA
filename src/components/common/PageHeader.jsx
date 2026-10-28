import React from 'react';
import Breadcrumbs from './Breadcrumbs';

/**
 * PageHeader Component
 * Consistent header across all CIVNEXA dashboard and feature views
 */
export const PageHeader = ({
  title,
  subtitle,
  breadcrumbs,
  badge,
  actions,
  className = '',
}) => {
  return (
    <div className={`cx-page-header mb-4 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
      <div className="d-flex flex-column flex-md-row md:align-items-center justify-content-between gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <h1 className="h3 mb-0" style={{ color: 'var(--cx-navy-900)', fontWeight: 700 }}>
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="mb-0 mt-1" style={{ color: 'var(--cx-slate-600)', fontSize: '0.875rem' }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="d-flex align-items-center gap-2 flex-wrap flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
