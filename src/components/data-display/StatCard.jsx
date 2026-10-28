import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cardHoverVariants } from '../../animations/motionVariants';

/**
 * StatCard Component
 * Displays key performance metrics with animations, trend indicators, and iconography.
 */
export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend, // { value: '+12%', isPositive: true, neutral: false }
  variant = 'default', // 'default', 'teal', 'danger', 'warning', 'info'
  onClick,
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'teal':
        return {
          iconBg: 'var(--cx-teal-50)',
          iconColor: 'var(--cx-teal-600)',
          accentBorder: 'var(--cx-teal-500)',
        };
      case 'danger':
        return {
          iconBg: 'var(--cx-danger-bg)',
          iconColor: 'var(--cx-danger)',
          accentBorder: 'var(--cx-danger)',
        };
      case 'warning':
        return {
          iconBg: 'var(--cx-warning-bg)',
          iconColor: 'var(--cx-warning)',
          accentBorder: 'var(--cx-warning)',
        };
      case 'info':
        return {
          iconBg: 'var(--cx-info-bg)',
          iconColor: 'var(--cx-info)',
          accentBorder: 'var(--cx-info)',
        };
      default:
        return {
          iconBg: 'var(--cx-slate-100)',
          iconColor: 'var(--cx-navy-900)',
          accentBorder: 'transparent',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <motion.div
      variants={cardHoverVariants}
      initial="rest"
      whileHover="hover"
      onClick={onClick}
      className={`cx-card p-4 position-relative overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        borderLeft: styles.accentBorder !== 'transparent' ? `4px solid ${styles.accentBorder}` : undefined,
      }}
    >
      <div className="d-flex align-items-start justify-content-between mb-2">
        <span
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--cx-slate-500)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {title}
        </span>
        {Icon && (
          <div
            className="d-flex align-items-center justify-content-center rounded-3 p-2 flex-shrink-0"
            style={{
              backgroundColor: styles.iconBg,
              color: styles.iconColor,
              width: '40px',
              height: '40px',
            }}
          >
            <Icon size={20} />
          </div>
        )}
      </div>

      <div className="d-flex align-items-baseline gap-2 mb-1">
        <span
          className="cx-font-heading"
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--cx-navy-900)',
            lineHeight: 1.1,
          }}
        >
          {value}
        </span>
      </div>

      {(subtitle || trend) && (
        <div className="d-flex align-items-center gap-2 mt-2" style={{ fontSize: '0.75rem' }}>
          {trend && (
            <span
              className="d-inline-flex align-items-center gap-1 fw-bold"
              style={{
                color: trend.neutral
                  ? 'var(--cx-slate-500)'
                  : trend.isPositive
                  ? 'var(--cx-success)'
                  : 'var(--cx-danger)',
              }}
            >
              {trend.neutral ? (
                <Minus size={13} />
              ) : trend.isPositive ? (
                <TrendingUp size={13} />
              ) : (
                <TrendingDown size={13} />
              )}
              {trend.value}
            </span>
          )}
          {subtitle && (
            <span style={{ color: 'var(--cx-slate-500)' }}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
