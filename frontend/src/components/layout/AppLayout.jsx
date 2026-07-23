import { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import Sidebar from './Sidebar';
import CommandPalette from '../ui/CommandPalette';
import CustomerTopNav from './CustomerTopNav';

const AppLayout = () => {
  const { user } = useSelector(state => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [cmdOpen, setCmdOpen] = useState(false);

  // Global ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (user?.role !== 'customer') {
          setCmdOpen(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [user]);

  // Strict route protection: force customers to stay on the chat portal, ticket details, or help center
  if (user?.role === 'customer' && location.pathname !== '/chat' && location.pathname !== '/help-center' && !location.pathname.startsWith('/tickets/')) {
    return <Navigate to="/chat" replace />;
  }

  return (
    <div className="app-layout" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-base)' }}>
      {user?.role === 'customer' && (
        <CustomerTopNav 
          user={user} 
          onLogout={() => {
            dispatch(logout());
            navigate('/login');
          }} 
        />
      )}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {user?.role !== 'customer' && (
          <Sidebar onOpenCmd={() => setCmdOpen(true)} />
        )}
        <main className="main-content" style={{ paddingLeft: user?.role === 'customer' ? '0' : undefined, flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
};

export default AppLayout;
