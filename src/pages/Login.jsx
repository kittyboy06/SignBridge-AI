import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [loading, setLoading] = useState(false);
  const { logIn, loginAsGuest } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!email || !password) {
      setValidationError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    const { data, error } = await logIn(email, password);
    setLoading(false);

    if (error) {
      setValidationError(error.message || 'Invalid email or password.');
    } else {
      navigate('/');
    }
  };

  const handleGuestMode = () => {
    loginAsGuest();
    navigate('/');
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-badge-centered">👋</div>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to save your conversation history</p>
        </div>

        {validationError && (
          <div className="auth-error-banner">
            <AlertCircle size={18} className="auth-error-icon" />
            <p className="auth-error-text">{validationError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-auth-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button onClick={handleGuestMode} className="btn-guest-entry">
          Continue as Guest
          <ArrowRight size={18} style={{ marginLeft: 8 }} />
        </button>

        <div className="auth-footer-links">
          <p>
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </div>
      </div>

      <style>{`
        .auth-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: var(--bg-primary);
          padding: 20px;
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          background: var(--bg-card);
          border-radius: var(--border-radius-lg);
          padding: 40px 30px;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border-color);
        }
        .auth-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .logo-badge-centered {
          font-size: 2.5rem;
          margin-bottom: 12px;
        }
        .auth-title {
          font-size: var(--font-size-2xl);
          font-weight: 700;
          margin-bottom: 6px;
        }
        .auth-subtitle {
          color: var(--text-secondary);
          font-size: var(--font-size-sm);
        }
        .auth-error-banner {
          display: flex;
          gap: 10px;
          background-color: var(--color-danger-bg);
          border: 1px solid var(--color-danger);
          border-radius: var(--border-radius-md);
          padding: 10px 14px;
          margin-bottom: 20px;
          text-align: left;
        }
        .auth-error-icon {
          color: var(--color-danger);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .auth-error-text {
          color: var(--text-primary);
          font-size: var(--font-size-sm);
          line-height: 1.4;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .input-group label {
          font-weight: 600;
          font-size: var(--font-size-sm);
          color: var(--text-primary);
        }
        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-secondary);
        }
        .input-wrapper input {
          width: 100%;
          padding: 12px 12px 12px 42px;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-md);
          background-color: var(--bg-input);
          transition: all var(--transition-fast);
          outline: none;
        }
        .input-wrapper input:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px var(--primary-light);
        }
        .btn-auth-submit {
          background-color: var(--primary-color);
          color: white;
          border: none;
          padding: 14px;
          border-radius: var(--border-radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: background-color var(--transition-fast);
          margin-top: 8px;
          box-shadow: var(--shadow-primary);
        }
        .btn-auth-submit:hover:not(:disabled) {
          background-color: var(--primary-hover);
        }
        .btn-auth-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .auth-divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 20px 0;
          color: var(--text-muted);
          font-size: var(--font-size-sm);
        }
        .auth-divider::before, .auth-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--border-color);
        }
        .auth-divider span {
          padding: 0 10px;
        }
        .btn-guest-entry {
          background: none;
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 12px;
          border-radius: var(--border-radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .btn-guest-entry:hover {
          background-color: var(--bg-sidebar);
        }
        .auth-footer-links {
          margin-top: 24px;
          text-align: center;
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
        }
        .auth-footer-links a {
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default Login;
