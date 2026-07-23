import React, { useEffect, useState } from 'react';

const ThemeToggle = () => {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Check local storage or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <button 
      onClick={toggleTheme}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '56px',
        height: '28px',
        borderRadius: '14px',
        background: theme === 'light' ? '#cbd5e1' : '#1e293b',
        border: '1px solid var(--border)',
        padding: '2px 4px',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.3s ease'
      }}
      aria-label="Toggle Theme"
    >
      <span style={{ fontSize: '12px' }}>☀️</span>
      <span style={{ fontSize: '12px' }}>🌙</span>
      <div 
        style={{
          position: 'absolute',
          top: '2px',
          left: theme === 'light' ? '2px' : 'calc(100% - 24px)',
          width: '22px',
          height: '22px',
          background: 'white',
          borderRadius: '50%',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      />
    </button>
  );
};

export default ThemeToggle;
