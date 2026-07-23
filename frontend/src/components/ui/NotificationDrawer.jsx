import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const typeConfig = {
  ticket_created:  { icon: '🎫', iconClass: 'notif-icon-ticket',  label: 'New Ticket' },
  ticket_resolved: { icon: '✅', iconClass: 'notif-icon-reply',   label: 'Resolved' },
  ticket_assigned: { icon: '👤', iconClass: 'notif-icon-assign',  label: 'Assigned' },
  public_reply:    { icon: '💬', iconClass: 'notif-icon-reply',   label: 'Reply' },
  sla_breach:      { icon: '🚨', iconClass: 'notif-icon-sla',     label: 'SLA Breach' },
};

const timeAgo = (date) => {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const NotificationDrawer = ({ open, onClose, notifications, onMarkAllRead }) => {
  const navigate = useNavigate();

  if (!open) return null;

  const unread = notifications.filter(n => !n.read).length;

  return (
    <>
      <div className="notif-overlay" onClick={onClose} />
      <div className="notif-drawer">
        <div className="notif-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="notif-title">Notifications</span>
            {unread > 0 && (
              <span style={{
                background: 'rgba(239,68,68,0.15)',
                color: '#fca5a5',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '99px',
                border: '1px solid rgba(239,68,68,0.25)'
              }}>
                {unread} new
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {unread > 0 && (
              <button className="notif-mark-read" onClick={onMarkAllRead}>
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        </div>

        <div className="notif-list">
          {notifications.length === 0 ? (
            <div className="notif-empty">
              <span style={{ fontSize: '32px' }}>🔔</span>
              <span>All caught up!</span>
            </div>
          ) : (
            notifications.map(n => {
              const cfg = typeConfig[n.type] || typeConfig.ticket_created;
              return (
                <div
                  key={n.id}
                  className={`notif-item ${!n.read ? 'notif-item-unread' : ''}`}
                  onClick={() => { if (n.ticketId) { navigate(`/tickets/${n.ticketId}`); onClose(); } }}
                  style={{ cursor: n.ticketId ? 'pointer' : 'default' }}
                >
                  <div className={`notif-icon ${cfg.iconClass}`}>{cfg.icon}</div>
                  <div className="notif-body">
                    <div className="notif-item-title">{n.title}</div>
                    <div className="notif-item-sub">{n.message}</div>
                    <div className="notif-time">{timeAgo(n.createdAt)}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationDrawer;
