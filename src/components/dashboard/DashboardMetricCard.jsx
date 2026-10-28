import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';

const VARIANT_CONFIGS = {
  teal: {
    bg: 'var(--cx-teal-50)',
    color: 'var(--cx-teal-700)',
    border: 'var(--cx-teal-200)',
    iconBg: 'rgba(15, 118, 110, 0.12)',
    badgeBg: 'var(--cx-teal-100)',
    badgeText: 'var(--cx-teal-800)',
  },
  primary: {
    bg: 'rgba(37, 99, 235, 0.04)',
    color: '#2563EB',
    border: 'rgba(37, 99, 235, 0.2)',
    iconBg: 'rgba(37, 99, 235, 0.12)',
    badgeBg: 'rgba(37, 99, 235, 0.1)',
    badgeText: '#1D4ED8',
  },
  warning: {
    bg: 'var(--cx-amber-50)',
    color: 'var(--cx-amber-800)',
    border: 'var(--cx-amber-200)',
    iconBg: 'rgba(217, 119, 6, 0.12)',
    badgeBg: 'var(--cx-amber-100)',
    badgeText: 'var(--cx-amber-800)',
  },
  danger: {
    bg: 'rgba(239, 68, 68, 0.04)',
    color: '#DC2626',
    border: 'rgba(239, 68, 68, 0.2)',
    iconBg: 'rgba(239, 68, 68, 0.12)',
    badgeBg: 'rgba(239, 68, 68, 0.1)',
    badgeText: '#B91C1C',
  },
  success: {
    bg: 'rgba(16, 185, 129, 0.04)',
    color: '#059669',
    border: 'rgba(16, 185, 129, 0.2)',
    iconBg: 'rgba(16, 185, 129, 0.12)',
    badgeBg: 'rgba(16, 185, 129, 0.1)',
    badgeText: '#047857',
  },
  purple: {
    bg: 'rgba(139, 92, 246, 0.04)',
    color: '#7C3AED',
    border: 'rgba(139, 92, 246, 0.2)',
    iconBg: 'rgba(139, 92, 246, 0.12)',
    badgeBg: 'rgba(139, 92, 246, 0.1)',
    badgeText: '#6D28D9',
  },
  neutral: {
    bg: '#F8FAFC',
    color: '#334155',
    border: '#E2E8F0',
    iconBg: 'rgba(100, 116, 139, 0.1)',
    badgeBg: '#F1F5F9',
    badgeText: '#475569',
  },
  default: {
    bg: '#FFFFFF',
    color: '#0F172A',
    border: '#E2E8F0',
    iconBg: '#F1F5F9',
    badgeBg: '#F8FAFC',
    badgeText: '#64748B',
  },
};

/**
 * DashboardMetricCard Component
 * High-impact institutional KPI card with click-to-filter capability,
 * trend trajectory, and accessible focus states.
 */
export const DashboardMetricCard = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  variant = 'default',
  onClick = null,
  isActive = false,
  className = '',
}) => {
  const conf = VARIANT_CONFIGS[variant] || VARIANT_CONFIGS.default;
  const isClickable = Boolean(onClick);

  return (
    <motion.div
      whileHover={isClickable ? { y: -2, transition: { duration: 0.15 } } : {}}
      whileTap={isClickable ? { scale: 0.99 } : {}}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`cx-card h-100 ${isClickable ? 'cursor-pointer' : ''} ${className}`}
      style={{
        border: isActive ? `2px solid ${conf.color}` : `1px solid ${conf.border}`,
        boxShadow: isActive
          ? `0 0 0 3px ${conf.badgeBg}, 0 4px 6px -1px rgba(0,0,0,0.06)`
          : '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.18s ease-in-out',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isActive && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            backgroundColor: conf.color,
          }}
        />
      )}

      <div className="cx-card-body p-3 p-md-3.5 d-flex flex-column justify-content-between h-100">
        <div>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span
              className="fw-semibold text-uppercase text-truncate"
              style={{
                fontSize: '0.72rem',
                letterSpacing: '0.5px',
                color: '#64748B',
                maxWidth: '75%',
              }}
              title={title}
            >
              {title}
            </span>
            {Icon && (
              <div
                className="rounded d-flex align-items-center justify-content-center"
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: conf.iconBg,
                  color: conf.color,
                  flexShrink: 0,
                }}
              >
                <Icon size={16} />
              </div>
            )}
          </div>

          <div className="d-flex align-items-baseline gap-2 mb-1">
            <span
              className="fw-bold cx-font-mono"
              style={{
                fontSize: '1.75rem',
                lineHeight: 1.1,
                color: conf.color === '#0F172A' ? '#0F172A' : conf.color,
              }}
            >
              {value !== undefined && value !== null ? value : '—'}
            </span>
            {isClickable && (
              <span
                className="badge bg-light text-secondary border px-1.5 py-0.5 ms-auto"
                style={{ fontSize: '0.65rem' }}
                title="Click to filter records"
              >
                <Filter size={10} className="me-0.5" />
                {isActive ? 'Filtered' : 'Filter'}
              </span>
            )}
          </div>
        </div>

        <div className="pt-2 mt-2 border-top d-flex align-items-center justify-content-between">
          <span className="text-muted small text-truncate" style={{ fontSize: '0.75rem' }}>
            {subtitle || 'Updated in real-time'}
          </span>

          {trend && (
            <span
              className="d-inline-flex align-items-center gap-1 small fw-semibold"
              style={{
                fontSize: '0.72rem',
                color: trend.isPositive ? '#059669' : '#DC2626',
              }}
            >
              {trend.isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              <span>{typeof trend === 'string' ? trend : trend.value}</span>
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardMetricCard;
