import React, { useEffect, useState } from 'react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Delete", isDestructive = true }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to allow display: block to apply before animating opacity
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
      // Wait for transition to finish before removing from DOM
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

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
      {/* Backdrop */}
      <div 
        onClick={onCancel}
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
      />

      {/* Modal Box */}
      <div style={{
        position: 'relative',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '2rem',
        width: '90%',
        maxWidth: '400px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: isDestructive ? '#fee2e2' : 'var(--bg-input)',
          color: isDestructive ? '#dc2626' : 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          margin: '0 auto 0.5rem auto'
        }}>
          {isDestructive ? '⚠️' : '❓'}
        </div>
        
        <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{title}</h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'center' }}>
          <button 
            className="btn btn-secondary" 
            onClick={onCancel}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button 
            className="btn" 
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => {
                onConfirm();
              }, 300);
            }}
            style={{ 
              flex: 1, 
              background: isDestructive ? '#dc2626' : 'var(--primary)',
              color: 'white',
              border: 'none'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
