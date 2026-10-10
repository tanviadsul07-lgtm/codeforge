import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = ({ toasts, onClose }) => {
  if (!toasts || toasts.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={20} style={{ color: 'var(--status-resolved)', flexShrink: 0 }} />;
      case 'error':
        return <AlertCircle size={20} style={{ color: 'var(--status-critical)', flexShrink: 0 }} />;
      case 'warning':
        return <AlertTriangle size={20} style={{ color: 'var(--status-pending)', flexShrink: 0 }} />;
      case 'info':
      default:
        return <Info size={20} style={{ color: 'var(--primary-blue)', flexShrink: 0 }} />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'success':
        return 'var(--status-resolved)';
      case 'error':
        return 'var(--status-critical)';
      case 'warning':
        return 'var(--status-pending)';
      case 'info':
      default:
        return 'var(--primary-blue)';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '420px',
        width: 'calc(100vw - 3rem)',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast) => {
        const borderColor = getBorderColor(toast.type);
        return (
          <div
            key={toast.id}
            className="animate-slide-up"
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.85rem',
              padding: '1rem 1.25rem',
              backgroundColor: '#0F2438',
              backgroundImage: 'linear-gradient(135deg, rgba(18, 54, 81, 0.95), rgba(7, 21, 34, 0.98))',
              borderLeft: `4px solid ${borderColor}`,
              borderTop: '1px solid rgba(25, 56, 86, 0.9)',
              borderRight: '1px solid rgba(25, 56, 86, 0.9)',
              borderBottom: '1px solid rgba(25, 56, 86, 0.9)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.6), 0 0 12px rgba(18, 189, 242, 0.15)',
              backdropFilter: 'blur(12px)',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {getIcon(toast.type)}
            <div style={{ flex: 1, minWidth: 0 }}>
              {toast.title && (
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>
                  {toast.title}
                </div>
              )}
              <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.45, wordBreak: 'break-word' }}>
                {toast.message}
              </div>
            </div>
            <button
              onClick={() => onClose(toast.id)}
              style={{
                color: 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s ease'
              }}
              aria-label="Close Toast"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
