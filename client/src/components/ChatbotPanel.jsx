import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const ChatbotPanel = () => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! I\'m your Nightlist assistant. Ask me anything about staying productive!' }
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: 'user', text: input.trim() };
    const updatedMessages = [...messages, userMsg];
    
    setMessages(updatedMessages);
    setInput('');

    try {
      const res = await axios.post('/api/chat', { messages: updatedMessages });
      setMessages(prev => [...prev, { sender: 'bot', text: res.data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I am having trouble connecting right now.' }]);
    }
  };

  return (
    <div className="card">
      <div className="sec-header">
        <h2 className="section-title">AI Chatbot</h2>
      </div>
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg ${msg.sender}`}>{msg.text}</div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="row1" style={{ marginBottom: 0 }}>
        <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask me anything..." />
        <button className="add-btn secondary" onClick={handleSend} style={{ marginLeft: 0 }}>Send</button>
      </div>
    </div>
  );
};

export default ChatbotPanel;
