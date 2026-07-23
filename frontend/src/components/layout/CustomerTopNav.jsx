import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

const CustomerTopNav = ({ user, onLogout }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <header className="customer-header glass-header" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="header-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="logo-icon" style={{ fontSize: '20px' }}>⚡</span>
        <span className="logo-text" style={{ fontSize: '18px', fontWeight: 'bold' }}>ResolveAI Support</span>
      </div>
      
      <nav style={{ display: 'flex', gap: '16px' }}>
        <Link 
          to="/chat" 
          style={{ 
            color: isActive('/chat') ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: isActive('/chat') ? '600' : '500',
            fontSize: '14px'
          }}
        >
          💬 Chat
        </Link>
        <Link 
          to="/help-center" 
          style={{ 
            color: isActive('/help-center') ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: isActive('/help-center') ? '600' : '500',
            fontSize: '14px'
          }}
        >
          📚 Help Center
        </Link>
      </nav>

      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <ThemeToggle />
        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="user-avatar" style={{
            width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold'
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
          </div>
          <span className="user-name-label" style={{ fontSize: '14px', fontWeight: '500' }}>{user?.name}</span>
        </div>
        <button 
          className="btn btn-outline-danger btn-sm"
          onClick={onLogout}
          style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid var(--red)', color: 'var(--red)', background: 'transparent', borderRadius: '4px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default CustomerTopNav;
