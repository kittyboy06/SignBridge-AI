import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, Video, Volume2, Globe } from 'lucide-react';

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const steps = [
    {
      title: "Welcome to SignBridge AI",
      description: "Let's create a world where every sign is understood. SignBridge AI bridges the communication gap between the Deaf and hearing communities.",
      icon: <Globe className="onboarding-icon" size={64} />,
      color: "var(--primary-color)"
    },
    {
      title: "Point Camera at Hands",
      description: "Sign naturally in front of your front or back camera. MediaPipe WASM reads your hand landmarks locally and securely on your device.",
      icon: <Video className="onboarding-icon" size={64} />,
      color: "var(--accent-color)"
    },
    {
      title: "Translate to Text & Voice",
      description: "Real-time sign classification turns your hand gestures into live captions and spoken Tamil/English audio with a single tap.",
      icon: <Volume2 className="onboarding-icon" size={64} />,
      color: "var(--primary-color)"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('sb_onboarded', 'true');
    navigate('/permissions');
  };

  return (
    <div className="onboarding-container animate-fade-in">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <div className="app-logo-badge">
            <span className="logo-hand-emoji">👋</span>
            <span className="logo-text">SignBridge AI</span>
          </div>
          <button onClick={handleSkip} className="btn-skip">Skip</button>
        </div>

        <div className="onboarding-content">
          <div className="onboarding-illustration" style={{ backgroundColor: steps[currentStep].color + '15', color: steps[currentStep].color }}>
            {steps[currentStep].icon}
          </div>
          <h2 className="onboarding-title">{steps[currentStep].title}</h2>
          <p className="onboarding-desc">{steps[currentStep].description}</p>
        </div>

        <div className="onboarding-footer">
          <div className="step-indicators">
            {steps.map((_, index) => (
              <span 
                key={index} 
                className={`indicator-dot ${index === currentStep ? 'active' : ''}`}
                onClick={() => setCurrentStep(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <button onClick={handleNext} className="btn-next">
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            <ArrowRight size={18} style={{ marginLeft: 8 }} />
          </button>
        </div>
      </div>

      <style>{`
        .onboarding-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: var(--bg-primary);
          padding: 20px;
        }
        .onboarding-card {
          width: 100%;
          max-width: 480px;
          background: var(--bg-card);
          border-radius: var(--border-radius-lg);
          padding: 30px;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          min-height: 520px;
        }
        .onboarding-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        .app-logo-badge {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .logo-text {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.2rem;
          color: var(--text-primary);
        }
        .btn-skip {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-weight: 600;
          cursor: pointer;
        }
        .onboarding-content {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .onboarding-illustration {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 24px;
          transition: background-color var(--transition-normal);
        }
        .onboarding-title {
          font-size: var(--font-size-2xl);
          margin-bottom: 12px;
          font-weight: 700;
        }
        .onboarding-desc {
          color: var(--text-secondary);
          line-height: 1.6;
          max-width: 360px;
        }
        .onboarding-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 30px;
        }
        .step-indicators {
          display: flex;
          gap: 8px;
        }
        .indicator-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--border-color);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .indicator-dot.active {
          background-color: var(--primary-color);
          width: 20px;
          border-radius: 4px;
        }
        .btn-next {
          background-color: var(--primary-color);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: var(--border-radius-md);
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          box-shadow: var(--shadow-primary);
          transition: background-color var(--transition-fast);
        }
        .btn-next:hover {
          background-color: var(--primary-hover);
        }
      `}</style>
    </div>
  );
};

export default Onboarding;
