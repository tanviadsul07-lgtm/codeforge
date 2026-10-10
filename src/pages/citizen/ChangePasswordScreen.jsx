import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Lock, CheckCircle2, ArrowLeft } from 'lucide-react';

export const ChangePasswordScreen = () => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setError('');
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      navigate(-1);
    }, 800);
  };

  return (
    <div>
      <PageHeader
        title="Change Password"
        description="Update your portal login password."
        actions={
          <Button variant="outline" icon={ArrowLeft} onClick={() => navigate(-1)}>
            Cancel
          </Button>
        }
      />

      <Card style={{ maxWidth: '540px' }}>
        {error && (
          <div style={{ padding: '0.65rem', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontWeight: 600 }}>
            {error}
          </div>
        )}
        {saved && (
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>Password changed successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="Current Password"
            type="password"
            icon={Lock}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            label="New Password"
            type="password"
            icon={Lock}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            icon={Lock}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '1rem' }}>
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  );
};
