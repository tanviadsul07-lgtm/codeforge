import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';

export const CitizenNotificationsScreen = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Notifications Center"
        description="Updates regarding your road hazard complaints and civic repair dispatches."
        actions={
          <Button variant="outline" icon={CheckCheck} onClick={markAllNotificationsRead}>
            Mark All as Read
          </Button>
        }
      />

      <Card>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No notifications available.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: n.read ? '#FFFFFF' : 'var(--bg-soft-blue)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', gap: '0.85rem' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    backgroundColor: n.read ? '#F1F5F9' : 'var(--primary-blue)',
                    color: n.read ? 'var(--text-secondary)' : '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Bell size={18} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)' }}>{n.title}</span>
                      <Badge variant={n.type === 'success' ? 'success' : n.type === 'warning' ? 'warning' : 'info'}>
                        {n.type}
                      </Badge>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                      {n.message}
                    </p>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      {n.timestamp}
                    </span>
                  </div>
                </div>

                {n.link && n.link !== '#' && (
                  <Button variant="outline" size="sm" icon={ExternalLink} onClick={(e) => { e.stopPropagation(); navigate(n.link); }}>
                    View
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
