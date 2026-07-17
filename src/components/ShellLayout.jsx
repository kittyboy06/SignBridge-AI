import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Video, 
  MessageSquare, 
  Clock, 
  Bell, 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  Globe, 
  LogOut, 
  User,
  Lightbulb,
  X
} from 'lucide-react';

const ShellLayout = ({ children }) => {
  const { user, profile, logOut, isGuest } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Settings states
  const [theme, setTheme] = useState(localStorage.getItem('sb_theme') || 'light');
  const [contrast, setContrast] = useState(localStorage.getItem('sb_contrast') || 'normal');
  const [fontSize, setFontSize] = useState(localStorage.getItem('sb_font_size') || 'normal');
  const [showTip, setShowTip] = useState(localStorage.getItem('sb_dismiss_tip') !== 'true');
  const [appLanguage, setAppLanguage] = useState(localStorage.getItem('sb_app_language') || 'English');

  // Sync settings with DOM attributes on change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sb_theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-contrast', contrast);
    localStorage.setItem('sb_contrast', contrast);
  }, [contrast]);

  useEffect(() => {
    // Basic font size classes on html element
    const html = document.documentElement;
    html.style.setProperty('--font-size-base', fontSize === 'large' ? '18px' : fontSize === 'xlarge' ? '20px' : '16px');
    localStorage.setItem('sb_font_size', fontSize);
  }, [fontSize]);

  // Listen to external settings changes (from settings screen)
  useEffect(() => {
    const handleStorageChange = () => {
      setTheme(localStorage.getItem('sb_theme') || 'light');
      setContrast(localStorage.getItem('sb_contrast') || 'normal');
      setFontSize(localStorage.getItem('sb_font_size') || 'normal');
    };
    window.addEventListener('storage', handleStorageChange);
    // Custom event dispatcher for same-window updates
    window.addEventListener('settings_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settings_updated', handleStorageChange);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const dismissTip = () => {
    setShowTip(false);
    localStorage.setItem('sb_dismiss_tip', 'true');
  };

  const handleLanguageChange = (e) => {
    setAppLanguage(e.target.value);
    localStorage.setItem('sb_app_language', e.target.value);
  };

  const navItems = [
    { name: 'Live Translator', path: '/', icon: <Video size={20} /> },
    { name: 'Conversations', path: '/history?view=conversations', icon: <MessageSquare size={20} /> },
    { name: 'History', path: '/history', icon: <Clock size={20} /> },
    { name: 'Emergency', path: '/emergency', icon: <Bell size={20} /> },
    { name: 'Settings', path: '/settings', icon: <SettingsIcon size={20} /> }
  ];

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';
  const avatarText = displayName.charAt(0).toUpperCase();

  return (
    <div className="layout-wrapper">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand" onClick={() => navigate('/')}>
          <div className="brand-logo">
            <span className="brand-hands-emoji">👋</span>
          </div>
          <div className="brand-text">
            <h2>SignBridge AI</h2>
            <p>Bridging Communication</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.name}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-name">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Illustration & Info */}
        <div className="sidebar-card-footer">
          <div className="footer-illustration">
            <div className="ill-person-left">🧑‍💻</div>
            <div className="ill-person-right">👩‍💼</div>
          </div>
          <h3>Break the barrier.</h3>
          <p>Build understanding.</p>
          <span className="heart-icon">💚</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-viewport">
        {/* Top Header Bar */}
        <header className="top-header">
          <div className="header-greeting">
            <h1>Hello, {isGuest ? 'Guest' : displayName} 👋</h1>
            <p>Let's create a world where every sign is understood.</p>
          </div>

          <div className="header-actions">
            {/* Guest Banner Badge */}
            {isGuest && (
              <span className="guest-badge" title="History won't sync to server">
                Guest Mode
              </span>
            )}

            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="action-btn" aria-label="Toggle dark mode">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Language Quick-Switch Selector */}
            <div className="language-selector-wrapper">
              <Globe size={18} className="lang-globe-icon" />
              <select 
                value={appLanguage} 
                onChange={handleLanguageChange} 
                className="language-dropdown-select"
                aria-label="Select App Language"
              >
                <option value="English">English</option>
                <option value="Tamil">Tamil</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>

            {/* Profile Avatar Clickable Dropdown */}
            <div className="avatar-wrapper" onClick={() => navigate('/profile')}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {avatarText}
                </div>
              )}
              <span className="avatar-status-dot"></span>
            </div>
            
            {/* Sign Out Button */}
            <button onClick={logOut} className="signout-btn" title="Sign Out">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="content-container">
          {children}
        </main>

        {/* Dismissible Tip Banner at the Bottom */}
        {showTip && (
          <div className="tip-banner animate-fade-in">
            <div className="tip-content">
              <Lightbulb size={20} className="tip-icon" />
              <p>Tip: Position your hands clearly in front of the camera for best results.</p>
            </div>
            <button onClick={dismissTip} className="tip-close-btn" aria-label="Dismiss Tip">
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        .layout-wrapper {
          display: flex;
          min-height: 100vh;
          background-color: var(--bg-primary);
        }
        
        /* Sidebar Styles */
        .sidebar {
          width: var(--sidebar-width);
          background-color: var(--bg-sidebar);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: 100vh;
          transition: all var(--transition-normal);
        }
        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 36px;
          cursor: pointer;
        }
        .brand-logo {
          width: 42px;
          height: 42px;
          border-radius: var(--border-radius-md);
          background-color: var(--bg-card);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-sm);
          font-size: 1.4rem;
        }
        .brand-text h2 {
          font-size: 1.15rem;
          font-weight: 800;
          font-family: var(--font-heading);
          line-height: 1.1;
        }
        .brand-text p {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-grow: 1;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: var(--border-radius-md);
          color: var(--text-secondary);
          font-weight: 600;
          transition: all var(--transition-fast);
        }
        .nav-item:hover {
          background-color: var(--bg-primary);
          color: var(--text-primary);
        }
        .nav-item.active {
          background-color: var(--primary-color);
          color: white;
          box-shadow: var(--shadow-primary);
        }
        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sidebar-card-footer {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-lg);
          padding: 20px 16px;
          text-align: center;
          position: relative;
          box-shadow: var(--shadow-sm);
        }
        .footer-illustration {
          display: flex;
          justify-content: center;
          gap: 16px;
          font-size: 2rem;
          margin-bottom: 8px;
        }
        .sidebar-card-footer h3 {
          font-size: var(--font-size-sm);
          font-weight: 700;
        }
        .sidebar-card-footer p {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        .heart-icon {
          font-size: 0.85rem;
        }

        /* Main Viewport Styles */
        .main-viewport {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          min-width: 0; /* Prevents flex children from breaking layout */
          position: relative;
        }
        
        /* Top Header Styles */
        .top-header {
          height: var(--header-height);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 32px;
          flex-shrink: 0;
        }
        .header-greeting h1 {
          font-size: var(--font-size-xl);
          font-weight: 800;
          line-height: 1.2;
        }
        .header-greeting p {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .guest-badge {
          background-color: var(--color-warning-bg);
          border: 1px solid var(--color-warning);
          color: var(--color-warning);
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .action-btn {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
          color: var(--text-secondary);
          box-shadow: var(--shadow-sm);
        }
        .action-btn:hover {
          background-color: var(--bg-sidebar);
          color: var(--text-primary);
        }
        .language-selector-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .lang-globe-icon {
          position: absolute;
          left: 12px;
          color: var(--text-secondary);
          pointer-events: none;
        }
        .language-dropdown-select {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          padding: 10px 12px 10px 36px;
          border-radius: 20px;
          font-weight: 600;
          font-size: var(--font-size-sm);
          cursor: pointer;
          outline: none;
          box-shadow: var(--shadow-sm);
          appearance: none;
          min-width: 120px;
        }
        .language-dropdown-select:hover {
          background-color: var(--bg-sidebar);
        }
        .avatar-wrapper {
          position: relative;
          cursor: pointer;
        }
        .profile-avatar-img, .profile-avatar-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid var(--bg-card);
          box-shadow: var(--shadow-sm);
        }
        .profile-avatar-placeholder {
          background-color: var(--primary-light);
          color: var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.1rem;
        }
        .avatar-status-dot {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: var(--color-success);
          border: 2px solid var(--bg-card);
        }
        .signout-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          transition: background-color var(--transition-fast);
        }
        .signout-btn:hover {
          background-color: var(--color-danger-bg);
          color: var(--color-danger);
        }

        /* Content Container Styles */
        .content-container {
          flex-grow: 1;
          padding: 32px;
          overflow-y: auto;
        }
        
        /* Tip Banner Styles */
        .tip-banner {
          position: fixed;
          bottom: 24px;
          left: calc(var(--sidebar-width) + 32px);
          right: 32px;
          background-color: var(--primary-light);
          border: 1px solid var(--primary-color);
          border-radius: var(--border-radius-md);
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: var(--shadow-md);
          z-index: 100;
        }
        .tip-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .tip-icon {
          color: var(--primary-color);
          flex-shrink: 0;
        }
        .tip-content p {
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--text-primary);
        }
        .tip-close-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 50%;
        }
        .tip-close-btn:hover {
          background-color: rgba(0, 0, 0, 0.05);
          color: var(--text-primary);
        }

        /* Mobile adjustments */
        @media (max-width: 900px) {
          .sidebar {
            width: 80px;
            padding: 24px 8px;
          }
          .brand-text, .nav-name, .sidebar-card-footer {
            display: none;
          }
          .sidebar-brand {
            margin-bottom: 24px;
            justify-content: center;
          }
          .nav-item {
            justify-content: center;
            padding: 12px;
          }
          .tip-banner {
            left: 112px;
          }
        }
        
        @media (max-width: 600px) {
          .layout-wrapper {
            flex-direction: column;
          }
          .sidebar {
            width: 100%;
            height: 60px;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding: 10px 16px;
            position: fixed;
            bottom: 0;
            top: auto;
            z-index: 1000;
            border-right: none;
            border-top: 1px solid var(--border-color);
          }
          .sidebar-brand {
            display: none;
          }
          .sidebar-nav {
            flex-direction: row;
            justify-content: space-around;
            width: 100%;
            margin: 0;
          }
          .nav-item {
            padding: 8px;
          }
          .top-header {
            height: auto;
            min-height: 64px;
            padding: 10px 16px;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
          }
          .header-greeting h1 {
            font-size: 1.15rem;
            font-weight: 700;
            line-height: 1.2;
          }
          .header-greeting p {
            display: none; /* Hide branding text on mobile */
          }
          .header-actions {
            gap: 8px;
            flex-wrap: nowrap;
          }
          .language-selector-wrapper {
            display: flex;
            align-items: center;
          }
          .language-dropdown-select {
            padding: 6px 8px 6px 24px;
            min-width: 80px;
            font-size: 11px;
            border-radius: 12px;
          }
          .lang-globe-icon {
            left: 8px;
            width: 14px;
            height: 14px;
          }
          .action-btn {
            width: 32px;
            height: 32px;
          }
          .action-btn svg {
            width: 16px;
            height: 16px;
          }
          .profile-avatar-img, .profile-avatar-placeholder {
            width: 32px;
            height: 32px;
          }
          .profile-avatar-placeholder {
            font-size: 0.9rem;
          }
          .guest-badge {
            padding: 2px 6px;
            font-size: 0.65rem;
            border-radius: 10px;
          }
          .signout-btn {
            padding: 6px;
          }
          .signout-btn svg {
            width: 16px;
            height: 16px;
          }
          .content-container {
            padding: 16px;
            margin-bottom: 60px; /* Space for sticky bottom bar */
          }
          .tip-banner {
            left: 16px;
            right: 16px;
            bottom: 80px;
          }
        }
      `}</style>
    </div>
  );
};

export default ShellLayout;
