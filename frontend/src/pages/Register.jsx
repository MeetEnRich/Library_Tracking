import React, { useState } from 'react';
import { api } from '../api/client';
import { User, Lock, BookOpen, GraduationCap } from 'lucide-react';

const Register = ({ setCurrentPage }) => {
  const [matricNo, setMatricNo] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!matricNo.trim() || !name.trim() || !department.trim()) {
      setError('All fields are required');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/auth/register', {
        matricNo: matricNo.trim(),
        name: name.trim(),
        department: department.trim(),
        password
      });

      setSuccess('Account created successfully. Redirecting to login...');
      setTimeout(() => {
        setCurrentPage('login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Registration failed. Please verify your details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <img src="/logo.png" alt="FULafia Logo" style={{ display: 'block', margin: '0 auto 1.5rem auto', height: '64px', width: 'auto' }} />
      <h2 className="form-title" style={{ display: 'block', textAlign: 'center', border: 'none' }}>
        Student Registration
      </h2>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <form onSubmit={handleSubmit}>
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

        <div className="form-group">
          <label className="form-label" htmlFor="name">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BookOpen size={14} />
              Full Name (Surname First)
            </div>
          </label>
          <input
            className="form-input"
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Audu Patrick"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="department">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <GraduationCap size={14} />
              Department
            </div>
          </label>
          <input
            className="form-input"
            type="text"
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. Computer Science"
            required
          />
        </div>

        <div className="form-group">
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

        <div className="form-group" style={{ marginBottom: '2rem' }}>
          <label className="form-label" htmlFor="confirmPassword">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={14} />
              Confirm Password
            </div>
          </label>
          <input
            className="form-input"
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="********"
            required
          />
        </div>

        <button 
          className="form-submit-btn" 
          type="submit" 
          disabled={submitting}
        >
          {submitting ? 'Creating Account...' : 'Register'}
        </button>
      </form>

      <div className="form-footer">
        Already registered?{' '}
        <button
          onClick={() => setCurrentPage('login')}
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
          Sign In
        </button>
      </div>
    </div>
  );
};

export default Register;
