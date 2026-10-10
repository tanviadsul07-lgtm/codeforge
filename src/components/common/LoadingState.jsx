import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState = ({ message = "Loading system data..." }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1rem',
      color: 'var(--text-secondary)'
    }}>
      <Loader2 className="spin" size={32} style={{ color: 'var(--primary-blue)', marginBottom: '0.75rem' }} />
      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{message}</span>
    </div>
  );
};
