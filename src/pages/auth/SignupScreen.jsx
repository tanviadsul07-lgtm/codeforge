import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
import { usePageTitle } from '../../hooks/usePageTitle';

export const SignupScreen = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  usePageTitle();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Calculate Password Strength Score (0 to 4)
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'var(--danger)' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'var(--warning)' };
    if (score === 3) return { score: 3, label: 'Good', color: 'var(--primary)' };
    return { score: 4, label: 'Strong', color: 'var(--success)' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!agreeTerms) {
      setError('You must accept the Terms of Service & Privacy Policy to proceed.');
      return;
    }

    setLoading(true);
    try {
      const res = await signup({ fullName, email, mobile, password });
      if (res.success) {
        // Proceed to Role Selection Screen
        navigate('/select-role');
      } else {
        setError(res.error || 'Registration failed. Please check your details.');
      }
    } catch (err) {
      console.error('[Signup UI Exception]', err);
      setError(err.message || 'An unexpected error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

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
        maxWidth: '520px',
        width: '100%',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-color)',
        padding: '2.5rem 2rem'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.75rem' }}>
          <Logo size="lg" layout="vertical" showTagline={true} />
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'center' }}>
            Create your account to start reporting and tracking road hazards
          </p>
        </div>

        {error && (
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

        <form onSubmit={handleSubmit}>
          <Input
            label="Full Name"
            type="text"
            icon={User}
            placeholder="Aarav Sharma"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={loading}
            required
          />

          <Input
            label="Email Address"
            type="email"
            icon={Mail}
            placeholder="aarav.sharma@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          <Input
            label="Mobile Phone (Optional)"
            type="tel"
            icon={Phone}
            placeholder="+91 98765 43210"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            disabled={loading}
          />

          <div style={{ position: 'relative' }}>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '36px',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Password Strength Indicator Meter */}
          {password && (
            <div style={{ marginTop: '-0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Password Strength:</span>
                <span style={{ fontWeight: 700, color: strength.color }}>{strength.label}</span>
              </div>
              <div style={{ display: 'flex', gap: '4px', height: '4px' }}>
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    style={{
                      flex: 1,
                      borderRadius: '2px',
                      backgroundColor: step <= strength.score ? strength.color : 'var(--border-color)',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <Input
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
          />

          <div style={{ marginBottom: '1.25rem', fontSize: '0.825rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                disabled={loading}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
              />
              <span>I agree to the Terms of Service & Privacy Policy</span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
          >
            {loading ? 'Creating Account...' : 'Register Account'}
          </Button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--cyan-accent)', fontWeight: 700 }}>Log In</Link>
        </div>
      </div>
    </div>
  );
};
