import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const pages = [
  { icon: '📊', title: 'Dashboard', path: '/dashboard', sub: 'Overview & stats' },
  { icon: '🎫', title: 'Tickets', path: '/tickets', sub: 'Manage support tickets' },
  { icon: '📚', title: 'Knowledge Base', path: '/knowledge-base', sub: 'Articles & docs' },
  { icon: '📁', title: 'Data Sources', path: '/data-sources', sub: 'Upload & manage docs' },
  { icon: '📈', title: 'Analytics', path: '/analytics', sub: 'Usage & AI stats' },
  { icon: '⚙️', title: 'Settings', path: '/settings', sub: 'Team & configuration' },
];

const CommandPalette = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { items: tickets } = useSelector(state => state.tickets);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const matchedPages = pages.filter(p =>
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    p.sub.toLowerCase().includes(query.toLowerCase())
  );

  const matchedTickets = query.length > 0
    ? (tickets || []).filter(t =>
        t.title?.toLowerCase().includes(query.toLowerCase()) ||
        t.id?.slice(-6).toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  const allItems = [
    ...matchedPages.map(p => ({ ...p, type: 'page' })),
    ...matchedTickets.map(t => ({
      icon: '🎫',
      title: t.title,
      path: `/tickets/${t.id}`,
      sub: `#${t.id?.slice(-6).toUpperCase()} · ${t.status}`,
      type: 'ticket'
    }))
  ];

  const handleSelect = (item) => {
    navigate(item.path);
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, allItems.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && allItems[activeIdx]) { handleSelect(allItems[activeIdx]); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, allItems, activeIdx]);

  if (!open) return null;

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-palette" onClick={e => e.stopPropagation()}>
        <div className="cmd-search-row">
          <span className="cmd-search-icon">🔍</span>
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder="Search pages, tickets, or actions..."
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
          />
          <span className="cmd-kbd">esc</span>
        </div>

        <div className="cmd-list">
          {matchedPages.length > 0 && (
            <>
              <div className="cmd-section-label">Navigation</div>
              {matchedPages.map((item, i) => (
                <div
                  key={item.path}
                  className={`cmd-item ${activeIdx === i ? 'cmd-item-active' : ''}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setActiveIdx(i)}
                >
                  <span className="cmd-item-icon">{item.icon}</span>
                  <span className="cmd-item-title">{item.title}</span>
                  <span className="cmd-item-sub">{item.sub}</span>
                </div>
              ))}
            </>
          )}

          {matchedTickets.length > 0 && (
            <>
              <div className="cmd-section-label" style={{ marginTop: '8px' }}>Tickets</div>
              {matchedTickets.map((t, i) => {
                const idx = matchedPages.length + i;
                return (
                  <div
                    key={t.id}
                    className={`cmd-item ${activeIdx === idx ? 'cmd-item-active' : ''}`}
                    onClick={() => handleSelect({ path: `/tickets/${t.id}` })}
                    onMouseEnter={() => setActiveIdx(idx)}
                  >
                    <span className="cmd-item-icon">🎫</span>
                    <span className="cmd-item-title">{t.title}</span>
                    <span className="cmd-item-sub">#{t.id?.slice(-6).toUpperCase()}</span>
                  </div>
                );
              })}
            </>
          )}

          {allItems.length === 0 && (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        <div className="cmd-footer">
          <span className="cmd-footer-hint"><span className="cmd-kbd">↑↓</span> Navigate</span>
          <span className="cmd-footer-hint"><span className="cmd-kbd">↵</span> Open</span>
          <span className="cmd-footer-hint"><span className="cmd-kbd">esc</span> Close</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
