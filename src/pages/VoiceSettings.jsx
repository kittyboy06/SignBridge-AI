import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, Play } from 'lucide-react';

const VoiceSettings = () => {
  const navigate = useNavigate();

  // Load preferences from localStorage or set defaults
  const [gender, setGender] = useState(localStorage.getItem('sb_voice_gender') || 'FEMALE');
  const [tier, setTier] = useState(localStorage.getItem('sb_voice_tier') || 'NEURAL2');
  const [rate, setRate] = useState(parseFloat(localStorage.getItem('sb_voice_rate') || '1.0'));
  const [pitch, setPitch] = useState(parseFloat(localStorage.getItem('sb_voice_pitch') || '0.0'));
  const [testing, setTesting] = useState(false);

  // Save values to localStorage on edit
  useEffect(() => {
    localStorage.setItem('sb_voice_gender', gender);
    localStorage.setItem('sb_voice_tier', tier);
    localStorage.setItem('sb_voice_rate', rate.toString());
    localStorage.setItem('sb_voice_pitch', pitch.toString());
    
    // Dispatch custom event to notify layout/screens
    window.dispatchEvent(new Event('settings_updated'));
  }, [gender, tier, rate, pitch]);

  const handleTestVoice = () => {
    setTesting(true);
    console.log(`Testing TTS parameters: Gender=${gender}, Tier=${tier}, Rate=${rate}, Pitch=${pitch}`);
    
    // Fallback: Web Speech API for local demonstration if edge function is offline
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const testText = gender === 'FEMALE' ? 'வணக்கம், இது குரல் அமைப்பின் சோதனை.' : 'வணக்கம், எனது குரல் நன்றாகக் கேட்கிறதா?';
      const utterance = new SpeechSynthesisUtterance(testText);
      utterance.lang = 'ta-IN';
      utterance.rate = rate;
      // Map pitch from Google TTS [-20, 20] to Web Speech API [0.5, 2]
      utterance.pitch = 1 + (pitch / 20); 
      
      utterance.onend = () => setTesting(false);
      utterance.onerror = () => setTesting(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setTesting(false), 2000);
    }
  };

  return (
    <div className="voice-settings-viewport animate-fade-in">
      <div className="back-nav-header">
        <button onClick={() => navigate('/settings')} className="btn-back">
          <ArrowLeft size={18} />
          Back to Settings
        </button>
      </div>

      <div className="voice-card">
        <div className="voice-card-header">
          <Volume2 size={24} className="voice-header-icon" />
          <div>
            <h2>Voice Settings</h2>
            <p>Control text-to-speech audio outputs generated from sign translations</p>
          </div>
        </div>

        <div className="voice-options-body">
          {/* Voice Gender Selection */}
          <div className="option-row">
            <label className="option-label">Voice Gender</label>
            <div className="gender-toggle-group">
              <button 
                type="button" 
                onClick={() => setGender('FEMALE')}
                className={`gender-btn ${gender === 'FEMALE' ? 'active' : ''}`}
              >
                Female Voice
              </button>
              <button 
                type="button" 
                onClick={() => setGender('MALE')}
                className={`gender-btn ${gender === 'MALE' ? 'active' : ''}`}
              >
                Male Voice
              </button>
            </div>
          </div>

          {/* Voice Tier Selection */}
          <div className="option-row">
            <label className="option-label">Voice Tier (Google Cloud Models)</label>
            <select 
              value={tier} 
              onChange={(e) => setTier(e.target.value)} 
              className="tier-dropdown"
            >
              <option value="STANDARD">Standard (High Speed, Lower Cost)</option>
              <option value="WAVENET">WaveNet (Premium human-like synthesis)</option>
              <option value="NEURAL2">Neural2 (State of the art quality models)</option>
            </select>
          </div>

          {/* Speaking Rate Slider */}
          <div className="option-row">
            <div className="slider-label-row">
              <label className="option-label">Speaking Rate</label>
              <span className="slider-val">{rate.toFixed(2)}x</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="2.0" 
              step="0.05"
              value={rate} 
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="settings-slider"
            />
            <div className="slider-limits">
              <span>Slower</span>
              <span>Normal</span>
              <span>Faster</span>
            </div>
          </div>

          {/* Voice Pitch Slider */}
          <div className="option-row">
            <div className="slider-label-row">
              <label className="option-label">Voice Pitch</label>
              <span className="slider-val">{pitch > 0 ? `+${pitch}` : pitch} semitones</span>
            </div>
            <input 
              type="range" 
              min="-20.0" 
              max="20.0" 
              step="1"
              value={pitch} 
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="settings-slider"
            />
            <div className="slider-limits">
              <span>Lower</span>
              <span>Default</span>
              <span>Higher</span>
            </div>
          </div>

          {/* Test Voice Button */}
          <div className="test-voice-row">
            <button 
              onClick={handleTestVoice} 
              className={`btn-test-voice ${testing ? 'testing' : ''}`}
              disabled={testing}
            >
              <Play size={18} fill="currentColor" style={{ marginRight: 8 }} />
              {testing ? 'Speaking Tamil...' : 'Test Tamil Voice'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .voice-settings-viewport {
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
        
        .voice-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-lg);
          padding: 30px;
          box-shadow: var(--shadow-md);
        }
        .voice-card-header {
          display: flex;
          align-items: center;
          gap: 16px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 20px;
          margin-bottom: 24px;
        }
        .voice-header-icon {
          color: var(--primary-color);
        }
        .voice-card-header h2 {
          font-size: var(--font-size-xl);
          font-weight: 800;
        }
        .voice-card-header p {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
        }

        .voice-options-body {
          display: flex;
          flex-direction: column;
          gap: 24px;
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
        .gender-toggle-group {
          display: flex;
          gap: 12px;
        }
        .gender-btn {
          flex: 1;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          padding: 12px;
          border-radius: var(--border-radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .gender-btn.active {
          background-color: var(--primary-color);
          border-color: var(--primary-color);
          color: white;
          box-shadow: var(--shadow-primary);
        }
        
        .tier-dropdown {
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          padding: 12px;
          border-radius: var(--border-radius-md);
          font-weight: 600;
          outline: none;
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
        
        .test-voice-row {
          margin-top: 12px;
          border-top: 1px solid var(--border-color);
          padding-top: 24px;
        }
        .btn-test-voice {
          background-color: var(--primary-color);
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: var(--border-radius-md);
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color var(--transition-fast);
          box-shadow: var(--shadow-primary);
        }
        .btn-test-voice:hover {
          background-color: var(--primary-hover);
        }
        .btn-test-voice:disabled {
          background-color: var(--color-success);
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default VoiceSettings;
