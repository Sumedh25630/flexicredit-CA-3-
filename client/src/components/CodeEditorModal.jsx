import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';

const CodeEditorModal = ({ show, onClose }) => {
  const [code, setCode] = useState('# Your code here');
  const [language, setLanguage] = useState('python');
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setStatus('Not supported');
      return;
    }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';

    recognition.onstart = () => {
      setListening(true);
      setStatus('Listening... Speak your prompt.');
    };

    recognition.onerror = (e) => {
      setStatus('Error: ' + e.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onresult = (e) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      const t = final || interim;
      setTranscript(t);
      if (final.trim()) {
        setStatus('Processing voice command...');
        generateCode(final.trim());
      }
    };
    recognitionRef.current = recognition;
  }, []);

  const toggleListen = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
    } else {
      try { recognitionRef.current.start(); } catch (e) {}
    }
  };

  const generateCode = async (prompt) => {
    try {
      setStatus('Generating code via Gemini...');
      const res = await axios.post('/api/code/generate', { prompt });
      // Append the code
      setCode(prev => prev + '\n\n# Generated based on: "' + prompt + '"\n' + res.data.code);
      if (res.data.language) setLanguage(res.data.language.toLowerCase());
      setStatus('Idle');
      setTranscript('');
    } catch (err) {
      console.error(err);
      setStatus('Error generating code.');
    }
  };

  if (!show) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '100vw', maxWidth: '100vw', height: '100vh', margin: 0, borderRadius: 0, display: 'flex', flexDirection: 'column', zIndex: 1001 }}>
        <div className="sec-header">
          <h2 className="section-title">AI Code Editor</h2>
          <button className="del-btn" onClick={onClose} style={{ fontSize: '24px' }}>×</button>
        </div>
        
        <div className="voice-row" style={{ marginBottom: '15px' }}>
          <button 
            className={`mic-btn ${listening ? 'listening' : ''}`} 
            onClick={toggleListen} 
            disabled={status === 'Not supported'}
            title="Tap to speak your prompt"
          >
            🎤
          </button>
          <div style={{ flex: 1, marginLeft: '15px' }}>
            <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{status}</div>
            <div className="voice-transcript" style={{ minHeight: '24px', fontStyle: 'italic', color: 'var(--slate)' }}>{transcript || 'Tap the mic and describe the code you want to generate.'}</div>
          </div>
        </div>

        <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val)}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              padding: { top: 16 }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CodeEditorModal;
