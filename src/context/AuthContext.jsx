import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // Check active session on load
  useEffect(() => {
    // Check if guest mode is persisted in localStorage
    const guestPersisted = localStorage.getItem('sb_guest_mode') === 'true';
    if (guestPersisted) {
      setIsGuest(true);
      setUser({ id: 'guest', email: 'guest@signbridge.ai', isGuest: true });
      setProfile({ display_name: 'Guest User', avatar_url: '' });
      setLoading(false);
      return;
    }

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsGuest(false);
        localStorage.removeItem('sb_guest_mode');
        setUser(session.user);
        fetchProfile(session.user.id);
      } else if (!guestPersisted) {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch profile details from profiles table
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error.message);
      } else if (data) {
        setProfile(data);
      } else {
        // If profile doesn't exist yet, set a default
        setProfile({ display_name: user?.email?.split('@')[0] || 'User', avatar_url: '' });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email
  const signUp = async (email, password, displayName) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      
      if (data.user && displayName) {
        // Create initial profile record
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            display_name: displayName,
            avatar_url: '',
            updated_at: new Date().toISOString(),
          });
        if (profileError) console.error('Error creating profile:', profileError.message);
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Log in with email
  const logIn = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const logOut = async () => {
    setLoading(true);
    setIsGuest(false);
    localStorage.removeItem('sb_guest_mode');
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  };

  // Enter guest mode
  const loginAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('sb_guest_mode', 'true');
    setUser({ id: 'guest', email: 'guest@signbridge.ai', isGuest: true });
    setProfile({ display_name: 'Guest User', avatar_url: '' });
  };

  // Update profile display name or avatar
  const updateProfile = async (updates) => {
    if (isGuest) {
      setProfile(prev => ({ ...prev, ...updates }));
      return { error: null };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setProfile(prev => ({ ...prev, ...updates }));
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    profile,
    loading,
    isGuest,
    signUp,
    logIn,
    logOut,
    loginAsGuest,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
