import React from 'react';

export const Input = ({
  label,
  error,
  icon: Icon,
  type = 'text',
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`input-group ${className}`}>
      {label && <label htmlFor={inputId} className="input-label">{label}</label>}
      <div style={{ position: 'relative', width: '100%' }}>
        {Icon && (
          <div style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Icon size={18} />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className="input-field"
          style={{ paddingLeft: Icon ? '40px' : '0.9rem' }}
          {...props}
        />
      </div>
      {error && <span style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '2px' }}>{error}</span>}
    </div>
  );
};
