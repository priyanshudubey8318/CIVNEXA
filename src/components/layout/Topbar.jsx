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
} from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import NotificationPanel from '../feedback/NotificationPanel';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

/**
 * Topbar Component
 * Provides global navigation actions, active institutional role badge, notifications, and profile details
 */
export const Topbar = ({ onOpenMobileMenu, className = '' }) => {
  const { currentUser, currentRole, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const profileMenuRef = useRef(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userName = currentUser?.name || 'Institutional User';
  const userRole = currentRole?.label || currentUser?.role || 'Authenticated';
  const userDept = currentUser?.department || 'CIVNEXA Platform';

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
            className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
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

      {/* Right: Active Role Badge, Notifications & Profile */}
      <div className="d-flex align-items-center gap-2 gap-sm-3">
        {/* Active Institutional Role Badge */}
        <div
          className="d-flex align-items-center gap-2 px-2.5 py-1.5 rounded-3 border"
          style={{
            backgroundColor: 'var(--cx-teal-50)',
            borderColor: 'var(--cx-teal-100)',
            color: 'var(--cx-teal-900)',
            fontSize: '0.8125rem',
            fontWeight: 600,
          }}
          title="Active Institutional Role"
        >
          <Shield size={15} style={{ color: 'var(--cx-teal-600)' }} />
          <span className="d-none d-sm-inline">{userRole}</span>
          <span className="d-inline d-sm-none">{(currentUser?.role || 'USR').slice(0, 3)}</span>
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
            <UserAvatar name={userName} avatar={currentUser?.avatar} size={36} role={currentUser?.role} />
            <div className="d-none d-xl-flex flex-column text-start">
              <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--cx-navy-900)', lineHeight: 1.2 }}>
                {userName}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--cx-slate-500)' }}>
                {userDept}
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
                  {userName}
                </div>
                <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                  {currentUser?.email || 'authenticated@civnexa.edu'}
                </div>
                <div className="badge bg-light text-primary border mt-2" style={{ fontSize: '0.7rem' }}>
                  {userRole}
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
