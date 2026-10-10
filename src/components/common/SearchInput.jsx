import React from 'react';
import { Search, X } from 'lucide-react';

export const SearchInput = ({ value, onChange, placeholder = "Search...", onClear, className = '' }) => {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }} className={className}>
      <Search size={18} style={{
        position: 'absolute',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--text-muted)'
      }} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field"
        style={{ paddingLeft: '38px', paddingRight: value ? '34px' : '12px' }}
      />
      {value && (
        <button
          onClick={() => {
            onChange('');
            if (onClear) onClear();
          }}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
