import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, verifyOtp, clearMessages, logout, resetVerification } from '../features/auth/authSlice';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, successMessage, requiresVerification, unverifiedEmail } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [otp, setOtp] = useState('');

  useEffect(() => {
    // If user completes OTP successfully, they get a token and we can redirect
    if (successMessage && !requiresVerification) {
      const timer = setTimeout(() => {
        navigate('/dashboard'); // Go directly to dashboard since they're logged in now
        dispatch(clearMessages());
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, requiresVerification, navigate, dispatch]);

  // Clear messages and ensure any stale session is wiped when loading the page
  useEffect(() => {
    dispatch(logout());
    dispatch(clearMessages());
  }, [dispatch]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(registerUser(form));
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    dispatch(verifyOtp({ email: unverifiedEmail, otp }));
  };

  if (requiresVerification) {
    return (
      <div className="auth-page">
        <div className="auth-glow auth-glow-1" />
        <div className="auth-glow auth-glow-2" />

        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">📧</div>
            <h1 className="auth-title">Verify your email</h1>
            <p className="auth-subtitle">We sent a code to {unverifiedEmail}</p>
          </div>

          {error && <div className="alert alert-error" role="alert">{error}</div>}
          {successMessage && <div className="alert alert-success" role="alert">{successMessage}</div>}

          <form onSubmit={handleOtpSubmit} className="auth-form" id="otp-form">
            <div className="form-group">
              <label htmlFor="otp" className="form-label">Verification Code (6 digits)</label>
              <input
                id="otp"
                type="text"
                required
                maxLength="6"
                className="form-input"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem', fontWeight: 'bold' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading || otp.length !== 6}
            >
              {loading ? <span className="spinner" /> : 'Verify Email'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-full"
              style={{ marginTop: '1rem' }}
              disabled={loading}
              onClick={() => dispatch(resetVerification())}
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-glow auth-glow-1" />
      <div className="auth-glow auth-glow-2" />

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">⚡</div>
          <h1 className="auth-title">Create an account</h1>
          <p className="auth-subtitle">Get support for your issues quickly</p>
        </div>

        {error && <div className="alert alert-error" role="alert">{error}</div>}
        {successMessage && <div className="alert alert-success" role="alert">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="auth-form" id="register-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="form-input"
              placeholder="Jane Doe"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
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
              autoComplete="new-password"
              className="form-input"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
