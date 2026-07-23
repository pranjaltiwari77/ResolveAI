import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearMessages, logout } from '../features/auth/authSlice';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token, user, requiresVerification } = useSelector((state) => state.auth);

  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    if (requiresVerification) {
      navigate('/register');
    }
  }, [requiresVerification, navigate]);

  useEffect(() => {
    if (token && user) {
      if (user.role === 'customer') {
        navigate('/chat', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } else if (!token) {
      dispatch(logout());
    }
    return () => dispatch(clearMessages());
  }, [token, user, navigate, dispatch]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser(form));
  };

  return (
    <div className="auth-page">
      {/* Animated glowing orbs */}
      <div className="auth-glow auth-glow-1" />
      <div className="auth-glow auth-glow-2" />

      <div className="auth-card" style={{ animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
        <div className="auth-header">
          <div className="auth-logo" style={{
            width: 52,
            height: 52,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
            margin: '0 auto 16px',
          }}>⚡</div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your ResolveAI workspace</p>
        </div>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form" id="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="form-input"
              placeholder="you@company.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ marginTop: '4px' }}
          >
            {loading ? <span className="spinner" /> : 'Sign in →'}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="auth-link">Create workspace</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
