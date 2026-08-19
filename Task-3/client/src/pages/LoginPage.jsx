import React, { useState } from 'react';
import { Trello, ArrowRight, UserCheck, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onSwitchToRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail) => {
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, 'password123');
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.15), transparent 70%), var(--bg-primary)',
      padding: '1.5rem'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '2.25rem',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'var(--accent-gradient)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            marginBottom: '0.75rem',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Trello size={28} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Welcome to TaskHub</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Real-time Collaborative Workspace & Board Manager
          </p>
        </div>

        {error && (
          <div style={{
            padding: '0.625rem 0.875rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--accent-danger)',
            fontSize: '0.825rem',
            marginBottom: '1.25rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.375rem' }}>EMAIL ADDRESS</label>
            <input
              type="email"
              className="input"
              placeholder="alex@taskhub.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.375rem' }}>PASSWORD</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', marginTop: '0.5rem', width: '100%', fontSize: '0.95rem' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'} <ArrowRight size={18} />
          </button>
        </form>

        {/* Quick Demo Login Preset Section */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.75rem' }}>
            Instant Quick Demo Login
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.5rem', justifyContent: 'flex-start' }}
              onClick={() => handleDemoLogin('alex@taskhub.com')}
            >
              <UserCheck size={14} color="#6366f1" /> Alex (Lead)
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.5rem', justifyContent: 'flex-start' }}
              onClick={() => handleDemoLogin('sarah@taskhub.com')}
            >
              <UserCheck size={14} color="#ec4899" /> Sarah (Frontend)
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.5rem', justifyContent: 'flex-start' }}
              onClick={() => handleDemoLogin('david@taskhub.com')}
            >
              <UserCheck size={14} color="#10b981" /> David (Backend)
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.5rem', justifyContent: 'flex-start' }}
              onClick={() => handleDemoLogin('emma@taskhub.com')}
            >
              <UserCheck size={14} color="#f59e0b" /> Emma (UX)
            </button>
          </div>
        </div>

        {/* Footer switch */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <span 
            onClick={onSwitchToRegister}
            style={{ color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Create account
          </span>
        </div>

      </div>
    </div>
  );
}
