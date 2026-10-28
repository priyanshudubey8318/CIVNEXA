import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  User,
  Shield,
  LogOut,
  ChevronDown,
  Info,
  Check,
} from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import NotificationPanel from '../feedback/NotificationPanel';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

/**
 * Topbar Component
 * Provides global navigation actions, development demo role switcher, notifications, and profile details
 */
export const Topbar = ({ onOpenMobileMenu, className = '' }) => {
  const { currentUser, currentRole, roles, allUsers, switchRole, switchUser, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const roleMenuRef = useRef(null);
  const profileMenuRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target)) {
        setIsRoleMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSelect = (roleKey) => {
    switchRole(roleKey);
    setIsRoleMenuOpen(false);
    toast.info(`Switched role to ${roles[roleKey]?.label}`);
  };

  return (
    <header
      className={`cx-topbar d-flex align-items-center justify-content-between px-3 px-md-4 bg-white border-bottom ${className}`}
      style={{
        height: 'var(--cx-topbar-height)',
        borderColor: 'var(--cx-slate-200)',
        position: 'sticky',
        top: 0,
        zIndex: 1010,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
      }}
    >
      {/* Left: Mobile hamburger & Global quick search */}
      <div className="d-flex align-items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="cx-btn cx-btn-ghost p-1.5 d-lg-none"
          aria-label="Open mobile navigation drawer"
        >
          <Menu size={22} />
        </button>

        <div className="d-none d-md-flex align-items-center position-relative" style={{ width: '280px' }}>
          <Search
            size={16}
            className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted pointer-events-none"
            style={{ pointerEvents: 'none' }}
          />
          <input
            type="text"
            placeholder="Search cases, students, records..."
            className="cx-input ps-5 pe-3 py-1.5"
            style={{ fontSize: '0.8125rem', backgroundColor: 'var(--cx-slate-50)' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigate(`/cases?q=${encodeURIComponent(e.target.value)}`);
              }
            }}
          />
        </div>
      </div>

      {/* Right: Demo Role Switcher, Notifications & Profile */}
      <div className="d-flex align-items-center gap-2 gap-sm-3">
        {/* Role Switcher */}
        <div className="position-relative" ref={roleMenuRef}>
          <button
            type="button"
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className="d-flex align-items-center gap-2 px-2.5 py-1.5 rounded-3 border transition-all"
            style={{
              backgroundColor: 'var(--cx-teal-50)',
              borderColor: 'var(--cx-teal-100)',
              color: 'var(--cx-teal-900)',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}
            title="Role Switcher"
            aria-expanded={isRoleMenuOpen}
            aria-haspopup="true"
          >
            <Shield size={15} style={{ color: 'var(--cx-teal-600)' }} />
            <span className="d-none d-sm-inline">{currentRole.label}</span>
            <span className="d-inline d-sm-none">{currentRole.key.slice(0, 3)}</span>
            <ChevronDown size={14} className="text-muted" />
          </button>

          {isRoleMenuOpen && (
            <div
              className="position-absolute end-0 mt-2 p-2 bg-white rounded-3 shadow-lg border"
              style={{
                width: '310px',
                zIndex: 1070,
                borderColor: 'var(--cx-slate-200)',
              }}
            >
              <div className="p-2 border-bottom mb-1 bg-light rounded-2">
                <div className="d-flex align-items-center gap-1.5 text-primary fw-bold" style={{ fontSize: '0.75rem' }}>
                  <Info size={13} />
                  <span>ROLE WORKSPACE SWITCHER</span>
                </div>
                <div className="text-muted" style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                  Switch perspective to inspect permissions and workflows across institutional roles.
                </div>
              </div>

              <div className="overflow-auto" style={{ maxHeight: '280px' }}>
                {Object.values(roles).map((r) => {
                  const isSelected = r.key === currentRole.key;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => handleRoleSelect(r.key)}
                      className={`w-100 text-start p-2 rounded-2 border-0 d-flex align-items-start gap-2 mb-1 ${
                        isSelected ? 'bg-light' : 'bg-transparent hover-bg-light'
                      }`}
                      style={{
                        backgroundColor: isSelected ? 'var(--cx-slate-100)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 150ms',
                      }}
                    >
                      <div className="mt-0.5">
                        {isSelected ? (
                          <Check size={14} style={{ color: 'var(--cx-teal-600)' }} />
                        ) : (
                          <div style={{ width: 14 }} />
                        )}
                      </div>
                      <div className="flex-grow-1 overflow-hidden">
                        <div
                          style={{
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: '0.8125rem',
                            color: 'var(--cx-navy-900)',
                          }}
                        >
                          {r.label}
                        </div>
                        <div
                          className="text-muted text-truncate"
                          style={{ fontSize: '0.7rem', maxWidth: '240px' }}
                        >
                          {r.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Button */}
        <div className="position-relative">
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="cx-btn cx-btn-ghost p-2 rounded-circle position-relative"
            aria-label="View notifications"
          >
            <Bell size={19} style={{ color: 'var(--cx-slate-600)' }} />
            {unreadNotifCount > 0 && (
              <span
                className="position-absolute top-1 end-1 badge rounded-pill bg-danger border border-white"
                style={{ fontSize: '0.65rem', padding: '0.25em 0.45em' }}
              >
                {unreadNotifCount}
              </span>
            )}
          </button>

          <NotificationPanel
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
            onUnreadCountChange={setUnreadNotifCount}
            onSelectCase={(caseId) => {
              setIsNotifOpen(false);
              navigate(`/cases?id=${caseId}`);
            }}
          />
        </div>

        {/* Profile Dropdown */}
        <div className="position-relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-2"
            aria-expanded={isProfileMenuOpen}
            aria-haspopup="true"
          >
            <UserAvatar name={currentUser.name} avatar={currentUser.avatar} size={36} role={currentUser.role} />
            <div className="d-none d-xl-flex flex-column text-start">
              <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--cx-navy-900)', lineHeight: 1.2 }}>
                {currentUser.name}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--cx-slate-500)' }}>
                {currentUser.department}
              </span>
            </div>
            <ChevronDown size={14} className="text-muted d-none d-sm-inline" />
          </button>

          {isProfileMenuOpen && (
            <div
              className="position-absolute end-0 mt-2 p-2 bg-white rounded-3 shadow-lg border"
              style={{
                width: '260px',
                zIndex: 1070,
                borderColor: 'var(--cx-slate-200)',
              }}
            >
              <div className="p-2 border-bottom mb-2">
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--cx-navy-900)' }}>
                  {currentUser.name}
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {currentUser.email}
                </div>
                <div className="badge bg-light text-primary border mt-2" style={{ fontSize: '0.7rem' }}>
                  {currentRole.label}
                </div>
              </div>

              <div className="d-flex flex-column gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-100 text-start btn btn-link text-decoration-none text-dark p-2 d-flex align-items-center gap-2 rounded-2"
                  style={{ fontSize: '0.8125rem' }}
                >
                  <User size={15} className="text-muted" />
                  <span>Profile & Settings</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setIsProfileMenuOpen(false);
                    await logout();
                    toast.info('Signed out successfully.');
                    navigate('/', { replace: true });
                  }}
                  className="w-100 text-start btn btn-link text-decoration-none text-danger p-2 d-flex align-items-center gap-2 rounded-2"
                  style={{ fontSize: '0.8125rem' }}
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
