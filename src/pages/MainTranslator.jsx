import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Maximize2, RefreshCw, Volume2, Play, ChevronRight, HelpCircle, Sparkles } from 'lucide-react';
import CameraTranslator from '../components/CameraTranslator';

// Client-side fallback dictionary for offline/billing-free demonstration
const localMocks = {
  tamil: {
    'good morning how are you': 'காலை வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்?',
    'good morning how are you?': 'காலை வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்?',
    'i need some water': 'எனக்கு கொஞ்சம் தண்ணீர் வேண்டும்.',
    'i need some water.': 'எனக்கு கொஞ்சம் தண்ணீர் வேண்டும்.',
    'where is the hospital': 'மருத்துவமனை எங்கே இருக்கிறது?',
    'where is the hospital?': 'மருத்துவமனை எங்கே இருக்கிறது?',
    'i need help': 'எனக்கு உதவி தேவை',
    'i need help.': 'எனக்கு உதவி தேவை',
    'call an ambulance': 'ஆம்புலன்ஸை அழைக்கவும்',
    'call an ambulance.': 'ஆம்புலன்ஸை அழைக்கவும்',
    'i am deaf / hard of hearing': 'நான் காது கேளாதவர்',
    'i am deaf': 'நான் காது கேளாதவர்',
    'there is an emergency': 'இங்கே ஒரு அவசர நிலை உள்ளது',
    'please contact my family': 'எனது குடும்பத்தினரை தொடர்பு கொள்ளவும்',
    'thank you': 'நன்றி',
    'yes': 'ஆம்',
    'no': 'இல்லை'
  },
  hindi: {
    'good morning how are you': 'शुभ प्रभात, आप कैसे हैं?',
    'good morning how are you?': 'शुभ प्रभात, आप कैसे हैं?',
    'i need some water': 'मुझे थोड़ा पानी चाहिए।',
    'i need some water.': 'मुझे थोड़ा पानी चाहिए।',
    'where is the hospital': 'अस्पताल कहाँ है?',
    'where is the hospital?': 'अस्पताल कहाँ है?',
    'i need help': 'मुझे मदद चाहिए',
    'call an ambulance': 'एम्बुलेंस बुलाओ'
  }
};

