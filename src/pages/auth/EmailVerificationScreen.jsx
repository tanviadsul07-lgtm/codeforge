import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { MailCheck } from 'lucide-react';

export const EmailVerificationScreen = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState(['5', '8', '2', '9', '1', '0']);
  const [loading, setLoading] = useState(false);

  const handleVerify = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/reset-password');
    }, 400);
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
        padding: '2.5rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '14px',
          backgroundColor: 'var(--bg-soft-blue)', color: 'var(--primary-blue)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem'
        }}>
          <MailCheck size={28} />
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
          Verify Your Email
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
          Enter the 6-digit security code sent to your email address
        </p>

        <form onSubmit={handleVerify}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            {code.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => {
                  const newCode = [...code];
                  newCode[idx] = e.target.value;
                  setCode(newCode);
                }}
                style={{
                  width: '44px',
                  height: '52px',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  textAlign: 'center',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: '#F8FAFC'
                }}
              />
            ))}
          </div>

          <Button type="submit" variant="primary" loading={loading} style={{ width: '100%', padding: '0.75rem' }}>
            Verify & Continue
          </Button>
        </form>
      </div>
    </div>
  );
};
