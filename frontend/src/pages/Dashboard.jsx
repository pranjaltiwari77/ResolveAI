import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardStats } from '../features/dashboard/dashboardSlice';
import { fetchTickets } from '../features/tickets/ticketSlice';

const priorityClass = { high: 'badge-red', medium: 'badge-yellow', low: 'badge-gray' };
const statusClass = { open: 'status-open', 'in-progress': 'status-progress', resolved: 'status-resolved' };

const timeAgo = (date) => {
  if (!date) return '';
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
};

const buildActivityFeed = (tickets) => {
  if (!tickets || tickets.length === 0) return [];
  const events = [];
  tickets.slice(0, 12).forEach(t => {
    if (t.status === 'resolved') {
      events.push({ id: t.id + '-r', type: 'resolved', ticket: t, time: t.updatedAt || t.createdAt });
    } else if (t.agentId) {
      events.push({ id: t.id + '-a', type: 'assigned', ticket: t, time: t.updatedAt || t.createdAt });
    } else {
      events.push({ id: t.id + '-c', type: 'created', ticket: t, time: t.createdAt });
    }
  });
  return events.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);
};

const ActivityEvent = ({ event, onClick }) => {
  const { type, ticket, time } = event;

  const configs = {
    created:  { dot: 'dot-created',  text: <>🎫 <strong>{ticket.creatorId?.name || 'A customer'}</strong> opened <strong>{ticket.title}</strong></> },
    resolved: { dot: 'dot-resolved', text: <><strong>{ticket.agentId?.name || 'An agent'}</strong> resolved <strong>{ticket.title}</strong></> },
    assigned: { dot: 'dot-assigned', text: <><strong>{ticket.title}</strong> was assigned to <strong>{ticket.agentId?.name}</strong></> },
  };

  const cfg = configs[type] || configs.created;
  const initials = (ticket.creatorId?.name || '?')[0].toUpperCase();

  return (
    <div className="activity-item" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="activity-avatar">{initials}</div>
      <div className="activity-content">
        <div className="activity-text">{cfg.text}</div>
        <div className="activity-time">{timeAgo(time)}</div>
      </div>
      <div className={`activity-dot ${cfg.dot}`} style={{ marginTop: 8 }} />
    </div>
  );
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { stats, loading } = useSelector((state) => state.dashboard);
  const { items: allTickets } = useSelector((state) => state.tickets);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchTickets());
  }, [dispatch]);

  const statCards = [
    {
      label: 'Open Tickets',
      value: loading ? '—' : stats?.openTickets ?? '—',
      trend: 'Live count',
      icon: '🎫',
      iconClass: 'stat-icon-blue',
      accentColor: 'var(--blue)',
      link: '/tickets?status=open'
    },
    {
      label: 'Resolved Today',
      value: loading ? '—' : stats?.resolvedToday ?? '—',
      trend: 'Since midnight',
      icon: '✅',
      iconClass: 'stat-icon-green',
      accentColor: 'var(--green)',
      link: '/tickets?status=resolved'
    },
    {
      label: 'Avg. Response',
      value: stats?.avgResponseTime ?? '—',
      trend: 'Response time',
      icon: '⏱️',
      iconClass: 'stat-icon-purple',
      accentColor: 'var(--purple)',
    },
    {
      label: 'AI Coverage',
      value: loading ? '—' : `${stats?.aiUsagePercent ?? 0}%`,
      trend: 'Of all tickets',
      icon: '🤖',
      iconClass: 'stat-icon-orange',
      accentColor: 'var(--orange)',
    },
  ];

  const activityEvents = buildActivityFeed(allTickets || stats?.recentTickets);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, <strong>{user?.name}</strong> — here&apos;s what&apos;s happening.</p>
        </div>
        {user?.role === 'customer' && (
          <button id="new-ticket-btn" className="btn btn-primary" onClick={() => navigate('/tickets')}>
            + New Ticket
          </button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {statCards.map((card) => (
          <div 
            key={card.label} 
            className="stat-card" 
            style={{ borderTop: `2px solid ${card.accentColor}`, cursor: card.link ? 'pointer' : 'default' }}
            onClick={() => card.link && navigate(card.link)}
          >
            <div className={`stat-icon-wrap ${card.iconClass}`}>{card.icon}</div>
            <div className="stat-body">
              <p className="stat-label">{card.label}</p>
              <p className="stat-value" style={{ color: card.accentColor }}>{card.value}</p>
              <p className="stat-trend">{card.trend}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>

        {/* Activity Feed */}
        <div className="section-card">
          <div className="section-card-header">
            <h2 className="section-title">Live Activity</h2>
            <a href="/tickets" className="section-link">View all →</a>
          </div>
          <div className="activity-feed">
            {loading ? (
              <div className="empty-state" style={{ padding: '40px 0' }}>Loading...</div>
            ) : activityEvents.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 0' }}>No recent activity. Create your first ticket!</div>
            ) : (
              activityEvents.map(event => (
                <ActivityEvent
                  key={event.id}
                  event={event}
                  onClick={() => navigate(`/tickets/${event.ticket.id}`)}
                />
              ))
            )}
          </div>
        </div>

        {/* Quick Stats sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* AI Banner */}
          {stats && stats.openTickets > 0 && (
            <div className="ai-banner">
              <div className="ai-banner-icon">🤖</div>
              <div className="ai-banner-body">
                <p className="ai-banner-title">AI Insight</p>
                <p className="ai-banner-text">
                  <strong>{stats.openTickets} open tickets</strong> — {stats.aiUsagePercent}% have AI insights. Consider adding KB articles to deflect recurring issues.
                </p>
              </div>
              <a href="/knowledge-base">
                <button id="ai-create-article-btn" className="btn btn-ghost btn-sm">Go to KB →</button>
              </a>
            </div>
          )}

          {/* Recent by priority */}
          <div className="section-card" style={{ padding: '0' }}>
            <div className="section-card-header">
              <h2 className="section-title">By Priority</h2>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['high', 'medium', 'low'].map(priority => {
                const count = (allTickets || []).filter(t => t.priority === priority && t.status === 'open').length;
                const colors = { high: 'var(--red)', medium: 'var(--yellow)', low: 'var(--green)' };
                return (
                  <div key={priority} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[priority], flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1, textTransform: 'capitalize' }}>{priority}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: colors[priority] }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SLA Health */}
          <div className="section-card" style={{ padding: '0' }}>
            <div className="section-card-header">
              <h2 className="section-title">SLA Health</h2>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Breached', color: 'var(--red)', filter: t => t.sla?.resolutionBreach },
                { label: 'At Risk',  color: 'var(--yellow)', filter: t => !t.sla?.resolutionBreach && t.sla?.resolutionDue && (new Date(t.sla.resolutionDue) - Date.now()) < 3600000 },
                { label: 'Healthy',  color: 'var(--green)',  filter: t => t.sla?.resolutionDue && (new Date(t.sla.resolutionDue) - Date.now()) >= 3600000 },
              ].map(({ label, color, filter }) => {
                const count = (allTickets || []).filter(t => t.status === 'open' && filter(t)).length;
                return (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1 }}>{label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
