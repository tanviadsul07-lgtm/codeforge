import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { ROLES, ROLE_LABELS } from '../../utils/constants';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  UserCheck,
  HardHat,
  Building2,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { usePageTitle } from '../../hooks/usePageTitle';

export const LoginScreen = () => {
  const { login, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  usePageTitle();

  const targetRole = searchParams.get('role') || null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mismatchError, setMismatchError] = useState(null);

  const from = location.state?.from?.pathname || null;

  // Auto fill target demo credentials if applicable
  useEffect(() => {
    if (targetRole === ROLES.FIELD_OPERATOR) {
      setEmail('operator@pathrakshak.ai');
      setPassword('Password123!');
    } else if (targetRole === ROLES.DEPARTMENT_OFFICER) {
      setEmail('department@pathrakshak.ai');
      setPassword('Password123!');
    } else if (targetRole === ROLES.ADMIN) {
      setEmail('admin@pathrakshak.ai');
      setPassword('Password123!');
    } else if (targetRole === ROLES.CITIZEN) {
      setEmail('citizen@pathrakshak.ai');
      setPassword('Password123!');
    }
  }, [targetRole]);

  const handleDemoFill = (demoRole) => {
    setMismatchError(null);
    setError('');
    if (demoRole === ROLES.CITIZEN) {
      setEmail('citizen@pathrakshak.ai');
      setPassword('Password123!');
    } else if (demoRole === ROLES.FIELD_OPERATOR) {
      setEmail('operator@pathrakshak.ai');
      setPassword('Password123!');
    } else if (demoRole === ROLES.DEPARTMENT_OFFICER) {
      setEmail('department@pathrakshak.ai');
      setPassword('Password123!');
    } else if (demoRole === ROLES.ADMIN) {
      setEmail('admin@pathrakshak.ai');
      setPassword('Password123!');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setMismatchError(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        const actualRole = res.profile?.role || ROLES.CITIZEN;

        // Check if user requested a specific target role and user actual role does not match
        if (targetRole && actualRole !== targetRole) {
          setMismatchError({
            actualRole,
            targetRole,
            userEmail: email,
            message: `Account '${email}' is registered as ${ROLE_LABELS[actualRole] || actualRole}. Accessing the ${ROLE_LABELS[targetRole] || targetRole} portal requires an authorized ${ROLE_LABELS[targetRole] || targetRole} account.`
          });
          setLoading(false);
          return;
        }

        // Access authorized
        switchRole(actualRole);
        if (from) {
          navigate(from, { replace: true });
        } else if (actualRole === ROLES.FIELD_OPERATOR) {
          navigate('/operator/dashboard', { replace: true });
        } else if (actualRole === ROLES.DEPARTMENT_OFFICER) {
          navigate('/department/dashboard', { replace: true });
        } else if (actualRole === ROLES.ADMIN) {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/citizen/dashboard', { replace: true });
        }
      } else {
        setError(res.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('[Login UI Exception]', err);
      setError(err.message || 'An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const getHeaderInfo = () => {
    if (targetRole === ROLES.FIELD_OPERATOR) {
      return {
        icon: HardHat,
        title: 'Field Operator Sign In',
        subtitle: 'Enter your authorized Field Inspector credentials to access spatial survey and inspection tools.',
        badge: 'FIELD OPERATOR PORTAL',
        badgeClass: 'badge-warning',
        accentColor: 'var(--cyan-accent)'
      };
    }
    if (targetRole === ROLES.DEPARTMENT_OFFICER) {
      return {
        icon: Building2,
        title: 'Road Department Sign In',
        subtitle: 'Enter your Municipal Officer credentials to manage complaints and dispatch work orders.',
        badge: 'ROAD DEPARTMENT PORTAL',
        badgeClass: 'badge-warning',
        accentColor: 'var(--warning)'
      };
    }
    if (targetRole === ROLES.ADMIN) {
      return {
        icon: ShieldCheck,
        title: 'System Admin Sign In',
        subtitle: 'Enter your System Administrator credentials for executive oversight and complaint audit log inspection.',
        badge: 'ADMIN PORTAL',
        badgeClass: 'badge-info',
        accentColor: 'var(--danger)'
      };
    }
    if (targetRole === ROLES.CITIZEN) {
      return {
        icon: UserCheck,
        title: 'Citizen Sign In',
        subtitle: 'Sign in to report road hazards, upload video telemetry, and track active complaints.',
        badge: 'CITIZEN PORTAL',
        badgeClass: 'badge-success',
        accentColor: 'var(--primary-blue)'
      };
    }
    return {
      icon: ShieldCheck,
      title: 'Sign In to PathRakshak AI',
      subtitle: 'Choose your credentials to enter your assigned PathRakshak AI portal.',
      badge: 'AUTHENTICATION PORTAL',
      badgeClass: 'badge-info',
      accentColor: 'var(--cyan-accent)'
    };
  };

  const header = getHeaderInfo();
  const IconComp = header.icon;

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-main)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div className="accent-line-top" style={{
        maxWidth: '480px',
        width: '100%',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-color)',
        padding: '2.5rem 2rem'
      }}>
        {/* Navigation Back Pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => navigate('/select-role')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={16} /> Back to Persona Selection
          </button>
          <span className={`badge ${header.badgeClass}`} style={{ fontSize: '0.65rem' }}>
            {header.badge}
          </span>
        </div>

        {/* Brand & Dynamic Role Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.75rem', textAlign: 'center' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-sidebar)',
            color: header.accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-color)',
            marginBottom: '1rem',
            boxShadow: `0 0 16px ${header.accentColor}33`
          }}>
            <IconComp size={28} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {header.title}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem', lineHeight: 1.5 }}>
            {header.subtitle}
          </p>
        </div>

        {/* Interactive Demo Quick-Fill Bar */}
        <div style={{
          backgroundColor: 'var(--bg-sidebar)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--cyan-accent)', marginBottom: '0.5rem' }}>
            <Sparkles size={14} /> Quick Demo Credentials:
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleDemoFill(ROLES.CITIZEN)}
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: targetRole === ROLES.CITIZEN ? 'var(--primary-blue)' : 'var(--bg-card)',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              👤 Citizen
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill(ROLES.FIELD_OPERATOR)}
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: targetRole === ROLES.FIELD_OPERATOR ? 'var(--cyan-accent)' : 'var(--bg-card)',
                color: targetRole === ROLES.FIELD_OPERATOR ? '#000' : '#fff',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              👷 Field Operator
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill(ROLES.DEPARTMENT_OFFICER)}
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: targetRole === ROLES.DEPARTMENT_OFFICER ? 'var(--warning)' : 'var(--bg-card)',
                color: targetRole === ROLES.DEPARTMENT_OFFICER ? '#000' : '#fff',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              🏛️ Department
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill(ROLES.ADMIN)}
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: targetRole === ROLES.ADMIN ? 'var(--danger)' : 'var(--bg-card)',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              🛡️ Admin
            </button>
          </div>
        </div>

        {/* Standard Auth Error */}
        {error && !mismatchError && (
          <div style={{
            padding: '0.85rem 1rem',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            fontSize: '0.85rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
            border: '1px solid rgba(255, 100, 124, 0.3)'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Role Authorization Mismatch Error Banner */}
        {mismatchError && (
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(245, 185, 66, 0.12)',
            border: '1px solid var(--warning)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
              <AlertCircle size={18} /> Role Access Restriction
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
              {mismatchError.message}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  switchRole(mismatchError.actualRole);
                  if (mismatchError.actualRole === ROLES.FIELD_OPERATOR) navigate('/operator/dashboard');
                  else if (mismatchError.actualRole === ROLES.DEPARTMENT_OFFICER) navigate('/department/dashboard');
                  else navigate('/citizen/dashboard');
                }}
              >
                Continue to My {ROLE_LABELS[mismatchError.actualRole]} Portal
              </Button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setEmail('');
                    setPassword('');
                    setMismatchError(null);
                  }}
                >
                  Try Another Account
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  style={{ flex: 1 }}
                  onClick={() => navigate('/select-role')}
                >
                  Change Persona
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            type="email"
            icon={Mail}
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          <div style={{ position: 'relative' }}>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              style={{
                position: 'absolute',
                right: '12px',
                top: '36px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                background: 'none',
                border: 'none'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '0.825rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked disabled={loading} style={{ accentColor: 'var(--primary)' }} /> Remember me
            </label>
            <Link to="/forgot-password" style={{ color: 'var(--cyan-accent)', fontWeight: 600 }}>
              Forgot password?
            </Link>
          </div>

          <Button type="submit" variant="primary" loading={loading} disabled={loading} style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', fontWeight: 700 }}>
            {loading ? 'Authenticating...' : `Sign In as ${targetRole ? (ROLE_LABELS[targetRole] || 'User') : 'User'}`}
          </Button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/signup" style={{ color: 'var(--cyan-accent)', fontWeight: 700 }}>Sign up</Link>
        </div>
      </div>
    </div>
  );
};
