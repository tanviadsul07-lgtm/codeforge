import React from 'react';
import { getStatusBadgeClass } from '../../utils/formatters';

export const Badge = ({ children, status, variant, className = '' }) => {
  const badgeClass = variant 
    ? `badge-${variant}` 
    : getStatusBadgeClass(status || children);

  return (
    <span className={`badge ${badgeClass} ${className}`}>
      {children || status}
    </span>
  );
};
