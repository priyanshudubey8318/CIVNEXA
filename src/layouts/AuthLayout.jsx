import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import CivnexaWordmark from '../components/common/CivnexaWordmark';
import { Shield } from 'lucide-react';

/**
 * AuthLayout Component
 * Focused, distraction-free authentication layout for login and credential recovery.
 */
export const AuthLayout = () => {
  const location = useLocation();

  return (
    <div
      className="cx-auth-layout min-vh-100 d-flex flex-column justify-content-between"
      style={{
        backgroundColor: 'var(--cx-slate-100)',
        backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(13, 148, 136, 0.05) 0%, transparent 60%)',
      }}
    >
      {/* Main Authentication Card Container */}
      <div className="container py-4 py-md-5 my-auto">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5" style={{ maxWidth: '520px' }}>
            {/* Header Brand */}
            <div className="text-center mb-4">
              <div className="d-inline-block p-2 rounded-3 bg-white shadow-xs border mb-2">
                <CivnexaWordmark variant="light" showTagline={false} />
              </div>
              <div
                className="text-uppercase fw-bold mt-1"
                style={{
                  fontSize: '0.6875rem',
                  letterSpacing: '0.08em',
                  color: 'var(--cx-teal-700)',
                }}
              >
                Report • Verify • Support • Resolve
              </div>
            </div>

            {/* Dynamic Auth View (Login, Forgot Password, Reset Password) */}
            <AnimatePresence mode="wait">
              <Outlet key={location.pathname} />
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Institutional Footer */}
      <footer
        className="py-3 px-3 border-top text-center text-muted bg-white"
        style={{ fontSize: '0.75rem', borderColor: 'var(--cx-slate-200)' }}
      >
        <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center gap-2">
          <span>CIVNEXA Campus Conduct & Support System</span>
          <span className="d-none d-sm-inline">•</span>
          <span>Enterprise University Platform v1.0.0</span>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;
