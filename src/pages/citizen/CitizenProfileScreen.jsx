import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ProfilePictureUploader } from '../../components/profile/ProfilePictureUploader';
import { ROLE_LABELS } from '../../utils/constants';
import { User, Mail, Phone, Calendar, Edit, Lock, ShieldCheck, MapPin } from 'lucide-react';

export const CitizenProfileScreen = () => {
  const { user, role } = useAuth();
  const { complaints } = useApp();
  const navigate = useNavigate();

  const userComplaints = (complaints || []).filter(c => c.submittedBy === user?.name || c.citizenEmail === user?.email);

  return (
    <div>
      <PageHeader
        title={`${ROLE_LABELS[role] || 'User'} Profile`}
        description="Manage your account preferences, contact details, and user profile information."
        actions={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="outline" icon={Edit} onClick={() => navigate(role === 'citizen' ? '/citizen/profile/edit' : role === 'field-operator' ? '/operator/settings' : '/department/settings')}>
              Edit Profile
            </Button>
          </div>
        }
      />

      <div className="grid-two-col">
        {/* Left Column: Interactive Avatar & Quick Actions */}
        <div>
          <ProfilePictureUploader />

          <Card title="Role Security & Tier">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <ShieldCheck size={20} style={{ color: 'var(--electric-blue)' }} />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Active Persona: {ROLE_LABELS[role]}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Verified by Firebase Auth & Firestore Rules
                </div>
              </div>
            </div>
            <span className="badge badge-success">Active Authorized Account</span>
          </Card>
        </div>

        {/* Right Column: Profile Overview & Metadata */}
        <div>
          <Card title="Personal Overview" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <User size={18} style={{ color: 'var(--electric-blue)' }} />
                <span><strong>Full Name:</strong> {user?.name || 'PathRakshak User'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Mail size={18} style={{ color: 'var(--electric-blue)' }} />
                <span><strong>Email:</strong> {user?.email || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Phone size={18} style={{ color: 'var(--electric-blue)' }} />
                <span><strong>Phone:</strong> {user?.phone || '+91 98765 43210'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <MapPin size={18} style={{ color: 'var(--electric-blue)' }} />
                <span><strong>Location:</strong> {user?.city || user?.location || 'New Delhi, India'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar size={18} style={{ color: 'var(--electric-blue)' }} />
                <span><strong>Account Created:</strong> {user?.joinedDate || user?.createdAt?.slice(0, 10) || '2026-01-15'}</span>
              </div>
            </div>
          </Card>

          <Card title="Portal Activity Summary">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'center' }}>
              <div style={{ backgroundColor: 'var(--bg-sidebar)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--electric-blue)' }}>{userComplaints.length}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Complaints Logged</div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-sidebar)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>
                  {userComplaints.filter(c => c.status === 'Resolved' || c.status === 'COMPLETED').length}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Resolved Hazards</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
