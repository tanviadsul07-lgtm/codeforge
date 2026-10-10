import React from 'react';

export const Card = ({ title, subtitle, action, children, className = '', style = {} }) => {
  return (
    <div className={`card ${className}`} style={style}>
      {(title || action) && (
        <div className="card-header">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export const StatCard = ({ icon: Icon, value, label, trend, trendValue, iconBg }) => {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={iconBg ? { backgroundColor: iconBg } : undefined}>
        {Icon && <Icon size={24} />}
      </div>
      <div className="stat-info">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
        {trendValue && (
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            marginTop: '4px',
            color: trend === 'up' ? 'var(--success)' : trend === 'down' ? 'var(--danger)' : 'var(--text-secondary)'
          }}>
            {trendValue}
          </span>
        )}
      </div>
    </div>
  );
};
