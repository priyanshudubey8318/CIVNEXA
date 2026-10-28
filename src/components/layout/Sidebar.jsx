import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CivnexaWordmark from '../common/CivnexaWordmark';
import { useAuth } from '../../context/AuthContext';
import { getNavigationForRole } from '../../routes/navigationConfig';

/**
 * Sidebar Component
 * Dynamic role-aware enterprise sidebar driven by centralized navigation configuration.
 */
export const Sidebar = ({ isCollapsed, toggleCollapsed, className = '' }) => {
  const { currentRole } = useAuth();
  const location = useLocation();

  const navItems = getNavigationForRole(currentRole?.key);

  return (
    <aside
      className={`cx-sidebar d-none d-lg-flex flex-column flex-shrink-0 transition-all ${className}`}
      style={{
        width: isCollapsed ? 'var(--cx-sidebar-collapsed-width)' : 'var(--cx-sidebar-width)',
        backgroundColor: 'var(--cx-navy-950)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 1020,
        transition: 'width 250ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Brand Header */}
      <div
        className="d-flex align-items-center justify-content-between px-3 border-bottom"
        style={{
          height: 'var(--cx-topbar-height)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <NavLink to="/dashboard" className="text-decoration-none">
          <CivnexaWordmark variant="dark" collapsed={isCollapsed} />
        </NavLink>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="btn btn-sm btn-link p-1 text-light opacity-75 hover-opacity-100"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          aria-label={isCollapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Role Banner / Context */}
      <div
        className="px-3 py-2.5 mx-2 my-2 rounded-3"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--cx-teal-400)',
              flexShrink: 0,
            }}
          />
          {!isCollapsed ? (
            <div className="overflow-hidden">
              <div
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--cx-teal-400)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                ACTIVE ROLE
              </div>
              <div
                className="text-truncate fw-semibold text-white"
                style={{ fontSize: '0.8125rem' }}
                title={currentRole.label}
              >
                {currentRole.label}
              </div>
            </div>
          ) : (
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--cx-teal-400)',
                fontWeight: 700,
              }}
              title={currentRole.label}
            >
              {currentRole.key.slice(0, 3)}
            </span>
          )}
        </div>
      </div>

      {/* Dynamic Role Navigation List */}
      <nav className="flex-grow-1 px-2 py-2 overflow-auto" aria-label="Main sidebar navigation">
        <ul className="nav nav-pills flex-column gap-1 m-0 p-0 list-unstyled">
          {navItems.map((item) => {
            const Icon = item.icon;
            const currentFull = location.pathname + (location.search || '');
            const isActive = item.path === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(item.path.split('?')[0]);

            return (
              <li key={item.id} className="nav-item">
                <NavLink
                  to={item.path}
                  className={`nav-link d-flex align-items-center position-relative py-2 px-3 rounded-2 text-decoration-none ${
                    isActive ? 'active' : ''
                  }`}
                  style={{
                    backgroundColor: isActive ? 'rgba(13, 148, 136, 0.16)' : 'transparent',
                    color: isActive ? '#FFFFFF' : 'var(--cx-slate-300)',
                    border: isActive
                      ? '1px solid rgba(45, 212, 191, 0.3)'
                      : '1px solid transparent',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.8125rem',
                    transition: 'all 150ms ease',
                  }}
                  title={isCollapsed ? item.label : undefined}
                >
                  {/* Subtle active left pill */}
                  {isActive && (
                    <span
                      style={{
                        position: 'absolute',
                        left: '-2px',
                        top: '6px',
                        bottom: '6px',
                        width: '4px',
                        backgroundColor: 'var(--cx-teal-400)',
                        borderRadius: '0 4px 4px 0',
                      }}
                    />
                  )}
                  <Icon
                    size={18}
                    className="flex-shrink-0"
                    style={{
                      color: isActive ? 'var(--cx-teal-400)' : 'var(--cx-slate-400)',
                      marginRight: isCollapsed ? 0 : '0.75rem',
                    }}
                  />
                  {!isCollapsed && (
                    <span className="flex-grow-1 text-truncate">{item.label}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span
                      className="badge ms-auto"
                      style={{
                        fontSize: '0.65rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'var(--cx-teal-300)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
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

      {/* Footer Info */}
      {!isCollapsed && (
        <div
          className="p-3 border-top mt-auto"
          style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
        >
          <div
            className="d-flex align-items-center gap-2 p-2 rounded-2"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--cx-slate-400)',
              }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--cx-slate-400)' }}>
              CIVNEXA Platform v1.0
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
