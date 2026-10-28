import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, UserCheck, Calendar, Bell } from 'lucide-react';
import { ROLES } from '../../constants/roles';

/**
 * RoleDashboardHeader Component
 * Role-specific institutional welcome banner with user credentials, designation,
 * department, security status, and contextual status pills.
 */
export const RoleDashboardHeader = ({
  user,
  roleInfo,
  statusPills = [],
  actions = null,
  title = null,
  subtitle = null,
}) => {
  const role = roleInfo || ROLES[user?.role] || {
    label: user?.roleLabel || user?.role || 'Campus User',
    badgeColor: 'primary',
    description: 'CIVNEXA Institutional System Workspace',
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="cx-card mb-4 border-0 shadow-sm"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 100%)',
        borderLeft: '4px solid var(--cx-teal-600)',
      }}
    >
      <div className="cx-card-body p-3 p-md-4">
        <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3">
          {/* User profile & greeting */}
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
              style={{
                width: '52px',
                height: '52px',
                backgroundColor: 'var(--cx-teal-700)',
                fontSize: '1.25rem',
                letterSpacing: '0.5px',
                flexShrink: 0,
              }}
            >
              {user?.avatar || user?.name?.substring(0, 2)?.toUpperCase() || 'CX'}
            </div>

            <div>
              <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                <h1 className="h4 mb-0 fw-bold text-dark" style={{ letterSpacing: '-0.2px' }}>
                  {title || `Welcome back, ${user?.name || 'Administrator'}`}
                </h1>
                <span
                  className={`badge bg-${role.badgeColor || 'primary'} text-white px-2.5 py-1`}
                  style={{ fontSize: '0.725rem', fontWeight: 600, letterSpacing: '0.3px' }}
                >
                  {role.label}
                </span>
              </div>

              <div className="text-muted small d-flex flex-wrap align-items-center gap-2">
                <span>{subtitle || user?.title || user?.designation || role.description}</span>
                {user?.department && (
                  <>
                    <span className="text-secondary">•</span>
                    <span className="fw-medium text-secondary">{user.department}</span>
                  </>
                )}
                <span className="text-secondary">•</span>
                <span className="d-inline-flex align-items-center gap-1 text-muted">
                  <Calendar size={13} />
                  <span>{todayFormatted}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons & custom toolbar */}
          {actions && (
            <div className="d-flex align-items-center flex-wrap gap-2 w-100 w-lg-auto justify-content-lg-end">
              {actions}
            </div>
          )}
        </div>

        {/* Status indicator pills */}
        {statusPills && statusPills.length > 0 && (
          <div className="d-flex flex-wrap align-items-center gap-2 pt-3 mt-3 border-top">
            <span className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
              Quick Status:
            </span>
            {statusPills.map((pill, idx) => {
              const IconComponent = pill.icon || ShieldCheck;
              const pillVariant = pill.variant || 'light';
              return (
                <div
                  key={idx}
                  className={`badge bg-${pillVariant}-subtle text-${pillVariant} border border-${pillVariant}-subtle d-inline-flex align-items-center gap-1.5 py-1.5 px-2.5 fw-medium`}
                  style={{ fontSize: '0.75rem' }}
                >
                  <IconComponent size={13} />
                  <span>
                    <strong>{pill.value}</strong> {pill.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default RoleDashboardHeader;
