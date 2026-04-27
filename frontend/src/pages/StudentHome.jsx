import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NotesTab from '../components/NotesTab';
import QuizTab from '../components/QuizTab';
import CoachTab from '../components/CoachTab';
import { Camera, Target, LogOut, User, LayoutDashboard, BrainCircuit, MessageCircleHeart } from 'lucide-react';

export default function StudentHome() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home'); // defaults to home hub
  const [concepts, setConcepts] = useState([]);
  const [studentName, setStudentName] = useState('Student');

  useEffect(() => {
    // Check auth
    if (!localStorage.getItem('studentToken')) {
      navigate('/login');
    } else {
      const name = localStorage.getItem('studentName');
      if (name) setStudentName(name);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentName');
    navigate('/');
  };

  const handleConceptsLoaded = (loadedConcepts) => {
    setConcepts(loadedConcepts);
  };

  return (
    <div className="app-container">
      <header className="header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="brand-title" style={{ fontSize: '1.8rem' }}>Student Dashboard</h1>
          <p className="brand-subtitle">Interactive Note Processor</p>
        </div>
        
        <div className="top-nav">
          <nav className="tab-nav">
            <button 
              className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              <LayoutDashboard size={18} />
              Home Hub
            </button>
            <button 
              className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              <Camera size={18} />
              Notes Tool
            </button>
            <button 
              className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
              onClick={() => setActiveTab('quiz')}
              disabled={concepts.length === 0}
            >
              <Target size={18} />
              Quiz Tool
            </button>
            <button
              className={`tab-btn ${activeTab === 'coach' ? 'active' : ''}`}
              onClick={() => setActiveTab('coach')}
            >
              <MessageCircleHeart size={18} />
              Study Coach
            </button>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <User size={18} />
              <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{studentName}</span>
            </div>
            <button 
              className="btn btn-ghost" 
              style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main>
        {activeTab === 'home' && (
          <div className="panel" style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>Welcome back, {studentName.split(' ')[0]}!</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Select a tool below to continue your learning journey.</p>
            </div>

            <div className="tool-grid">
              <div className="tool-card" onClick={() => setActiveTab('notes')}>
                <div className="tool-icon-wrapper" style={{ color: 'var(--accent-primary)', background: 'rgba(37, 99, 235, 0.1)' }}>
                  <Camera size={32} />
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Note Processor</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  Upload an image of your handwritten or typed notes. We will automatically extract key concepts and generate audio summaries.
                </p>
              </div>

              <div className="tool-card" onClick={() => setActiveTab('quiz')}>
                <div className="tool-icon-wrapper" style={{ color: 'var(--emerald)', background: 'var(--emerald-glass)' }}>
                  <BrainCircuit size={32} />
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Interactive Quizzer</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  Test your knowledge of extracted concepts using voice-activated quizzes and get instant conversational feedback.
                </p>
                {concepts.length === 0 && (
                  <span className="pill" style={{ marginTop: '1rem', background: 'var(--bg-surface-hover)', fontSize: '0.75rem' }}>
                    Requires processed notes
                  </span>
                )}
              </div>

              <div className="tool-card" onClick={() => setActiveTab('coach')}>
                <div className="tool-icon-wrapper" style={{ color: 'var(--gold)', background: 'var(--gold-glass)' }}>
                  <MessageCircleHeart size={32} />
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>AI Study Coach</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  Get short CBT-style support for exam stress, focus issues, and overwhelming study moments with age-aware guidance.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Your Statistics</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', fontWeight: '500', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total Concepts Extracted</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--accent-primary)' }}>{concepts.length > 0 ? concepts.length : '0'}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', flex: 1 }}>
                      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', fontWeight: '500', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Quizzes</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--emerald)' }}>0</p>
                    </div>
                    <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', flex: 1 }}>
                      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', fontWeight: '500', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Streak</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gold)' }}>1 Day</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Exam Updates</h3>
                <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                  
                  <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>UPSC Civil Services</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>2 hrs ago</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Prelims admit card released. Exam scheduled for May 26.</p>
                  </div>
                  
                  <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>JEE Advanced</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>5 hrs ago</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Registration closes tomorrow. Exam on June 4.</p>
                  </div>

                  <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>NEET UG</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>1 day ago</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Correction window open until Friday. Please verify details.</p>
                  </div>

                  <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>AIIMS INI-CET</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>2 days ago</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Results declared. Counselling process starts next week.</p>
                  </div>

                  <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>SSC CGL</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>3 days ago</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Tier 1 notification released. Online applications open now.</p>
                  </div>

                  <div style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Kerala PSC</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>4 days ago</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Degree Level Prelims answer key published. Check official website.</p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <NotesTab onConceptsLoaded={handleConceptsLoaded} />
        )}
        
        {activeTab === 'quiz' && (
          <QuizTab concepts={concepts} />
        )}

        {activeTab === 'coach' && <CoachTab />}
      </main>
    </div>
  );
}
