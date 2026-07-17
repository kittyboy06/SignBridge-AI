import React, { useState } from 'react';
import { Volume2, AlertOctagon, HelpCircle, HeartPulse, UserRoundCheck, Landmark, MessageSquareWarning } from 'lucide-react';

const Emergency = () => {
  const [playingId, setPlayingId] = useState(null);

  const emergencyPhrases = [
    { id: 'need_help', text_en: 'I need help', text_ta: 'எனக்கு உதவி தேவை', icon: <HelpCircle size={28} /> },
    { id: 'ambulance', text_en: 'Call an ambulance', text_ta: 'ஆம்புலன்ஸை அழைக்கவும்', icon: <HeartPulse size={28} /> },
    { id: 'hospital', text_en: 'Where is the hospital?', text_ta: 'மருத்துவமனை எங்கே இருக்கிறது?', icon: <Landmark size={28} /> },
    { id: 'deaf_hearing', text_en: 'I am deaf / hard of hearing', text_ta: 'நான் காது கேளாதவர்', icon: <UserRoundCheck size={28} /> },
    { id: 'emergency', text_en: 'There is an emergency', text_ta: 'இங்கே ஒரு அவசர நிலை உள்ளது', icon: <AlertOctagon size={28} /> },
    { id: 'contact_family', text_en: 'Please contact my family', text_ta: 'எனது குடும்பத்தினரை தொடர்பு கொள்ளவும்', icon: <MessageSquareWarning size={28} /> }
  ];

  const handlePlayPhrase = (id) => {
    setPlayingId(id);
    console.log(`Triggering pre-cached audio for phrase: ${id}`);
    
    // Play local audio files from public/audio/emergency/
    const baseUrl = import.meta.env.BASE_URL || '/';
    const audioDir = baseUrl.endsWith('/') ? `${baseUrl}audio/emergency/` : `${baseUrl}/audio/emergency/`;
    const audioPath = `${audioDir}${id}_ta.mp3`;
    const audio = new Audio(audioPath);
    
    audio.play().catch(err => {
      console.warn('Audio cache not loaded yet. Mocking speech...', err);
      // Fallback: Web Speech API (speechSynthesis) if offline cache isn't built yet
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new UtteranceMock(id);
        window.speechSynthesis.speak(utterance);
      }
    });

    audio.onended = () => setPlayingId(null);
    setTimeout(() => {
      setPlayingId(null); // Clear animation fallback
    }, 2000);
  };

  // Basic mock class for Web Speech fallback parameters
  class UtteranceMock {
    constructor(id) {
      const phrase = emergencyPhrases.find(p => p.id === id);
      const utterance = new SpeechSynthesisUtterance(phrase.text_ta);
      utterance.lang = 'ta-IN';
      utterance.rate = 0.95;
      return utterance;
    }
  }

  return (
    <div className="emergency-viewport animate-fade-in">
      <div className="emergency-header">
        <div className="emergency-alert-icon">⚠️</div>
        <h2>Emergency Broadcast Module</h2>
        <p>Tap any phrase card below for instant spoken Tamil/English audio playback to communicate with others.</p>
      </div>

      {/* Grid of Phrases */}
      <div className="emergency-grid">
        {emergencyPhrases.map((phrase) => {
          const isPlaying = playingId === phrase.id;
          return (
            <button
              key={phrase.id}
              onClick={() => handlePlayPhrase(phrase.id)}
              className={`emergency-card ${isPlaying ? 'playing' : ''}`}
              aria-label={`Play: ${phrase.text_en}`}
            >
              <div className="emergency-card-top">
                <span className="emergency-icon-container">{phrase.icon}</span>
                <span className="emergency-play-icon">
                  <Volume2 size={20} className={isPlaying ? 'wave-pulse' : ''} />
                </span>
              </div>
              <div className="emergency-card-bottom">
                <h3 className="phrase-ta">{phrase.text_ta}</h3>
                <p className="phrase-en">{phrase.text_en}</p>
              </div>
              {isPlaying && <span className="playing-pulse-overlay"></span>}
            </button>
          );
        })}
      </div>

      <div className="emergency-footer-info">
        <p>💡 Emergency phrases use pre-generated offline-capable audio files for reliability when network connectivity is lost.</p>
      </div>

      <style>{`
        .emergency-viewport {
          max-width: 900px;
          margin: 0 auto;
        }
        .emergency-header {
          text-align: center;
          margin-bottom: 36px;
          padding: 30px;
          background-color: var(--color-danger-bg);
          border: 1px solid var(--color-danger);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-sm);
        }
        .emergency-alert-icon {
          font-size: 2.5rem;
          margin-bottom: 8px;
          display: block;
        }
        .emergency-header h2 {
          color: var(--color-danger);
          font-weight: 800;
          margin-bottom: 8px;
        }
        .emergency-header p {
          max-width: 600px;
          margin: 0 auto;
          color: var(--text-primary);
          font-size: var(--font-size-sm);
          font-weight: 600;
        }

        .emergency-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
          margin-bottom: 36px;
        }
        .emergency-card {
          background-color: var(--bg-card);
          border: 2px solid var(--border-color);
          border-radius: var(--border-radius-lg);
          padding: 24px;
          text-align: left;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all var(--transition-fast);
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: var(--shadow-sm);
        }
        .emergency-card:hover {
          border-color: var(--color-danger);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .emergency-card.playing {
          border-color: var(--color-danger);
          background-color: var(--color-danger-bg);
        }
        
        .emergency-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .emergency-icon-container {
          color: var(--color-danger);
          background-color: var(--color-danger-bg);
          width: 52px;
          height: 52px;
          border-radius: var(--border-radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .emergency-play-icon {
          color: var(--text-secondary);
        }
        .playing .emergency-play-icon {
          color: var(--color-danger);
        }
        .wave-pulse {
          animation: wavePulse 0.6s infinite alternate;
        }
        @keyframes wavePulse {
          0% { transform: scale(1); }
          100% { transform: scale(1.3); }
        }

        .emergency-card-bottom {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .phrase-ta {
          font-size: var(--font-size-lg);
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.3;
        }
        .phrase-en {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
          font-weight: 500;
        }

        .playing-pulse-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 2px solid var(--color-danger);
          animation: pulseOverlay 1s infinite;
          pointer-events: none;
        }
        @keyframes pulseOverlay {
          0% { opacity: 0.5; }
          50% { opacity: 0.1; }
          100% { opacity: 0.5; }
        }

        .emergency-footer-info {
          text-align: center;
          color: var(--text-secondary);
          font-size: var(--font-size-sm);
          padding: 16px;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-md);
        }
      `}</style>
    </div>
  );
};

export default Emergency;
