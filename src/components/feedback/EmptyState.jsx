import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * EmptyState Component
 * Displays helpful, clean guidance when lists or queries return no results.
 */
export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are currently no items matching your criteria or active filters.',
  action,
  className = '',
}) => {
  return (
    <div
      className={`cx-empty-state d-flex flex-column align-items-center justify-content-center text-center p-5 ${className}`}
      style={{
        borderRadius: 'var(--cx-border-radius-lg)',
        border: '1px dashed var(--cx-slate-300)',
        backgroundColor: 'var(--cx-slate-50)',
      }}
    >
      <div
        className="d-flex align-items-center justify-content-center mb-3"
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--cx-slate-200)',
          color: 'var(--cx-slate-600)',
        }}
      >
        <Icon size={26} />
      </div>
      <h3
        className="h5 mb-1"
        style={{ color: 'var(--cx-navy-900)', fontWeight: 600 }}
      >
        {title}
      </h3>
      <p
        className="text-muted mb-3"
        style={{ maxWidth: '420px', fontSize: '0.875rem' }}
      >
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
