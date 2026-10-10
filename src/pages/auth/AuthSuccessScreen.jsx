import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { ROLES } from '../../utils/constants';

export const AuthSuccessScreen = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const handleContinue = () => {
    if (role === ROLES.CITIZEN) navigate('/citizen/dashboard');
    else if (role === ROLES.FIELD_OPERATOR) navigate('/operator/dashboard');
    else navigate('/department/dashboard');
  };

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
        maxWidth: '420px',
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
          backgroundColor: 'var(--success-bg)', color: 'var(--success)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem'
        }}>
          <CheckCircle2 size={36} />
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Authentication Verified!
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.5 }}>
          Your identity has been authenticated successfully. You may now access your PathRakshak AI workspace.
        </p>

        <Button variant="primary" size="lg" onClick={handleContinue} icon={ArrowRight} iconPosition="right" style={{ width: '100%' }}>
          Launch Dashboard
        </Button>
      </div>
    </div>
  );
};
