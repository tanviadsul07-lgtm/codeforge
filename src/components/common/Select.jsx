import React from 'react';

export const Select = ({
  label,
  options = [],
  error,
  className = '',
  id,
  value,
  onChange,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`input-group ${className}`}>
      {label && <label htmlFor={selectId} className="input-label">{label}</label>}
      <select
        id={selectId}
        className="select-field"
        value={value}
        onChange={onChange}
        {...props}
      >
        {options.map((opt, idx) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const lbl = typeof opt === 'object' ? opt.label : opt;
          return <option key={idx} value={val}>{lbl}</option>;
        })}
      </select>
      {error && <span style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '2px' }}>{error}</span>}
    </div>
  );
};
