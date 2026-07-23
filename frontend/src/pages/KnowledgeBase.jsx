import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchArticles,
  createArticle,
  generateArticle,
  updateArticle,
  deleteArticle,
} from '../features/articles/articleSlice';
import ConfirmModal from '../components/ui/ConfirmModal';

const CATEGORIES = ['General', 'Account', 'Billing', 'Auth', 'API', 'Integration', 'Bug', 'UI'];

const KnowledgeBase = () => {
  const dispatch = useDispatch();
  const { items: articles, loading, mutateLoading } = useSelector((state) => state.articles);

  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);
  const [activeArticle, setActiveArticle] = useState(null);
  const [mode, setMode] = useState('manual'); // 'manual' | 'ai'
  const [form, setForm] = useState({ title: '', content: '', category: 'General' });

  useEffect(() => {
    dispatch(fetchArticles());
  }, [dispatch]);

  const filtered = articles.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  const resetModal = () => {
    setForm({ title: '', content: '', category: 'General' });
    setMode('manual');
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setActiveArticle(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (mode === 'ai') {
      await dispatch(generateArticle({ title: form.title, category: form.category }));
    } else {
      await dispatch(createArticle(form));
    }
    resetModal();
  };

  const handleEdit = (article) => {
    setActiveArticle(article);
    setForm({ title: article.title, content: article.content, category: article.category });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await dispatch(updateArticle({ id: activeArticle.id, data: form }));
    resetModal();
  };

  const handleDelete = (id) => {
    setArticleToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (articleToDelete) {
      dispatch(deleteArticle(articleToDelete));
      setDeleteModalOpen(false);
      setArticleToDelete(null);
    }
  };

  const handleView = (article) => {
    setActiveArticle(article);
    setShowViewModal(true);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Knowledge Base</h1>
          <p className="page-subtitle">
            {loading ? 'Loading...' : `${filtered.length} article${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button id="new-article-btn" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + New Article
        </button>
      </div>

      {/* Search */}
      <div className="kb-search-bar">
        <span className="kb-search-icon">🔍</span>
        <input
          id="kb-search"
          type="search"
          className="kb-search-input"
          placeholder="Search knowledge base..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="empty-state" style={{ marginTop: '3rem' }}>Loading articles...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '3rem', textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</p>
          <p>No articles yet. Create one manually or generate one with AI.</p>
        </div>
      ) : (
        <div className="kb-grid">
          {filtered.map((article) => (
            <div key={article.id} className="kb-card" id={`kb-article-${article.id}`}>
              <div className="kb-card-header">
                <span className="category-tag">{article.category}</span>
                <span className="kb-views">👁 {article.views}</span>
              </div>
              <h3 className="kb-card-title">{article.title}</h3>
              <p className="kb-card-updated">
                Updated {new Date(article.updatedAt).toLocaleDateString()}
              </p>
              <div className="kb-card-footer">
                <button className="btn btn-ghost btn-sm" onClick={() => handleView(article)}>Read →</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(article)}>Edit</button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--color-danger, #ef4444)' }}
                  onClick={() => handleDelete(article.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h2>New Knowledge Base Article</h2>
              <button className="btn-close" onClick={resetModal}>&times;</button>
            </div>

            {/* Mode Toggle */}
            <div className="mode-toggle" style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
              <button
                type="button"
                className={`btn btn-sm ${mode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setMode('manual')}
              >
                ✍️ Manual
              </button>
              <button
                type="button"
                className={`btn btn-sm ${mode === 'ai' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setMode('ai')}
              >
                🤖 AI Generate
              </button>
            </div>

            {mode === 'ai' && (
              <div className="ai-banner" style={{ marginBottom: '1rem' }}>
                <div className="ai-banner-icon">🤖</div>
                <div className="ai-banner-body">
                  <p className="ai-banner-title">AI Article Generation</p>
                  <p className="ai-banner-text">
                    Enter a title and category — Gemini will write the full article for you.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleCreate} className="auth-form" style={{ marginTop: '0' }}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  required
                  type="text"
                  className="form-input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="E.g. How to reset your password"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              {mode === 'manual' && (
                <div className="form-group">
                  <label className="form-label">Content (Markdown supported)</label>
                  <textarea
                    required
                    className="form-input"
                    rows={8}
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="Write your article content here..."
                    style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                  />
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={resetModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={mutateLoading}>
                  {mutateLoading
                    ? (mode === 'ai' ? '🤖 Generating...' : 'Saving...')
                    : (mode === 'ai' ? '🤖 Generate Article' : 'Save Article')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && activeArticle && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h2>Edit Article</h2>
              <button className="btn-close" onClick={resetModal}>&times;</button>
            </div>
            <form onSubmit={handleUpdate} className="auth-form" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  required
                  type="text"
                  className="form-input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Content (Markdown supported)</label>
                <textarea
                  required
                  className="form-input"
                  rows={10}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={resetModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={mutateLoading}>
                  {mutateLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View / Read Modal */}
      {showViewModal && activeArticle && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <div>
                <span className="category-tag" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
                  {activeArticle.category}
                </span>
                <h2 style={{ marginTop: '0.25rem' }}>{activeArticle.title}</h2>
              </div>
              <button className="btn-close" onClick={resetModal}>&times;</button>
            </div>
            <div
              className="article-content"
              style={{
                marginTop: '1rem',
                padding: '1.25rem',
                background: 'var(--surface-2, rgba(255,255,255,0.04))',
                borderRadius: '0.75rem',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.75',
                fontSize: '0.9rem',
                maxHeight: '60vh',
                overflowY: 'auto',
              }}
            >
              {activeArticle.content}
            </div>
            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => { resetModal(); handleEdit(activeArticle); }}>
                Edit
              </button>
              <button className="btn btn-primary" onClick={resetModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Article"
        message="Are you sure you want to delete this article? This action cannot be undone."
        confirmText="Delete Article"
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setArticleToDelete(null);
        }}
      />
    </div>
  );
};

export default KnowledgeBase;
