import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { ShieldAlert, Home } from 'lucide-react';

export const NotFoundScreen = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      backgroundColor: '#F7F9FC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-color)',
        padding: '3rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          backgroundColor: 'var(--danger-bg)', color: 'var(--danger)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem'
        }}>
          <ShieldAlert size={36} />
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
          404
        </h1>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Page Not Found
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.5 }}>
          The requested road portal route does not exist or has been relocated.
        </p>

        <Button variant="primary" icon={Home} onClick={() => navigate('/')} style={{ width: '100%' }}>
          Return to Application
        </Button>
      </div>
    </div>
  );
};
