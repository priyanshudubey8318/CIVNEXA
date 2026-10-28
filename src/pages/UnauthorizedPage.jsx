import React from 'react';
import { Link } from 'react-router-dom';
import AnimatedPage from '../components/common/AnimatedPage';
import { ShieldAlert, Home, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UnauthorizedPage = () => {
  const { currentRole } = useAuth();

  return (
    <AnimatedPage>
      <div
        className="d-flex flex-column align-items-center justify-content-center text-center p-5 my-5"
        style={{ minHeight: '50vh' }}
      >
        <div
          className="d-flex align-items-center justify-content-center rounded-circle p-4 mb-3"
          style={{ backgroundColor: 'var(--cx-danger-bg)', color: 'var(--cx-danger)', width: '80px', height: '80px' }}
        >
          <ShieldAlert size={40} />
        </div>
        <h1 className="h3 fw-bold text-dark mb-1">Access Restricted</h1>
        <p className="text-muted small mb-2" style={{ maxWidth: '420px' }}>
          Your current persona role (<strong className="text-dark">{currentRole.label}</strong>) does not have authorization to view this sensitive institutional dossier or confidential hearing file.
        </p>
        <p className="text-muted small mb-4" style={{ fontSize: '0.75rem' }}>
          (Use the Development Role Switcher in the topbar to test access with Dean or Central Admin roles.)
        </p>
        <div className="d-flex gap-2">
          <Link to="/" className="cx-btn cx-btn-outline">
            <Home size={15} />
            <span>Return to Overview</span>
          </Link>
          <Link to="/settings" className="cx-btn cx-btn-primary">
            <RefreshCw size={15} />
            <span>Change Active Role</span>
          </Link>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default UnauthorizedPage;
