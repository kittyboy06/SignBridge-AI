import React, { useRef, useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { Camera, RefreshCw, RefreshCcw, Volume2, Sparkles, AlertCircle } from 'lucide-react';
import LandmarkOverlay from './LandmarkOverlay';

const CameraTranslator = ({ 
  sentence: parentSentence = '',
  onSentenceChange, 
  targetLang, 
  sourceLang, 
  onTranslatedText,
  isPlayingAudio,
  setIsPlayingAudio
}) => {
  const videoRef = useRef(null);
  const activeStreamRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Load States
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState('');
  
  // HandLandmarker & Classifier instances
  const landmarkerRef = useRef(null);
  const classifierRef = useRef(null);

  // Camera Settings
  const [facingMode, setFacingMode] = useState('user'); // user (front), environment (back)
  const [isMirrored, setIsMirrored] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [cameraError, setCameraError] = useState('');

  // Inference & Buffering States
  const [detectedLetter, setDetectedLetter] = useState('Show your hand');
  const [confidence, setConfidence] = useState(0);
  const [handsData, setHandsData] = useState([]); // Shared skeleton data
  const [sentence, setSentence] = useState(parentSentence);

  // Synchronize internal state with parent's sentence state (e.g. manual edits / resets)
  useEffect(() => {
    setSentence(parentSentence);
  }, [parentSentence]);
  
  // HOLD-TO-COMMIT BUFFERING VARIABLES
  const bufferLetterRef = useRef('');
  const bufferFramesRef = useRef(0);
  const lastPredictionTimeRef = useRef(0);
  const prevLandmarksRef = useRef(null);
  const hasCommittedCurrentLetterRef = useRef(false);
  const averageVelocityRef = useRef(0);
  const predictionHistoryRef = useRef([]);

  // Initialize both MediaPipe Landmarker and TF.js Classifier
  useEffect(() => {
    let active = true;

    const initModels = async () => {
      try {
        setModelLoading(true);
        setModelError('');
        
        // 1. Load MediaPipe HandLandmarker WASM files
        console.log('Loading MediaPipe HandLandmarker WASM...');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm'
        );
        
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 2
        });
        
        if (active) {
          landmarkerRef.current = landmarker;
          console.log('MediaPipe HandLandmarker loaded.');
        }

        // 2. Load TF.js Classifier Model
        console.log('Loading TF.js Classifier Model...');
        // We load the model.json from the public directory
        const model = await tf.loadLayersModel('/model/model.json');
        
        if (active) {
          classifierRef.current = model;
          console.log('TF.js Classifier Model loaded successfully.');
        }
        
        if (active) setModelLoading(false);
      } catch (err) {
        console.error('Failed to initialize models:', err);
        if (active) {
          setModelError(
            'Failed to load classification models. Please ensure the model has been trained and generated at public/model/'
          );
          setModelLoading(false);
        }
      }
    };

    initModels();

    return () => {
      active = false;
    };
  }, []);

  // Handle Camera toggling and facingMode stream changes
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError('');
    setIsMirrored(facingMode === 'user');

    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        activeStreamRef.current = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          // Start the landmark detection loop
          startInferenceLoop();
        };
      }
    } catch (err) {
      console.error('Error starting video stream:', err);
      setCameraError('Camera access denied or device is not available.');
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop());
      activeStreamRef.current = null;
    }
    setHandsData([]);
  };

  const toggleCameraFacing = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // MAIN RUNTIME INFERENCE LOOP
  const startInferenceLoop = () => {
    const runInference = async () => {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      const classifier = classifierRef.current;

      if (!video || !landmarker || video.paused || video.ended) {
        animationFrameRef.current = requestAnimationFrame(runInference);
        return;
      }

      const now = performance.now();
      // Throttling to save CPU - runs detection every 100ms
      if (now - lastPredictionTimeRef.current >= 100) {
        lastPredictionTimeRef.current = now;

        try {
          const results = landmarker.detectForVideo(video, now);
          
          if (results && results.landmarks && results.landmarks.length > 0) {
            // Draw skeleton landmarks in overlay
            const formattedHands = results.landmarks.map((landmarksArray, idx) => {
              const handednessStr = results.handednesses[idx] ? results.handednesses[idx][0].categoryName : 'Left';
              // If mirrored (front camera), swap handedness
              let finalHandedness = handednessStr;
              if (isMirrored) {
                finalHandedness = handednessStr === 'Left' ? 'Right' : 'Left';
              }
              return {
                landmarks: landmarksArray,
                handedness: finalHandedness
              };
            });
            setHandsData(formattedHands);

            // Calculate velocity of landmarks to measure movement speed
            let currentVelocity = 0;
            if (formattedHands.length > 0 && prevLandmarksRef.current) {
              let totalDist = 0;
              let count = 0;
              const currentLms = formattedHands[0].landmarks;
              const prevLms = prevLandmarksRef.current;
              const minLen = Math.min(currentLms.length, prevLms.length);
              for (let i = 0; i < minLen; i++) {
                const dx = currentLms[i].x - prevLms[i].x;
                const dy = currentLms[i].y - prevLms[i].y;
                const dz = currentLms[i].z - prevLms[i].z;
                totalDist += Math.sqrt(dx*dx + dy*dy + dz*dz);
                count++;
              }
              if (count > 0) {
                currentVelocity = totalDist / count;
              }
            }
            
            // Store current landmarks for next frame
            if (formattedHands.length > 0) {
              prevLandmarksRef.current = JSON.parse(JSON.stringify(formattedHands[0].landmarks));
            } else {
              prevLandmarksRef.current = null;
            }

            // Smooth the velocity using a moving average
            averageVelocityRef.current = averageVelocityRef.current * 0.8 + currentVelocity * 0.2;

            // If hand is moving fast, reset the committed flag to allow repeating the letter
            if (averageVelocityRef.current > 0.02) {
              hasCommittedCurrentLetterRef.current = false;
            }

            // Calculate dynamic stable frames needed based on hand movement velocity
            // Higher velocity (fast signing) -> lower threshold (detect faster)
            // Lower velocity (slow signing) -> higher threshold (prevent double triggers/noise)
            let stableFramesNeeded = 8;
            if (averageVelocityRef.current > 0.015) {
              stableFramesNeeded = 4; // Fast signing: commit quick
            } else if (averageVelocityRef.current < 0.005) {
              stableFramesNeeded = 12; // Slow signing: require more stability
            } else {
              const ratio = (averageVelocityRef.current - 0.005) / 0.01; // 0 to 1
              stableFramesNeeded = Math.round(12 - ratio * 8); // maps to range [12, 4]
            }

            // Execute gesture classification if TFJS model is ready
            if (classifier) {
              const features = formatLandmarksTo127Vector(formattedHands);
              
              // Predict sign using TF.js model
              tf.tidy(() => {
                const inputTensor = tf.tensor2d([features], [1, 127]);
                const prediction = classifier.predict(inputTensor);
                const classProbs = prediction.dataSync();
                
                // Find class with highest probability
                let maxIdx = 0;
                let maxVal = 0;
                for (let i = 0; i < classProbs.length; i++) {
                  if (classProbs[i] > maxVal) {
                    maxVal = classProbs[i];
                    maxIdx = i;
                  }
                }

                const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                let letter = '';
                if (maxIdx === 26) {
                  letter = 'Space';
                } else {
                  letter = alphabet[maxIdx];
                }

                setConfidence(Math.round(maxVal * 100));

                if (maxVal > 0.80) {
                  setDetectedLetter(letter);
                  handleBuffering(letter, stableFramesNeeded);
                } else {
                  setDetectedLetter('Low Confidence...');
                }
              });
            }
          } else {
            // No hands detected
            setHandsData([]);
            setDetectedLetter('Show your hand');
            setConfidence(0);
            bufferLetterRef.current = '';
            bufferFramesRef.current = 0;
            hasCommittedCurrentLetterRef.current = false; // Reset committed flag on release
            prevLandmarksRef.current = null;
            averageVelocityRef.current = 0;
            predictionHistoryRef.current = []; // Clear voting history on release
          }
        } catch (err) {
          console.error('Error running landmark/prediction model:', err);
        }
      }

      animationFrameRef.current = requestAnimationFrame(runInference);
    };

    animationFrameRef.current = requestAnimationFrame(runInference);
  };

  // Scale and translation-invariant landmark normalization function
  const normalizeHandLandmarks = (landmarks) => {
    // 1. Translate relative to wrist (landmark 0)
    const wrist = landmarks[0];
    const translated = landmarks.map(lm => ({
      x: lm.x - wrist.x,
      y: lm.y - wrist.y,
      z: lm.z - wrist.z
    }));

    // 2. Scale relative to distance between Wrist (0) and Middle Knuckle (9)
    const dx = translated[9].x - translated[0].x;
    const dy = translated[9].y - translated[0].y;
    const dz = translated[9].z - translated[0].z;
    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

    if (dist > 0) {
      return translated.map(lm => ({
        x: lm.x / dist,
        y: lm.y / dist,
        z: lm.z / dist
      }));
    }
    return translated;
  };

  // Convert MediaPipe landmarks into the 127 inputs expected by our trained MLP model
  const formatLandmarksTo127Vector = (formattedHands) => {
    // 127 slots:
    // Slot 0: uses_two_hands (0.0 or 1.0)
    // Slots 1-63: left hand x,y,z (21 * 3 = 63 cols)
    // Slots 64-126: right hand x,y,z (21 * 3 = 63 cols)

    const usesTwo = formattedHands.length > 1 ? 1.0 : 0.0;
    
    // Default arrays filled with -1.0
    let leftHandCoords = new Array(63).fill(-1.0);
    let rightHandCoords = new Array(63).fill(-1.0);

    formattedHands.forEach(hand => {
      const coords = [];
      const normalized = normalizeHandLandmarks(hand.landmarks);
      normalized.forEach(lm => {
        coords.push(lm.x, lm.y, lm.z);
      });

      if (hand.handedness === 'Left') {
        leftHandCoords = coords;
      } else {
        rightHandCoords = coords;
      }
    });

    return [usesTwo, ...leftHandCoords, ...rightHandCoords];
  };

  // HOLD-TO-COMMIT BUFFERING UX LOGIC WITH SLIDING VOTING BUFFER & ANTI-FLICKER CONFUSABLE FILTER
  const handleBuffering = (letter, stableFramesNeeded) => {
    // 1. Add current prediction to sliding history window
    predictionHistoryRef.current.push(letter);

    // Dynamic window size based on stable frames needed (min 4, max 10)
    const windowSize = Math.min(10, Math.max(4, Math.round(stableFramesNeeded * 1.2)));
    while (predictionHistoryRef.current.length > windowSize) {
      predictionHistoryRef.current.shift();
    }

    // 2. Count letter occurrences in sliding window
    const counts = {};
    predictionHistoryRef.current.forEach(l => {
      counts[l] = (counts[l] || 0) + 1;
    });

    // Sort classes by counts descending to evaluate distribution
    const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const maxLetter = sortedCounts[0] ? sortedCounts[0][0] : '';
    const maxCount = sortedCounts[0] ? sortedCounts[0][1] : 0;
    const secondMaxCount = sortedCounts[1] ? sortedCounts[1][1] : 0;

    // 3. Define threshold for commit (e.g. 60% of the window)
    const threshold = Math.ceil(windowSize * 0.6);

    // Calculate if the classifier is confused/hallucinating between two close classes
    // If difference in count between first and second place is too small, it's considered confused
    const confusionThreshold = Math.max(1, Math.ceil(windowSize * 0.25));
    const isConfused = (maxCount - secondMaxCount) < confusionThreshold;

    if (maxCount >= threshold && !isConfused) {
      if (bufferLetterRef.current === maxLetter) {
        if (hasCommittedCurrentLetterRef.current) {
          return;
        }

        // Commit the letter to our sentence
        setSentence(prev => {
          let nextSentence = prev;
          if (maxLetter === 'Space') {
            nextSentence += ' ';
          } else {
            nextSentence += maxLetter;
          }

          if (onSentenceChange) {
            setTimeout(() => {
              onSentenceChange(nextSentence);
            }, 0);
          }
          return nextSentence;
        });

        // Mark as committed to prevent duplicate triggers on hold
        hasCommittedCurrentLetterRef.current = true;
      } else {
        // Transitional phase: update buffer target letter
        bufferLetterRef.current = maxLetter;
        hasCommittedCurrentLetterRef.current = false;
      }
    }
  };

  const handleClearSentence = () => {
    setSentence('');
    bufferLetterRef.current = '';
    bufferFramesRef.current = 0;
    hasCommittedCurrentLetterRef.current = false;
    predictionHistoryRef.current = []; // Clear voting history
    if (onSentenceChange) {
      setTimeout(() => {
        onSentenceChange('');
      }, 0);
    }
  };

  const handleBackspace = () => {
    setSentence(prev => {
      const nextSentence = prev.slice(0, -1);
      if (onSentenceChange) {
        setTimeout(() => {
          onSentenceChange(nextSentence);
        }, 0);
      }
      return nextSentence;
    });
  };

  // Render video frame dimensions dynamically
  const videoWidth = 640;
  const videoHeight = 480;

  return (
    <div className="camera-translator-wrapper">
      {/* Loading Overlay */}
      {modelLoading && (
        <div className="models-loading-overlay">
          <div className="loading-card">
            <div className="spinner"></div>
            <h3>Loading Models & WebAssembly...</h3>
            <p>Fetching MediaPipe HandLandmarker and TensorFlow.js weights.</p>
          </div>
        </div>
      )}

      {/* Model Error Overlay */}
      {modelError && (
        <div className="models-error-overlay">
          <div className="error-card">
            <AlertCircle size={40} className="error-icon" />
            <h3>Configuration Error</h3>
            <p>{modelError}</p>
            <button onClick={() => window.location.reload()} className="btn-retry">
              Reload Page
            </button>
          </div>
        </div>
      )}

      {/* Camera Preview Panel */}
      <div className="camera-box-panel">
        <div className="camera-box-header">
          <div className="camera-header-left">
            <span className={`status-dot ${handsData.length > 0 ? 'active' : ''}`}></span>
            <span className="status-lbl">
              {handsData.length === 0 ? 'No Hand Detected' : `${handsData.length} Hand(s) Detected`}
            </span>
          </div>

          <div className="camera-header-actions">
            <button 
              onClick={() => setShowSkeleton(prev => !prev)} 
              className={`action-btn-pill ${showSkeleton ? 'active' : ''}`}
            >
              Skeleton Overlay
            </button>

            {/* Mobile Facing Mode Flip Button */}
            <button onClick={toggleCameraFacing} className="action-btn-circle" title="Flip Camera">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Video Canvas Container */}
        <div className="video-viewport-container">
          {cameraError ? (
            <div className="camera-error-view">
              <AlertCircle size={32} />
              <p>{cameraError}</p>
              <button onClick={startCamera} className="btn-camera-retry">
                Retry Connection
              </button>
            </div>
          ) : (
            <div className="video-positioning-relative">
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: isMirrored ? 'scaleX(-1)' : 'none',
                  borderRadius: 'var(--border-radius-md)'
                }}
              />
              
              {/* Drawing Skeleton overlays */}
              {showSkeleton && (
                <LandmarkOverlay 
                  handsData={handsData}
                  width={videoWidth}
                  height={videoHeight}
                  isMirrored={isMirrored}
                />
              )}

              {/* Status Badge */}
              <div className="video-live-badge">
                <span className="live-red-badge"></span>
                LIVE
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control Actions & Caption Builder */}
      <div className="caption-builder-controls">
        <div className="builder-left">
          <span className="letter-preview-box">
            {detectedLetter}
          </span>
          <div className="inf-stats">
            <span className="confidence-title">Confidence</span>
            <div className="progress-bar-wrapper">
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${confidence}%`,
                  backgroundColor: confidence > 85 ? 'var(--color-success)' : confidence > 65 ? 'var(--color-warning)' : 'var(--color-danger)'
                }}
              ></div>
            </div>
            <span className="confidence-percentage">{confidence}%</span>
          </div>
        </div>

        <div className="builder-right">
          <button onClick={handleBackspace} className="btn-caption-action" disabled={!sentence}>
            Backspace
          </button>
          <button onClick={handleClearSentence} className="btn-caption-action danger" disabled={!sentence}>
            Reset
          </button>
        </div>
      </div>

      <style>{`
        .camera-translator-wrapper {
          display: flex;
          flex-direction: column;
          gap: 20px;
          flex-grow: 1;
          position: relative;
        }

        /* Loading & Error Overlays */
        .models-loading-overlay, .models-error-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(249, 246, 240, 0.95);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--border-radius-lg);
        }
        [data-theme="dark"] .models-loading-overlay {
          background-color: rgba(18, 21, 24, 0.95);
        }
        .loading-card, .error-card {
          text-align: center;
          padding: 30px;
          max-width: 380px;
        }
        .error-card .error-icon {
          color: var(--color-danger);
          margin-bottom: 12px;
        }
        .btn-retry {
          background-color: var(--primary-color);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: var(--border-radius-md);
          font-weight: 600;
          margin-top: 16px;
          cursor: pointer;
        }

        /* Camera Box Styles */
        .camera-box-panel {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-lg);
          padding: 16px;
          box-shadow: var(--shadow-md);
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex-grow: 1;
        }
        .camera-box-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .camera-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--text-muted);
        }
        .status-dot.active {
          background-color: var(--color-success);
          animation: pulseBorder 1.2s infinite;
        }
        .status-lbl {
          font-size: var(--font-size-sm);
          font-weight: 700;
        }
        
        .camera-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .action-btn-pill {
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          color: var(--text-secondary);
        }
        .action-btn-pill.active {
          background-color: var(--primary-light);
          border-color: var(--primary-color);
          color: var(--primary-color);
        }
        .action-btn-circle {
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-secondary);
        }

        .video-viewport-container {
          flex-grow: 1;
          min-height: 340px;
          background-color: #e2e8f0;
          border-radius: var(--border-radius-md);
          position: relative;
          overflow: hidden;
        }
        [data-theme="dark"] .video-viewport-container {
          background-color: #0f172a;
        }
        .video-positioning-relative {
          position: relative;
          width: 100%;
          height: 100%;
        }
        .video-live-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid var(--color-danger);
          color: var(--color-danger);
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 0.7rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 4px;
          z-index: 10;
        }
        .live-red-badge {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--color-danger);
        }

        .camera-error-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-secondary);
          gap: 12px;
          padding: 20px;
          text-align: center;
        }
        .btn-camera-retry {
          background-color: var(--primary-color);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: var(--border-radius-md);
          font-weight: 600;
          cursor: pointer;
        }

        /* Controls Panel */
        .caption-builder-controls {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-lg);
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          box-shadow: var(--shadow-sm);
        }
        .builder-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-grow: 1;
        }
        .letter-preview-box {
          font-size: var(--font-size-2xl);
          font-weight: 800;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          min-width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--border-radius-md);
          color: var(--primary-color);
          text-align: center;
        }
        
        .inf-stats {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 140px;
        }
        .confidence-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .progress-bar-wrapper {
          height: 6px;
          background-color: var(--bg-primary);
          border-radius: 3px;
          overflow: hidden;
          width: 100%;
          border: 1px solid var(--border-color);
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.15s ease;
        }
        .confidence-percentage {
          font-size: var(--font-size-sm);
          font-weight: 800;
        }

        .builder-right {
          display: flex;
          gap: 10px;
        }
        .btn-caption-action {
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          padding: 10px 16px;
          border-radius: var(--border-radius-md);
          font-weight: 600;
          font-size: var(--font-size-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .btn-caption-action:hover:not(:disabled) {
          background-color: var(--border-color);
        }
        .btn-caption-action.danger {
          color: var(--color-danger);
          border-color: var(--color-danger);
        }
        .btn-caption-action.danger:hover:not(:disabled) {
          background-color: var(--color-danger-bg);
        }
        .btn-caption-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 600px) {
          .caption-builder-controls {
            flex-direction: column;
            align-items: stretch;
          }
          .builder-left {
            justify-content: space-between;
          }
          .builder-right {
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  );
};

export default CameraTranslator;
