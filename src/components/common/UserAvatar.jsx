import React from 'react';

/**
 * UserAvatar Component
 * Displays user initials with consistent color generation or image.
 */
export const UserAvatar = ({ name = 'User', avatar, size = 36, role, className = '' }) => {
  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const initials = avatar || getInitials(name);

  // Derive stable background hue based on name
  const getBgColor = (seed) => {
    const colors = [
      '#0F766E', // teal-700
      '#1E3A8A', // blue-900
      '#4338CA', // indigo-700
      '#0369A1', // sky-700
      '#334155', // slate-700
      '#6D28D9', // purple-700
      '#065F46', // emerald-800
    ];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const bgColor = getBgColor(name);

  return (
    <div
      className={`user-avatar position-relative d-inline-flex align-items-center justify-content-center flex-shrink-0 ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: bgColor,
        color: '#FFFFFF',
        fontFamily: 'var(--cx-font-heading)',
        fontWeight: 600,
        fontSize: `${Math.max(11, Math.round(size * 0.38))}px`,
        border: '1.5px solid rgba(255, 255, 255, 0.2)',
        userSelect: 'none',
      }}
      title={`${name} (${role || 'User'})`}
      aria-label={`${name} avatar`}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
