import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAnalytics } from '../features/analytics/analyticsSlice';
import { fetchEvaluation } from '../features/settings/aiConfigSlice';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const PRIORITY_COLORS = {
  Low: '#64748b',
  Medium: '#f59e0b',
  High: '#ef4444',
  Critical: '#dc2626',
};

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'];

const KpiCard = ({ label, value, sub, color = 'var(--primary)' }) => (
  <div className="kpi-card" style={{ borderTop: `3px solid ${color}` }}>
    <div className="kpi-value" style={{ color }}>{value}</div>
    <div className="kpi-label">{label}</div>
    {sub && <div className="kpi-sub">{sub}</div>}
  </div>
);

const ChartCard = ({ title, children, style }) => (
  <div className="chart-card" style={style}>
    <h3 className="chart-title">{title}</h3>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '8px 14px',
        fontSize: '0.82rem',
      }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || 'var(--text-primary)', fontWeight: 600 }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Analytics = () => {
  const dispatch = useDispatch();
  const { kpis, volumeData, priorityData, statusData, categoryData, loading } = useSelector(s => s.analytics);
  const { evaluation, loading: aiLoading } = useSelector(s => s.aiConfig);

  useEffect(() => {
    dispatch(fetchAnalytics());
    dispatch(fetchEvaluation());
  }, [dispatch]);

  if (loading || aiLoading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p className="text-muted">Loading dashboard...</p>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p className="text-muted" style={{ color: 'var(--text-secondary)' }}>No analytics data available or failed to load.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics &amp; Reporting</h1>
          <p className="page-subtitle">Performance metrics and insights for your support team</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard label="Total Tickets" value={kpis.totalTickets} color="var(--primary)" />
        <KpiCard label="Open Tickets" value={kpis.openTickets} color="#f59e0b" sub="Awaiting resolution" />
        <KpiCard label="Resolved Tickets" value={kpis.resolvedTickets} color="#10b981" />
        <KpiCard
          label="Avg Resolution"
          value={kpis.avgResolutionHours > 0 ? `${kpis.avgResolutionHours}h` : 'N/A'}
          color="#8b5cf6"
          sub="Mean time to resolve"
        />
        <KpiCard
          label="SLA Breach Rate"
          value={`${kpis.slaBreachRate}%`}
          color={kpis.slaBreachRate > 10 ? '#ef4444' : '#10b981'}
          sub={`${kpis.slaBreachedTickets} tickets breached`}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="charts-grid">
        <ChartCard title="Ticket Volume — Last 30 Days" style={{ gridColumn: 'span 2' }}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} interval={4} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" name="Tickets" stroke="#6366f1" fill="url(#volGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Priority Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={priorityData.filter(p => p.value > 0)}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
              >
                {priorityData.map((entry) => (
                  <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#64748b'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="charts-grid">
        <ChartCard title="Tickets by Category">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 10, left: 80, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} width={75} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Tickets" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Status Breakdown">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusData.filter(s => s.value > 0)}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
              >
                {statusData.map((entry, i) => (
                  <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="SLA Performance">
          <div style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>SLA Compliance</span>
                <span style={{ fontWeight: 600, color: '#10b981' }}>{(100 - kpis.slaBreachRate).toFixed(1)}%</span>
              </div>
              <div style={{ height: 8, background: 'var(--bg-input)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${100 - kpis.slaBreachRate}%`,
                  background: 'linear-gradient(90deg, #10b981, #34d399)',
                  borderRadius: 99,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>SLA Breach Rate</span>
                <span style={{ fontWeight: 600, color: '#ef4444' }}>{kpis.slaBreachRate}%</span>
              </div>
              <div style={{ height: 8, background: 'var(--bg-input)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${kpis.slaBreachRate}%`,
                  background: 'linear-gradient(90deg, #ef4444, #f87171)',
                  borderRadius: 99,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
            <div style={{ marginTop: '0.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'center' }}>
              <div style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ef4444' }}>{kpis.slaBreachedTickets}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Breached</div>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>{kpis.resolvedTickets}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Resolved</div>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* --- AI EVALUATION SECTION --- */}
      {evaluation && (
        <>
          <div style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>
            <h2 className="page-title" style={{ fontSize: '1.25rem' }}>AI Performance Evaluation</h2>
            <p className="page-subtitle">Metrics tracking how well the AI triage and chat features are working.</p>
          </div>
          
          <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
            <KpiCard 
              label="Triage Accuracy (Category)" 
              value={`${evaluation.triageAccuracy.categoryAccuracy}%`} 
              sub={`${evaluation.triageAccuracy.categoryOverrides} manual overrides`}
              color="#10b981"
            />
            <KpiCard 
              label="Triage Accuracy (Priority)" 
              value={`${evaluation.triageAccuracy.priorityAccuracy}%`} 
              sub={`${evaluation.triageAccuracy.priorityOverrides} manual overrides`}
              color="#3b82f6"
            />
            <KpiCard 
              label="Chat Deflection Rate" 
              value={`${evaluation.chatDeflection.deflectionRate}%`} 
              sub={`${evaluation.chatDeflection.totalChats} total chat sessions`}
              color="#8b5cf6"
            />
          </div>
        </>
      )}

    </div>
  );
};

export default Analytics;
