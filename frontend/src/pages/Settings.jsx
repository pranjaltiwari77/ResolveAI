import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchProfile, updateProfile, 
  fetchTeam, inviteMember, updateRole, removeMember,
  fetchOrgSettings, updateOrgSettings,
  clearSettingsMessages 
} from '../features/settings/settingsSlice';
import ConfirmModal from '../components/ui/ConfirmModal';

const Settings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { profile, team, org, loading, error, successMsg } = useSelector(state => state.settings);
  
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({ name: '', currentPassword: '', newPassword: '' });
  
  // Team invite form state
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'support_agent' });
  
  // Org form state
  const [orgForm, setOrgForm] = useState({ name: '' });
  
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  useEffect(() => {
    dispatch(fetchProfile());
    if (user?.role === 'admin') {
      dispatch(fetchTeam());
      dispatch(fetchOrgSettings());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (profile) setProfileForm(f => ({ ...f, name: profile.name }));
  }, [profile]);

  useEffect(() => {
    if (org) setOrgForm(f => ({ ...f, name: org.name }));
  }, [org]);

  useEffect(() => {
    if (org) setOrgForm(f => ({ ...f, name: org.name }));
  }, [org]);

  // Clear messages when switching tabs
  useEffect(() => {
    dispatch(clearSettingsMessages());
  }, [activeTab, dispatch]);

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    dispatch(updateProfile(profileForm));
    setProfileForm(f => ({ ...f, currentPassword: '', newPassword: '' }));
  };

  const handleInvite = (e) => {
    e.preventDefault();
    dispatch(inviteMember(inviteForm));
    setInviteForm({ name: '', email: '', role: 'support_agent' });
  };

  const handleOrgUpdate = (e) => {
    e.preventDefault();
    dispatch(updateOrgSettings(orgForm));
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and preferences</p>
        </div>
      </div>

      <div className="filter-bar" style={{ marginBottom: '1.5rem' }}>
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${activeTab === 'profile' ? 'filter-tab-active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            My Profile
          </button>
          {isAdmin && (
            <>
              <button 
                className={`filter-tab ${activeTab === 'team' ? 'filter-tab-active' : ''}`}
                onClick={() => setActiveTab('team')}
              >
                Team Management
              </button>
              <button 
                className={`filter-tab ${activeTab === 'org' ? 'filter-tab-active' : ''}`}
                onClick={() => setActiveTab('org')}
              >
                Organization
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="error-message" style={{ marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px' }}>{error}</div>}
      {successMsg && <div className="success-message" style={{ marginBottom: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1rem', borderRadius: '8px' }}>{successMsg}</div>}

      {/* --- PROFILE TAB --- */}
      {activeTab === 'profile' && profile && (
        <div className="section-card" style={{ maxWidth: 600, padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Profile Information</h2>
          <form onSubmit={handleProfileUpdate} className="auth-form" style={{ padding: 0 }}>
            <div className="form-group">
              <label className="form-label">Email Address (Read-only)</label>
              <input type="email" className="form-input" value={profile.email} disabled style={{ opacity: 0.7 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={profileForm.name} 
                onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} 
                required 
              />
            </div>
            
            <h3 style={{ fontSize: '1rem', marginTop: '2rem', marginBottom: '1rem' }}>Change Password (Optional)</h3>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input 
                type="password" 
                className="form-input" 
                value={profileForm.currentPassword} 
                onChange={e => setProfileForm({ ...profileForm, currentPassword: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input 
                type="password" 
                className="form-input" 
                value={profileForm.newPassword} 
                onChange={e => setProfileForm({ ...profileForm, newPassword: e.target.value })} 
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      )}

      {/* --- TEAM MANAGEMENT TAB --- */}
      {activeTab === 'team' && isAdmin && (
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr 350px' }}>
          
          <div className="section-card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Team Members ({team.length})</h2>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map(m => (
                    <tr key={m._id} className="table-row">
                      <td style={{ fontWeight: 500 }}>{m.name} {m._id === user.userId && '(You)'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{m.email}</td>
                      <td>
                        {m._id === user.userId ? (
                          <span className="badge badge-gray">{m.role}</span>
                        ) : (
                          <select 
                            className="form-input" 
                            style={{ padding: '4px 8px', width: 'auto', fontSize: '0.85rem' }}
                            value={m.role}
                            onChange={(e) => dispatch(updateRole({ id: m._id, role: e.target.value }))}
                          >
                            <option value="admin">Admin</option>
                            <option value="support_agent">Support Agent</option>
                            <option value="customer">Customer</option>
                          </select>
                        )}
                      </td>
                      <td>
                        {m._id !== user.userId && (
                          <button 
                            className="btn" 
                            style={{ padding: '4px 10px', fontSize: '0.8rem', color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}
                            onClick={() => {
                              setMemberToRemove(m);
                              setDeleteModalOpen(true);
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {team.length === 0 && !loading && (
                    <tr><td colSpan={4} className="empty-state">No team members found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="section-card" style={{ alignSelf: 'start', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Invite Member</h2>
            <form onSubmit={handleInvite} className="auth-form" style={{ padding: 0 }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={inviteForm.name} 
                  onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  required 
                  value={inviteForm.email} 
                  onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select 
                  className="form-input" 
                  value={inviteForm.role} 
                  onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                >
                  <option value="support_agent">Support Agent</option>
                  <option value="admin">Admin</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Inviting...' : 'Send Invite'}
              </button>
            </form>
          </div>
          
        </div>
      )}

      {/* --- ORGANIZATION TAB --- */}
      {activeTab === 'org' && isAdmin && org && (
        <div className="section-card" style={{ maxWidth: 600, padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Organization Settings</h2>
          <form onSubmit={handleOrgUpdate} className="auth-form" style={{ padding: 0 }}>
            <div className="form-group">
              <label className="form-label">Organization Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={orgForm.name} 
                onChange={e => setOrgForm({ ...orgForm, name: e.target.value })} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Workspace URL (Slug) - Read-only</label>
              <input type="text" className="form-input" value={org.slug} disabled style={{ opacity: 0.7 }} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Organization'}
            </button>
          </form>
        </div>
      )}

      {/* --- AI CONFIGURATION TAB --- */}
      {activeTab === 'ai' && isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="section-card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Customer Chat AI Instructions</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Configure how the customer-facing AI behaves, its tone, and fallback behaviors.</p>
            <form onSubmit={(e) => { e.preventDefault(); dispatch(updatePrompt({ type: 'chat', instruction: aiPrompts.chat })); }} className="auth-form" style={{ padding: 0 }}>
              <div className="form-group">
                <textarea 
                  className="form-input" 
                  rows="6" 
                  value={aiPrompts.chat} 
                  onChange={e => setAiPrompts({ ...aiPrompts, chat: e.target.value })} 
                  placeholder="You are a helpful assistant..."
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={aiConfig.loading}>
                {aiConfig.loading ? 'Saving...' : 'Save Chat Instructions'}
              </button>
            </form>
          </div>

          <div className="section-card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Ticket Triage AI Instructions</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Configure how incoming tickets are categorized and prioritized by the AI.</p>
            <form onSubmit={(e) => { e.preventDefault(); dispatch(updatePrompt({ type: 'triage', instruction: aiPrompts.triage })); }} className="auth-form" style={{ padding: 0 }}>
              <div className="form-group">
                <textarea 
                  className="form-input" 
                  rows="6" 
                  value={aiPrompts.triage} 
                  onChange={e => setAiPrompts({ ...aiPrompts, triage: e.target.value })} 
                  placeholder="Analyze this ticket and extract category..."
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={aiConfig.loading}>
                {aiConfig.loading ? 'Saving...' : 'Save Triage Instructions'}
              </button>
            </form>
          </div>

        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Remove Team Member"
        message={memberToRemove ? `Are you sure you want to remove ${memberToRemove.name} from the team?` : "Are you sure you want to remove this member?"}
        confirmText="Remove"
        onConfirm={() => {
          if (memberToRemove) {
            dispatch(removeMember(memberToRemove._id));
          }
          setDeleteModalOpen(false);
          setMemberToRemove(null);
        }}
        onCancel={() => {
          setDeleteModalOpen(false);
          setMemberToRemove(null);
        }}
      />
    </div>
  );
};

export default Settings;
