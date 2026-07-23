import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useSelector } from 'react-redux';
import AlertModal from '../components/ui/AlertModal';

const PromptManagement = () => {
  const { user, token } = useSelector(state => state.auth);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [alertData, setAlertData] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const [form, setForm] = useState({
    name: '',
    purpose: 'chat',
    systemInstruction: '',
    inputTemplate: '{{question}}',
    outputSchema: '',
    model: 'gemini-3.1-flash-lite',
    temperature: 0.2,
    maxTokens: 2048,
    isActive: false,
  });

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const res = await api.get('/prompts');
      setPrompts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/prompts', form);
      setShowModal(false);
      fetchPrompts();
    } catch (err) {
      setAlertData({ isOpen: true, title: 'Error', message: 'Failed to create prompt version', type: 'error' });
    }
  };

  const handleActivate = async (id) => {
    try {
      await api.post(`/prompts/${id}/activate`);
      fetchPrompts();
    } catch (err) {
      setAlertData({ isOpen: true, title: 'Error', message: 'Failed to activate prompt', type: 'error' });
    }
  };

  const activeChatPrompt = prompts.find(p => p.purpose === 'chat' && p.isActive);
  const activeTriagePrompt = prompts.find(p => p.purpose === 'triage' && p.isActive);

  return (
    <div className="page-container">
      <div className="tickets-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Prompt Management</h1>
          <p className="page-subtitle">Manage, version, and activate AI instructions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Prompt Version</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="section-card">
          <h3 style={{ margin: '0 0 1rem', color: 'var(--text-primary)' }}>Active Chat Prompt</h3>
          {activeChatPrompt ? (
            <div>
              <p><strong>Name:</strong> {activeChatPrompt.name} (v{activeChatPrompt.version})</p>
              <p><strong>Model:</strong> {activeChatPrompt.model}</p>
              <p style={{ margin: 0, padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                {activeChatPrompt.systemInstruction}
              </p>
            </div>
          ) : <p className="text-muted">No active chat prompt.</p>}
        </div>

        <div className="section-card">
          <h3 style={{ margin: '0 0 1rem', color: 'var(--text-primary)' }}>Active Triage Prompt</h3>
          {activeTriagePrompt ? (
            <div>
              <p><strong>Name:</strong> {activeTriagePrompt.name} (v{activeTriagePrompt.version})</p>
              <p><strong>Model:</strong> {activeTriagePrompt.model}</p>
              <p style={{ margin: 0, padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                {activeTriagePrompt.systemInstruction}
              </p>
            </div>
          ) : <p className="text-muted">No active triage prompt.</p>}
        </div>
      </div>

      <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Version History</h2>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Purpose</th>
              <th>Name</th>
              <th>Version</th>
              <th>Model</th>
              <th>Temp</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prompts.map(p => (
              <tr key={p._id}>
                <td>{p.purpose}</td>
                <td>{p.name}</td>
                <td>v{p.version}</td>
                <td>{p.model}</td>
                <td>{p.temperature}</td>
                <td>
                  <span className={`badge ${p.isActive ? 'badge-glow-open' : 'badge-gray'}`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  {!p.isActive && (
                    <button className="btn btn-sm" onClick={() => handleActivate(p._id)}>Activate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Create Prompt Version</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreate} className="auth-form" style={{ marginTop: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input required className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Chat Refactor" />
                </div>
                <div className="form-group">
                  <label className="form-label">Purpose</label>
                  <select className="form-input" value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})}>
                    <option value="chat">Chat</option>
                    <option value="triage">Triage</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">System Instruction</label>
                <textarea required className="form-input" rows={6} value={form.systemInstruction} onChange={e => setForm({...form, systemInstruction: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Model</label>
                  <input required className="form-input" value={form.model} onChange={e => setForm({...form, model: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Temperature</label>
                  <input type="number" step="0.1" required className="form-input" value={form.temperature} onChange={e => setForm({...form, temperature: Number(e.target.value)})} />
                </div>
              </div>
              <div className="form-group" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} id="isAct" />
                <label htmlFor="isAct">Set as Active Immediately</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Version</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <AlertModal 
        isOpen={alertData.isOpen} 
        title={alertData.title} 
        message={alertData.message} 
        type={alertData.type}
        onClose={() => setAlertData({ ...alertData, isOpen: false })} 
      />
    </div>
  );
};

export default PromptManagement;
