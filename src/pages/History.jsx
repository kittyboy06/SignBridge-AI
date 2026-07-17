import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Search, Play, Trash2, Download, RefreshCw, Volume2 } from 'lucide-react';

const History = () => {
  const { user, isGuest } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    setLoading(true);
    if (isGuest || !user) {
      const cached = localStorage.getItem('sb_local_history');
      if (cached) {
        setHistoryItems(JSON.parse(cached));
      } else {
        setHistoryItems([]);
      }
      setLoading(false);
    } else {
      try {
        const { data, error } = await supabase
          .from('translation_history')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (data) setHistoryItems(data);
      } catch (err) {
        console.warn('Failed to fetch from database, loading local storage:', err);
        const cached = localStorage.getItem('sb_local_history');
        if (cached) setHistoryItems(JSON.parse(cached));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this translation entry?')) return;

    if (isGuest || !user) {
      const updated = historyItems.filter(item => item.id !== id);
      setHistoryItems(updated);
      localStorage.setItem('sb_local_history', JSON.stringify(updated));
    } else {
      try {
        const { error } = await supabase
          .from('translation_history')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        setHistoryItems(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        alert('Failed to delete history item: ' + err.message);
      }
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to permanently clear all conversation history?')) return;

    if (isGuest || !user) {
      setHistoryItems([]);
      localStorage.removeItem('sb_local_history');
    } else {
      try {
        const { error } = await supabase
          .from('translation_history')
          .delete()
          .eq('user_id', user.id);
        
        if (error) throw error;
        setHistoryItems([]);
      } catch (err) {
        alert('Failed to clear database history: ' + err.message);
      }
    }
  };

  const handlePlayRow = async (item) => {
    if (playingId === item.id) {
      setPlayingId(null);
      return;
    }

    setPlayingId(item.id);
    console.log(`Replaying translation audio: "${item.translated_text}"`);

    // Call TTS Edge function or fall back to local Web Speech API
    try {
      const languageCode = item.target_lang === 'Tamil' ? 'ta-IN' : item.target_lang === 'Hindi' ? 'hi-IN' : 'en-US';
      const voiceGender = localStorage.getItem('sb_voice_gender') || 'FEMALE';
      const speakingRate = parseFloat(localStorage.getItem('sb_voice_rate') || '1.0');
      const pitch = parseFloat(localStorage.getItem('sb_voice_pitch') || '0.0');
      const voiceTier = localStorage.getItem('sb_voice_tier') || 'NEURAL2';

      const { data, error } = await supabase.functions.invoke('tts', {
        body: { text: item.translated_text, languageCode, voiceGender, speakingRate, pitch, voiceTier }
      });

      if (data && data.audioContent && !data.isMock) {
        const audioUrl = `data:audio/mp3;base64,${data.audioContent}`;
        const audio = new Audio(audioUrl);
        audio.onended = () => setPlayingId(null);
        audio.onerror = () => {
          triggerSpeechFallback(item.translated_text, item.target_lang);
        };
        audio.play().catch(() => {
          triggerSpeechFallback(item.translated_text, item.target_lang);
        });
      } else {
        triggerSpeechFallback(item.translated_text, item.target_lang);
      }
    } catch (err) {
      triggerSpeechFallback(item.translated_text, item.target_lang);
    }
  };

  const triggerSpeechFallback = (text, targetLang) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = targetLang === 'Tamil' ? 'ta-IN' : targetLang === 'Hindi' ? 'hi-IN' : 'en-US';
      
      const speakingRate = parseFloat(localStorage.getItem('sb_voice_rate') || '1.0');
      const pitch = parseFloat(localStorage.getItem('sb_voice_pitch') || '0.0');
      
      utterance.rate = speakingRate;
      utterance.pitch = 1 + (pitch / 20);

      utterance.onend = () => setPlayingId(null);
      utterance.onerror = () => setPlayingId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingId(null);
    }
  };

  // Export logs to a downloadable text file (GDPR compliance)
  const handleExport = () => {
    if (historyItems.length === 0) return;
    
    let content = 'SignBridge AI Translation Log File\n';
    content += `Export Date: ${new Date().toLocaleString()}\n`;
    content += '==================================================\n\n';

    historyItems.forEach((item, index) => {
      content += `[${index + 1}] Timestamp: ${item.created_at || new Date().toISOString()}\n`;
      content += `    Direction: ${item.source_lang} ⇄ ${item.target_lang}\n`;
      content += `    Original:  "${item.detected_text}"\n`;
      content += `    Translated: "${item.translated_text}"\n`;
      content += '--------------------------------------------------\n';
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `signbridge_history_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredItems = historyItems.filter(item => 
    item.detected_text.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.translated_text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="history-container animate-fade-in">
      <div className="history-header-row">
        <div>
          <h2>Conversation History</h2>
          <p className="history-sub">
            {isGuest ? 'Viewing local guest session history (not synced)' : 'All past translation logs saved to your profile'}
          </p>
        </div>
        
        {historyItems.length > 0 && (
          <div className="history-bulk-actions">
            <button onClick={handleExport} className="btn-secondary" title="Export logs">
              <Download size={16} style={{ marginRight: 6 }} />
              Export Logs
            </button>
            <button onClick={handleClearAll} className="btn-secondary danger-text" title="Clear all history">
              <Trash2 size={16} style={{ marginRight: 6 }} />
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Search Filter Bar */}
      <div className="search-bar-wrapper">
        <Search size={18} className="search-icon" />
        <input 
          type="text" 
          placeholder="Search by original words or translations..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="history-search-input"
          aria-label="Search History"
        />
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="history-loading-spinner-box">
          <div className="loading-spinner"></div>
          <p>Fetching history logs...</p>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="history-list">
          {filteredItems.map(item => {
            const isPlaying = playingId === item.id;
            return (
              <div key={item.id} className="history-row-card">
                <div className="history-row-main">
                  <span className="history-row-lang">{item.source_lang} ⇄ {item.target_lang}</span>
                  <div className="history-text-exchanges">
                    <p className="exchange-original">“ {item.detected_text} ”</p>
                    <p className="exchange-translation">{item.translated_text}</p>
                  </div>
                  <div className="history-row-meta">
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="history-row-actions">
                  <button 
                    onClick={() => handlePlayRow(item)} 
                    className={`btn-row-play ${isPlaying ? 'active' : ''}`} 
                    title="Play Audio"
                  >
                    <Volume2 size={16} className={isPlaying ? 'speak-pulse' : ''} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="btn-row-delete" title="Delete entry">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-history-state">
          <span className="empty-state-icon">🗒️</span>
          <h3>No Conversations Found</h3>
          <p>{searchQuery ? 'No results matched your search query.' : 'Log your first live translation to populate your history!'}</p>
        </div>
      )}

      <style>{`
        .history-container {
          max-width: 800px;
          margin: 0 auto;
        }
        .history-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          gap: 16px;
        }
        .history-sub {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
        }
        .history-bulk-actions {
          display: flex;
          gap: 10px;
        }
        .btn-secondary {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          padding: 8px 16px;
          border-radius: var(--border-radius-sm);
          font-weight: 600;
          font-size: var(--font-size-sm);
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-sm);
        }
        .btn-secondary:hover {
          background-color: var(--bg-sidebar);
        }
        .btn-secondary.danger-text {
          color: var(--color-danger);
          border-color: var(--color-danger);
        }
        .btn-secondary.danger-text:hover {
          background-color: var(--color-danger-bg);
        }
        
        .search-bar-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          margin-bottom: 24px;
        }
        .search-icon {
          position: absolute;
          left: 16px;
          color: var(--text-secondary);
        }
        .history-search-input {
          width: 100%;
          padding: 14px 14px 14px 46px;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-md);
          background-color: var(--bg-card);
          outline: none;
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-fast);
        }
        .history-search-input:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px var(--primary-light);
        }

        .history-loading-spinner-box {
          text-align: center;
          padding: 40px;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-lg);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--border-color);
          border-top: 3px solid var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .history-row-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-lg);
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: var(--shadow-sm);
          transition: transform var(--transition-fast);
        }
        .history-row-card:hover {
          transform: translateY(-2px);
        }
        .history-row-main {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-grow: 1;
          padding-right: 20px;
        }
        .history-row-lang {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--primary-color);
          background-color: var(--primary-light);
          padding: 2px 8px;
          border-radius: 6px;
          align-self: flex-start;
        }
        .exchange-original {
          font-weight: 700;
          font-size: var(--font-size-md);
          color: var(--text-secondary);
        }
        .exchange-translation {
          font-size: var(--font-size-lg);
          font-weight: 700;
          color: var(--text-primary);
          margin-top: 4px;
        }
        .history-row-meta {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 4px;
        }
        
        .history-row-actions {
          display: flex;
          gap: 8px;
        }
        .btn-row-play {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: var(--primary-color);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: var(--shadow-primary);
          transition: all var(--transition-fast);
        }
        .btn-row-play:hover {
          background-color: var(--primary-hover);
        }
        .btn-row-play.active {
          background-color: var(--color-success);
        }
        .speak-pulse {
          animation: beat 0.8s infinite alternate;
        }
        @keyframes beat {
          0% { transform: scale(0.9); }
          100% { transform: scale(1.15); }
        }
        
        .btn-row-delete {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .btn-row-delete:hover {
          background-color: var(--color-danger-bg);
          color: var(--color-danger);
          border-color: var(--color-danger);
        }

        .empty-history-state {
          text-align: center;
          padding: 60px 20px;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-sm);
        }
        .empty-state-icon {
          font-size: 3.5rem;
          display: block;
          margin-bottom: 16px;
        }
        .empty-history-state h3 {
          margin-bottom: 8px;
          font-weight: 700;
        }
        .empty-history-state p {
          color: var(--text-secondary);
        }
        
        @media (max-width: 600px) {
          .history-header-row {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .history-bulk-actions {
            justify-content: flex-end;
          }
          .history-row-card {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }
          .history-row-main {
            padding-right: 0;
          }
          .history-row-actions {
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  );
};

export default History;
