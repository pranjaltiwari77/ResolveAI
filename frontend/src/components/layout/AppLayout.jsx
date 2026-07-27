import { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import Sidebar from './Sidebar';
import CommandPalette from '../ui/CommandPalette';
import CustomerTopNav from './CustomerTopNav';
import { Toaster, toast } from 'react-hot-toast';
import { socket } from '../../services/socket';

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

  // Global socket connection for push notifications
  useEffect(() => {
    if (user?.role !== 'customer') {
      toast.success('Notifications Active');
      socket.connect();
      
      const handleNewTicket = (ticket) => {
        toast(`New Ticket Created: ${ticket.title || 'Support Request'}`, {
          icon: '🎫',
          style: { background: 'rgba(30, 41, 59, 0.9)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }
        });
      };
      
      const handleSlaBreach = (data) => {
        toast.error(`SLA Breach: Ticket #${data.ticketId.slice(-4)} requires attention!`, {
          icon: '🚨',
          style: { background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }
        });
      };

      socket.on('ticket_created', handleNewTicket);
      socket.on('sla_breach', handleSlaBreach);

      socket.on('connect', () => console.log('✅ Socket connected to backend!', socket.id));
      socket.on('connect_error', (err) => console.error('❌ Socket connection error:', err));
      socket.on('disconnect', (reason) => console.log('❌ Socket disconnected:', reason));

      return () => {
        socket.off('ticket_created', handleNewTicket);
        socket.off('sla_breach', handleSlaBreach);
        socket.off('connect');
        socket.off('connect_error');
        socket.off('disconnect');
      };
    }
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
      
      {/* Global Push Notifications Toaster */}
      <Toaster position="top-right" />
    </div>
  );
};

export default AppLayout;
