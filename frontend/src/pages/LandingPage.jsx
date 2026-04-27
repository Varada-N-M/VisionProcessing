import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Camera, Mic, Zap } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <header className="header" style={{ padding: '1.5rem 2rem', marginBottom: '0' }}>
        <div>
          <h1 className="brand-title" style={{ fontSize: '1.8rem' }}>Note Processor</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-ghost" style={{ width: 'auto', background: 'transparent' }} onClick={() => navigate('/login')}>
            Login
          </button>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => navigate('/signup')}>
            Sign Up
          </button>
        </div>
      </header>

      <div className="hero-section">
        <h1 className="hero-title serif">Master Your Notes with AI</h1>
        <p className="hero-subtitle">
          Transform your handwritten or typed notes into interactive learning experiences. Extract concepts, listen to audio summaries, and test your knowledge with spoken quizzes.
        </p>
        
        <button 
          className="btn btn-primary" 
          style={{ width: 'auto', padding: '1rem 3rem', fontSize: '1.1rem', borderRadius: 'var(--radius-xl)' }}
          onClick={() => navigate('/login')}
        >
          Get Started
        </button>

        <div className="feature-grid">
          <div className="feature-card">
            <Camera size={32} style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Image Processing</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Upload a picture of your notes. We automatically extract the core concepts and organize them for you.
            </p>
          </div>
          
          <div className="feature-card">
            <Mic size={32} style={{ color: 'var(--gold)', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Audio Summaries</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Listen to AI-generated explanations of each concept, available in multiple languages.
            </p>
          </div>

          <div className="feature-card">
            <Brain size={32} style={{ color: 'var(--emerald)', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Interactive Quizzes</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Speak your answers to generated quiz questions and get real-time conversational feedback.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
