import React, { useState, useRef, useEffect } from 'react';
import { Mic, Target, Loader2, Play, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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
    <div className="split-layout panel">
      <aside className="card">
        <span className="section-label">Quiz Settings</span>
        
        <div>
          <span className="section-label">Difficulty</span>
          <div className="pill-group">
            {['easy', 'medium', 'hard'].map(d => (
              <button 
                key={d} 
                className={`pill diff-${d} ${difficulty === d ? 'active' : ''}`}
                onClick={() => setDifficulty(d)}
                style={{ flex: 1, textAlign: 'center' }}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="section-label">Language</span>
          <div className="pill-group">
            {Object.keys(LANG_LABELS).map(lang => (
              <button 
                key={lang}
                className={`pill ${quizLang === lang ? 'active' : ''}`}
                onClick={() => setQuizLang(lang)}
              >
                {LANG_LABELS[lang].split(' ')[0]} {lang.split('-')[0].toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <span className="section-label">Pick a Concept</span>
          {(!concepts || concepts.length === 0) ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Process an image in the Notes tab first.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {concepts.map((c, i) => (
                <button 
                  key={i} 
                  className={`concept-item ${selectedConcept?.id === c.id ? 'active' : ''}`}
                  onClick={() => startQuizForConcept(c)}
                  style={{ textAlign: 'left', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      <main className="card" style={{ justifyContent: stage === 'empty' || stage === 'loading' ? 'center' : 'flex-start' }}>
        
        {stage === 'empty' && (
          <div className="empty-state">
            <Target size={64} style={{ opacity: 0.2 }} />
            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>Ready to test yourself?</h3>
            <p>Select a concept on the left and we'll generate a spoken question for you.</p>
          </div>
        )}

        {(stage === 'loading' || stage === 'evaluating') && (
          <div className="empty-state">
            <Loader2 size={48} className="spinner" style={{ borderTopColor: 'var(--accent-primary)', opacity: 1, borderWidth: '4px' }} />
            <p>{stage === 'loading' ? 'Crafting your question...' : 'Evaluating your answer...'}</p>
          </div>
        )}

        {stage === 'question' && questionData && (
          <div className="question-stage">
            <div className="quiz-card">
              <span className={`pill diff-${difficulty} active`} style={{ display: 'inline-block', marginBottom: '1.5rem', padding: '0.2rem 0.8rem', fontSize: '0.7rem' }}>
                {difficulty.toUpperCase()}
              </span>
              <div className="quiz-question-text">{questionData.question}</div>
              {questionData.audio_base64 && (
                <button 
                  className="btn" 
                  style={{ width: 'auto', background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }}
                  onClick={() => new Audio(`data:audio/wav;base64,${questionData.audio_base64}`).play()}
                >
                  <Play size={16} /> Play Question
                </button>
              )}
            </div>

            <div className="record-area">
              <button 
                className={`mic-btn ${isRecording ? 'recording' : ''}`} 
                onClick={toggleRecording}
              >
                <Mic size={32} />
              </button>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {isRecording ? `Recording... click to stop (${recordSeconds}s)` : 'Press the mic and speak your answer'}
              </p>
            </div>
          </div>
        )}

        {stage === 'result' && evalData && (
          <div className="question-stage">
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '-1rem' }}>Question</p>
            <p style={{ fontFamily: '"DM Serif Display", serif', fontSize: '1.2rem', marginBottom: '1rem' }}>
              {questionData?.question}
            </p>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '-0.5rem' }}>Your Answer</p>
            <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', background: 'var(--bg-surface-glass)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              "{transcript}"
            </p>

            <div className="eval-card">
              <div className={`eval-header ${evalData.rating}`}>
                {evalData.rating === 'correct' && <CheckCircle size={28} color="var(--emerald)" />}
                {evalData.rating === 'partially_correct' && <AlertCircle size={28} color="var(--gold)" />}
                {evalData.rating === 'incorrect' && <XCircle size={28} color="var(--rose)" />}
                <div>
                  <div className="eval-rating">
                    {evalData.rating === 'correct' ? 'Great Job!' : evalData.rating === 'partially_correct' ? 'Almost There' : 'Keep Practicing'}
                  </div>
                </div>
              </div>
              <div className="eval-body">
                <p style={{ marginBottom: evalData.audio_base64 ? '1.5rem' : '0' }}>{evalData.feedback}</p>
                {evalData.audio_base64 && (
                  <audio controls src={`data:audio/wav;base64,${evalData.audio_base64}`} autoPlay />
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setStage('empty')}>Try Another Concept</button>
              <button className="btn" style={{ width: 'auto' }} onClick={() => startQuizForConcept(selectedConcept)}>Retry Question</button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
