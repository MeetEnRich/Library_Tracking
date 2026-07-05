import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Lock, User, KeySquare } from 'lucide-react';

const Login = ({ setCurrentPage }) => {
  const { login } = useAuth();
  
  // Tab control: 'student' or 'admin'
  const [activeTab, setActiveTab] = useState('student');
  
  // Fields
  const [matricNo, setMatricNo] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Status state
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (activeTab === 'student') {
        if (!matricNo || !password) {
          throw new Error('Matriculation number and password are required');
        }
        const data = await api.post('/auth/login', { matricNo, password });
        login(data.token, data.user);
        setCurrentPage('student-dashboard');
      } else {
        if (!username || !password) {
          throw new Error('Username and password are required');
        }
        const data = await api.post('/auth/admin/login', { username, password });
        login(data.token, data.user);
        setCurrentPage('admin-dashboard');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <img src="/logo.png" alt="FULafia Logo" style={{ display: 'block', margin: '0 auto 1.5rem auto', height: '64px', width: 'auto' }} />
      <h2 className="form-title" style={{ display: 'block', textAlign: 'center', border: 'none' }}>
        FULafia Portal Sign-in
      </h2>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => { setActiveTab('student'); setError(''); }}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'student' ? '3px solid var(--secondary-color)' : 'none',
            fontWeight: activeTab === 'student' ? '700' : '500',
            color: activeTab === 'student' ? 'var(--primary-color)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontFamily: 'var(--font-family)'
          }}
        >
          Student Login
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('admin'); setError(''); }}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'admin' ? '3px solid var(--secondary-color)' : 'none',
            fontWeight: activeTab === 'admin' ? '700' : '500',
            color: activeTab === 'admin' ? 'var(--primary-color)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontFamily: 'var(--font-family)'
          }}
        >
          Administrator
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit}>
        {activeTab === 'student' ? (
          <div className="form-group">
            <label className="form-label" htmlFor="matricNo">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={14} />
                Matriculation Number
              </div>
            </label>
            <input
              className="form-input"
              type="text"
              id="matricNo"
              value={matricNo}
              onChange={(e) => setMatricNo(e.target.value)}
              placeholder="e.g. 2021/CP/CSC/0054"
              required
            />
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <KeySquare size={14} />
                Admin Username
              </div>
            </label>
            <input
              className="form-input"
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
          </div>
        )}

        <div className="form-group" style={{ marginBottom: '2rem' }}>
          <label className="form-label" htmlFor="password">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={14} />
              Password
            </div>
          </label>
          <input
            className="form-input"
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            required
          />
        </div>

        <button 
          className="form-submit-btn" 
          type="submit" 
          disabled={submitting}
        >
          {submitting ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      {activeTab === 'student' && (
        <div className="form-footer">
          New student?{' '}
          <button
            onClick={() => setCurrentPage('register')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-color)',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
              fontFamily: 'var(--font-family)'
            }}
          >
            Create Account
          </button>
        </div>
      )}
    </div>
  );
};

export default Login;
