import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

/**
 * ErrorState Component
 * Displays clear feedback and recovery options when operations fail.
 */
export const ErrorState = ({
  title = 'Unable to load data',
  message = 'An unexpected issue occurred while retrieving the requested records.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`cx-error-state p-4 text-center d-flex flex-column align-items-center justify-content-center ${className}`}
      style={{
        borderRadius: 'var(--cx-border-radius-lg)',
        border: '1px solid var(--cx-danger-border)',
        backgroundColor: 'var(--cx-danger-bg)',
      }}
      role="alert"
    >
      <div
        className="d-flex align-items-center justify-content-center mb-2"
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: '#FEE2E2',
          color: 'var(--cx-danger)',
        }}
      >
        <AlertCircle size={24} />
      </div>
      <h3 className="h6 mb-1" style={{ color: 'var(--cx-danger-text)', fontWeight: 700 }}>
        {title}
      </h3>
      <p className="small mb-3" style={{ color: '#7F1D1D', maxWidth: '420px' }}>
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="cx-btn cx-btn-outline cx-btn-sm"
        >
          <RotateCcw size={14} />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
