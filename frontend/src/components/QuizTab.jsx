import React, { useState, useRef, useEffect } from 'react';
import { Mic, Target, Loader2, Play, CheckCircle, XCircle, AlertCircle, Headphones, MessageSquare } from 'lucide-react';

const API = 'http://localhost:3000/api';
const LANG_LABELS = {
  'en-US': '🇺🇸 English (US)',
  'en-IN': '🇮🇳 English (IN)',
  'hi-IN': '🇮🇳 Hindi',
  'ta-IN': '🇮🇳 Tamil',
  'te-IN': '🇮🇳 Telugu',
  'mr-IN': '🇮🇳 Marathi',
};

export default function QuizTab({ concepts }) {
  const [difficulty, setDifficulty] = useState('medium');
  const [quizLang, setQuizLang] = useState('en-US');
  const [selectedConcept, setSelectedConcept] = useState(null);
  
  const [stage, setStage] = useState('empty'); // empty | loading | question | evaluating | result
  const [questionData, setQuestionData] = useState(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordSeconds, setRecordSeconds] = useState(0);
  
  const [evalData, setEvalData] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  const startQuizForConcept = async (concept) => {
    setSelectedConcept(concept);
    setStage('loading');
    setTranscript('');
    setEvalData(null);

    try {
      const res = await fetch(`${API}/quiz/generate_question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept_name: concept.name,
          concept_description: concept.summary || concept.category,
          difficulty,
          language: quizLang
        })
      });
      const data = await res.json();
      if (data.success) {
        setQuestionData(data);
        setStage('question');
        if (data.audio_base64) {
          new Audio(`data:audio/wav;base64,${data.audio_base64}`).play().catch(()=>{});
        }
      } else {
        alert('Error: ' + data.error);
        setStage('empty');
      }
    } catch (err) {
      alert('Error: ' + err.message);
      setStage('empty');
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        recorder.onstop = async () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          stream.getTracks().forEach(t => t.stop());
          
          const reader = new FileReader();
          reader.onload = async (ev) => {
            const base64 = ev.target.result.split(',')[1];
            // Get Transcript via Speech To Text
            setStage('evaluating');
            try {
              const res = await fetch(`${API}/quiz/speech_to_text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audio_base64: base64, language: quizLang })
              });
              const data = await res.json();
              if (data.success) {
                setTranscript(data.text);
                submitAnswer(data.text);
              } else {
                alert('Transcription failed');
                setStage('question');
              }
            } catch(e) {
              alert('Error: ' + e.message);
              setStage('question');
            }
          };
          reader.readAsDataURL(blob);
        };
        
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        setRecordSeconds(0);
        timerIntervalRef.current = setInterval(() => {
          setRecordSeconds(prev => prev + 1);
        }, 1000);
      } catch (err) {
        alert('Microphone access denied or not available.');
      }
    }
  };

  const submitAnswer = async (answerText) => {
    try {
      const res = await fetch(`${API}/quiz/evaluate_answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept_name: selectedConcept.name,
          concept_description: selectedConcept.summary || selectedConcept.category,
          question: questionData.question,
          student_answer: answerText,
          language: quizLang
        })
      });
      const data = await res.json();
      if (data.success) {
        setEvalData(data);
        setStage('result');
        if (data.audio_base64) {
          new Audio(`data:audio/wav;base64,${data.audio_base64}`).play().catch(()=>{});
        }
      } else {
        alert('Error: ' + data.error);
        setStage('question');
      }
    } catch(e) {
      alert('Error: ' + e.message);
      setStage('question');
    }
  };

  return (
    <div className="split-layout panel" style={{ gridTemplateColumns: '400px 1fr' }}>
      <aside className="card" style={{ gap: '2rem' }}>
        <div>
          <span className="section-label">Preferences</span>
          <div style={{ background: 'var(--bg-base)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: '500' }}>Difficulty Level</p>
            <div className="pill-group" style={{ marginBottom: '1.5rem' }}>
              {['easy', 'medium', 'hard'].map(d => (
                <button 
                  key={d} 
                  className={`pill diff-${d} ${difficulty === d ? 'active' : ''}`}
                  onClick={() => setDifficulty(d)}
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  {d}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: '500' }}>Interaction Language</p>
            <div className="pill-group">
              {Object.keys(LANG_LABELS).map(lang => (
                <button 
                  key={lang}
                  className={`pill ${quizLang === lang ? 'active' : ''}`}
                  onClick={() => setQuizLang(lang)}
                  style={{ flex: '1 1 40%', textAlign: 'center' }}
                >
                  {lang.split('-')[0].toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <span className="section-label">Select Concept</span>
          {(!concepts || concepts.length === 0) ? (
             <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--text-tertiary)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Upload notes first to start a quiz.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {concepts.map((c, i) => (
                <button 
                  key={i} 
                  className={`concept-item ${selectedConcept?.id === c.id ? 'active' : ''}`}
                  onClick={() => startQuizForConcept(c)}
                  style={{ 
                    textAlign: 'left', 
                    padding: '1rem 1.25rem',
                    borderLeft: selectedConcept?.id === c.id ? '4px solid var(--accent-primary)' : '1px solid var(--border)',
                    background: 'var(--bg-surface)' 
                  }}
                >
                  <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      <main className="card" style={{ padding: '0', overflow: 'hidden', justifyContent: stage === 'empty' || stage === 'loading' ? 'center' : 'flex-start' }}>
        
        {stage === 'empty' && (
          <div className="empty-state" style={{ minHeight: '600px' }}>
            <div style={{ background: 'rgba(79, 70, 229, 0.05)', padding: '2rem', borderRadius: '50%', marginBottom: '2rem' }}>
              <Target size={64} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <h3 style={{ fontSize: '2.5rem', color: 'var(--text-primary)', fontFamily: 'Instrument Serif', marginBottom: '1rem' }}>Active Recall Training</h3>
            <p style={{ maxWidth: '400px', margin: '0 auto', color: 'var(--text-secondary)' }}>
              Pick a concept on the left. Our AI will generate a specific question to test your core understanding.
            </p>
          </div>
        )}

        {(stage === 'loading' || stage === 'evaluating') && (
          <div className="empty-state" style={{ minHeight: '600px' }}>
             <div className="shimmer" style={{ width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={32} className="spinner" style={{ color: 'var(--accent-primary)' }} />
             </div>
            <p style={{ marginTop: '2rem', fontWeight: '500' }}>{stage === 'loading' ? 'Crafting a unique question for you...' : 'Analyzing your spoken response...'}</p>
          </div>
        )}

        {stage === 'question' && questionData && (
          <div className="question-stage" style={{ padding: '3rem' }}>
            <div style={{ background: 'var(--bg-base)', padding: '3rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '1.5rem', left: '2rem', display: 'flex', gap: '0.5rem' }}>
                <span className={`pill diff-${difficulty} active`} style={{ padding: '0.2rem 0.8rem', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase' }}>
                  {difficulty}
                </span>
                <span style={{ background: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.8rem', borderRadius: '100px', fontSize: '0.7rem', fontWeight: '600' }}>
                  VOICE QUIZ
                </span>
              </div>
              
              <div className="quiz-question-text" style={{ fontSize: '2.25rem', fontFamily: 'Instrument Serif', lineHeight: '1.2', marginTop: '1.5rem', marginBottom: '2rem' }}>
                {questionData.question}
              </div>
              
              {questionData.audio_base64 && (
                <button 
                  className="btn" 
                  style={{ width: 'auto', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)' }}
                  onClick={() => new Audio(`data:audio/wav;base64,${questionData.audio_base64}`).play()}
                >
                  <Headphones size={18} /> Replay Audio
                </button>
              )}
            </div>

            <div className="record-area" style={{ marginTop: '3rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '3rem' }}>
              <div style={{ position: 'relative' }}>
                <button 
                  className={`mic-btn ${isRecording ? 'recording' : ''}`} 
                  onClick={toggleRecording}
                  style={{ width: '80px', height: '80px', borderRadius: '50%', boxShadow: 'var(--shadow-lg)' }}
                >
                  <Mic size={36} />
                </button>
                {isRecording && <div style={{ position: 'absolute', top: '-1rem', right: '-1rem', background: 'var(--rose)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '700' }}>{recordSeconds}s</div>}
              </div>
              <p style={{ marginTop: '1.5rem', color: 'var(--text-primary)', fontWeight: '500', fontSize: '1.1rem' }}>
                {isRecording ? 'Listening carefully...' : 'Tap the microphone to speak your answer'}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>Your voice is processed locally and then analyzed by AI.</p>
            </div>
          </div>
        )}

        {stage === 'result' && evalData && (
          <div className="question-stage" style={{ padding: '3rem' }}>
            <div style={{ marginBottom: '2rem' }}>
              <span className="section-label">Discussion Review</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
                <div style={{ background: 'var(--bg-base)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>The Question</p>
                  <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '500' }}>{questionData?.question}</p>
                </div>
                <div style={{ background: 'var(--bg-base)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Your Response</p>
                  <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{transcript}"</p>
                </div>
              </div>
            </div>

            <div className="eval-card" style={{ border: 'none', boxShadow: 'var(--shadow-lg)', borderRadius: 'var(--radius-xl)' }}>
              <div className={`eval-header ${evalData.rating}`} style={{ padding: '2rem' }}>
                <div style={{ background: 'white', padding: '0.75rem', borderRadius: '50%', boxShadow: 'var(--shadow-sm)' }}>
                  {evalData.rating === 'correct' && <CheckCircle size={32} color="var(--emerald)" />}
                  {evalData.rating === 'partially_correct' && <AlertCircle size={32} color="var(--gold)" />}
                  {evalData.rating === 'incorrect' && <XCircle size={32} color="var(--rose)" />}
                </div>
                <div>
                  <div className="eval-rating" style={{ fontSize: '1.5rem', fontFamily: 'Instrument Serif' }}>
                    {evalData.rating === 'correct' ? 'Perfect Understanding' : evalData.rating === 'partially_correct' ? 'Nearly Mastered' : 'Needs Reinforcement'}
                  </div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>AI Evaluated Feedback</div>
                </div>
              </div>
              <div className="eval-body" style={{ padding: '2.5rem', background: 'var(--bg-surface)' }}>
                <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: 'var(--text-primary)', marginBottom: '2rem' }}>{evalData.feedback}</p>
                {evalData.audio_base64 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ color: 'var(--accent-primary)' }}><Headphones size={20} /></div>
                    <audio controls src={`data:audio/wav;base64,${evalData.audio_base64}`} autoPlay style={{ height: '36px' }} />
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '2.5rem' }}>
              <button className="btn btn-primary" style={{ width: 'auto', padding: '0.8rem 2rem' }} onClick={() => setStage('empty')}>Choose New Concept</button>
              <button className="btn" style={{ width: 'auto', padding: '0.8rem 2rem' }} onClick={() => startQuizForConcept(selectedConcept)}>Retry This Topic</button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
