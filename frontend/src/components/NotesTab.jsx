import React, { useState, useRef } from 'react';
import { Upload, Mic, Play, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../config';
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
        
        const res = await fetch(`${API_BASE_URL}/upload_notes`, {
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
      const res = await fetch(`${API_BASE_URL}/generate_speech`, {
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
    <div className="split-layout panel" style={{ gridTemplateColumns: '400px 1fr' }}>
      <aside className="card" style={{ gap: '2rem' }}>
        <div>
          <span className="section-label">Configuration</span>
          <div style={{ background: 'var(--bg-base)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
             <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: '500' }}>Extraction Language</p>
             <div className="pill-group">
              {Object.keys(LANG_LABELS).map(lang => (
                <button 
                  key={lang}
                  className={`pill ${notesLang === lang ? 'active' : ''}`}
                  onClick={() => setNotesLang(lang)}
                  style={{ flex: '1 1 40%', textAlign: 'center' }}
                >
                  {lang.split('-')[0].toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <span className="section-label">Image Upload</span>
          <div 
            className={`file-upload ${isProcessing ? 'shimmer' : ''}`} 
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            style={{ padding: '3rem 2rem' }}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handleFileUpload}
            />
            {isProcessing ? (
              <div style={{ textAlign: 'center' }}>
                <Loader2 className="spinner" style={{ margin: '0 auto 1rem' }} />
                <p style={{ fontWeight: '500' }}>Processing your notes...</p>
              </div>
            ) : (
              <>
                <Upload size={32} style={{ margin: '0 auto 1.25rem', color: 'var(--accent-primary)' }} />
                <p style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Click to upload image</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>PNG, JPG up to 10MB</p>
              </>
            )}
          </div>
        </div>

        {audioData && (
          <div style={{ animation: 'fadeIn 0.3s ease-out', background: 'rgba(79, 70, 229, 0.03)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(79, 70, 229, 0.1)' }}>
            <span className="section-label" style={{ color: 'var(--accent-primary)' }}>Audio Guide</span>
            <div style={{ marginBottom: '1.5rem' }}>
              <audio controls src={`data:audio/wav;base64,${audioData.audio_base64}`} autoPlay style={{ height: '40px' }} />
            </div>
            
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontFamily: 'Instrument Serif' }}>{summaryData.title}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <CheckCircle2 size={14} style={{ color: 'var(--emerald)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
                {summaryData.category}
              </span>
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              {summaryData.body}
            </p>
          </div>
        )}
        
        {isGeneratingAudio && !audioData && (
          <div className="shimmer" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
            <Loader2 className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>Synthesizing audio summary...</p>
          </div>
        )}
      </aside>

      <main className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="section-label" style={{ margin: '0' }}>Processed Document</span>
          {concepts.length > 0 && (
            <span style={{ fontSize: '0.8rem', color: 'var(--emerald)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} /> {concepts.length} Concepts Found
            </span>
          )}
        </div>
        
        <div style={{ padding: '2rem' }}>
          {!imageSrc ? (
            <div className="empty-state" style={{ minHeight: '500px' }}>
              <FileText size={64} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
              <p style={{ fontSize: '1.1rem', color: 'var(--text-tertiary)' }}>No document processed yet.</p>
            </div>
          ) : (
            <div>
              <div className="image-viewer" style={{ border: 'none', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <img src={imageSrc} alt="Notes" style={{ borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)' }} />
              </div>
              
              <div style={{ marginTop: '3rem' }}>
                <span className="section-label">Interactive Concepts</span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>Select a concept card below to generate an AI explanation.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  {concepts.map((c, i) => (
                    <div 
                      key={i} 
                      className={`concept-item ${selectedConcept?.id === c.id ? 'active' : ''}`}
                      onClick={() => handleConceptSelect(c)}
                      style={{ 
                        padding: '1.25rem',
                        borderLeft: `4px solid rgb(${c.color?.r||99}, ${c.color?.g||102}, ${c.color?.b||241})`,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}
                    >
                      <div className="concept-title" style={{ fontSize: '1rem', fontWeight: '600' }}>{c.name}</div>
                      <div className="concept-cat" style={{ fontSize: '0.8rem', opacity: 0.8 }}>{c.category || 'General'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
