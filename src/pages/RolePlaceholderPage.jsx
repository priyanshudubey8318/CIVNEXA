import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import AnimatedPage from '../components/common/AnimatedPage';
import PageHeader from '../components/common/PageHeader';
import { useAuth } from '../context/AuthContext';
import { Layers, Calendar, ArrowRight, ShieldCheck, Home } from 'lucide-react';

/**
 * RolePlaceholderPage Component
 * Clean, production-styled placeholder for role-specific routes scheduled for implementation
 * in subsequent frontend phases (FE-3, FE-4, FE-5).
 * Prevents broken navigation links and clearly documents the module roadmap.
 */
export const RolePlaceholderPage = ({ title, description, phase = 'FE-3', icon: Icon = Layers }) => {
  const location = useLocation();
  const { currentRole } = useAuth();

  const routeName = title || location.pathname.split('/').filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' • ');

  return (
    <AnimatedPage>
      <PageHeader
        title={routeName}
        subtitle={description || `Section for ${currentRole.label} role.`}
        breadcrumbs={[{ label: 'Workspace' }, { label: routeName }]}
        badge={
          <span className="badge bg-light text-secondary border px-2.5 py-1">
            Not Available
          </span>
        }
      />

      <div className="cx-card p-4 p-md-5 text-center">
        <div
          className="d-inline-flex align-items-center justify-content-center p-3 mb-3 rounded-circle"
          style={{ backgroundColor: 'var(--cx-slate-100)', color: 'var(--cx-teal-700)', width: '64px', height: '64px' }}
        >
          <Icon size={32} />
        </div>

        <h2 className="h5 fw-bold text-dark mb-2">
          {routeName}
        </h2>
        <p className="text-muted small mx-auto mb-4" style={{ maxWidth: '520px', lineHeight: 1.6 }}>
          This section is not yet available in the demonstration.
        </p>

        <div className="d-flex flex-wrap justify-content-center gap-2">
          <Link to="/dashboard" className="cx-btn cx-btn-primary">
            <Home size={15} />
            <span>Return to Dashboard</span>
          </Link>
          <Link to="/cases" className="cx-btn cx-btn-outline">
            <span>Explore Active Case Registry</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default RolePlaceholderPage;
