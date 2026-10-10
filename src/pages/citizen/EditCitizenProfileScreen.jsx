import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ProfilePictureUploader } from '../../components/profile/ProfilePictureUploader';
import { User, Mail, Phone, MapPin, CheckCircle2, ArrowLeft, Shield } from 'lucide-react';

export const EditCitizenProfileScreen = () => {
  const { user, updateProfile, role } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || user?.location || '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({ name, phone, city, location: city });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        navigate(-1);
      }, 800);
    } catch (err) {
      console.error('[Update Profile Exception]', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Edit Profile Settings"
        description="Update your personal details, phone number, and location."
        actions={
          <Button variant="outline" icon={ArrowLeft} onClick={() => navigate(-1)}>
            Cancel
          </Button>
        }
      />

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <ProfilePictureUploader />

        <Card title="Edit Details">
          {saved && (
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: '1px solid rgba(56, 217, 150, 0.3)'
            }}>
              <CheckCircle2 size={18} />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Full Name"
              icon={User}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Email Address (Read-only)"
              type="email"
              icon={Mail}
              value={email}
              disabled
            />

            <Input
              label="Mobile Phone"
              type="tel"
              icon={Phone}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />

            <Input
              label="City / Location"
              icon={MapPin}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="New Delhi, India"
            />

            <div style={{
              margin: '1.25rem 0',
              padding: '0.75rem',
              backgroundColor: 'var(--bg-sidebar)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <Shield size={16} style={{ color: 'var(--electric-blue)' }} />
                <span>Account Role Access:</span>
              </div>
              <span className="badge badge-neutral">{role || 'CITIZEN'}</span>
            </div>

            <Button type="submit" variant="primary" loading={loading} disabled={loading} style={{ width: '100%' }}>
              Save Profile Changes
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
