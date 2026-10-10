import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const Logo = ({
  size = 'md', // sm, md, lg, xl
  showTagline = true,
  layout = 'horizontal', // horizontal, vertical
  className = '',
  onClick
}) => {
  const getIconSize = () => {
    if (size === 'sm') return 18;
    if (size === 'md') return 22;
    if (size === 'lg') return 32;
    if (size === 'xl') return 44;
    return 22;
  };

  const getContainerSize = () => {
    if (size === 'sm') return { width: '30px', height: '30px', radius: '6px' };
    if (size === 'md') return { width: '38px', height: '38px', radius: '10px' };
    if (size === 'lg') return { width: '54px', height: '54px', radius: '14px' };
    if (size === 'xl') return { width: '76px', height: '76px', radius: '20px' };
    return { width: '38px', height: '38px', radius: '10px' };
  };

  const getFontSize = () => {
    if (size === 'sm') return '0.95rem';
    if (size === 'md') return '1.15rem';
    if (size === 'lg') return '1.6rem';
    if (size === 'xl') return '2.2rem';
    return '1.15rem';
  };

  const getTaglineSize = () => {
    if (size === 'sm') return '0.625rem';
    if (size === 'md') return '0.7rem';
    if (size === 'lg') return '0.8rem';
    if (size === 'xl') return '0.95rem';
    return '0.7rem';
  };

  const dim = getContainerSize();

  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        display: 'flex',
        flexDirection: layout === 'vertical' ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: layout === 'vertical' ? 'center' : 'flex-start',
        gap: layout === 'vertical' ? '0.75rem' : '0.75rem',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none'
      }}
    >
      {/* Shield Icon Box */}
      <div style={{
        width: dim.width,
        height: dim.height,
        borderRadius: dim.radius,
        backgroundColor: 'var(--primary-blue)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        boxShadow: size === 'xl' || size === 'lg' ? '0 10px 28px rgba(37, 99, 235, 0.35)' : 'var(--shadow-glow)',
        flexShrink: 0
      }}>
        <ShieldAlert size={getIconSize()} />
      </div>

      {/* Brand Text */}
      <div style={{ textAlign: layout === 'vertical' ? 'center' : 'left' }}>
        <h1 style={{
          fontSize: getFontSize(),
          fontWeight: 800,
          color: 'var(--text-main)',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          margin: 0
        }}>
          PathRakshak<span style={{ color: 'var(--electric-blue)' }}>AI</span>
        </h1>
        {showTagline && (
          <p style={{
            fontSize: getTaglineSize(),
            color: 'var(--text-secondary)',
            fontWeight: 600,
            letterSpacing: '0.04em',
            marginTop: '2px',
            margin: 0
          }}>
            Your Intelligent Road Protector
          </p>
        )}
      </div>
    </div>
  );
};
