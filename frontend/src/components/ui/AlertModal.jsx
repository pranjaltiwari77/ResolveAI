import React, { useEffect, useState } from 'react';

const AlertModal = ({ isOpen, title, message, onClose, type = "error" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const config = {
    error: { icon: '⚠️', bg: '#fee2e2', color: '#dc2626' },
    info: { icon: 'ℹ️', bg: '#e0e7ff', color: '#4f46e5' },
    success: { icon: '✅', bg: '#dcfce7', color: '#16a34a' }
  };
  const currentConfig = config[type] || config.info;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      pointerEvents: isVisible ? 'auto' : 'none'
    }}>
      <div 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
      />
      <div style={{
        position: 'relative',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '2rem',
        width: '90%',
        maxWidth: '400px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: '50px', height: '50px',
          borderRadius: '50%',
          background: currentConfig.bg,
          color: currentConfig.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          margin: '0 auto'
        }}>
          {currentConfig.icon}
        </div>
        <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{title}</h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
          {message}
        </p>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          style={{ marginTop: '1rem', width: '100%' }}
        >
          Okay
        </button>
      </div>
    </div>
  );
};

export default AlertModal;
