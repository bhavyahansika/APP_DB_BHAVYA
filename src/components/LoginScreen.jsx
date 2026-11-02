import React, { useState } from 'react';
import { supabase, formatTeacherEmail, TEACHER_EMAIL_DOMAIN, isConfigured } from '../supabaseClient';
import { Lock, User, Eye, EyeOff, GraduationCap, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginScreen({ onLoginSuccess }) {
  const [teacherId, setTeacherId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!teacherId.trim() || !password) {
      setErrorMessage('Please enter both Teacher ID and Password.');
      return;
    }

    if (!isConfigured) {
      setErrorMessage(
        'Supabase credentials are not set in .env. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'
      );
      return;
    }

    const email = formatTeacherEmail(teacherId);

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('Invalid Teacher ID or password. Please verify credentials.');
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      if (data?.session) {
        onLoginSuccess(data.session);
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-viewport">
      <div className="login-card">
        <div className="login-header">
          <div className="brand-icon-wrapper">
            <GraduationCap size={26} strokeWidth={2.2} />
          </div>
          <h1 className="login-title">Teacher Portal</h1>
          <p className="login-subtitle">Student Database Management System</p>
        </div>

        {errorMessage && (
          <div className="error-banner" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="teacher-id">
              Teacher ID
            </label>
            <div className="input-with-icon">
              <span className="input-prefix-icon">
                <User size={16} />
              </span>
              <input
                id="teacher-id"
                type="text"
                className="form-input"
                placeholder="e.g. T001"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                autoComplete="username"
                disabled={loading}
                autoFocus
              />
            </div>
            <div className="login-meta-hint">
              <span>Domain: @{TEACHER_EMAIL_DOMAIN}</span>
              {teacherId.trim() && (
                <span>&rarr; {formatTeacherEmail(teacherId)}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="teacher-password">
              Password
            </label>
            <div className="input-with-icon">
              <span className="input-prefix-icon">
                <Lock size={16} />
              </span>
              <input
                id="teacher-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingRight: '2.5rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="input-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="spinner" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
