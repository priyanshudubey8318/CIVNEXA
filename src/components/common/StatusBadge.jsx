import React from 'react';

/**
 * StatusBadge Component
 * Renders consistent status indicators with accessible contrast and semantic colors.
 */
export const StatusBadge = ({ status, label, className = '' }) => {
  const getStatusConfig = (val) => {
    switch (val?.toUpperCase()) {
      case 'SUBMITTED':
      case 'NEW':
        return {
          type: 'info',
          text: label || 'New Submission',
        };
      case 'UNDER_REVIEW':
        return {
          type: 'warning',
          text: label || 'Under Review',
        };
      case 'INVESTIGATION':
        return {
          type: 'confidential',
          text: label || 'Investigation',
        };
      case 'HEARING_SCHEDULED':
        return {
          type: 'warning',
          text: label || 'Hearing Scheduled',
        };
      case 'RESOLVED':
      case 'CLOSED':
        return {
          type: 'success',
          text: label || 'Resolved',
        };
      case 'APPEALED':
        return {
          type: 'danger',
          text: label || 'Appealed',
        };
      default:
        return {
          type: 'neutral',
          text: label || status || 'Unknown',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`cx-badge cx-badge-${config.type} ${className}`}>
      <span className="cx-badge-dot" aria-hidden="true" />
      <span>{config.text}</span>
    </span>
  );
};

export default StatusBadge;