const MainTranslator = () => {
  const { user, isGuest } = useAuth();
  
  // Language Direction
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Tamil');

  // Translation States
  const [rawSentence, setRawSentence] = useState('');
  const [enhancedSentence, setEnhancedSentence] = useState('');
  const [enhancing, setEnhancing] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [translating, setTranslating] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0); // 0 to 100%

  // Playback refs
  const audioRef = useRef(null);
  const translationTimeoutRef = useRef(null);

  // History States (loaded from localStorage/Supabase)
  const [historyItems, setHistoryItems] = useState([]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (isGuest || !user) {
      // Load local history from localStorage
      const cached = localStorage.getItem('sb_local_history');
      if (cached) {
        setHistoryItems(JSON.parse(cached).slice(0, 10));
      }
    } else {
      // Query history from Supabase
      try {
        const { data, error } = await supabase
          .from('translation_history')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        if (data) {
          setHistoryItems(data);
        }
      } catch (err) {
        console.warn('Failed to load Supabase history, loading local fallback:', err);
      }
    }
  };

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
  };

  // Fallback clean-up rules for off-grid mock enhancement
  const cleanRawLettersFallback = (text) => {
    const clean = text.toUpperCase().replace(/[^A-Z\s]/g, '');
    const words = clean.split(/\s+/);
    const cleanedWords = words.map(word => {
      let result = '';
      let lastChar = '';
      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        if (char !== lastChar) {
          result += char;
          lastChar = char;
        }
      }
      return result;
    });
    const deduplicated = cleanedWords.join(' ');
    const mappings = {
      'GOOD MORNING HOW ARE YOU': 'Good morning, how are you?',
      'I NEED SOME WATER': 'I need some water.',
      'WHERE IS THE HOSPITAL': 'Where is the hospital?',
      'I NEED HELP': 'I need help.',
      'CALL AN AMBULANCE': 'Call an ambulance.',
      'I AM DEAF': 'I am deaf.',
      'THANK YOU': 'Thank you.'
    };
    for (const [key, val] of Object.entries(mappings)) {
      if (deduplicated.includes(key) || key.includes(deduplicated) && deduplicated.length > 3) {
        return val;
      }
    }
    const sentence = deduplicated.charAt(0) + deduplicated.slice(1).toLowerCase();
    return sentence ? `${sentence}.` : 'Show your hand to sign.';
  };

  // Enhance spelled text via Gemini Edge Function
  const executeEnhancement = async (rawText) => {
    setEnhancing(true);
    try {
      const customKey = localStorage.getItem('sb_gemini_api_key');
      const { data, error } = await supabase.functions.invoke('gemini', {
        body: { text: rawText },
        headers: customKey ? {
          'x-gemini-api-key': customKey
        } : {}
      });
      if (error) throw error;
      if (data && data.enhancedText) {
        setEnhancedSentence(data.enhancedText);
        return data.enhancedText;
      } else {
        throw new Error('Malformed response');
      }
    } catch (err) {
      console.warn('Gemini Edge Function failed, generating rule-based mock correction:', err);
      const mockEnhanced = cleanRawLettersFallback(rawText);
      setEnhancedSentence(mockEnhanced);
      return mockEnhanced;
    } finally {
      setEnhancing(false);
    }
  };

  // Debounced translation callback whenever rawSentence changes
  useEffect(() => {
    if (translationTimeoutRef.current) {
      clearTimeout(translationTimeoutRef.current);
    }

    if (!rawSentence.trim()) {
      setEnhancedSentence('');
      setTranslatedText('');
      return;
    }

    // Debounce API requests for 800ms after user pauses signing
    translationTimeoutRef.current = setTimeout(async () => {
      const enhanced = await executeEnhancement(rawSentence);
      if (enhanced) {
        executeTranslation(enhanced);
      }
    }, 800);

    return () => {
      if (translationTimeoutRef.current) clearTimeout(translationTimeoutRef.current);
    };
  }, [rawSentence, targetLang]);

  // Execute translation via Edge Function or client-side fallback
  const executeTranslation = async (textToTranslate) => {
    setTranslating(true);
    
    // 1. Check client-side fallback dictionary first for rapid mockup responses
    const cleanText = textToTranslate.trim().toLowerCase();
    let localResult = '';
    
    if (targetLang === 'Tamil') {
      localResult = localMocks.tamil[cleanText] || localMocks.tamil[cleanText + '.'];
    } else if (targetLang === 'Hindi') {
      localResult = localMocks.hindi[cleanText] || localMocks.hindi[cleanText + '.'];
    }

    if (localResult) {
      setTranslatedText(localResult);
      setTranslating(false);
      // Auto commit to history log
      commitToHistory(textToTranslate, localResult);
      return;
    }

    // 2. Call Supabase edge function
    try {
      const customKey = localStorage.getItem('sb_gemini_api_key');
      const { data, error } = await supabase.functions.invoke('translate', {
        body: { text: textToTranslate, sourceLang, targetLang },
        headers: customKey ? {
          'x-gemini-api-key': customKey
        } : {}
      });

      if (error) throw error;

      if (data && data.translatedText) {
        setTranslatedText(data.translatedText);
        commitToHistory(textToTranslate, data.translatedText);
      } else {
        throw new Error('Malformed response');
      }
    } catch (err) {
      console.warn('Translation Edge Function failed, generating mock translation:', err);
      const mockResult = `[Mock ${targetLang}] ${textToTranslate}`;
      setTranslatedText(mockResult);
      commitToHistory(textToTranslate, mockResult);
    } finally {
      setTranslating(false);
    }
  };

  // Commit text exchange to local state, localStorage, and Supabase
  const commitToHistory = async (originalText, translated) => {
    // Avoid duplicates for the exact same sentence at the top of history
    if (historyItems.length > 0 && historyItems[0].detected_text === originalText) {
      return;
    }

    const newItem = {
      id: Math.random().toString(),
      detected_text: originalText,
      translated_text: translated,
      source_lang: sourceLang,
      target_lang: targetLang,
      created_at: new Date().toISOString()
    };

    // Update state
    setHistoryItems(prev => [newItem, ...prev.slice(0, 9)]);

    if (isGuest || !user) {
      // Save locally to localStorage
      const cached = localStorage.getItem('sb_local_history');
      const hist = cached ? JSON.parse(cached) : [];
      hist.unshift(newItem);
      localStorage.setItem('sb_local_history', JSON.stringify(hist.slice(0, 50)));
    } else {
      // Push to Supabase database
      try {
        await supabase.from('translation_history').insert({
          user_id: user.id,
          detected_text: originalText,
          translated_text: translated,
          source_lang: sourceLang,
          target_lang: targetLang
        });
      } catch (err) {
        console.warn('Error saving history to Supabase:', err);
      }
    }

    // Trigger auto-play if enabled
    const autoPlayPref = localStorage.getItem('sb_auto_play') === 'true';
    if (autoPlayPref) {
      playTts(translated);
    }
  };

  const getLanguageCode = (lang) => {
    const mapping = {
      'Tamil': 'ta-IN',
      'Hindi': 'hi-IN',
      'English': 'en-US',
      'Spanish': 'es-ES',
      'French': 'fr-FR',
      'German': 'de-DE',
      'Malayalam': 'ml-IN',
      'Telugu': 'te-IN',
      'Kannada': 'kn-IN'
    };
    return mapping[lang] || 'en-US';
  };

  // Trigger Google Text-To-Speech Playback
  const playTts = async (textToSpeak) => {
    if (!textToSpeak) return;

    if (playingAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingAudio(false);
      return;
    }

    setPlayingAudio(true);
    setAudioProgress(0);

    try {
      const languageCode = getLanguageCode(targetLang);
      const voiceGender = localStorage.getItem('sb_voice_gender') || 'FEMALE';
      const speakingRate = parseFloat(localStorage.getItem('sb_voice_rate') || '1.0');
      const pitch = parseFloat(localStorage.getItem('sb_voice_pitch') || '0.0');
      const voiceTier = localStorage.getItem('sb_voice_tier') || 'NEURAL2';

      // 1. Invoke TTS Edge Function
      const { data, error } = await supabase.functions.invoke('tts', {
        body: { text: textToSpeak, languageCode, voiceGender, speakingRate, pitch, voiceTier }
      });

      if (error) throw error;

      // 2. Play base64 audio content using standard Audio object
      if (data && data.audioContent && !data.isMock) {
        const audioUrl = `data:audio/mp3;base64,${data.audioContent}`;
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onplay = () => setPlayingAudio(true);
        audio.ontimeupdate = () => {
          if (audio.duration) {
            setAudioProgress((audio.currentTime / audio.duration) * 100);
          }
        };
        audio.onended = () => {
          setPlayingAudio(false);
          setAudioProgress(0);
        };
        audio.onerror = () => {
          setPlayingAudio(false);
          triggerWebSpeechFallback(textToSpeak);
        };

        audio.play().catch(e => {
          console.warn('Audio play failed, playing local fallback speech:', e);
          triggerWebSpeechFallback(textToSpeak);
        });
      } else {
        // Mock mode returned, fallback to Web Speech
        triggerWebSpeechFallback(textToSpeak);
      }

    } catch (err) {
      console.warn('TTS Edge Function failed, falling back to client-side speech synthesis:', err);
      triggerWebSpeechFallback(textToSpeak);
    }
  };

  const triggerWebSpeechFallback = (textToSpeak) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const langCode = getLanguageCode(targetLang);
      utterance.lang = langCode;
      
      // Select appropriate browser voice for target language
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(v => 
        v.lang.toLowerCase() === langCode.toLowerCase() || 
        v.lang.toLowerCase().startsWith(langCode.split('-')[0].toLowerCase())
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
      
      const speakingRate = parseFloat(localStorage.getItem('sb_voice_rate') || '1.0');
      const pitch = parseFloat(localStorage.getItem('sb_voice_pitch') || '0.0');
      
      utterance.rate = speakingRate;
      utterance.pitch = 1 + (pitch / 20); // Map [-20,20] to [0.5, 2]

      // Animate progress bar using interval since speechSynthesis doesn't have accurate stream updates
      let fakeProgress = 0;
      const interval = setInterval(() => {
        fakeProgress += 5;
        if (fakeProgress >= 100) {
          clearInterval(interval);
          setPlayingAudio(false);
          setAudioProgress(0);
        } else {
          setAudioProgress(fakeProgress);
        }
      }, 150);

      utterance.onend = () => {
        clearInterval(interval);
        setPlayingAudio(false);
        setAudioProgress(0);
      };
      
      utterance.onerror = () => {
        clearInterval(interval);
        setPlayingAudio(false);
        setAudioProgress(0);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingAudio(false);
    }
  };

  return (
    <div className="main-translator-grid animate-fade-in">
      {/* Left Column - Camera & Camera Controls */}
      <div className="translator-left-col">
        <CameraTranslator 
          sentence={rawSentence}
          onSentenceChange={setRawSentence}
          sourceLang={sourceLang}
          targetLang={targetLang}
          onTranslatedText={setTranslatedText}
          isPlayingAudio={playingAudio}
          setIsPlayingAudio={setPlayingAudio}
        />

        {/* Live caption block */}
        <div className="live-caption-card">
          <div className="caption-header">
            <h3>Spelled Sentence (English)</h3>
            <span className="info-badge">Inference output</span>
          </div>

          <div className="caption-content">
            <span className="quote-mark">“</span>
            <p className="caption-text-display raw-spelled-display">
              {rawSentence || 'Awaiting sign inputs...'}
            </p>
          </div>

          <div className="manual-input-wrapper">
            <input 
              type="text" 
              value={rawSentence} 
              onChange={(e) => setRawSentence(e.target.value)} 
              placeholder="Or type raw letters here to simulate fingerspelling..."
              className="manual-spell-input"
            />
          </div>

          {rawSentence && (
            <div className="enhanced-caption-section animate-fade-in">
              <div className="enhanced-header">
                <Sparkles size={16} className="sparkles-icon" />
                <h4>Smart Sentence (Gemini AI)</h4>
              </div>
              <div className="enhanced-content">
                {enhancing ? (
                  <div className="enhancing-indicator">
                    <span className="dots-bounce"></span>
                    Correcting grammar...
                  </div>
                ) : (
                  <p className="enhanced-text-display">
                    {enhancedSentence || 'Awaiting correction...'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Translation & History Preview */}
      <div className="translator-right-col">
        {/* Translation Output Card */}
        <div className="translation-card">
          <h3>Target Translation</h3>
          
          <div className="language-selector-row">
            <select 
              value={sourceLang} 
              onChange={(e) => setSourceLang(e.target.value)} 
              className="lang-selector"
              aria-label="Source Language"
            >
              <option value="English">English</option>
              <option value="Tamil">Tamil</option>
              <option value="Hindi">Hindi</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Malayalam">Malayalam</option>
              <option value="Telugu">Telugu</option>
              <option value="Kannada">Kannada</option>
            </select>
            
            <button onClick={swapLanguages} className="lang-swap-btn" aria-label="Swap Languages">
              ⇄
            </button>
            
            <select 
              value={targetLang} 
              onChange={(e) => setTargetLang(e.target.value)} 
              className="lang-selector"
              aria-label="Target Language"
            >
              <option value="Tamil">Tamil</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Malayalam">Malayalam</option>
              <option value="Telugu">Telugu</option>
              <option value="Kannada">Kannada</option>
            </select>
          </div>

          <div className="translation-result-box">
            {translating ? (
              <div className="translating-indicator">
                <span className="dots-bounce"></span>
                Translating sign...
              </div>
            ) : (
              <p className="translated-text">
                {translatedText || 'Translation output will render here'}
              </p>
            )}

            {/* Replay / Play TTS Button */}
            {translatedText && (
              <button 
                onClick={() => playTts(translatedText)} 
                className={`tts-play-btn ${playingAudio ? 'active' : ''}`} 
                aria-label="Speak Translation"
              >
                <Volume2 size={22} className={playingAudio ? 'speaking-wave' : ''} />
              </button>
            )}

            {/* Playback Audio Waveform Progress Bar */}
            {playingAudio && (
              <div className="waveform-playback-progress">
                <div className="progress-track" style={{ width: `${audioProgress}%` }}></div>
              </div>
            )}
          </div>
        </div>

        {/* Conversation History Preview Panel */}
        <div className="history-preview-card">
          <div className="history-preview-header">
            <h3>Recent Conversations</h3>
            <a href="/history" className="view-all-link">View history</a>
          </div>

          <div className="history-preview-list">
            {historyItems.length > 0 ? (
              historyItems.slice(0, 3).map((item) => (
                <div key={item.id} className="history-preview-item">
                  <div className="history-item-details">
                    <p className="hist-orig">“{item.detected_text}”</p>
                    <p className="hist-trans">{item.translated_text}</p>
                  </div>
                  <button 
                    onClick={() => playTts(item.translated_text)} 
                    className="history-item-play-btn" 
                    title="Play Audio"
                  >
                    <Play size={12} fill="currentColor" />
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-history-preview">
                <p>No logged conversions in this session yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .main-translator-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 24px;
          height: 100%;
        }
        
        .translator-left-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
          height: 100%;
        }
        
        .translator-right-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
          height: 100%;
        }

        /* Live Caption Card */
        .live-caption-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-lg);
          padding: 20px;
          box-shadow: var(--shadow-md);
        }
        .caption-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 8px;
        }
        .info-badge {
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          padding: 2px 8px;
          border-radius: 8px;
          font-size: 0.7rem;
          color: var(--text-secondary);
          font-weight: 700;
        }
        .caption-content {
          position: relative;
          padding: 12px 12px 12px 24px;
        }
        .quote-mark {
          position: absolute;
          left: 0;
          top: 0;
          font-size: 3rem;
          color: var(--border-color);
          font-family: Georgia, serif;
          line-height: 1;
        }
        .caption-text-display {
          font-size: var(--font-size-2xl);
          font-weight: 700;
          color: var(--text-primary);
          word-break: break-word;
          overflow-wrap: anywhere;
        }
        .raw-spelled-display {
          color: var(--text-secondary);
          font-size: var(--font-size-lg);
          font-family: monospace;
          letter-spacing: 0.05em;
        }
        .enhanced-caption-section {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px dashed var(--border-color);
        }
        .enhanced-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          color: var(--primary-color);
        }
        .enhanced-header h4 {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .sparkles-icon {
          color: var(--primary-color);
          animation: sparkleSpin 3s infinite linear;
        }
        @keyframes sparkleSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .enhanced-text-display {
          font-size: var(--font-size-2xl);
          font-weight: 800;
          color: var(--text-primary);
        }
        .enhancing-indicator {
          color: var(--text-secondary);
          font-size: var(--font-size-sm);
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .manual-input-wrapper {
          margin-top: 12px;
          margin-bottom: 8px;
        }
        .manual-spell-input {
          width: 100%;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          padding: 8px 12px;
          border-radius: var(--border-radius-sm);
          font-size: var(--font-size-sm);
          color: var(--text-primary);
          outline: none;
          transition: border-color var(--transition-fast);
        }
        .manual-spell-input:focus {
          border-color: var(--primary-color);
        }

        /* Translation Card */
        .translation-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-lg);
          padding: 24px;
          box-shadow: var(--shadow-md);
        }
        .translation-card h3 {
          margin-bottom: 16px;
        }
        .language-selector-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .lang-selector {
          flex: 1;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          padding: 10px 14px;
          border-radius: var(--border-radius-md);
          font-weight: 600;
          outline: none;
        }
        .lang-swap-btn {
          font-size: 1.2rem;
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          transition: background-color var(--transition-fast);
        }
        .lang-swap-btn:hover {
          background-color: var(--bg-primary);
        }
        .translation-result-box {
          background-color: #faf6f0;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-md);
          padding: 24px;
          position: relative;
          min-height: 120px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        [data-theme="dark"] .translation-result-box {
          background-color: #171b20;
        }
        .translated-text {
          font-size: var(--font-size-xl);
          font-weight: 600;
          color: var(--text-primary);
          padding-right: 48px;
          line-height: 1.4;
          word-break: break-word;
          overflow-wrap: anywhere;
        }
        .translating-indicator {
          color: var(--text-secondary);
          font-size: var(--font-size-sm);
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .tts-play-btn {
          position: absolute;
          right: 16px;
          bottom: 16px;
          background-color: var(--primary-color);
          color: white;
          border: none;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: var(--shadow-primary);
          transition: all var(--transition-fast);
        }
        .tts-play-btn:hover {
          background-color: var(--primary-hover);
          transform: scale(1.05);
        }
        .tts-play-btn.active {
          background-color: var(--color-success);
          box-shadow: 0 0 0 3px var(--color-success-bg);
        }
        .speaking-wave {
          animation: waveBeat 0.8s infinite alternate;
        }
        @keyframes waveBeat {
          0% { transform: scale(0.9); }
          100% { transform: scale(1.15); }
        }

        .waveform-playback-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background-color: var(--border-color);
          border-bottom-left-radius: var(--border-radius-md);
          border-bottom-right-radius: var(--border-radius-md);
          overflow: hidden;
        }
        .progress-track {
          height: 100%;
          background-color: var(--primary-color);
          transition: width 0.1s linear;
        }

        /* History Preview */
        .history-preview-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-lg);
          padding: 20px;
          box-shadow: var(--shadow-md);
        }
        .history-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .view-all-link {
          font-size: var(--font-size-sm);
          font-weight: 700;
        }
        .history-preview-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .history-preview-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: var(--bg-primary);
          padding: 12px 16px;
          border-radius: var(--border-radius-md);
          border: 1px solid var(--border-color);
        }
        .history-item-details {
          padding-right: 12px;
          word-break: break-word;
          overflow-wrap: anywhere;
        }
        .hist-orig {
          font-weight: 700;
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
        }
        .hist-trans {
          font-size: var(--font-size-sm);
          font-weight: 700;
          color: var(--text-primary);
          margin-top: 2px;
        }
        .history-item-play-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background-color: var(--primary-light);
          color: var(--primary-color);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all var(--transition-fast);
        }
        .history-item-play-btn:hover {
          background-color: var(--primary-color);
          color: white;
        }
        .empty-history-preview {
          text-align: center;
          padding: 16px;
          color: var(--text-muted);
          font-size: var(--font-size-sm);
        }

        @media (max-width: 1024px) {
          .main-translator-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default MainTranslator;
