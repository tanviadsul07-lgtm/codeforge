import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Breadcrumbs } from './Breadcrumbs';
import { ROLE_LABELS } from '../../utils/constants';
import {
  Bell,
  Search,
  Menu,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Sparkles,
  ShieldCheck,
  Edit
} from 'lucide-react';

export const Topbar = ({ onToggleSidebar }) => {
  const { user, role, logout } = useAuth();
  const { notifications, globalSearch, setGlobalSearch } = useApp();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const unreadCount = (notifications || []).filter(n => !n.read && (n.role === role || n.role === 'all')).length;

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/admin/dashboard')) return 'Executive Admin Command Center';
    if (path.includes('/admin/complaints')) return 'Authoritative Complaints Directory';
    if (path.includes('/admin/users')) return 'System Personnel & Staff Management';

    if (path.includes('/citizen/dashboard')) return 'Citizen Portal';
    if (path.includes('/citizen/report-hazard')) return 'Report Road Hazard';
    if (path.includes('/citizen/complaints')) return 'My Complaints';
    if (path.includes('/citizen/upload')) return 'Upload Video & GPS Trajectory';
    if (path.includes('/citizen/jobs')) return 'AI Analysis Jobs';
    if (path.includes('/citizen/map')) return 'Hazard Map';
    if (path.includes('/citizen/profile')) return 'Citizen Profile';

    if (path.includes('/operator/dashboard')) return 'Field Operations Dashboard';
    if (path.includes('/operator/surveys')) return 'Assigned Field Surveys';
    if (path.includes('/operator/upload')) return 'Survey Video & GPS Upload';
    if (path.includes('/operator/jobs')) return 'AI Processing Queue';
    if (path.includes('/operator/gis') || path.includes('/gis-map')) return 'GIS Hazard Intelligence Map';
    if (path.includes('/operator/profile')) return 'Operator Profile';

    if (path.includes('/department/dashboard')) return 'Department Control Center';
    if (path.includes('/department/complaints')) return 'Civic Complaints Management';
    if (path.includes('/department/work-orders')) return 'Repair Work Orders';
    if (path.includes('/department/verification-queue')) return 'Verified Hazards Queue';
    if (path.includes('/department/analytics')) return 'Road Quality Analytics';
    if (path.includes('/department/profile')) return 'Officer Profile';
    if (path.includes('/geojson')) return 'GeoJSON Spatial Export';
    return 'PathRakshak AI';
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (globalSearch && globalSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  const userAvatar = user?.avatar || user?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

  return (
    <header className="app-topbar" style={{
      backgroundColor: 'var(--bg-topbar)',
      borderBottom: '1px solid var(--border-color)',
      height: 'var(--topbar-height)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem'
    }}>
      {/* Left: Mobile Menu Toggle & Title / Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onToggleSidebar}
          style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}
          className="mobile-menu-btn"
        >
          <Menu size={22} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
            {getPageTitle()}
          </h2>
          <Breadcrumbs />
        </div>
      </div>

      {/* Center: Global Search */}
      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', flex: 1, maxWidth: '380px', margin: '0 1.5rem' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search complaints, hazards, work orders..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="input-field"
            style={{
              paddingLeft: '36px',
              height: '38px',
              fontSize: '0.85rem',
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)'
            }}
          />
        </div>
      </form>

      {/* Right: Notifications & User Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Notifications Icon */}
        <button
          onClick={() => navigate(role === 'citizen' ? '/citizen/notifications' : role === 'field-operator' ? '/notifications' : '/department/notifications')}
          style={{ position: 'relative', padding: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }}
          title="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              backgroundColor: 'var(--danger)',
              color: '#FFFFFF',
              fontSize: '0.65rem',
              fontWeight: 800,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-card)',
              cursor: 'pointer'
            }}
          >
            <img
              src={userAvatar}
              alt={user?.name || 'User Avatar'}
              style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--electric-blue)' }}
            />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.1 }}>
                {user?.name || 'PathRakshak User'}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                {ROLE_LABELS[role]}
              </div>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </button>

          {profileMenuOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '110%',
              width: '210px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 100,
              padding: '0.35rem 0'
            }}>
              <div style={{ padding: '0.65rem 1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sidebar)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>{user?.name || 'User'}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                <span className="badge badge-neutral" style={{ marginTop: '4px', fontSize: '0.65rem' }}>{ROLE_LABELS[role]}</span>
              </div>
              <button
                onClick={() => { setProfileMenuOpen(false); navigate(role === 'citizen' ? '/citizen/profile' : role === 'field-operator' ? '/operator/profile' : '/department/profile'); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.6rem 1rem', fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                <User size={16} /> View Profile
              </button>
              <button
                onClick={() => { setProfileMenuOpen(false); navigate(role === 'citizen' ? '/citizen/profile/edit' : role === 'field-operator' ? '/operator/settings' : '/department/settings'); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.6rem 1rem', fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                <Edit size={16} /> Edit Profile
              </button>
              <button
                onClick={() => { setProfileMenuOpen(false); navigate('/settings'); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.6rem 1rem', fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                <Settings size={16} /> Settings
              </button>
              <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.25rem 0' }} />
              <button
                onClick={() => { setProfileMenuOpen(false); logout(); navigate('/login'); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.6rem 1rem', fontSize: '0.85rem', color: 'var(--danger)', cursor: 'pointer' }}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
