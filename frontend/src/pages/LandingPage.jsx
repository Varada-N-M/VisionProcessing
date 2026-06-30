import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Camera, Mic, ArrowRight } from 'lucide-react';

/* ─── Individual Book Card ─────────────────────────────────────────────────── */
function BookCard({ icon, iconBg, iconColor, title, description, style, innerStyle }) {
  return (
    <div
      style={{
        position: 'absolute',
        width: '300px',
        height: '380px',
        borderRadius: '20px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 60px -12px rgba(0,0,0,0.12)',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        boxSizing: 'border-box',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          background: iconBg,
          width: 'fit-content',
          padding: '0.75rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
        }}
      >
        {React.cloneElement(icon, { size: 28, style: { color: iconColor } })}
      </div>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontFamily: 'Instrument Serif, serif' }}>
        {title}
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
        {description}
      </p>
      {/* Spine shadow strip — the inner edge that faces the center */}
      <div style={innerStyle} />
    </div>
  );
}

/* ─── Landing Page ─────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [opened, setOpened] = useState(false);

  // Trigger the book-open after a short mount delay
  useEffect(() => {
    const t = setTimeout(() => setOpened(true), 400);
    return () => clearTimeout(t);
  }, []);

  // ── Shared animation config ──────────────────────────────────────────────
  const DURATION = '1.4s';
  const EASING   = 'cubic-bezier(0.22, 1, 0.36, 1)';

  /*
   *  HOW IT WORKS
   *  ─────────────────────────────────────────────────────────────────────────
   *  All three cards start stacked at center (like a closed book lying flat
   *  on a table, spine at center, cover facing you).
   *
   *  LEFT card  → transformOrigin: RIGHT center
   *    Phase 1 (0–25 %):  rotateY climbs to +70° — the left edge of the card
   *                        lifts UP TOWARD the viewer (opens from the FRONT).
   *    Phase 2 (25–55 %): card arcs over and sweeps left, translateX grows.
   *    Phase 3 (55–100%): gentle overshoot + settle flat to the left.
   *
   *  RIGHT card → transformOrigin: LEFT center  (mirror image)
   *
   *  CENTER card stays perfectly still — it is the book's back cover / spine.
   */

  const leftCardStyle = {
    transformOrigin: 'right center',
    zIndex: opened ? 2 : 4,           // sits on top when closed, behind when open
    animation: opened
      ? `bookOpenLeft ${DURATION} ${EASING} forwards`
      : 'none',
    transform: opened ? undefined : 'translateX(0px) rotateY(0deg)',
    // Directional shadow: deepens as the page swings away
    boxShadow: opened
      ? '-14px 24px 48px -8px rgba(0,0,0,0.18)'
      : '0 20px 60px -12px rgba(0,0,0,0.12)',
    transition: opened ? 'box-shadow 0.5s ease 0.9s' : 'none',
  };

  const rightCardStyle = {
    transformOrigin: 'left center',
    zIndex: opened ? 2 : 3,
    animation: opened
      ? `bookOpenRight ${DURATION} ${EASING} forwards`
      : 'none',
    transform: opened ? undefined : 'translateX(0px) rotateY(0deg)',
    boxShadow: opened
      ? '14px 24px 48px -8px rgba(0,0,0,0.18)'
      : '0 20px 60px -12px rgba(0,0,0,0.12)',
    transition: opened ? 'box-shadow 0.5s ease 0.9s' : 'none',
  };

  const centerCardStyle = {
    zIndex: 1,
    transform: 'translateX(0px) rotateY(0deg)',
    boxShadow: '0 20px 60px -12px rgba(0,0,0,0.12)',
  };

  return (
    <div className="app-container" style={{ maxWidth: '100%', margin: '0', padding: '0' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header
        className="header"
        style={{
          padding: '1.5rem 4rem',
          marginBottom: '0',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-surface)',
        }}
      >
        <div>
          <h1 className="brand-title" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }}>
            NoteNova
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <button
            className="btn btn-ghost"
            style={{ width: 'auto', fontWeight: '500' }}
            onClick={() => navigate('/login')}
          >
            Login
          </button>
          <button
            className="btn btn-primary"
            style={{ width: 'auto', padding: '0.6rem 1.5rem' }}
            onClick={() => navigate('/signup')}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="hero-section">
        <h1 className="hero-title">
          Master Your Knowledge <br /> with{' '}
          <span style={{ color: 'var(--accent-primary)', fontStyle: 'italic' }}>Intelligent</span>{' '}
          Notes.
        </h1>
        <p className="hero-subtitle">
          The ultimate companion for students. Transform handwritten scribbles into structured
          concepts, audio summaries, and interactive spoken quizzes.
        </p>

        <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center' }}>
          <button
            className="btn btn-primary"
            style={{ width: 'auto', padding: '1rem 3rem', fontSize: '1.1rem', borderRadius: 'var(--radius-xl)' }}
            onClick={() => navigate('/signup')}
          >
            Start Learning for Free{' '}
            <ArrowRight size={18} style={{ marginLeft: '0.75rem' }} />
          </button>
        </div>

        {/* ── 3-D Book Animation ────────────────────────────────────────── */}
        <div
          style={{
            perspective: '1800px',
            perspectiveOrigin: '50% 50%',
            width: '100%',
            maxWidth: '1100px',
            height: '420px',
            position: 'relative',
            marginTop: '5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Inner wrapper preserves 3-D context */}
          <div
            style={{
              position: 'relative',
              width: '300px',
              height: '380px',
              transformStyle: 'preserve-3d',
            }}
          >

            {/* ── CENTER card (back cover — stays still) ─────────────── */}
            <BookCard
              icon={<Brain />}
              iconBg="rgba(79, 70, 229, 0.05)"
              iconColor="var(--accent-primary)"
              title="Conversational Quiz"
              description="Test your knowledge with spoken quizzes. Get real-time feedback from our AI tutor to reinforce your learning."
              style={centerCardStyle}
              innerStyle={{}}
            />

            {/* ── LEFT card (front cover — swings open to the left) ──── */}
            <BookCard
              icon={<Camera />}
              iconBg="var(--emerald-glass)"
              iconColor="var(--emerald)"
              title="Vision Processing"
              description="Upload photos of your notes. Our AI extracts core concepts and organizes them into a searchable knowledge base."
              style={leftCardStyle}
              innerStyle={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '6px',
                height: '100%',
                borderRadius: '0 20px 20px 0',
                background: 'linear-gradient(to left, rgba(0,0,0,0.06), transparent)',
              }}
            />

            {/* ── RIGHT card (inside page — swings open to the right) ── */}
            <BookCard
              icon={<Mic />}
              iconBg="var(--gold-glass)"
              iconColor="var(--gold)"
              title="Audio Synthesizer"
              description="Generate natural-sounding audio summaries. Perfect for listening to your notes while commuting or exercising."
              style={rightCardStyle}
              innerStyle={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '6px',
                height: '100%',
                borderRadius: '20px 0 0 20px',
                background: 'linear-gradient(to right, rgba(0,0,0,0.06), transparent)',
              }}
            />

          </div>
        </div>
        {/* ── End 3-D Book ──────────────────────────────────────────────── */}

      </div>
    </div>
  );
}
