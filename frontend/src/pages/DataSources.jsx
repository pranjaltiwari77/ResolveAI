import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchKnowledgeBases, createKnowledgeBase, fetchDocuments, uploadDocument, deleteDocument } from '../features/knowledgeBases/kbSlice';
import ConfirmModal from '../components/ui/ConfirmModal';

const DataSources = () => {
  const dispatch = useDispatch();
  const { knowledgeBases, documents, loading, docLoading, uploadLoading } = useSelector(state => state.kb);
  
  const [activeKb, setActiveKb] = useState(null);
  const [showCreateKb, setShowCreateKb] = useState(false);
  const [kbName, setKbName] = useState('');
  const [kbDesc, setKbDesc] = useState('');
  
  const [file, setFile] = useState(null);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchKnowledgeBases());
  }, [dispatch]);

  useEffect(() => {
    if (knowledgeBases.length > 0 && !activeKb) {
      setActiveKb(knowledgeBases[0]);
    }
  }, [knowledgeBases, activeKb]);

  useEffect(() => {
    if (activeKb) {
      dispatch(fetchDocuments(activeKb.id));
      // Simple polling for document status
      const interval = setInterval(() => {
        dispatch(fetchDocuments(activeKb.id));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [dispatch, activeKb]);

  const handleCreateKb = async (e) => {
    e.preventDefault();
    await dispatch(createKnowledgeBase({ name: kbName, description: kbDesc }));
    setShowCreateKb(false);
    setKbName('');
    setKbDesc('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !activeKb) return;
    await dispatch(uploadDocument({ kbId: activeKb.id, file }));
    setFile(null);
    // Reset file input
    document.getElementById('file-upload').value = '';
  };

  const handleDelete = (docId) => {
    setDocToDelete(docId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (docToDelete && activeKb) {
      dispatch(deleteDocument({ kbId: activeKb.id, docId: docToDelete }));
      setDeleteModalOpen(false);
      setDocToDelete(null);
    }
  };

  return (
    <div className="page" style={{ display: 'flex', gap: '2rem', height: 'calc(100vh - 40px)' }}>
      
      {/* Sidebar for KBs */}
      <div style={{ width: '250px', borderRight: '1px solid var(--border)', paddingRight: '1rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem' }}>Knowledge Bases</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowCreateKb(true)}>+</button>
        </div>
        
        {loading ? <p>Loading...</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
            {knowledgeBases.map(kb => (
              <div 
                key={kb.id} 
                onClick={() => setActiveKb(kb)}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: activeKb?.id === kb.id ? 'var(--bg-input)' : 'transparent',
                  border: activeKb?.id === kb.id ? '1px solid var(--border-focus)' : '1px solid transparent'
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{kb.name}</div>
              </div>
            ))}
            {knowledgeBases.length === 0 && <p className="text-muted">No knowledge bases yet.</p>}
          </div>
        )}
      </div>

      {/* Main Content for Documents */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {showCreateKb ? (
          <div className="section-card" style={{ padding: '1.5rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Create Knowledge Base</h2>
            <form onSubmit={handleCreateKb} className="auth-form" style={{ marginTop: 0, maxWidth: '400px' }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input required className="form-input" value={kbName} onChange={e => setKbName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" value={kbDesc} onChange={e => setKbDesc(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateKb(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        ) : activeKb ? (
          <>
            <div className="page-header" style={{ marginBottom: '1rem' }}>
              <div>
                <h1 className="page-title">{activeKb.name}</h1>
                <p className="page-subtitle">{activeKb.description || 'Manage documents for this knowledge base'}</p>
              </div>
            </div>

            {/* Upload Area */}
            <div className="section-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
              <form onSubmit={handleUpload} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input 
                  id="file-upload"
                  type="file" 
                  accept=".txt,.md,.pdf" 
                  onChange={e => setFile(e.target.files[0])} 
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary" disabled={!file || uploadLoading}>
                  {uploadLoading ? 'Uploading...' : 'Upload Document'}
                </button>
              </form>
            </div>

            {/* Documents List */}
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Uploaded</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {docLoading && documents.length === 0 ? (
                    <tr><td colSpan={4}>Loading...</td></tr>
                  ) : documents.length === 0 ? (
                    <tr><td colSpan={4} className="empty-state">No documents uploaded yet.</td></tr>
                  ) : (
                    documents.map(doc => (
                      <tr key={doc.id} className="table-row">
                        <td style={{ fontWeight: 500 }}>{doc.title}</td>
                        <td>{new Date(doc.createdAt).toLocaleString()}</td>
                        <td>
                          <span className={`status-pill ${doc.status === 'Ready' ? 'status-resolved' : doc.status === 'Failed' ? 'badge-red' : 'status-progress'}`}>
                            {doc.status}
                          </span>
                          {doc.processingError && <div style={{ fontSize: '0.75rem', color: 'var(--red)', marginTop: '4px' }}>{doc.processingError}</div>}
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => handleDelete(doc.id)}>Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="empty-state" style={{ marginTop: '4rem' }}>Select or create a knowledge base to start.</div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Document"
        message="Are you sure you want to delete this document? The AI will no longer use it for answers."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setDocToDelete(null);
        }}
      />
    </div>
  );
};

export default DataSources;
