import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, Mail, CheckCircle, AlertCircle } from 'lucide-react';

const Profile = () => {
  const { user, profile, updateProfile, isGuest } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleSave = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMsg('');

    const { error } = await updateProfile({
      display_name: displayName,
      avatar_url: avatarUrl
    });

    if (error) {
      setStatus('error');
      setMsg(error.message || 'Failed to update profile.');
    } else {
      setStatus('success');
      setMsg('Profile updated successfully!');
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    }
  };

  const emailText = isGuest ? 'guest@signbridge.ai' : user?.email || 'N/A';
  const avatarChar = (displayName || 'U').charAt(0).toUpperCase();

  return (
    <div className="profile-viewport animate-fade-in">
      <div className="back-nav-header">
        <button onClick={() => navigate('/settings')} className="btn-back">
          <ArrowLeft size={18} />
          Back to Settings
        </button>
      </div>

      <div className="profile-card">
        <div className="profile-card-header">
          <div className="avatar-large-wrapper">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="avatar-large-img" />
            ) : (
              <div className="avatar-large-placeholder">{avatarChar}</div>
            )}
          </div>
          <h2>User Profile</h2>
          <p>{isGuest ? 'Temporary local guest account' : 'Supabase account settings'}</p>
        </div>

        {status === 'success' && (
          <div className="profile-success-banner">
            <CheckCircle size={18} className="profile-banner-icon" />
            <p>{msg}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="profile-error-banner">
            <AlertCircle size={18} className="profile-banner-icon" />
            <p>{msg}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="profile-form">
          <div className="profile-input-group">
            <label htmlFor="p-email">Email Address</label>
            <div className="profile-input-wrapper disabled">
              <Mail size={18} className="profile-input-icon" />
              <input
                id="p-email"
                type="email"
                value={emailText}
                disabled
                className="profile-disabled-input"
              />
            </div>
            <p className="profile-input-tip">Email address is locked to your account credentials</p>
          </div>

          <div className="profile-input-group">
            <label htmlFor="p-name">Display Name</label>
            <div className="profile-input-wrapper">
              <User size={18} className="profile-input-icon" />
              <input
                id="p-name"
                type="text"
                placeholder="Priya"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="profile-input-group">
            <label htmlFor="p-avatar">Avatar URL</label>
            <div className="profile-input-wrapper">
              <User size={18} className="profile-input-icon" />
              <input
                id="p-avatar"
                type="text"
                placeholder="https://example.com/avatar.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>
            <p className="profile-input-tip">Optionally link a custom HTTPS avatar image URL</p>
          </div>

          <button 
            type="submit" 
            className="btn-profile-save" 
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Saving...' : 'Save Profile Details'}
          </button>
        </form>
      </div>

      <style>{`
        .profile-viewport {
          max-width: 600px;
          margin: 0 auto;
        }
        .back-nav-header {
          margin-bottom: 20px;
        }
        .btn-back {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .btn-back:hover {
          color: var(--text-primary);
        }
        
        .profile-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-lg);
          padding: 30px;
          box-shadow: var(--shadow-md);
        }
        .profile-card-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 24px;
          margin-bottom: 24px;
        }
        .avatar-large-wrapper {
          margin-bottom: 16px;
        }
        .avatar-large-img, .avatar-large-placeholder {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 3px solid var(--bg-primary);
          box-shadow: var(--shadow-md);
        }
        .avatar-large-placeholder {
          background-color: var(--primary-light);
          color: var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 2.2rem;
        }
        .profile-card-header h2 {
          font-size: var(--font-size-xl);
          font-weight: 800;
          margin-bottom: 4px;
        }
        .profile-card-header p {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
        }
        
        .profile-success-banner {
          display: flex;
          gap: 10px;
          background-color: var(--color-success-bg);
          border: 1px solid var(--color-success);
          border-radius: var(--border-radius-md);
          padding: 10px 14px;
          margin-bottom: 20px;
        }
        .profile-error-banner {
          display: flex;
          gap: 10px;
          background-color: var(--color-danger-bg);
          border: 1px solid var(--color-danger);
          border-radius: var(--border-radius-md);
          padding: 10px 14px;
          margin-bottom: 20px;
        }
        .profile-banner-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }
        .profile-success-banner p {
          color: var(--text-primary);
          font-size: var(--font-size-sm);
        }
        .profile-error-banner p {
          color: var(--text-primary);
          font-size: var(--font-size-sm);
        }

        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .profile-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .profile-input-group label {
          font-weight: 700;
          font-size: var(--font-size-sm);
          color: var(--text-primary);
        }
        .profile-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .profile-input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-secondary);
        }
        .profile-input-wrapper input {
          width: 100%;
          padding: 12px 12px 12px 42px;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-md);
          background-color: var(--bg-input);
          outline: none;
          transition: all var(--transition-fast);
        }
        .profile-input-wrapper input:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px var(--primary-light);
        }
        .profile-disabled-input {
          cursor: not-allowed;
          background-color: var(--bg-primary) !important;
          color: var(--text-muted);
        }
        .profile-input-tip {
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-top: 2px;
        }
        
        .btn-profile-save {
          background-color: var(--primary-color);
          color: white;
          border: none;
          padding: 14px;
          border-radius: var(--border-radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: background-color var(--transition-fast);
          margin-top: 12px;
          box-shadow: var(--shadow-primary);
        }
        .btn-profile-save:hover:not(:disabled) {
          background-color: var(--primary-hover);
        }
      `}</style>
    </div>
  );
};

export default Profile;
