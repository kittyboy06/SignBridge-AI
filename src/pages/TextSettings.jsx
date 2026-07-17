import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Type } from 'lucide-react';

const TextSettings = () => {
  const navigate = useNavigate();

  // Load preferences or set defaults
  const [fontSize, setFontSize] = useState(localStorage.getItem('sb_font_size') || 'normal');
  const [contrast, setContrast] = useState(localStorage.getItem('sb_contrast') || 'normal');
  const [bgOpacity, setBgOpacity] = useState(parseInt(localStorage.getItem('sb_caption_opacity') || '80'));
  const [autoPlay, setAutoPlay] = useState(localStorage.getItem('sb_auto_play') === 'true');

  // Save values to localStorage and dispatch update events
  useEffect(() => {
    localStorage.setItem('sb_font_size', fontSize);
    localStorage.setItem('sb_contrast', contrast);
    localStorage.setItem('sb_caption_opacity', bgOpacity.toString());
    localStorage.setItem('sb_auto_play', autoPlay.toString());
    
    // Dispatch custom event to notify layout/screens
    window.dispatchEvent(new Event('settings_updated'));
    
    // Immediate CSS adjustments
    document.documentElement.setAttribute('data-contrast', contrast);
    const baseSize = fontSize === 'large' ? '18px' : fontSize === 'xlarge' ? '20px' : '16px';
    document.documentElement.style.setProperty('--font-size-base', baseSize);
  }, [fontSize, contrast, bgOpacity, autoPlay]);

  return (
    <div className="text-settings-viewport animate-fade-in">
      <div className="back-nav-header">
        <button onClick={() => navigate('/settings')} className="btn-back">
          <ArrowLeft size={18} />
          Back to Settings
        </button>
      </div>

      <div className="text-card">
        <div className="text-card-header">
          <Type size={24} className="text-header-icon" />
          <div>
            <h2>Text & Caption Settings</h2>
            <p>Customize display sizes, legibility, and automated playback options</p>
          </div>
        </div>

        <div className="text-options-body">
          {/* Font Size Selection */}
          <div className="option-row">
            <label className="option-label">Caption Font Size</label>
            <div className="font-size-buttons">
              <button 
                type="button" 
                onClick={() => setFontSize('normal')}
                className={`font-btn ${fontSize === 'normal' ? 'active' : ''}`}
              >
                Normal (16px)
              </button>
              <button 
                type="button" 
                onClick={() => setFontSize('large')}
                className={`font-btn ${fontSize === 'large' ? 'active' : ''}`}
              >
                Large (18px)
              </button>
              <button 
                type="button" 
                onClick={() => setFontSize('xlarge')}
                className={`font-btn ${fontSize === 'xlarge' ? 'active' : ''}`}
              >
                Extra Large (20px)
              </button>
            </div>
          </div>

          {/* High Contrast Mode Toggle */}
          <div className="option-row">
            <div className="toggle-option-wrapper">
              <div>
                <label className="option-label">High Contrast Mode</label>
                <p className="toggle-sub">Increase visual boundaries and maximize text legibility (WCAG AAA compliant)</p>
              </div>
              <input 
                type="checkbox" 
                checked={contrast === 'high'}
                onChange={(e) => setContrast(e.target.checked ? 'high' : 'normal')}
                className="accessibility-toggle-switch"
                aria-label="High Contrast Mode Toggle"
              />
            </div>
          </div>

          {/* Caption Opacity Slider */}
          <div className="option-row">
            <div className="slider-label-row">
              <label className="option-label">Caption Card Background Opacity</label>
              <span className="slider-val">{bgOpacity}%</span>
            </div>
            <input 
              type="range" 
              min="20" 
              max="100" 
              step="5"
              value={bgOpacity} 
              onChange={(e) => setBgOpacity(parseInt(e.target.value))}
              className="settings-slider"
            />
            <div className="slider-limits">
              <span>Translucent</span>
              <span>Fully Opaque</span>
            </div>
          </div>

          {/* Auto-Play Speech Toggle */}
          <div className="option-row">
            <div className="toggle-option-wrapper">
              <div>
                <label className="option-label">Auto-Play Audio Output</label>
                <p className="toggle-sub">Automatically speak the translation using TTS when a sign is committed (off by default)</p>
              </div>
              <input 
                type="checkbox" 
                checked={autoPlay}
                onChange={(e) => setAutoPlay(e.target.checked)}
                className="accessibility-toggle-switch"
                aria-label="Auto-Play Audio Toggle"
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .text-settings-viewport {
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
        
        .text-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-lg);
          padding: 30px;
          box-shadow: var(--shadow-md);
        }
        .text-card-header {
          display: flex;
          align-items: center;
          gap: 16px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 20px;
          margin-bottom: 24px;
        }
        .text-header-icon {
          color: var(--primary-color);
        }
        .text-card-header h2 {
          font-size: var(--font-size-xl);
          font-weight: 800;
        }
        .text-card-header p {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
        }

        .text-options-body {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .option-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .option-label {
          font-weight: 700;
          font-size: var(--font-size-sm);
          color: var(--text-primary);
        }
        
        .font-size-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .font-btn {
          flex: 1;
          min-width: 120px;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          padding: 12px;
          border-radius: var(--border-radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .font-btn.active {
          background-color: var(--primary-color);
          border-color: var(--primary-color);
          color: white;
          box-shadow: var(--shadow-primary);
        }
        
        .toggle-option-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }
        .toggle-sub {
          font-size: 0.75rem;
          color: var(--text-secondary);
          max-width: 320px;
        }
        .accessibility-toggle-switch {
          width: 48px;
          height: 24px;
          cursor: pointer;
          accent-color: var(--primary-color);
        }

        .slider-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .slider-val {
          font-size: var(--font-size-sm);
          font-weight: 700;
          color: var(--primary-color);
        }
        .settings-slider {
          width: 100%;
          cursor: pointer;
          accent-color: var(--primary-color);
        }
        .slider-limits {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};

export default TextSettings;
