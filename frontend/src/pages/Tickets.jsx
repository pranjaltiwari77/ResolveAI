import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchTickets, createTicket, deflectTicket } from '../features/tickets/ticketSlice';
import { socket } from '../services/socket';

const priorityClass = { critical: 'badge-red', high: 'badge-red', medium: 'badge-yellow', low: 'badge-gray' };
const statusClass = { open: 'status-open', 'in-progress': 'status-progress', resolved: 'status-resolved', closed: 'status-resolved' };

// Returns { label, color } for SLA status badge
const getSLAStatus = (ticket) => {
  if (!ticket.sla?.resolutionDue) return null;
  if (ticket.status === 'resolved' || ticket.status === 'closed') return null;

  const { resolutionBreach, responseBreach } = ticket.sla;
  if (resolutionBreach) return { label: '🔴 Breach', cls: 'sla-breach' };

  const minutesLeft = Math.floor((new Date(ticket.sla.resolutionDue) - new Date()) / 60000);
  const totalMinutes = Math.floor((new Date(ticket.sla.resolutionDue) - new Date(ticket.createdAt)) / 60000);
  const pctLeft = minutesLeft / totalMinutes;

  if (minutesLeft <= 0) return { label: '🔴 Breach', cls: 'sla-breach' };
  if (pctLeft < 0.25) return { label: `🟡 At Risk (${minutesLeft}m)`, cls: 'sla-risk' };
  if (responseBreach) return { label: '🟠 Response SLA Breached', cls: 'sla-risk' };

  const hoursLeft = Math.floor(minutesLeft / 60);
  const display = hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft % 60}m` : `${minutesLeft}m`;
  return { label: `🟢 ${display}`, cls: 'sla-ok' };
};

const Tickets = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: allTickets, loading, createLoading, deflectLoading } = useSelector((state) => state.tickets);
  const { user } = useSelector((state) => state.auth);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialStatus = queryParams.get('status') || 'all';

  const [filter, setFilter] = useState(initialStatus);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeflectionModal, setShowDeflectionModal] = useState(false);
  const [deflectionSolution, setDeflectionSolution] = useState('');
  const [form, setForm] = useState({ title: '', description: '' });

  useEffect(() => {
    dispatch(fetchTickets());
    // Refresh tickets every 60s to reflect SLA worker updates
    const interval = setInterval(() => dispatch(fetchTickets()), 60000);

    // Socket Setup
    socket.connect();
    
    const handleSocketUpdate = () => {
      // Re-fetch tickets when a live event happens
      dispatch(fetchTickets());
    };

    socket.on('ticket_created', handleSocketUpdate);
    socket.on('ticket_updated', handleSocketUpdate);

    return () => {
      clearInterval(interval);
      socket.off('ticket_created', handleSocketUpdate);
      socket.off('ticket_updated', handleSocketUpdate);
      // Wait to disconnect until unmount. Note: multiple components might use the socket, 
      // but in this simple app it's fine or we just let it stay connected.
    };
  }, [dispatch]);

  const filtered = allTickets.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.id && t.id.includes(search));

    if (filter === 'all') return matchesSearch;
    if (filter === 'breach') {
      return matchesSearch && (t.sla?.resolutionBreach || t.sla?.responseBreach);
    }
    return t.status === filter && matchesSearch;
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await dispatch(deflectTicket(form)).unwrap();
      if (res.deflected) {
        setDeflectionSolution(res.solution);
        setShowDeflectionModal(true);
      } else {
        await forceCreateTicket();
      }
    } catch (err) {
      // Fallback if deflection check fails
      await forceCreateTicket();
    }
  };

  const forceCreateTicket = async () => {
    await dispatch(createTicket(form));
    setShowModal(false);
    setShowDeflectionModal(false);
    setForm({ title: '', description: '' });
  };

  const handleDeflectionAccepted = () => {
    // Zero-Touch Resolution successful! Discard ticket.
    setShowModal(false);
    setShowDeflectionModal(false);
    setForm({ title: '', description: '' });
  };

  const filterTabs = ['all', 'open', 'in-progress', 'resolved', 'breach'];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tickets</h1>
          <p className="page-subtitle">{filtered.length} ticket{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
        {user?.role === 'customer' && (
          <button
            id="create-ticket-btn"
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            + New Ticket
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="filter-tabs">
          {filterTabs.map((s) => (
            <button
              key={s}
              id={`filter-${s}`}
              className={`filter-tab ${filter === s ? 'filter-tab-active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s === 'all' ? 'All' : s === 'breach' ? '🔴 SLA Breach' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <input
          id="ticket-search"
          type="search"
          className="search-input"
          placeholder="Search tickets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="section-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Creator</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>SLA</th>
                <th>Agent</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="empty-state">Loading tickets...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="empty-state">No tickets match your filters.</td></tr>
              ) : (
                filtered.map((t) => {
                  const slaStatus = getSLAStatus(t);
                  return (
                    <tr 
                      key={t.id} 
                      className={`table-row table-row-clickable ${t.sla?.resolutionBreach ? 'row-breach' : ''}`}
                      onClick={() => navigate(`/tickets/${t.id}`)}
                    >
                      <td className="ticket-id">{t.id.slice(-6).toUpperCase()}</td>
                      <td className="ticket-title">{t.title}</td>
                      <td>{t.creatorId?.name || 'Unknown'}</td>
                      <td><span className="category-tag">{t.category}</span></td>
                      <td>
                        <span className={`badge ${priorityClass[t.priority] || 'badge-gray'}`}>{t.priority}</span>
                        {t.sla?.escalatedAt && <span title="Auto-escalated by SLA" style={{ marginLeft: '4px', fontSize: '0.7rem' }}>⬆️</span>}
                      </td>
                      <td><span className={`status-pill ${statusClass[t.status]}`}>{t.status}</span></td>
                      <td style={{ minWidth: '130px' }}>
                        {slaStatus ? (
                          <span className={`sla-badge sla-badge-${slaStatus.cls}`}>{slaStatus.label}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                      <td className="ticket-agent">{t.agentId ? t.agentId.name : 'Unassigned'}</td>
                      <td className="ticket-date">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create New Ticket</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreate} className="auth-form" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  required
                  type="text"
                  className="form-input"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="E.g. Unable to login"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  required
                  className="form-input"
                  rows={4}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the issue..."
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createLoading || deflectLoading}>
                  {deflectLoading ? 'Analyzing...' : createLoading ? 'Creating...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deflection Modal */}
      {showDeflectionModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', animation: 'scaleIn 0.3s ease-out' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.5rem' }}>✨</span> Wait! We found a solution.
              </h2>
            </div>
            
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-glass)', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}>
              <p style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Based on your issue, our AI agent suggests:</p>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{deflectionSolution}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={forceCreateTicket} disabled={createLoading}>
                {createLoading ? 'Submitting...' : 'No, submit my ticket anyway'}
              </button>
              <button type="button" className="btn btn-primary" onClick={handleDeflectionAccepted}>
                Yes, this solved my issue!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;