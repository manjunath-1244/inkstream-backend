import React, { useState } from 'react';
import { api } from '../api';

export default function AuthModal({ onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('LOGIN'); // LOGIN, REGISTER, FORGOT
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        const response = await api.login(email, password);
        // Fetch current user details after login success
        const user = await api.getMe();
        localStorage.setItem('user', JSON.stringify(user));
        onAuthSuccess(user);
        onClose();
      } else if (mode === 'REGISTER') {
        await api.register(email, password, username, displayName);
        const user = await api.getMe();
        localStorage.setItem('user', JSON.stringify(user));
        onAuthSuccess(user);
        onClose();
      } else if (mode === 'FORGOT') {
        await api.forgotPassword(email);
        setSuccessMsg('Forgot password email triggered! Check MailHog (http://localhost:8025) for the reset link.');
        setEmail('');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {mode === 'LOGIN' && 'Welcome Back'}
            {mode === 'REGISTER' && 'Create Creator Account'}
            {mode === 'FORGOT' && 'Reset Password'}
          </h2>
          <button className="btn-icon" onClick={onClose}>×</button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '0.75rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            padding: '0.75rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '1rem'
          }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'REGISTER' && (
            <>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {mode !== 'FORGOT' && (
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Processing...' : (
              mode === 'LOGIN' ? 'Sign In' : mode === 'REGISTER' ? 'Register Account' : 'Send Reset Instructions'
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
          {mode === 'LOGIN' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                Don't have an account?{' '}
                <span style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setMode('REGISTER')}>
                  Sign up
                </span>
              </span>
              <span style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setMode('FORGOT')}>
                Forgot password?
              </span>
            </div>
          ) : mode === 'REGISTER' ? (
            <span style={{ color: 'var(--text-secondary)' }}>
              Already registered?{' '}
              <span style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setMode('LOGIN')}>
                Log in
              </span>
            </span>
          ) : (
            <span style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setMode('LOGIN')}>
              Back to Login
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
