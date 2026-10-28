import React from 'react';

/**
 * FormField Component
 * Accessible wrapper for form controls with labels, hints, and inline validation messages
 */
export const FormField = ({
  label,
  id,
  hint,
  error,
  required = false,
  children,
  className = '',
}) => {
  return (
    <div className={`cx-form-group mb-3 ${className}`}>
      {label && (
        <label htmlFor={id} className="cx-form-label">
          {label}
          {required && <span className="text-danger ms-1" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <div id={id ? `${id}-hint` : undefined} className="cx-form-hint">
          {hint}
        </div>
      )}
      {error && (
        <div
          id={id ? `${id}-error` : undefined}
          className="cx-form-error d-flex align-items-center gap-1"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default FormField;
