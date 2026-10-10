import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES, ROLE_LABELS } from '../../utils/constants';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { UserCheck, HardHat, Building2, ArrowRight, ShieldAlert, Lock, CheckCircle2 } from 'lucide-react';
import { usePageTitle } from '../../hooks/usePageTitle';

export const RoleSelectionScreen = () => {
  const { user, switchRole, updateProfile } = useAuth();
  const navigate = useNavigate();
  usePageTitle();

  const [selectedRole, setSelectedRole] = useState(ROLES.CITIZEN);

  const handleSelectRole = async (roleKey) => {
    setSelectedRole(roleKey);

    // If user is logged in AND their actual profile role matches the selected card role:
    if (user && user?.role === roleKey) {
      switchRole(roleKey);
      if (roleKey === ROLES.CITIZEN) navigate('/citizen/dashboard');
      else if (roleKey === ROLES.FIELD_OPERATOR) navigate('/operator/dashboard');
      else if (roleKey === ROLES.ADMIN) navigate('/admin/dashboard');
      else navigate('/department/dashboard');
    } else {
      // Otherwise, navigate directly to the appropriate role-aware authentication page
      navigate(`/login?role=${roleKey}`);
    }
  };

  const cards = [
    {
      key: ROLES.CITIZEN,
      title: 'Citizen',
      icon: UserCheck,
      description: 'Report road hazards, upload road videos, track complaints, and help make roads safer.',
      cta: 'Continue as Citizen',
      badge: 'Public Access',
      badgeClass: 'badge-success',
      accentColor: 'var(--primary-blue)'
    },
    {
      key: ROLES.FIELD_OPERATOR,
      title: 'Field Operator',
      icon: HardHat,
      description: 'Inspect assigned hazards, verify road conditions, upload evidence, and update field inspection tasks.',
      cta: 'Continue to Field Operator Sign In',
      badge: 'Authorized Persona Access',
      badgeClass: 'badge-warning',
      accentColor: 'var(--cyan-accent)'
    },
    {
      key: ROLES.DEPARTMENT_OFFICER,
      title: 'Road Department',
      icon: Building2,
      description: 'Manage verified hazards, assign operators, dispatch repair teams, and monitor road restoration.',
      cta: 'Continue to Road Department Sign In',
      badge: 'Authorized Persona Access',
      badgeClass: 'badge-warning',
      accentColor: 'var(--warning)'
    },
    {
      key: ROLES.ADMIN,
      title: 'System Administrator',
      icon: ShieldAlert,
      description: 'Executive oversight, complete complaint audit histories, system-wide analytics, and staff workload tracking.',
      cta: 'Continue to Admin Sign In',
      badge: 'System Admin Access',
      badgeClass: 'badge-info',
      accentColor: 'var(--danger)'
    }
  ];

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
      <div style={{ maxWidth: '1100px', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '3rem' }}>
          <Logo size="xl" layout="vertical" showTagline={true} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '1.25rem' }}>
            Select Your Work Persona
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.35rem', textAlign: 'center' }}>
            Choose your profile access tier to enter the tailored PathRakshak AI portal
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.75rem'
        }}>
          {cards.map((card) => {
            const IconComponent = card.icon;
            const isSelected = selectedRole === card.key;

            return (
              <div
                key={card.key}
                tabIndex={0}
                onClick={() => handleSelectRole(card.key)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectRole(card.key); }}
                className="accent-line-top"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: isSelected ? '2px solid var(--electric-blue)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2rem 1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isSelected ? '0 0 20px rgba(18, 189, 242, 0.35)' : 'var(--shadow-sm)',
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-sidebar)',
                      color: card.accentColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border-color)'
                    }}>
                      <IconComponent size={28} />
                    </div>
                    <span className={`badge ${card.badgeClass}`} style={{ fontSize: '0.68rem', textAlign: 'right' }}>
                      {card.badge}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                    {card.title}
                  </h3>

                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    {card.description}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-subtle)'
                }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: card.accentColor }}>
                    {card.cta}
                  </span>
                  <ArrowRight size={18} style={{ color: card.accentColor }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
