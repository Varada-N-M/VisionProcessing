import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Loader2, Sparkles } from 'lucide-react';

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      
      if (data.success) {
        alert('Account created successfully! Please log in.');
        navigate('/login');
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container" style={{ background: 'var(--bg-base)' }}>
      <div className="auth-card" style={{ padding: '4rem 3rem', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', maxWidth: '450px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <div style={{ background: 'rgba(79, 70, 229, 0.08)', padding: '1rem', borderRadius: '50%', color: 'var(--accent-primary)' }}>
            <Sparkles size={32} />
          </div>
        </div>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontFamily: 'Instrument Serif' }}>Start Your Journey</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '0.95rem' }}>
          Create an account to begin mastering your notes.
        </p>

        <form onSubmit={handleSignup} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Full Name</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ padding: '0.8rem 1rem' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Academic Email</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ padding: '0.8rem 1rem' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '2.5rem' }}>
            <label className="form-label" style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Create Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
              style={{ padding: '0.8rem 1rem' }}
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem', fontSize: '1rem', fontWeight: '600' }} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 size={18} className="spinner" /> : <UserPlus size={18} />}
            Create Account
          </button>
        </form>

        <p style={{ marginTop: '2.5rem', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
          Already using NoteNova? <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: '600', textDecoration: 'none' }}>Sign in instead</Link>
        </p>
      </div>
    </div>
  );
}
