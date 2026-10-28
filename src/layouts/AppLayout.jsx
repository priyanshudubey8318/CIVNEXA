import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import MobileNavigation from '../components/layout/MobileNavigation';
import { useAuth } from '../context/AuthContext';
import { Info, ShieldAlert } from 'lucide-react';

/**
 * AppLayout Component
 * Root layout structure integrating Sidebar, Topbar, Content Viewport, and Demo Mode Indicators
 */
export const AppLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { currentRole } = useAuth();
  const location = useLocation();

  return (
    <div className="cx-app-layout d-flex min-vh-100 bg-light" style={{ backgroundColor: 'var(--cx-slate-100)' }}>
      {/* Collapsible Desktop Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleCollapsed={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Mobile Drawer */}
      <MobileNavigation
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="d-flex flex-column flex-grow-1 min-vw-0">
        {/* Global Topbar */}
        <Topbar onOpenMobileMenu={() => setIsMobileNavOpen(true)} />

        {/* Dynamic Route Viewport */}
        <main className="flex-grow-1 p-3 p-md-4 p-xl-5">
          <div className="container-fluid p-0" style={{ maxWidth: '1440px', margin: '0 auto' }}>
            <AnimatePresence mode="wait">
              <Outlet key={location.pathname} />
            </AnimatePresence>
          </div>
        </main>

        {/* Institutional Enterprise Footer */}
        <footer
          className="mt-auto px-4 py-3 bg-white border-top text-muted d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2"
          style={{ borderColor: 'var(--cx-slate-200)', fontSize: '0.8125rem' }}
        >
          <div>
            <strong style={{ color: 'var(--cx-navy-900)' }}>CIVNEXA</strong> — Campus Conduct, Grievance, Safety & Student Support
          </div>
          <div className="d-flex align-items-center gap-3" style={{ fontSize: '0.75rem' }}>
            <span><em>Report. Verify. Support. Resolve.</em></span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AppLayout;
