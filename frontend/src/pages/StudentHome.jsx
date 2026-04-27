import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NotesTab from '../components/NotesTab';
import QuizTab from '../components/QuizTab';
import CoachTab from '../components/CoachTab';
import { Camera, Target, LogOut, User, LayoutDashboard, BrainCircuit, MessageCircleHeart, Sparkles } from 'lucide-react';

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
    <div className="app-container" style={{ maxWidth: '1400px' }}>
      <header className="header" style={{ marginBottom: '3rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
           <div style={{ background: 'rgba(79, 70, 229, 0.08)', padding: '0.6rem', borderRadius: 'var(--radius-md)', color: 'var(--accent-primary)' }}>
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="brand-title" style={{ fontSize: '1.75rem', marginBottom: '0.1rem' }}>NoteNova</h1>
            <p className="brand-subtitle" style={{ fontSize: '0.85rem' }}>Your Intelligent Study Companion</p>
          </div>
        </div>
        
        <div className="top-nav" style={{ flex: 1, justifyContent: 'flex-end', gap: '2rem' }}>
          <nav className="tab-nav" style={{ background: 'var(--bg-surface)', padding: '0.4rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
            <button 
              className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              <LayoutDashboard size={18} />
              Home
            </button>
            <button 
              className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              <Camera size={18} />
              Notes
            </button>
            <button 
              className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
              onClick={() => setActiveTab('quiz')}
              disabled={concepts.length === 0}
            >
              <Target size={18} />
              Quizzes
            </button>
            <button
              className={`tab-btn ${activeTab === 'coach' ? 'active' : ''}`}
              onClick={() => setActiveTab('coach')}
            >
              <MessageCircleHeart size={18} />
              Coach
            </button>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', borderLeft: '1px solid var(--border)', paddingLeft: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '0.9rem' }}>
                {studentName.charAt(0)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>{studentName}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Student Plan</span>
              </div>
            </div>
            <button 
              className="btn btn-ghost" 
              style={{ width: 'auto', padding: '0.5rem', color: 'var(--rose)' }}
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main>
        {activeTab === 'home' && (
          <div className="panel" style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '2.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Welcome back, {studentName.split(' ')[0]}!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Ready to turn your notes into knowledge today?</p>
            </div>

            <div className="tool-grid" style={{ gap: '1.5rem' }}>
              <div className="tool-card" style={{ padding: '2.5rem' }} onClick={() => setActiveTab('notes')}>
                <div className="tool-icon-wrapper" style={{ color: 'var(--accent-primary)', background: 'rgba(79, 70, 229, 0.08)', borderRadius: 'var(--radius-lg)' }}>
                  <Camera size={32} />
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Process Notes</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  Upload images of your handwritten notes. We'll extract core concepts and generate audio explanations.
                </p>
              </div>

              <div className="tool-card" style={{ padding: '2.5rem' }} onClick={() => setActiveTab('quiz')}>
                <div className="tool-icon-wrapper" style={{ color: 'var(--emerald)', background: 'var(--emerald-glass)', borderRadius: 'var(--radius-lg)' }}>
                  <BrainCircuit size={32} />
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Voice Quiz</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  Practice active recall. Take a voice-activated quiz on your notes and get real-time feedback.
                </p>
                {concepts.length === 0 && (
                  <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></div>
                    Upload notes to unlock
                  </div>
                )}
              </div>

              <div className="tool-card" style={{ padding: '2.5rem' }} onClick={() => setActiveTab('coach')}>
                <div className="tool-icon-wrapper" style={{ color: 'var(--gold)', background: 'var(--gold-glass)', borderRadius: 'var(--radius-lg)' }}>
                  <MessageCircleHeart size={32} />
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Study Coach</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  Feeling overwhelmed? Talk to our AI coach for motivation and focus strategies tailored to your age.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '4rem', display: 'grid', gridTemplateColumns: '350px 1fr', gap: '3rem' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Performance Analytics</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: 'var(--bg-surface)', padding: '1.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Concepts Extracted</p>
                    <p style={{ fontSize: '2rem', fontWeight: '500', color: 'var(--accent-primary)', fontFamily: 'Instrument Serif' }}>{concepts.length > 0 ? concepts.length : '0'}</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Quizzes</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: '500', color: 'var(--emerald)', fontFamily: 'Instrument Serif' }}>0</p>
                    </div>
                    <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Streak</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: '500', color: 'var(--gold)', fontFamily: 'Instrument Serif' }}>1 Day</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Important Exam Feed</h3>
                <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
                  
                  {[
                    { title: 'UPSC Civil Services', time: '2 hrs ago', msg: 'Prelims admit card released. Exam scheduled for May 26.' },
                    { title: 'JEE Advanced', time: '5 hrs ago', msg: 'Registration closes tomorrow. Exam on June 4.' },
                    { title: 'NEET UG', time: '1 day ago', msg: 'Correction window open until Friday. Please verify details.' },
                    { title: 'AIIMS INI-CET', time: '2 days ago', msg: 'Results declared. Counselling process starts next week.' }
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '1.25rem 1.5rem', borderBottom: i === 3 ? 'none' : '1px solid var(--border)', transition: 'background 0.2s', cursor: 'pointer' }} className="item-hover">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{item.title}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{item.time}</span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{item.msg}</p>
                    </div>
                  ))}

                  <div style={{ padding: '1rem', textAlign: 'center', background: 'var(--bg-surface-hover)', borderTop: '1px solid var(--border)' }}>
                    <button className="btn btn-ghost" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', width: 'auto' }}>View all updates</button>
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
