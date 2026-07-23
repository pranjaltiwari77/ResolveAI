import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import api from '../services/api';

const HelpCenter = () => {
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Fetch all articles on mount
  useEffect(() => {
    fetchArticles('');
  }, []);

  const fetchArticles = async (searchQuery) => {
    setLoading(true);
    try {
      const res = await api.get('/articles/search', { params: { q: searchQuery } });
      setArticles(res.data);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchArticles(query);
  };

  if (selectedArticle) {
    return (
      <div className="page" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem' }}>
        <button 
          className="btn btn-ghost" 
          onClick={() => setSelectedArticle(null)}
          style={{ marginBottom: '1.5rem', alignSelf: 'flex-start' }}
        >
          &larr; Back to Help Center
        </button>
        
        <div className="section-card" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
            <span className="category-tag" style={{ marginBottom: '1rem' }}>
              {selectedArticle.category}
            </span>
            <h1 style={{ fontSize: '2rem', marginTop: '1rem', color: 'var(--text-primary)' }}>
              {selectedArticle.title}
            </h1>
          </div>
          
          <div className="markdown-body" style={{ color: 'var(--text-primary)', lineHeight: '1.7' }}>
            <ReactMarkdown>{selectedArticle.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem', padding: '3rem 1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', background: 'linear-gradient(135deg, var(--indigo-400), var(--pink))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          How can we help you today?
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2rem' }}>
          Search our AI-powered knowledge base for instant answers.
        </p>
        
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', maxWidth: '600px', margin: '0 auto' }}>
          <input
            type="text"
            className="form-input"
            style={{ flex: 1, padding: '12px 20px', fontSize: '1rem', borderRadius: '30px' }}
            placeholder="e.g., How do I reset my password?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ borderRadius: '30px', padding: '0 24px' }} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {loading && articles.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>Finding the best articles...</p>
        )}
        
        {!loading && articles.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>No articles found. Try another search!</p>
        )}

        {articles.map(article => (
          <div 
            key={article._id} 
            className="kb-card" 
            onClick={() => setSelectedArticle(article)}
            style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <span className="category-tag" style={{ alignSelf: 'flex-start', marginBottom: '1rem' }}>
              {article.category}
            </span>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              {article.title}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
              {article.content.replace(/[#*`_>]/g, '').substring(0, 120)}...
            </p>
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--indigo-400)', fontSize: '0.9rem', fontWeight: 600 }}>
              Read Article &rarr;
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HelpCenter;
