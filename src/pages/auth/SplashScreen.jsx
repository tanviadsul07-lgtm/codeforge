import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/common/Button';
import { Activity, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { usePageTitle } from '../../hooks/usePageTitle';

export const SplashScreen = () => {
  const { user, role, isAuthenticated, loading, authError, retryAuth } = useAuth();
  const navigate = useNavigate();
  usePageTitle();

  const [timedOut, setTimedOut] = useState(false);

  // Safety fallback timeout to prevent infinite stuck screens if network hangs
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setTimedOut(true);
    }, 6000);

    return () => clearTimeout(safetyTimer);
  }, []);

  useEffect(() => {
    // Wait until authentication initialization finishes
    if (loading) return;

    // Brief visual entrance animation buffer
    const animTimer = setTimeout(() => {
      if (isAuthenticated && user) {
        const activeRole = role || user?.role || ROLES.CITIZEN;
        if (activeRole === ROLES.CITIZEN) {
          navigate('/citizen/dashboard', { replace: true });
        } else if (activeRole === ROLES.FIELD_OPERATOR) {
          navigate('/operator/dashboard', { replace: true });
        } else if (activeRole === ROLES.DEPARTMENT_OFFICER) {
          navigate('/department/dashboard', { replace: true });
        } else {
          navigate('/select-role', { replace: true });
        }
      } else {
        // Unauthenticated -> proceed to Welcome screen
        navigate('/welcome', { replace: true });
      }
    }, 800);

    return () => clearTimeout(animTimer);
  }, [loading, isAuthenticated, user, role, navigate]);

  const handleManualProceed = () => {
    if (isAuthenticated && user) {
      const activeRole = role || user?.role || ROLES.CITIZEN;
      if (activeRole === ROLES.CITIZEN) navigate('/citizen/dashboard', { replace: true });
      else if (activeRole === ROLES.FIELD_OPERATOR) navigate('/operator/dashboard', { replace: true });
      else navigate('/department/dashboard', { replace: true });
    } else {
      navigate('/welcome', { replace: true });
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#071522',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle Radial Cyan Background Accent */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(18, 189, 242, 0.22) 0%, rgba(69, 228, 244, 0.08) 40%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Main Branding Card */}
      <div className="animate-fade-in accent-line-top" style={{
        textAlign: 'center',
        maxWidth: '480px',
        width: '100%',
        backgroundColor: '#123651',
        padding: '3.5rem 2.5rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid #164A6B',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Logo */}
        <Logo size="xl" layout="vertical" showTagline={true} />

        {/* Error State Feedback */}
        {authError ? (
          <div style={{ marginTop: '2rem', width: '100%' }}>
            <div style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: '1px solid rgba(255, 100, 124, 0.3)'
            }}>
              <AlertCircle size={18} />
              <span>{authError}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Button variant="secondary" size="sm" icon={RefreshCw} onClick={retryAuth}>
                Retry Connection
              </Button>
              <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right" onClick={handleManualProceed}>
                Continue to Portal
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Loading Progress Indicator */}
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: '#0D263B',
              borderRadius: '2px',
              overflow: 'hidden',
              marginTop: '2.5rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#12BDF2',
                width: loading ? '60%' : '100%',
                transition: 'width 0.4s ease',
                boxShadow: '0 0 10px rgba(18, 189, 242, 0.6)'
              }} />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              fontSize: '0.85rem',
              color: '#91A9BB',
              fontWeight: 600
            }}>
              {loading ? (
                <>
                  <Activity className="spin" size={16} style={{ color: '#12BDF2' }} />
                  <span>Verifying Authentication Session...</span>
                </>
              ) : (
                <span>Session Verified. Launching Portal...</span>
              )}
            </div>

            {/* Safety Timeout Bypass Action */}
            {(timedOut || !loading) && (
              <div style={{ marginTop: '1.75rem' }}>
                <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right" onClick={handleManualProceed}>
                  Enter Application
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
