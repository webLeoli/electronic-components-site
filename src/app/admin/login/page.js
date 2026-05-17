'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
function AdminLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(from);
        router.refresh();
      } else {
        setError(data.error || 'Authentication failed. Please try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  };



  return (
    <form onSubmit={handleSubmit} className="admin-login-form">
      {error && (
        <div className="admin-alert admin-alert-danger">{error}</div>
      )}
      <div className="admin-field">
        <label htmlFor="admin-email">Username / Email</label>
        <input
          type="text"
          id="admin-email"
          className="admin-input"
          placeholder="admin or user@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
      </div>
      <div className="admin-field">
        <label htmlFor="admin-password">Password</label>
        <input
          type="password"
          id="admin-password"
          className="admin-input"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit" className="admin-btn admin-btn-primary admin-btn-lg" disabled={loading} style={{ width: '100%' }}>
        {loading ? 'Authenticating...' : 'Sign In'}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <div className="logo-icon" style={{ width: 48, height: 48, fontSize: 24 }}>F</div>
          <h1>Admin Panel</h1>
          <p>FPGACenter Management Console</p>
        </div>

        <Suspense fallback={
          <div className="admin-login-form">
            <div className="admin-field">
              <label htmlFor="admin-password">Password</label>
              <input type="password" className="admin-input" placeholder="Loading..." disabled />
            </div>
            <button className="admin-btn admin-btn-primary admin-btn-lg" disabled style={{ width: '100%' }}>
              Sign In
            </button>
          </div>
        }>
          <AdminLoginForm />
        </Suspense>

        <p className="admin-login-footer">
          <Link href="/">← Back to FPGACenter</Link>
        </p>
      </div>
    </div>
  );
}
