import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Loader2, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('studentToken', data.token);
        localStorage.setItem('studentName', data.user.name);
        navigate('/student/home');
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container" style={{ background: 'var(--bg-base)' }}>
      <div className="auth-card" style={{ padding: '4rem 3rem', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <div style={{ background: 'rgba(79, 70, 229, 0.08)', padding: '1rem', borderRadius: '50%', color: 'var(--accent-primary)' }}>
            <Sparkles size={32} />
          </div>
        </div>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontFamily: 'Instrument Serif' }}>Welcome Back</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '0.95rem' }}>
          Sign in to your NoteNova account
        </p>

        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Student Email</label>
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
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ padding: '0.8rem 1rem' }}
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem', fontSize: '1rem', fontWeight: '600' }} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 size={18} className="spinner" /> : <LogIn size={18} />}
            Sign In
          </button>
        </form>

        <p style={{ marginTop: '2.5rem', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
          New here? <Link to="/signup" style={{ color: 'var(--accent-primary)', fontWeight: '600', textDecoration: 'none' }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
