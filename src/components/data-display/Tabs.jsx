import React from 'react';
import { motion } from 'framer-motion';

/**
 * Tabs / Segmented Control Component
 * Animated tab switcher with sliding indicator layout animation
 */
export const Tabs = ({ tabs = [], activeTab, onChange, className = '' }) => {
  return (
    <div
      role="tablist"
      className={`d-inline-flex p-1 bg-light border rounded-3 ${className}`}
      style={{
        backgroundColor: 'var(--cx-slate-100)',
        borderColor: 'var(--cx-slate-200)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className="position-relative border-0 bg-transparent py-1.5 px-3 rounded-2 cursor-pointer d-flex align-items-center gap-1.5"
            style={{
              fontFamily: 'var(--cx-font-heading)',
              fontSize: '0.8125rem',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'var(--cx-navy-900)' : 'var(--cx-slate-600)',
              zIndex: 1,
              transition: 'color 150ms ease',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className="position-absolute inset-0 bg-white rounded-2 shadow-xs"
                style={{
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: -1,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`badge rounded-pill ms-1 ${
                  isActive ? 'bg-primary text-white' : 'bg-secondary text-white'
                }`}
                style={{ fontSize: '0.68rem' }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
