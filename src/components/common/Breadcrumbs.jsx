import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumbs Component
 * Provides clear hierarchical navigation cues
 */
export const Breadcrumbs = ({ items = [] }) => {
  return (
    <nav aria-label="Breadcrumb" className="d-flex align-items-center mb-2">
      <ol className="list-unstyled d-flex align-items-center m-0 p-0" style={{ fontSize: '0.8125rem' }}>
        <li className="d-flex align-items-center">
          <Link
            to="/"
            className="text-decoration-none d-flex align-items-center text-muted"
            style={{ color: 'var(--cx-slate-500)', transition: 'color 150ms' }}
          >
            <Home size={14} className="me-1" />
            <span>Home</span>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="d-flex align-items-center">
              <ChevronRight size={13} className="mx-1.5" style={{ color: 'var(--cx-slate-400)' }} />
              {isLast || !item.to ? (
                <span
                  style={{
                    color: 'var(--cx-navy-900)',
                    fontWeight: 600,
                  }}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="text-decoration-none"
                  style={{ color: 'var(--cx-slate-600)' }}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
