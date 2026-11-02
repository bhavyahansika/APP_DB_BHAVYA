import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import LoginScreen from './components/LoginScreen';
import StudentDatabaseScreen from './components/StudentDatabaseScreen';
import './styles/theme.css';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for auth changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setSession(null);
    }
  };

  if (loading) {
    return (
      <div className="login-viewport">
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Initializing Teacher Portal...
          </p>
        </div>
      </div>
    );
  }

  // Exactly 2 screens: LoginScreen (Screen 1) or StudentDatabaseScreen (Screen 2)
  if (!session) {
    return <LoginScreen onLoginSuccess={(newSession) => setSession(newSession)} />;
  }

  return <StudentDatabaseScreen session={session} onLogout={handleLogout} />;
}
