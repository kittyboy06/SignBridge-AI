import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ShellLayout from './components/ShellLayout';

// Page imports
import Onboarding from './pages/Onboarding';
import Permissions from './pages/Permissions';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MainTranslator from './pages/MainTranslator';
import History from './pages/History';
import Emergency from './pages/Emergency';
import Settings from './pages/Settings';
import VoiceSettings from './pages/VoiceSettings';
import TextSettings from './pages/TextSettings';
import Profile from './pages/Profile';

// Route Guard to protect routes and handle first-run onboarding redirects
const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading-screen">
        <div className="spinner"></div>
        <p>Loading SignBridge AI...</p>
        <style>{`
          .app-loading-screen {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #f9f6f0;
            color: #1a2530;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e5dec9;
            border-top: 4px solid #708a9e;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const isOnboarded = localStorage.getItem('sb_onboarded') === 'true';

  return (
    <Routes>
      {/* Public Pages */}
      <Route 
        path="/onboarding" 
        element={user ? <Navigate to="/" replace /> : <Onboarding />} 
      />
      <Route 
        path="/permissions" 
        element={user ? <Navigate to="/" replace /> : <Permissions />} 
      />
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" replace /> : (isOnboarded ? <Login /> : <Navigate to="/onboarding" replace />)} 
      />
      <Route 
        path="/signup" 
        element={user ? <Navigate to="/" replace /> : (isOnboarded ? <Signup /> : <Navigate to="/onboarding" replace />)} 
      />

      {/* Protected Pages (require login or guest session) */}
      <Route
        path="/"
        element={
          user ? (
            <ShellLayout>
              <MainTranslator />
            </ShellLayout>
          ) : (
            <Navigate to={isOnboarded ? "/login" : "/onboarding"} replace />
          )
        }
      />
      
      <Route
        path="/history"
        element={
          user ? (
            <ShellLayout>
              <History />
            </ShellLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/emergency"
        element={
          user ? (
            <ShellLayout>
              <Emergency />
            </ShellLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/settings"
        element={
          user ? (
            <ShellLayout>
              <Settings />
            </ShellLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/settings/voice"
        element={
          user ? (
            <ShellLayout>
              <VoiceSettings />
            </ShellLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/settings/text"
        element={
          user ? (
            <ShellLayout>
              <TextSettings />
            </ShellLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/profile"
        element={
          user ? (
            <ShellLayout>
              <Profile />
            </ShellLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Fallback redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
