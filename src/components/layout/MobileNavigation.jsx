import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield } from 'lucide-react';
import CivnexaWordmark from '../common/CivnexaWordmark';
import { useAuth } from '../../context/AuthContext';
import { getNavigationForRole } from '../../routes/navigationConfig';

/**
 * MobileNavigation Drawer
 * Accessible touch-friendly offcanvas navigation for mobile and tablet devices
 * driven by role-aware navigation configuration.
 */
export const MobileNavigation = ({ isOpen, onClose }) => {
  const { currentRole } = useAuth();
  const location = useLocation();

  // Close drawer on route change
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname, location.search]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const navItems = getNavigationForRole(currentRole?.key);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="cx-mobile-nav-root" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="position-fixed inset-0 bg-dark bg-opacity-50"
            style={{
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1040,
              backdropFilter: 'blur(2px)',
            }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="position-fixed top-0 start-0 bottom-0 d-flex flex-column"
            style={{
              width: '280px',
              maxWidth: '85vw',
              backgroundColor: 'var(--cx-navy-950)',
              zIndex: 1050,
              boxShadow: 'var(--cx-shadow-xl)',
            }}
          >
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between p-3 border-bottom border-secondary border-opacity-25">
              <CivnexaWordmark variant="dark" />
              <button
                type="button"
                onClick={onClose}
                className="btn btn-link text-white p-1"
                aria-label="Close navigation drawer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Active Role Indicator */}
            <div className="p-3 bg-white bg-opacity-5 border-bottom border-secondary border-opacity-10">
              <div className="d-flex align-items-center gap-2">
                <Shield size={16} className="text-info" />
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--cx-teal-400)', fontWeight: 700 }}>
                    ACTIVE ROLE (DEMO)
                  </div>
                  <div className="text-white fw-bold" style={{ fontSize: '0.8125rem' }}>
                    {currentRole.label}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="flex-grow-1 p-3 overflow-auto" aria-label="Mobile navigation links">
              <ul className="nav nav-pills flex-column gap-1 m-0 p-0 list-unstyled">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path.split('?')[0]);

                  return (
                    <li key={item.id}>
                      <NavLink
                        to={item.path}
                        className={`nav-link d-flex align-items-center gap-3 py-2.5 px-3 rounded-2 text-decoration-none ${
                          isActive ? 'active' : ''
                        }`}
                        style={{
                          backgroundColor: isActive ? 'rgba(13, 148, 136, 0.2)' : 'transparent',
                          color: isActive ? '#FFFFFF' : 'var(--cx-slate-300)',
                          fontWeight: isActive ? 600 : 500,
                          fontSize: '0.85rem',
                        }}
                      >
                        <Icon size={18} style={{ color: isActive ? 'var(--cx-teal-400)' : 'var(--cx-slate-400)' }} />
                        <span className="flex-grow-1 text-truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className="badge"
                            style={{
                              fontSize: '0.62rem',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              color: 'var(--cx-teal-300)',
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Footer */}
            <div className="p-3 border-top border-secondary border-opacity-25 text-center text-muted small">
              CIVNEXA v1.0.0
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MobileNavigation;
