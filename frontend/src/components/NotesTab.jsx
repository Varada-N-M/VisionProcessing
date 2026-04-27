import React, { useState, useRef } from 'react';
import { Upload, Mic, Play, Loader2 } from 'lucide-react';

const API = 'http://localhost:3000/api';
const LANG_LABELS = {
  'en-US': '🇺🇸 English (US)',
  'en-IN': '🇮🇳 English (IN)',
  'hi-IN': '🇮🇳 Hindi',
  'ta-IN': '🇮🇳 Tamil',
  'te-IN': '🇮🇳 Telugu',
  'mr-IN': '🇮🇳 Marathi',
};

export default function NotesTab({ onConceptsLoaded }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [concepts, setConcepts] = useState([]);
  const [dimensions, setDimensions] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [notesLang, setNotesLang] = useState('en-US');
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioData, setAudioData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);

  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        setIsProcessing(true);
        const base64 = ev.target.result.split(',')[1];
        
        const res = await fetch(`${API}/upload_notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: base64 })
        });
        
        const data = await res.json();
        if (data.success) {
          setImageSrc(`data:image/png;base64,${data.highlighted_image}`);
          setConcepts(data.concepts || []);
          setDimensions(data.image_dimensions);
          onConceptsLoaded(data.concepts || []);
        } else {
          alert('Error: ' + data.error);
        }
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConceptSelect = async (concept) => {
    setSelectedConcept(concept);
    setIsGeneratingAudio(true);
    setAudioData(null);
    
    try {
      const res = await fetch(`${API}/generate_speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept_name: concept.name,
          concept_description: concept.summary || concept.category,
          language: notesLang,
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setAudioData(data);
        setSummaryData({
          title: concept.name,
          category: concept.category || 'General',
          body: data.explanation_text || concept.summary,
          lang: data.language || notesLang
        });
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <div className="split-layout panel">
      <aside className="card">
        <div>
          <span className="section-label">Step 1 — Upload</span>
          <div 
            className="file-upload" 
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handleFileUpload}
            />
            {isProcessing ? (
              <Loader2 className="spinner" style={{ margin: '0 auto' }} />
            ) : (
              <>
                <Upload size={32} style={{ margin: '0 auto 1rem', color: 'var(--accent-primary)' }} />
                <p>Click to upload notes image</p>
              </>
            )}
          </div>
        </div>

        <div>
          <span className="section-label">Step 2 — Explain</span>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
            Click a concept in the image to hear its explanation.
          </p>

          <span className="section-label">Language</span>
          <div className="pill-group" style={{ marginBottom: '1.5rem' }}>
            {Object.keys(LANG_LABELS).map(lang => (
              <button 
                key={lang}
                className={`pill ${notesLang === lang ? 'active' : ''}`}
                onClick={() => setNotesLang(lang)}
              >
                {LANG_LABELS[lang].split(' ')[0]} {lang.split('-')[0].toUpperCase()}
              </button>
            ))}
          </div>

          {isGeneratingAudio && (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <Loader2 className="spinner" style={{ margin: '0 auto' }} />
              <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--text-tertiary)' }}>Generating audio...</p>
            </div>
          )}

          {audioData && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <span className="section-label">Audio Explanation</span>
              <audio controls src={`data:audio/wav;base64,${audioData.audio_base64}`} autoPlay />
              
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', marginTop: '1.5rem' }}>
                <span className="section-label" style={{ color: 'var(--accent-primary)' }}>Text Summary</span>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>{summaryData.title}</h3>
                <span className="pill" style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem', background: 'var(--accent-glow)' }}>
                  {summaryData.category}
                </span>
                <p style={{ marginTop: '1rem', fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                  {summaryData.body}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="card">
        <span className="section-label">Processed Notes</span>
        {!imageSrc ? (
          <div className="empty-state">
            <Upload size={48} style={{ opacity: 0.2 }} />
            <p>Upload a photo of your notes to get started</p>
          </div>
        ) : (
          <div>
            <div className="image-viewer">
              <img src={imageSrc} alt="Notes" />
              {/* Dynamic Overlay logic can be added here using dimensions & concepts */}
            </div>
            
            <span className="section-label" style={{ marginTop: '2rem' }}>Extracted Concepts</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {concepts.map((c, i) => (
                <div 
                  key={i} 
                  className={`concept-item ${selectedConcept?.id === c.id ? 'active' : ''}`}
                  onClick={() => handleConceptSelect(c)}
                  style={{ borderLeft: `3px solid rgb(${c.color?.r||99}, ${c.color?.g||102}, ${c.color?.b||241})` }}
                >
                  <div className="concept-title">{c.name}</div>
                  <div className="concept-cat">{c.category || 'General'}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
