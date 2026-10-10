import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES, ROLE_LABELS } from '../../utils/constants';
import { Logo } from '../common/Logo';
import {
  ShieldAlert,
  LayoutDashboard,
  MapPin,
  Upload,
  Cpu,
  FileCheck,
  AlertTriangle,
  FileText,
  Briefcase,
  BarChart3,
  Download,
  Bell,
  Settings,
  HelpCircle,
  Camera,
  LogOut,
  Users,
  User,
  Layers,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { role, logout, user } = useAuth();
  const navigate = useNavigate();

  const getNavItems = () => {
    if (role === ROLES.ADMIN) {
      return [
        { label: 'Admin Command Center', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Complaints Directory', path: '/department/complaints', icon: FileText },
        { label: 'User & Staff Accounts', path: '/admin/users', icon: Users },
        { label: 'Department Control', path: '/department/dashboard', icon: Briefcase },
        { label: 'GIS Spatial Map', path: '/gis-map', icon: MapPin },
        { label: 'GeoJSON Export', path: '/geojson-export', icon: Download },
        { label: 'System Diagnostics', path: '/diagnostics', icon: ShieldAlert },
        { label: 'Profile Settings', path: '/profile', icon: User },
      ];
    }
    if (role === ROLES.CITIZEN) {
      return [
        { label: 'Dashboard', path: '/citizen/dashboard', icon: LayoutDashboard },
        { label: 'Live GeoAI Scanner', path: '/operator/live-scanner', icon: Camera },
        { label: 'File Complaint', path: '/citizen/report-hazard', icon: ShieldAlert },
        { label: 'My Complaints', path: '/citizen/complaints', icon: FileText },
        { label: 'Upload Video + GPS', path: '/citizen/upload', icon: Upload },
        { label: 'AI Analysis Jobs', path: '/citizen/jobs', icon: Cpu },
        { label: 'Hazard Map', path: '/citizen/map', icon: MapPin },
        { label: 'Profile Settings', path: '/citizen/profile', icon: User },
      ];
    }
    if (role === ROLES.FIELD_OPERATOR) {
      return [
        { label: 'Dashboard', path: '/operator/dashboard', icon: LayoutDashboard },
        { label: 'Live GeoAI Scanner', path: '/operator/live-scanner', icon: Camera },
        { label: 'Assigned Surveys', path: '/operator/surveys', icon: Layers },
        { label: 'Verification Tasks', path: '/operator/jobs', icon: FileCheck },
        { label: 'Video & GPS Upload', path: '/operator/upload', icon: Upload },
        { label: 'Hazard Map', path: '/operator/gis', icon: MapPin },
        { label: 'GeoJSON Export', path: '/operator/geojson', icon: Download },
        { label: 'Profile Settings', path: '/operator/profile', icon: User },
      ];
    }
    return [
      { label: 'Dashboard', path: '/department/dashboard', icon: LayoutDashboard },
      { label: 'Hazards', path: '/department/verification-queue', icon: AlertTriangle },
      { label: 'Repair Operations', path: '/department/complaints', icon: FileText },
      { label: 'Dispatches', path: '/department/priority-queue', icon: ShieldAlert },
      { label: 'Hazard Map', path: '/gis-map', icon: MapPin },
      { label: 'Field Operators', path: '/department/users', icon: Users },
      { label: 'Profile Settings', path: '/department/profile', icon: User },
    ];
  };

  const navItems = getNavItems();

  const userAvatar = user?.avatar || user?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : ''}`} style={{
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-sidebar)'
      }}>
        <Logo size="md" showTagline={true} />
      </div>

      {/* Authenticated Persona Banner */}
      <div style={{
        padding: '0.75rem 1.25rem',
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
          Active Persona
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--electric-blue)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ShieldCheck size={14} style={{ color: 'var(--success)' }} />
          <span>{ROLE_LABELS[role] || 'Citizen'}</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.75rem' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', paddingLeft: '0.75rem', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
          Navigation
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {navItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <NavLink
                key={index}
                to={item.path}
                onClick={onClose}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#071522' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--electric-blue)' : 'transparent',
                  boxShadow: isActive ? '0 2px 8px rgba(18, 189, 242, 0.3)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                })}
              >
                <IconComponent size={18} />
                <span style={{ flex: 1 }}>{item.label}</span>
                <ChevronRight size={14} style={{ opacity: 0.5 }} />
              </NavLink>
            );
          })}
        </nav>

        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <NavLink
            to="/help"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              color: isActive ? 'var(--cyan-accent)' : 'var(--text-secondary)'
            })}
          >
            <HelpCircle size={18} />
            <span>Help & Support</span>
          </NavLink>
        </div>
      </div>

      {/* User Avatar Footer */}
      <div style={{
        padding: '1rem 1.25rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
          <img
            src={userAvatar}
            alt={user?.name || 'User Avatar'}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--electric-blue)',
              flexShrink: 0
            }}
          />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.name || 'PathRakshak User'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              {ROLE_LABELS[role] || 'Citizen'}
            </div>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          title="Sign Out"
          style={{ color: 'var(--text-secondary)', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};
