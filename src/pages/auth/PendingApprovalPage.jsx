import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ShieldCheck, CheckCircle2, LogIn, Building, Info, ArrowLeft } from 'lucide-react';
import { pageTransitionVariants } from '../../animations/motionVariants';

export const PendingApprovalPage = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  return (
    <motion.div
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="cx-card p-4 p-md-5 shadow-lg text-center"
      style={{ maxWidth: '520px', margin: '0 auto' }}
    >
      <div
        className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
        style={{ width: '64px', height: '64px', backgroundColor: 'rgba(234, 179, 8, 0.12)', color: 'var(--cx-amber-500, #d97706)' }}
      >
        <Clock size={32} />
      </div>

      <h1 className="h4 fw-bold text-dark mb-1" style={{ color: 'var(--cx-navy-900)' }}>
        Email Verified — Pending Administrative Approval
      </h1>
      <p className="text-muted small mb-4">
        Your institutional email address has been successfully verified.
      </p>

      {/* Account Status Card */}
      <div className="bg-light p-3 rounded-3 text-start mb-4 border" style={{ borderColor: 'var(--cx-border-color)' }}>
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span className="small text-muted">Account Status:</span>
          <span className="badge bg-warning text-dark px-2.5 py-1.5 fw-semibold" style={{ fontSize: '0.75rem' }}>
            PENDING_APPROVAL
          </span>
        </div>
        {email && (
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="small text-muted">Verified Email:</span>
            <span className="small fw-semibold text-dark font-monospace">{email}</span>
          </div>
        )}
        <div className="d-flex align-items-center justify-content-between">
          <span className="small text-muted">Provisioning Entity:</span>
          <span className="small fw-semibold text-dark">University Registrar / Proctor Office</span>
        </div>
      </div>

      {/* Advisory Message */}
      <div className="alert alert-info p-3 small text-start d-flex align-items-start gap-2 mb-4 rounded-3" role="region" aria-label="Review timeline">
        <Info size={18} className="mt-0.5 flex-shrink-0 text-primary" />
        <div>
          <strong>Next Steps:</strong> In accordance with university cybersecurity policies, student self-registrations undergo roster verification by academic administrators before platform activation. Once approved, your status will become <strong>ACTIVE</strong> and you can sign in with your credentials.
        </div>
      </div>

      {/* Action Buttons */}
      <div className="d-flex flex-column gap-2">
        <Link
          to="/login"
          className="cx-btn cx-btn-primary w-100 py-2.5 d-flex align-items-center justify-content-center gap-2"
        >
          <LogIn size={18} />
          <span>Return to Sign In</span>
        </Link>
        <Link
          to="/"
          className="btn btn-outline-secondary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
          style={{ fontSize: '0.9rem' }}
        >
          <Building size={16} />
          <span>Visit CIVNEXA Portal</span>
        </Link>
      </div>
    </motion.div>
  );
};

export default PendingApprovalPage;
