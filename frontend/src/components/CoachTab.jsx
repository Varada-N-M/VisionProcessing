import { useMemo, useState } from 'react';
import { Loader2, MessageCircleHeart, Send } from 'lucide-react';
import { API_BASE_URL } from '../config';

const INTENTS = [
  { value: 'general', label: 'General' },
  { value: 'exam_stress', label: 'Exam Stress' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'emotional_support', label: 'Emotional Support' },
  { value: 'thought_challenge', label: 'Thought Challenge' },
  { value: 'coping_strategy', label: 'Coping Strategy' },
];

const EMOTIONS = ['unspecified', 'anxious', 'stressed', 'worried', 'sad', 'frustrated', 'overwhelmed'];

const GREETING =
  'Hi there, I am glad you are here.\nHow was your day today?\nTell me where you want help, and we will take one small step at a time.';

function inferAgeGroup(ageInput, standardInput) {
  const age = Number.parseInt(ageInput.trim(), 10);
  if (!Number.isNaN(age)) {
    if (age >= 8 && age <= 10) return '8-10';
    if (age >= 11 && age <= 13) return '11-13';
    if (age >= 14 && age <= 15) return '14-15';
  }

  const standard = Number.parseInt(standardInput.trim(), 10);
  if (!Number.isNaN(standard)) {
    if (standard >= 1 && standard <= 5) return '8-10';
    if (standard >= 6 && standard <= 8) return '11-13';
    if (standard >= 9 && standard <= 10) return '14-15';
  }
  return 'unspecified';
}

export default function CoachTab() {
  const [selectedIntent, setSelectedIntent] = useState('general');
  const [selectedEmotion, setSelectedEmotion] = useState('unspecified');
  const [age, setAge] = useState('');
  const [standard, setStandard] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([{ role: 'assistant', content: GREETING }]);

  const ageGroup = useMemo(() => inferAgeGroup(age, standard), [age, standard]);

  const submitMessage = async (event) => {
    event.preventDefault();
    const trimmedInput = userInput.trim();
    if (!trimmedInput || isLoading) return;

    setError('');
    const nextMessages = [...messages, { role: 'user', content: trimmedInput }];
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/coach/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_input: trimmedInput,
          emotion: selectedEmotion,
          intent: selectedIntent,
          age_group: ageGroup,
          conversation_history: nextMessages,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.detail || 'Coach request failed.');
      }
      const reply = (data.response || '').trim();
      if (!reply) {
        throw new Error('Coach returned an empty response.');
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      setUserInput('');
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Something went wrong.';
      setError(message);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="split-layout panel">
      <aside className="card">
        <div>
          <span className="section-label">Profile</span>
          <div className="coach-profile-grid">
            <label className="coach-label">
              Age
              <input
                className="form-input"
                inputMode="numeric"
                pattern="[0-9]*"
                value={age}
                onChange={(event) => setAge(event.target.value.replace(/[^0-9]/g, ''))}
                placeholder="12"
              />
            </label>
            <label className="coach-label">
              Standard
              <input
                className="form-input"
                inputMode="numeric"
                pattern="[0-9]*"
                value={standard}
                onChange={(event) => setStandard(event.target.value.replace(/[^0-9]/g, ''))}
                placeholder="7"
              />
            </label>
          </div>
          <p className="coach-hint">Detected age group: {ageGroup}</p>
        </div>

        <div>
          <span className="section-label">Intent</span>
          <div className="pill-group">
            {INTENTS.map((intentOption) => (
              <button
                key={intentOption.value}
                type="button"
                className={`pill ${selectedIntent === intentOption.value ? 'active' : ''}`}
                onClick={() => setSelectedIntent(intentOption.value)}
              >
                {intentOption.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="section-label">Current Feeling</span>
          <div className="pill-group">
            {EMOTIONS.map((emotionOption) => (
              <button
                key={emotionOption}
                type="button"
                className={`pill ${selectedEmotion === emotionOption ? 'active' : ''}`}
                onClick={() => setSelectedEmotion(emotionOption)}
              >
                {emotionOption === 'unspecified' ? 'Not sure' : emotionOption}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="card">
        <span className="section-label">AI Study Coach</span>
        <div className="coach-chat">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`coach-bubble ${message.role === 'assistant' ? 'coach' : 'user'}`}
            >
              {message.content.split('\n').map((line, lineIndex) => (
                <p key={lineIndex}>{line}</p>
              ))}
            </div>
          ))}
          {isLoading && (
            <div className="coach-bubble coach loading">
              <Loader2 size={18} className="spinner" />
              <span>Thinking...</span>
            </div>
          )}
        </div>

        <form onSubmit={submitMessage} className="coach-form">
          <textarea
            value={userInput}
            onChange={(event) => setUserInput(event.target.value)}
            placeholder="Tell me what feels hard right now..."
            className="coach-textarea"
            required
          />
          <button className="btn btn-primary" type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 size={18} className="spinner" /> : <Send size={18} />}
            Send
          </button>
        </form>
        {error && <p className="coach-error">{error}</p>}
        <p className="coach-safety-note">
          <MessageCircleHeart size={16} />
          If someone is in danger, tell a trusted adult and contact local emergency help.
        </p>
      </main>
    </div>
  );
}
