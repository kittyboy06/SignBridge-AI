import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';

const Signup = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password should be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const { data, error } = await signUp(email, password, displayName);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Error occurred during sign up.');
    } else {
      setSuccess(true);
      // Clean up fields
      setDisplayName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-badge-centered">👋</div>
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join us to translate and sync conversations</p>
        </div>

        {errorMsg && (
          <div className="auth-error-banner">
            <AlertCircle size={18} className="auth-error-icon" />
            <p className="auth-error-text">{errorMsg}</p>
          </div>
        )}

        {success && (
          <div className="auth-success-banner">
            <CheckCircle size={18} className="auth-success-icon" />
            <p className="auth-success-text">
              Registration successful! Please check your email inbox to verify your account, and then log in. Redirecting...
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="displayName">Display Name</label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input
                id="displayName"
                type="text"
                placeholder="Priya"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder="priya@example.com"
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
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="confirmPassword"
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-auth-submit" disabled={loading || success}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer-links">
          <p>
            Already have an account? <Link to="/login">Sign In</Link>
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
        .auth-success-banner {
          display: flex;
          gap: 10px;
          background-color: var(--color-success-bg);
          border: 1px solid var(--color-success);
          border-radius: var(--border-radius-md);
          padding: 10px 14px;
          margin-bottom: 20px;
          text-align: left;
        }
        .auth-success-icon {
          color: var(--color-success);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .auth-success-text {
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

export default Signup;
