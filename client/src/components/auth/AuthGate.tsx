import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';

type Mode = 'login' | 'register' | 'forgot' | 'reset';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, setUser } = useAuthStore();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset_token');
    if (token) {
      setResetToken(token);
      setMode('reset');
      window.history.replaceState({}, '', '/');
    }
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span style={{ color: 'var(--text-muted)' }}>Loading…</span>
      </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      if (mode === 'forgot') {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError((data as { error?: string }).error ?? 'Something went wrong. Please try again.');
          return;
        }
        setMessage('If that email is registered, you'll receive a reset link shortly.');
        return;
      }

      if (mode === 'reset') {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, password }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? 'Something went wrong'); return; }
        setMessage('Password updated — sign in with your new password.');
        setMode('login');
        setPassword('');
        return;
      }

      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return; }
      setUser(data);
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(m: Mode) {
    setMode(m);
    setError('');
    setMessage('');
  }

  const isAuthMode = mode === 'login' || mode === 'register';

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 380, padding: 32 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)', marginBottom: 24, textAlign: 'center' }}>
          Pantry Builder
        </h1>

        {isAuthMode && (
          <div style={{ display: 'flex', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 24 }}>
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  background: mode === m ? 'var(--primary)' : 'var(--surface)',
                  color: mode === m ? '#fff' : 'var(--text-muted)',
                  fontWeight: mode === m ? 600 : 400,
                  border: 'none',
                  borderRadius: 0,
                  fontSize: 14,
                }}
              >
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>
        )}

        {mode === 'forgot' && (
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
            Enter your email and we'll send you a reset link.
          </p>
        )}

        {mode === 'reset' && (
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
            Enter your new password.
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{ marginBottom: 0 }}
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'reset') && (
            <div style={{ marginBottom: mode === 'login' ? 8 : 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  style={{ marginBottom: 0, paddingRight: 52 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                    padding: '0 4px',
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div style={{ marginBottom: 20, textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12 }}
              >
                Forgot password?
              </button>
            </div>
          )}

          {error && <p style={{ color: '#e74c3c', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          {message && <p style={{ color: 'var(--primary)', fontSize: 13, marginBottom: 12 }}>{message}</p>}

          {!(mode === 'forgot' && message) && (
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? '…'
                : mode === 'login' ? 'Sign in'
                : mode === 'register' ? 'Create account'
                : mode === 'forgot' ? 'Send reset link'
                : 'Update password'}
            </button>
          )}
        </form>

        {(mode === 'forgot' || mode === 'reset') && (
          <button
            type="button"
            onClick={() => switchMode('login')}
            style={{ marginTop: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, width: '100%' }}
          >
            Back to sign in
          </button>
        )}
      </div>
    </div>
  );
}
