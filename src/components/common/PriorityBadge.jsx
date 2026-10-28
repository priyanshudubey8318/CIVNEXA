import React from 'react';
import { AlertOctagon, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';

/**
 * PriorityBadge Component
 * Displays priority level with clear hierarchy and icons
 */
export const PriorityBadge = ({ priority, className = '' }) => {
  const getPriorityConfig = (val) => {
    switch (val?.toUpperCase()) {
      case 'CRITICAL':
        return {
          bg: '#FEF2F2',
          border: '#FECACA',
          color: '#991B1B',
          icon: <AlertOctagon size={12} className="text-danger" />,
          label: 'Critical',
        };
      case 'HIGH':
        return {
          bg: '#FFF7ED',
          border: '#FED7AA',
          color: '#C2410C',
          icon: <AlertTriangle size={12} style={{ color: '#EA580C' }} />,
          label: 'High',
        };
      case 'MEDIUM':
        return {
          bg: '#EFF6FF',
          border: '#BFDBFE',
          color: '#1D4ED8',
          icon: <ArrowUp size={12} style={{ color: '#2563EB' }} />,
          label: 'Medium',
        };
      case 'LOW':
      default:
        return {
          bg: '#F8FAFC',
          border: '#E2E8F0',
          color: '#475569',
          icon: <ArrowDown size={12} style={{ color: '#64748B' }} />,
          label: 'Low',
        };
    }
  };

  const config = getPriorityConfig(priority);

  return (
    <span
      className={`cx-badge ${className}`}
      style={{
        backgroundColor: config.bg,
        borderColor: config.border,
        color: config.color,
      }}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};

export default PriorityBadge;
