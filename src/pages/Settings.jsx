import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Volume2, Type, Globe, Shield, RefreshCcw, ChevronRight, LogOut } from 'lucide-react';

const Settings = () => {
  const { user, logOut, isGuest } = useAuth();
  const navigate = useNavigate();

  const [geminiKey, setGeminiKey] = React.useState(localStorage.getItem('sb_gemini_api_key') || '');

  const handleKeyChange = (e) => {
    const val = e.target.value;
    setGeminiKey(val);
    if (val.trim()) {
      localStorage.setItem('sb_gemini_api_key', val.trim());
    } else {
      localStorage.removeItem('sb_gemini_api_key');
    }
  };

  const handleResetData = () => {
    if (window.confirm('This will reset all local preferences and log out. Continue?')) {
      localStorage.clear();
      logOut();
      navigate('/onboarding');
    }
  };

  return (
    <div className="settings-container animate-fade-in">
      <h2>Settings</h2>
      <p className="settings-desc-sub">Configure user preferences, speech attributes, and caption styling.</p>

      <div className="settings-sections-list">
        {/* Account Profile Box Link */}
        <div className="settings-card-group">
          <h3>Account</h3>
          <Link to="/profile" className="settings-row-item">
            <div className="row-item-left">
              <span className="row-icon-box"><User size={20} /></span>
              <div className="row-text-box">
                <h4>Profile Settings</h4>
                <p>Change your display name and update avatar</p>
              </div>
            </div>
            <ChevronRight size={18} className="row-arrow" />
          </Link>
          
          <div className="settings-row-static">
            <div className="row-item-left">
              <span className="row-icon-box"><Globe size={20} /></span>
              <div className="row-text-box">
                <h4>Default Language Pair</h4>
                <p>Set standard translation directions</p>
              </div>
            </div>
            <span className="row-badge-val">English ⇄ Tamil</span>
          </div>
        </div>

        {/* Accessibility & Interface settings */}
        <div className="settings-card-group">
          <h3>Accessibility & Audio</h3>
          
          <Link to="/settings/voice" className="settings-row-item">
            <div className="row-item-left">
              <span className="row-icon-box"><Volume2 size={20} /></span>
              <div className="row-text-box">
                <h4>Voice Settings</h4>
                <p>Configure speaking rate, pitch, and tier models</p>
              </div>
            </div>
            <ChevronRight size={18} className="row-arrow" />
          </Link>

          <Link to="/settings/text" className="settings-row-item">
            <div className="row-item-left">
              <span className="row-icon-box"><Type size={20} /></span>
              <div className="row-text-box">
                <h4>Text & Caption Settings</h4>
                <p>Font sizes, high-contrast, and auto-play audio</p>
              </div>
            </div>
            <ChevronRight size={18} className="row-arrow" />
          </Link>
        </div>

        {/* Developer configuration settings */}
        <div className="settings-card-group">
          <h3>Developer Configuration</h3>
          
          <div className="settings-row-static-input">
            <div className="row-item-left">
              <span className="row-icon-box"><Shield size={20} /></span>
              <div className="row-text-box">
                <h4>Custom Gemini API Key</h4>
                <p>Override cloud configuration dynamically</p>
              </div>
            </div>
            <input
              type="password"
              placeholder="AIzaSy... (local storage)"
              value={geminiKey}
              onChange={handleKeyChange}
              className="settings-text-input"
            />
          </div>
        </div>

        {/* System Administration Settings */}
        <div className="settings-card-group">
          <h3>System</h3>
          
          <div className="settings-row-static">
            <div className="row-item-left">
              <span className="row-icon-box"><Shield size={20} /></span>
              <div className="row-text-box">
                <h4>Privacy Policy</h4>
                <p>GDPR compliance and landmark local processing info</p>
              </div>
            </div>
            <span className="row-badge-val text-green">Secure local WASM</span>
          </div>

          <button onClick={handleResetData} className="settings-row-btn danger-btn-row">
            <div className="row-item-left">
              <span className="row-icon-box"><RefreshCcw size={20} /></span>
              <div className="row-text-box">
                <h4>Reset App Preferences</h4>
                <p>Clear theme, accessibility state, and logs</p>
              </div>
            </div>
            <ChevronRight size={18} className="row-arrow" />
          </button>

          <button onClick={logOut} className="settings-row-btn sign-out-btn-row">
            <div className="row-item-left">
              <span className="row-icon-box"><LogOut size={20} /></span>
              <div className="row-text-box">
                <h4>Sign Out</h4>
                <p>{isGuest ? 'Exit Guest Mode' : 'Log out of your Supabase profile'}</p>
              </div>
            </div>
            <ChevronRight size={18} className="row-arrow" />
          </button>
        </div>
      </div>

      <style>{`
        .settings-container {
          max-width: 680px;
          margin: 0 auto;
        }
        .settings-desc-sub {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
          margin-bottom: 24px;
        }
        .settings-sections-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .settings-card-group {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-lg);
          padding: 12px 0;
          box-shadow: var(--shadow-sm);
        }
        .settings-card-group h3 {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 8px 20px 12px;
          border-bottom: 1px solid var(--border-color);
        }
        
        /* Row Styles */
        .settings-row-item, .settings-row-static, .settings-row-btn {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          width: 100%;
          border: none;
          background: none;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
          transition: background-color var(--transition-fast);
        }
        .settings-row-item:last-child, .settings-row-static:last-child, .settings-row-btn:last-child {
          border-bottom: none;
        }
        .settings-row-item:hover, .settings-row-btn:hover {
          background-color: var(--bg-primary);
        }
        
        .row-item-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .row-icon-box {
          width: 40px;
          height: 40px;
          border-radius: var(--border-radius-md);
          background-color: var(--primary-light);
          color: var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .row-text-box h4 {
          font-size: var(--font-size-md);
          font-weight: 600;
          color: var(--text-primary);
        }
        .row-text-box p {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        
        .row-arrow {
          color: var(--text-muted);
        }
        .row-badge-val {
          font-size: var(--font-size-sm);
          font-weight: 700;
          color: var(--text-secondary);
          background-color: var(--bg-primary);
          padding: 6px 12px;
          border-radius: var(--border-radius-sm);
          border: 1px solid var(--border-color);
        }
        .row-badge-val.text-green {
          color: var(--color-success);
          background-color: var(--color-success-bg);
          border-color: var(--color-success);
        }
        
        .danger-btn-row .row-icon-box {
          background-color: var(--color-warning-bg);
          color: var(--color-warning);
        }
        .sign-out-btn-row .row-icon-box {
          background-color: var(--color-danger-bg);
          color: var(--color-danger);
        }
        .sign-out-btn-row:hover {
          background-color: var(--color-danger-bg);
        }

        .settings-row-static-input {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          width: 100%;
          border: none;
          background: none;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }
        .settings-text-input {
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          padding: 8px 12px;
          border-radius: var(--border-radius-sm);
          font-size: var(--font-size-sm);
          color: var(--text-primary);
          outline: none;
          width: 220px;
          transition: border-color var(--transition-fast);
        }
        .settings-text-input:focus {
          border-color: var(--primary-color);
        }

        @media (max-width: 600px) {
          .settings-row-static-input {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .settings-text-input {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Settings;
