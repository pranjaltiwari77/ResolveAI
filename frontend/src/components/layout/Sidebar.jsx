import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import { fetchTickets } from '../../features/tickets/ticketSlice';
import NotificationDrawer from '../ui/NotificationDrawer';
import ThemeToggle from '../ThemeToggle';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/tickets', label: 'Tickets', icon: '🎫' },
  { to: '/knowledge-base', label: 'Knowledge Base', icon: '📚' },
  { to: '/data-sources', label: 'Data Sources', icon: '📁' },
  { to: '/chat', label: 'Customer Chat', icon: '💬' },
  { to: '/analytics', label: 'Analytics', icon: '📈' },
];

const adminLinks = [
  { to: '/prompts', label: 'Prompt Management', icon: '📝' },
  { to: '/evaluations', label: 'AI Evaluations', icon: '🧪' },
  { to: '/settings', label: 'Settings & Team', icon: '⚙️' },
];

// Sample notifications derived from tickets
const buildNotifications = (tickets) => {
  if (!tickets || tickets.length === 0) return [];
  // Sort tickets by latest update/creation for notifications
  const sorted = [...tickets].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  
  return sorted.slice(0, 8).map((t) => {
    if (t.sla?.resolutionBreach) {
      return { id: t.id + '-sla', type: 'sla_breach', title: 'SLA Breach', message: t.title, ticketId: t.id, createdAt: t.updatedAt || t.createdAt, read: false };
    }
    if (t.status === 'resolved') {
      return { id: t.id + '-res', type: 'ticket_resolved', title: 'Ticket Resolved', message: t.title, ticketId: t.id, createdAt: t.updatedAt || t.createdAt, read: false };
    }
    return { id: t.id + '-new', type: 'ticket_created', title: 'New Ticket', message: t.title, ticketId: t.id, createdAt: t.createdAt, read: false };
  });
};

const Sidebar = ({ onOpenCmd }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { items: tickets } = useSelector((state) => state.tickets);

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(new Set());

  // Global ticket poller for notifications
  useEffect(() => {
    if (user?.role !== 'customer') {
      // Fetch immediately
      dispatch(fetchTickets());
      // Poll every 30s to catch new tickets for notifications globally
      const interval = setInterval(() => {
        dispatch(fetchTickets());
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [dispatch, user]);

  // Update notifications whenever tickets change
  useEffect(() => {
    setNotifications(buildNotifications(tickets));
  }, [tickets]);

  const allNotifs = notifications.map(n => ({ ...n, read: n.read || readIds.has(n.id) }));
  const unreadCount = allNotifs.filter(n => !n.read).length;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const markAllRead = () => {
    setReadIds(new Set(notifications.map(n => n.id)));
  };

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">ResolveAI</span>
        </div>

        {/* ⌘K Search Hint */}
        <div
          style={{
            margin: '0 10px 12px',
            padding: '7px 12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'border-color 0.15s, background 0.15s',
          }}
          onClick={onOpenCmd}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)';
            e.currentTarget.style.background = 'rgba(99,102,241,0.06)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
          }}
        >
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', flex: 1 }}>Search...</span>
          <span style={{ fontSize: '10px', padding: '2px 5px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>⌘K</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <p className="nav-label">Main</p>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-item ${isActive(link.to) ? 'nav-item-active' : ''}`}
              >
                <span className="nav-icon">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {user?.role === 'admin' && (
            <div className="nav-section">
              <p className="nav-label">Admin</p>
              {adminLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`nav-item ${isActive(link.to) ? 'nav-item-active' : ''}`}
                >
                  <span className="nav-icon">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="user-info" style={{ flex: 1, overflow: 'hidden' }}>
              <div className="user-avatar">{user?.name?.[0]?.toUpperCase() || '?'}</div>
              <div className="user-details">
                <p className="user-name">{user?.name}</p>
                <p className="user-role">{user?.role}</p>
              </div>
            </div>

            {/* Notification Bell */}
            <button
              className="notif-btn"
              onClick={() => setNotifOpen(true)}
              title="Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
            <ThemeToggle />
            <button className="logout-btn" onClick={handleLogout} id="logout-btn" style={{ flex: 1, marginLeft: '12px' }}>
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <NotificationDrawer
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={allNotifs}
        onMarkAllRead={markAllRead}
      />
    </>
  );
};

export default Sidebar;
