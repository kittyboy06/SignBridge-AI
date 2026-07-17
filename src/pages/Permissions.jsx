import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, AlertCircle, Check } from 'lucide-react';

const Permissions = () => {
  const [status, setStatus] = useState('idle'); // idle, requesting, granted, denied
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const requestCamera = async () => {
    setStatus('requesting');
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Permission granted! Stop the stream immediately to release the camera hardware
      stream.getTracks().forEach(track => track.stop());
      setStatus('granted');
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    } catch (err) {
      console.error('Camera access error:', err);
      setStatus('denied');
      setErrorMsg(
        'Camera permission was denied. You can still continue to the app, but sign detection will be disabled until you enable camera access in your browser site settings.'
      );
    }
  };

  const handleSkip = () => {
    navigate('/login');
  };

  return (
    <div className="permissions-container animate-fade-in">
      <div className="permissions-card">
        <div className="camera-illustration-wrapper">
          {status === 'granted' ? (
            <div className="badge-status-circle success animate-pulse">
              <Check size={48} color="white" />
            </div>
          ) : (
            <div className={`badge-status-circle ${status === 'denied' ? 'denied' : 'idle'}`}>
              <Camera size={48} />
            </div>
          )}
        </div>

        <h2 className="permissions-title">Enable Camera Access</h2>
        <p className="permissions-description">
          SignBridge AI uses your device webcam or back camera to capture and track hand gestures in real-time. Landmark analysis runs entirely local on your device.
        </p>

        {status === 'denied' && (
          <div className="error-banner">
            <AlertCircle size={20} className="error-icon" />
            <p className="error-text">{errorMsg}</p>
          </div>
        )}

        <div className="permissions-actions">
          {status === 'granted' ? (
            <button className="btn-allow success-state" disabled>
              Permission Granted
            </button>
          ) : (
            <button 
              onClick={requestCamera} 
              className={`btn-allow ${status === 'requesting' ? 'loading' : ''}`}
              disabled={status === 'requesting'}
            >
              {status === 'requesting' ? 'Requesting...' : 'Allow Camera Access'}
            </button>
          )}
          
          <button onClick={handleSkip} className="btn-skip-auth">
            Continue without Camera
          </button>
        </div>
      </div>

      <style>{`
        .permissions-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: var(--bg-primary);
          padding: 20px;
        }
        .permissions-card {
          width: 100%;
          max-width: 440px;
          background: var(--bg-card);
          border-radius: var(--border-radius-lg);
          padding: 40px 30px;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border-color);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .camera-illustration-wrapper {
          margin-bottom: 24px;
        }
        .badge-status-circle {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: var(--primary-light);
          color: var(--primary-color);
          transition: all var(--transition-normal);
        }
        .badge-status-circle.success {
          background-color: var(--color-success);
          color: white;
        }
        .badge-status-circle.denied {
          background-color: var(--color-danger-bg);
          color: var(--color-danger);
          border: 2px solid var(--color-danger);
        }
        .permissions-title {
          font-size: var(--font-size-2xl);
          font-weight: 700;
          margin-bottom: 12px;
        }
        .permissions-description {
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 30px;
          font-size: var(--font-size-sm);
        }
        .error-banner {
          display: flex;
          gap: 10px;
          background-color: var(--color-danger-bg);
          border: 1px solid var(--color-danger);
          border-radius: var(--border-radius-md);
          padding: 12px 16px;
          margin-bottom: 24px;
          text-align: left;
        }
        .error-icon {
          color: var(--color-danger);
          flex-shrink: 0;
        }
        .error-text {
          color: var(--text-primary);
          font-size: var(--font-size-sm);
          line-height: 1.4;
        }
        .permissions-actions {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .btn-allow {
          background-color: var(--primary-color);
          color: white;
          border: none;
          padding: 14px;
          border-radius: var(--border-radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: background-color var(--transition-fast);
          width: 100%;
          box-shadow: var(--shadow-primary);
        }
        .btn-allow:hover:not(:disabled) {
          background-color: var(--primary-hover);
        }
        .btn-allow.success-state {
          background-color: var(--color-success);
          box-shadow: none;
          cursor: default;
        }
        .btn-skip-auth {
          background: none;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 14px;
          border-radius: var(--border-radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          width: 100%;
        }
        .btn-skip-auth:hover {
          background-color: var(--bg-sidebar);
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
};

export default Permissions;
