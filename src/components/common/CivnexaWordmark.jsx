import React from 'react';

/**
 * CIVNEXA Wordmark
 * An original typographic wordmark and geometric mark implemented with SVG & CSS.
 * Represents university conduct, institutional integrity, and connected support.
 */
export const CivnexaWordmark = ({
  variant = 'dark', // 'dark' (for dark navy sidebar) or 'light' (for white surfaces)
  collapsed = false,
  showTagline = true,
  className = '',
}) => {
  return (
    <div
      className={`cx-wordmark ${variant === 'light' ? 'cx-wordmark-light' : ''} ${className}`}
      aria-label="CIVNEXA - Campus Conduct, Grievance, Safety & Counseling Management System"
    >
      {/* Geometric Mark: Hexagonal shield representing protection, equity, and institutional governance */}
      <div className="cx-wordmark-icon" aria-hidden="true">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Shield Hexagon */}
          <path
            d="M12 2L20 6.5V12C20 16.5 16.5 20.5 12 22C7.5 20.5 4 16.5 4 12V6.5L12 2Z"
            stroke="url(#shieldGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Inner Pillars of Resolution & Support */}
          <path
            d="M9 10V15M12 8V16M15 11V15"
            stroke="#2DD4BF"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="shieldGrad" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2DD4BF" />
              <stop offset="1" stopColor="#0284C7" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {!collapsed && (
        <div className="cx-wordmark-text">
          <div className="cx-wordmark-title">
            CIV<span style={{ color: 'var(--cx-teal-400)' }}>NEXA</span>
          </div>
          {showTagline && (
            <div className="cx-wordmark-subtitle">
              CAMPUS CONDUCT & SUPPORT
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CivnexaWordmark;
