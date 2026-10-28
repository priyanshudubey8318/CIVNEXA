import React from 'react';

/**
 * LoadingSkeleton Component
 * Provides clean shimmering placeholders during data fetch states
 */
export const LoadingSkeleton = ({ type = 'line', count = 1, height = 20, width = '100%', className = '' }) => {
  const shimmerStyle = {
    background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
    backgroundSize: '200% 100%',
    animation: 'cxShimmer 1.5s infinite linear',
    borderRadius: 'var(--cx-border-radius-sm)',
  };

  if (type === 'table') {
    return (
      <div className={`cx-table-skeleton p-3 ${className}`}>
        <style>
          {`
            @keyframes cxShimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
          `}
        </style>
        <div className="d-flex gap-3 mb-3 pb-2 border-bottom">
          {[15, 30, 20, 15, 20].map((w, idx) => (
            <div key={idx} style={{ ...shimmerStyle, height: '18px', width: `${w}%` }} />
          ))}
        </div>
        {Array.from({ length: count || 4 }).map((_, rIdx) => (
          <div key={rIdx} className="d-flex gap-3 py-2.5 border-bottom border-light">
            {[15, 30, 20, 15, 20].map((w, cIdx) => (
              <div key={cIdx} style={{ ...shimmerStyle, height: '16px', width: `${w}%` }} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className={`row g-3 ${className}`}>
        {Array.from({ length: count || 4 }).map((_, idx) => (
          <div key={idx} className="col-12 col-sm-6 col-xl-3">
            <div className="cx-card p-4">
              <div style={{ ...shimmerStyle, height: '14px', width: '50%', marginBottom: '12px' }} />
              <div style={{ ...shimmerStyle, height: '28px', width: '35%', marginBottom: '8px' }} />
              <div style={{ ...shimmerStyle, height: '12px', width: '70%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`d-flex flex-column gap-2 ${className}`}>
      <style>
        {`
          @keyframes cxShimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}
      </style>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          style={{
            ...shimmerStyle,
            height: typeof height === 'number' ? `${height}px` : height,
            width: typeof width === 'number' ? `${width}px` : width,
          }}
        />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
