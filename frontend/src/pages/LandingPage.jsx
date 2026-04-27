import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Camera, Mic, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="app-container" style={{ maxWidth: '100%', margin: '0', padding: '0' }}>
      <header className="header" style={{ padding: '1.5rem 4rem', marginBottom: '0', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div>
          <h1 className="brand-title" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }}>NoteNova</h1>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <button className="btn btn-ghost" style={{ width: 'auto', fontWeight: '500' }} onClick={() => navigate('/login')}>
            Login
          </button>
          <button className="btn btn-primary" style={{ width: 'auto', padding: '0.6rem 1.5rem' }} onClick={() => navigate('/signup')}>
            Get Started
          </button>
        </div>
      </header>

      <div className="hero-section">
        <h1 className="hero-title">Master Your Knowledge <br /> with <span style={{ color: 'var(--accent-primary)', fontStyle: 'italic' }}>Intelligent</span> Notes.</h1>
        <p className="hero-subtitle">
          The ultimate companion for students. Transform handwritten scribbles into structured concepts, audio summaries, and interactive spoken quizzes.
        </p>
        
        <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center' }}>
          <button 
            className="btn btn-primary" 
            style={{ width: 'auto', padding: '1rem 3rem', fontSize: '1.1rem', borderRadius: 'var(--radius-xl)' }}
            onClick={() => navigate('/signup')}
          >
            Start Learning for Free <ArrowRight size={18} style={{ marginLeft: '0.75rem' }} />
          </button>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <div style={{ background: 'var(--emerald-glass)', width: 'fit-content', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <Camera size={28} style={{ color: 'var(--emerald)' }} />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Vision Processing</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Upload photos of your notes. Our AI extracts core concepts and organizes them into a searchable knowledge base.
            </p>
          </div>
          
          <div className="feature-card">
            <div style={{ background: 'var(--gold-glass)', width: 'fit-content', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <Mic size={28} style={{ color: 'var(--gold)' }} />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Audio Synthesizer</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Generate natural-sounding audio summaries. Perfect for listening to your notes while commuting or exercising.
            </p>
          </div>

          <div className="feature-card">
            <div style={{ background: 'rgba(79, 70, 229, 0.05)', width: 'fit-content', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <Brain size={28} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Conversational Quiz</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Test your knowledge with spoken quizzes. Get real-time feedback from our AI tutor to reinforce your learning.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
