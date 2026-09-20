import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useData } from '../context/DataContext';

const VoiceAssistant = ({ weather }) => {
  const { tasks, setTasks, schedules, setSchedules, goals, setGoals, stats, setStats, awardPoints, fireConfetti } = useData();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('Say "Wake up Jarvis" or tap the mic.');
  const [status, setStatus] = useState('Idle');
  const [pendingCmd, setPendingCmd] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editPoints, setEditPoints] = useState(10);
  const recognitionRef = useRef(null);
  
  // Conversational state: 'IDLE' -> 'WAIT_FOR_NOTE' -> 'WAIT_FOR_TASK' -> 'WAIT_FOR_UPDATE'
  // Start alert flow: 'WAIT_FOR_START_CONFIRM' -> 'WAIT_FOR_START_CHANGES'
  const [convState, setConvState] = useState('IDLE');
  const [activeAlert, setActiveAlert] = useState(null);

  const [standbyMode, setStandbyMode] = useState(true);
  const standbyRef = useRef(standbyMode);

  // Load voices so they're available for selection
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {};
    }
  }, []);

  useEffect(() => {
    standbyRef.current = standbyMode;
  }, [standbyMode]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setStatus('Not supported'); setTranscript("Voice not supported. Try Chrome or Edge."); return; }
    const recognition = new SR();
    recognition.continuous = false; recognition.interimResults = true; recognition.lang = navigator.language || 'en-US';
    recognition.onstart = () => { 
      setListening(true); 
      setStatus(convState === 'IDLE' ? 'Standby (Listening for "Jarvis"…)' : 'Listening…'); 
    };
    recognition.onerror = (e) => { 
      setStatus('Error: ' + e.error); 
      setListening(false); 
      if (e.error === 'no-speech' && standbyRef.current && !window.speechSynthesis.speaking) {
         try { recognition.start(); } catch(err){}
      }
    };
    recognition.onend = () => { 
      setListening(false); 
      setStatus('Idle'); 
      if (standbyRef.current && !window.speechSynthesis.speaking) {
         setTimeout(() => { try { recognition.start(); } catch(err){} }, 300);
      }
    };
    recognition.onresult = (e) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setTranscript(final || interim || '…');
      if (final.trim()) handleVoiceFinal(final.trim());
    };
    recognitionRef.current = recognition;
  }, [convState, tasks, schedules, weather, activeAlert]);

  // Check schedules every 15s to see if a task is starting
  useEffect(() => {
    const checkAlerts = () => {
      // Don't interrupt if we are already in a conversation
      if (convState !== 'IDLE' && convState !== 'WAIT_FOR_START_CONFIRM' && convState !== 'WAIT_FOR_START_CHANGES') return;
      const now = new Date();
      const hhmm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      
      for (const item of schedules) {
        if (item.status === 'pending' && !item.alerted && item.time <= hhmm) {
          setActiveAlert(item);
          setConvState('WAIT_FOR_START_CONFIRM');
          speak(`Your task, ${item.title}, is about to start. Should I confirm this task and count it in your list?`);
          
          // Mark as alerted so we don't trigger again continuously
          axios.put(`/api/schedules/${item._id}`, { ...item, alerted: true }).then(res => {
            setSchedules(prev => prev.map(s => s._id === item._id ? res.data : s));
          });
          return;
        }
      }
    };

    const interval = setInterval(checkAlerts, 15000);
    return () => clearInterval(interval);
  }, [schedules, convState]);

  const toggleListen = () => {
    if (!recognitionRef.current) return;
    if (listening && standbyMode) {
       setStandbyMode(false);
       recognitionRef.current.stop();
       setTranscript('Voice Assistant Paused.');
       return;
    }
    if (!standbyMode) setStandbyMode(true);
    setPendingCmd(null);
    try { recognitionRef.current.start(); } catch (e) { }
  };

  const speak = (text, onEndCallback = null) => {
    if (!('speechSynthesis' in window)) return;
    try { 
      // Stop listening to prevent self-triggering
      if (recognitionRef.current) recognitionRef.current.stop();

      window.speechSynthesis.cancel(); 
      const u = new SpeechSynthesisUtterance(text); 
      
      const lang = navigator.language || 'en-US';
      u.lang = lang;
      
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const regionalVoice = voices.find(v => v.lang === lang || v.lang.startsWith(lang.split('-')[0]));
        if (regionalVoice) u.voice = regionalVoice;
      }

      u.onend = () => {
         if (onEndCallback) onEndCallback();
         // Resume standby after speaking
         if (standbyRef.current) {
            setTimeout(() => { try { recognitionRef.current.start(); } catch(e){} }, 500);
         }
      };

      window.speechSynthesis.speak(u); 
    } catch (e) { }
  };

  // --- Full NLP Parser (ported from original) ---
  const capitalizeFirst = (s) => { if (!s) return s; return s.charAt(0).toUpperCase() + s.slice(1); };

  const to24Hour = (h, m, ap) => {
    h = parseInt(h, 10); m = parseInt(m, 10) || 0;
    if (ap) {
      ap = ap.toLowerCase().replace(/\./g, '');
      if (ap === 'pm' && h < 12) h += 12;
      if (ap === 'am' && h === 12) h = 0;
    }
    if (h > 23) h = 23; if (h < 0) h = 0;
    if (m > 59) m = 59;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  };

  const extractTime = (text) => {
    const lower = text.toLowerCase();
    let m = lower.match(/\b(?:at\s+)?noon\b/);
    if (m) return { time24: '12:00', matched: m[0] };
    m = lower.match(/\b(?:at\s+)?midnight\b/);
    if (m) return { time24: '00:00', matched: m[0] };
    const patterns = [
      /\b(?:at|by|around)\s+(?<h>\d{1,2})(?::(?<m>\d{2}))?\s*(?<ap>a\.?m\.?|p\.?m\.?)?\b/i,
      /\b(?<h>\d{1,2}):(?<m>\d{2})\s*(?<ap>a\.?m\.?|p\.?m\.?)?\b/i,
      /\b(?<h>\d{1,2})\s*(?<ap>a\.?m\.?|p\.?m\.?)\b/i,
      /\b(?<h>\d{1,2})\s*o'?clock\b/i
    ];
    for (const re of patterns) {
      const mm = lower.match(re);
      if (mm && mm.groups && mm.groups.h) {
        return { time24: to24Hour(mm.groups.h, mm.groups.m || '0', mm.groups.ap), matched: mm[0] };
      }
    }
    return null;
  };

  const cleanTitle = (text) => {
    return text
      .replace(/^(please\s+)?(can you\s+|could you\s+)?(add|create|set up|set|schedule|remind me to|remind me|book|update)\b\s*/i, '')
      .replace(/^(a|an|the)\s+/i, '')
      .replace(/^(task|reminder|block|event|goal)\b\s*(to\s+)?/i, '')
      .replace(/^to\s+/i, '')
      .replace(/\s+please\s*$/i, '')
      .replace(/\s+/g, ' ').trim();
  };

  const extractPoints = (lower) => {
    if (/\b(hard|difficult|big|major|important)\b/.test(lower)) return 20;
    if (/\b(easy|quick|small|simple)\b/.test(lower)) return 5;
    return 10;
  };

  const parseVoiceCommand = (raw) => {
    const text = raw.trim();
    const lower = text.toLowerCase();

    if (/\breward\b/.test(lower)) {
      let m = lower.match(/\breward\s+(.+?)\s+(?:for|at|worth)\s+(\d+)\s*points?\b/);
      if (m) return { type: 'reward', name: capitalizeFirst(m[1].trim()), points: parseInt(m[2]) };
    }

    let m = lower.match(/^(?:mark|complete|finish|check off|tick off|update)\s+(.+?)(?:\s+as\s+done)?$/);
    if (m && m[1].trim() && !lower.includes('to')) return { type: 'complete', query: m[1].trim() };

    m = lower.match(/^(?:delete|remove|cancel)\s+(?:the\s+)?(?:task|schedule item|schedule|item)?\s*(.+)$/);
    if (m && m[1].trim()) return { type: 'delete', query: m[1].trim() };

    m = lower.match(/^(?:add\s+(?:a\s+)?subtask|add\s+step)\s+(.+?)\s+to\s+(.+)$/i);
    if (m) return { type: 'add_subtask', subtask: capitalizeFirst(m[1].trim()), target: m[2].trim() };

    m = lower.match(/^(?:change time of|reschedule|delay|move)\s+(.+?)\s+(?:to|for|at)\s+(.+)$/i);
    if (m) {
      const timeInfo = extractTime(m[2]);
      if (timeInfo) return { type: 'change_time', target: m[1].trim(), time: timeInfo.time24 };
    }

    m = lower.match(/^(?:change|rename|update)\s+(?:the\s+)?(?:task|schedule|item)?\s*(.+?)\s+to\s+(.+)$/i);
    if (m && !m[0].includes('as done')) return { type: 'rename', target: m[1].trim(), newTitle: capitalizeFirst(m[2].trim()) };

    if (/\bgoal\b/.test(lower)) {
      const title = cleanTitle(text.replace(/\blong[\s-]?term\s+goal\b|\bgoal\b/i, ''));
      return { type: 'goal', title: capitalizeFirst(title) || text };
    }

    if (/\b(long[\s-]?term\s+schedule|study plan)\b/.test(lower)) {
      const title = cleanTitle(text.replace(/\b(long[\s-]?term\s+schedule|study plan)\b/i, ''));
      return { type: 'longschedule', title: capitalizeFirst(title) || text };
    }

    const timeInfo = extractTime(text);
    if (timeInfo) {
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const cleaned = text.replace(new RegExp(escapeRegex(timeInfo.matched), 'i'), ' ').replace(/\s+/g, ' ').trim();
      const title = cleanTitle(cleaned);
      return { type: 'schedule', title: capitalizeFirst(title) || 'Untitled block', time: timeInfo.time24, points: extractPoints(lower) };
    }

    if (/^schedule\b/.test(lower)) {
      const title = cleanTitle(text.replace(/^schedule\b/i, ''));
      return { type: 'schedule', title: capitalizeFirst(title) || 'Untitled block', time: '09:00', points: extractPoints(lower) };
    }

    return { type: 'task', title: capitalizeFirst(cleanTitle(text)) || text, points: extractPoints(lower) };
  };

  const summarizeTasksAndAsk = () => {
    let summary = '';
    const pendingTasks = tasks.filter(t => !t.completed);
    const pendingScheds = schedules.filter(s => s.status === 'pending');
    
    if (pendingTasks.length > 0 || pendingScheds.length > 0) {
      summary += `You have ${pendingTasks.length} pending general tasks. `;
      if (pendingScheds.length > 0) {
        summary += `On your schedule: `;
        pendingScheds.forEach(s => {
          summary += `${s.title} at ${s.time}. `;
        });
      }
      summary += "Would you like to update or complete any of these tasks?";
      setConvState('WAIT_FOR_UPDATE');
      speak(summary, () => {
        setTimeout(toggleListen, 500); 
      });
    } else {
      summary += "You have no tasks or schedules for today. Enjoy your free time!";
      speak(summary);
      setConvState('IDLE');
    }
  };

  const handleVoiceFinal = async (text) => {
    const lower = text.toLowerCase();

    // Alert Flow: Wait for start confirm
    if (convState === 'WAIT_FOR_START_CONFIRM') {
      if (/\b(?:yes|yeah|sure|yep|confirm|continue|ok|okay)\b/i.test(lower)) {
        speak(`Okay, proceeding with ${activeAlert.title}. You've got this!`);
        setConvState('IDLE');
        setActiveAlert(null);
      } else if (/\b(?:no|nope|nah|cancel|wait)\b/i.test(lower)) {
        speak(`Got it. What changes would you like to make to the task list or subtasks?`, () => {
          setConvState('WAIT_FOR_START_CHANGES');
          setTimeout(toggleListen, 500);
        });
      } else {
        speak(`I didn't catch that. Should I confirm ${activeAlert.title}?`, () => setTimeout(toggleListen, 500));
      }
      return;
    }

    // Alert Flow: Wait for start changes
    if (convState === 'WAIT_FOR_START_CHANGES') {
      if (lower.includes('subtask') || lower.includes('step')) {
        const subtaskText = cleanTitle(text.replace(/add\s+(a\s+)?subtask\s+(to\s+)?/i, ''));
        const updatedTasks = [...(activeAlert.tasks || []), { text: subtaskText, done: false }];
        await axios.put(`/api/schedules/${activeAlert._id}`, { ...activeAlert, tasks: updatedTasks });
        setSchedules(prev => prev.map(s => s._id === activeAlert._id ? { ...s, tasks: updatedTasks } : s));
        speak(`I added the subtask: ${subtaskText}.`);
      } 
      else if (lower.includes('delay') || lower.includes('change time') || lower.includes('postpone')) {
        const timeInfo = extractTime(text);
        if (timeInfo) {
          // Reset alerted so it triggers again at the new time
          await axios.put(`/api/schedules/${activeAlert._id}`, { ...activeAlert, time: timeInfo.time24, alerted: false }); 
          setSchedules(prev => prev.map(s => s._id === activeAlert._id ? { ...s, time: timeInfo.time24, alerted: false } : s));
          speak(`Changed the time to ${timeInfo.time24}.`);
        } else {
          speak(`I have made a note to update the time. Please adjust the exact time manually.`);
        }
      }
      else if (lower.includes('delete') || lower.includes('cancel') || lower.includes('remove')) {
        await axios.delete(`/api/schedules/${activeAlert._id}`);
        setSchedules(prev => prev.filter(s => s._id !== activeAlert._id));
        speak(`Task deleted from your schedule.`);
      }
      else {
         const updated = { ...activeAlert, customFields: [...(activeAlert.customFields || []), { label: 'Note', value: text }] };
         await axios.put(`/api/schedules/${activeAlert._id}`, updated);
         setSchedules(prev => prev.map(s => s._id === activeAlert._id ? updated : s));
         speak(`I have updated the task with your changes.`);
      }

      setConvState('IDLE');
      setActiveAlert(null);
      return;
    }

    // Standby Mode: Ignore everything unless it contains "jarvis"
    if (convState === 'IDLE') {
      if (lower.includes('jarvis')) {
        const withoutJarvis = lower.replace(/wake up[, ]*jarvis|jarvis/g, '').trim();
        
        if (withoutJarvis.length === 0 || withoutJarvis === 'wake up') {
          // Wake word only
          const weatherText = weather ? `The weather outside is ${weather.label} and ${weather.temp} degrees.` : '';
          const greeting = `Hello. ${weatherText} How is your day going?`;
          setConvState('WAIT_FOR_NOTE');
          speak(greeting);
          return;
        } else {
          // Direct command (e.g., "Jarvis, add task buy milk")
          const cmd = parseVoiceCommand(text.replace(/jarvis/i, '').trim());
          setPendingCmd(cmd);
          setEditTitle(cmd.title || cmd.name || cmd.query || cmd.subtask || cmd.target || '');
          setEditTime(cmd.time || '');
          setEditPoints(cmd.points || 10);
          speak(voiceConfirmPhrase(cmd));
          return;
        }
      } else {
        // Ignore background noise in standby
        setTimeout(() => setTranscript('Listening for "Jarvis"…'), 2000);
        return;
      }
    }

    if (convState === 'WAIT_FOR_NOTE') {
      const hasTasks = tasks.length > 0 || schedules.length > 0;
      if (!hasTasks) {
        setConvState('WAIT_FOR_TASK');
        speak("I have taken a note of that. You haven't added any tasks yet. What task would you like to add for today?", () => {
          setTimeout(toggleListen, 500); 
        });
      } else {
        speak("I have taken a note of that. Here is a summary of your tasks. ", () => {
          summarizeTasksAndAsk();
        });
      }
      return;
    }

    if (convState === 'WAIT_FOR_TASK') {
      setConvState('IDLE');
      if (/\b(?:no|nope|nothing|nah|i'm good|none)\b/i.test(lower)) {
        speak("Okay, let me know if you need anything.");
        return;
      }
    }

    if (convState === 'WAIT_FOR_UPDATE') {
      setConvState('IDLE');
      if (/\b(?:no|nope|nothing|nah|i'm good|none)\b/i.test(lower)) {
        speak("Alright, have a productive day!");
        return;
      }
    }

    const cmd = parseVoiceCommand(text);
    setPendingCmd(cmd);
    setEditTitle(cmd.title || cmd.name || cmd.query || '');
    setEditTime(cmd.time || '');
    setEditPoints(cmd.points || 10);
    speak(voiceConfirmPhrase(cmd));
  };

  const handleAlertYes = () => {
    speak(`Okay, proceeding with ${activeAlert.title}.`);
    setConvState('IDLE');
    setActiveAlert(null);
  };

  const handleAlertNo = () => {
    speak(`Got it. What changes would you like to make to the task list or subtasks?`, () => {
      setConvState('WAIT_FOR_START_CHANGES');
      setTimeout(toggleListen, 500);
    });
  };

  const voiceConfirmPhrase = (cmd) => {
    switch (cmd.type) {
      case 'task': return `Add task: ${cmd.title}?`;
      case 'schedule': return `Schedule ${cmd.title} at ${cmd.time}?`;
      case 'goal': return `Add long-term goal: ${cmd.title}?`;
      case 'longschedule': return `Add long-term schedule: ${cmd.title}?`;
      case 'reward': return `Add reward ${cmd.name} for ${cmd.points} points?`;
      case 'complete': return `Mark ${cmd.query} as done?`;
      case 'delete': return `Delete ${cmd.query}?`;
      case 'add_subtask': return `Add subtask "${cmd.subtask}" to ${cmd.target}?`;
      case 'change_time': return `Change time of ${cmd.target} to ${cmd.time}?`;
      case 'rename': return `Change ${cmd.target} to ${cmd.newTitle}?`;
      default: return 'Got it.';
    }
  };

  const confirmCommand = async () => {
    if (!pendingCmd) return;
    try {
      const cmd = pendingCmd;
      if (cmd.type === 'task') {
        const res = await axios.post('/api/tasks', { text: editTitle, points: editPoints });
        setTasks(prev => [res.data, ...prev]);
        if (convState === 'WAIT_FOR_TASK') {
          setTimeout(summarizeTasksAndAsk, 1500);
        }
      } else if (cmd.type === 'schedule') {
        const res = await axios.post('/api/schedules', { title: editTitle, time: editTime, points: editPoints });
        setSchedules(prev => [...prev, res.data].sort((a, b) => a.time.localeCompare(b.time)));
      } else if (cmd.type === 'goal') {
        const res = await axios.post('/api/goals', { title: editTitle });
        setGoals(prev => [...prev, res.data]);
      } else if (cmd.type === 'longschedule') {
        await axios.post('/api/longschedules', { title: editTitle });
      } else if (cmd.type === 'reward') {
        const updated = { rewards: [...(stats?.rewards || []), { name: editTitle, threshold: editPoints }].sort((a, b) => a.threshold - b.threshold) };
        const res = await axios.put('/api/stats', updated);
        setStats(res.data);
      } else if (cmd.type === 'complete') {
        const q = cmd.query.toLowerCase();
        
        // Try tasks first
        const task = tasks.find(t => t.text.toLowerCase().includes(q) && !t.completed);
        if (task) {
          await axios.put(`/api/tasks/${task._id}`, { ...task, completed: true });
          setTasks(prev => prev.map(t => t._id === task._id ? { ...t, completed: true } : t));
          awardPoints(task.points); fireConfetti();
          speak('Marked ' + task.text + ' as done.');
        } else {
          // Try schedules
          const sched = schedules.find(s => s.title.toLowerCase().includes(q) && s.status === 'pending');
          if (sched) {
            await axios.put(`/api/schedules/${sched._id}`, { ...sched, status: 'done', alerted: true });
            setSchedules(prev => prev.map(s => s._id === sched._id ? { ...s, status: 'done', alerted: true } : s));
            awardPoints(sched.points); fireConfetti();
            speak('Marked ' + sched.title + ' as done.');
          } else {
            speak("I couldn't find a matching pending item to update.");
          }
        }
      } else if (cmd.type === 'delete') {
        const q = cmd.query.toLowerCase();
        const task = tasks.find(t => t.text.toLowerCase().includes(q));
        if (task) {
          await axios.delete(`/api/tasks/${task._id}`);
          setTasks(prev => prev.filter(t => t._id !== task._id));
          speak('Deleted ' + task.text);
        } else {
           const sched = schedules.find(s => s.title.toLowerCase().includes(q));
           if (sched) {
             await axios.delete(`/api/schedules/${sched._id}`);
             setSchedules(prev => prev.filter(s => s._id !== sched._id));
             speak('Deleted ' + sched.title);
           } else { speak("I couldn't find a matching item to delete."); }
        }
      } else if (cmd.type === 'add_subtask') {
        const q = cmd.target.toLowerCase();
        let found = false;
        const sched = schedules.find(s => s.title.toLowerCase().includes(q));
        if (sched) {
          const updatedTasks = [...(sched.tasks || []), { text: cmd.subtask, done: false }];
          await axios.put(`/api/schedules/${sched._id}`, { ...sched, tasks: updatedTasks });
          setSchedules(prev => prev.map(s => s._id === sched._id ? { ...s, tasks: updatedTasks } : s));
          found = true;
        } else {
          const goal = goals.find(g => g.title.toLowerCase().includes(q));
          if (goal) {
            const updatedTasks = [...(goal.tasks || []), { text: cmd.subtask, done: false }];
            await axios.put(`/api/goals/${goal._id}`, { ...goal, tasks: updatedTasks });
            setGoals(prev => prev.map(g => g._id === goal._id ? { ...g, tasks: updatedTasks } : g));
            found = true;
          }
        }
        if (found) speak('Subtask added.');
        else speak("I couldn't find a matching task to add a subtask to.");
      } else if (cmd.type === 'change_time') {
        const q = cmd.target.toLowerCase();
        const sched = schedules.find(s => s.title.toLowerCase().includes(q));
        if (sched) {
          await axios.put(`/api/schedules/${sched._id}`, { ...sched, time: cmd.time });
          setSchedules(prev => prev.map(s => s._id === sched._id ? { ...s, time: cmd.time } : s));
          speak('Time updated.');
        } else { speak("I couldn't find a matching schedule block to change the time."); }
      } else if (cmd.type === 'rename') {
        const q = cmd.target.toLowerCase();
        const task = tasks.find(t => t.text.toLowerCase().includes(q));
        if (task) {
           await axios.put(`/api/tasks/${task._id}`, { ...task, text: cmd.newTitle });
           setTasks(prev => prev.map(t => t._id === task._id ? { ...t, text: cmd.newTitle } : t));
           speak('Task renamed.');
        } else {
           const sched = schedules.find(s => s.title.toLowerCase().includes(q));
           if (sched) {
             await axios.put(`/api/schedules/${sched._id}`, { ...sched, title: cmd.newTitle });
             setSchedules(prev => prev.map(s => s._id === sched._id ? { ...s, title: cmd.newTitle } : s));
             speak('Schedule renamed.');
           } else { speak("I couldn't find a matching item to rename."); }
        }
      }
    } catch (err) { console.error(err); }
    setPendingCmd(null);
  };

  const typeLabel = pendingCmd ? {
    task: 'General task', schedule: 'Schedule block', goal: 'Long-term goal',
    longschedule: 'Long-term schedule', reward: 'Reward', complete: 'Mark as done', delete: 'Delete item'
  }[pendingCmd.type] || 'Task' : '';

  return (
    <div className="card">
      <div className="sec-header">
        <h2 className="section-title">Voice Assistant</h2>
        <span className="voice-status">{status}</span>
      </div>
      <div className="voice-row">
        <button className={`mic-btn ${standbyMode ? 'listening' : ''}`} onClick={toggleListen} disabled={status === 'Not supported'} title="Tap to pause/resume Standby">🎤</button>
        <div className="voice-transcript">{transcript}</div>
      </div>

      {activeAlert && (
        <div className="voice-confirm" style={{ display: 'block', borderColor: 'var(--gold)' }}>
          <div className="voice-confirm-type" style={{ color: 'var(--gold)' }}>Task Starting</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)' }}>{activeAlert.title}</div>
          <div className="hint" style={{ marginTop: '8px' }}>Jarvis is confirming if you want to proceed with this task.</div>
          <div className="row2" style={{ marginTop: '10px' }}>
            <button className="add-btn" onClick={handleAlertYes}>✓ Yes, Proceed</button>
            <button className="add-btn secondary" style={{ background: 'var(--danger)' }} onClick={handleAlertNo}>✕ No, Change it</button>
          </div>
        </div>
      )}

      {pendingCmd && !activeAlert && (
        <div className="voice-confirm" style={{ display: 'block' }}>
          <div className="voice-confirm-type">{typeLabel}</div>
          {(pendingCmd.type === 'complete' || pendingCmd.type === 'delete' || pendingCmd.type === 'add_subtask' || pendingCmd.type === 'change_time' || pendingCmd.type === 'rename') ? (
            <div className="hint">Looking for an item matching "<b>{pendingCmd.query || pendingCmd.target}</b>".</div>
          ) : (
            <>
              <div className="row1"><input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title" /></div>
              {pendingCmd.type === 'schedule' && (
                <div className="row2" style={{ marginTop: '8px' }}>
                  <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)} />
                  <select value={editPoints} onChange={e => setEditPoints(Number(e.target.value))}>
                    <option value={5}>Easy · 5 pts</option>
                    <option value={10}>Medium · 10 pts</option>
                    <option value={20}>Hard · 20 pts</option>
                  </select>
                </div>
              )}
              {pendingCmd.type === 'task' && (
                <div className="row2" style={{ marginTop: '8px' }}>
                  <select value={editPoints} onChange={e => setEditPoints(Number(e.target.value))}>
                    <option value={5}>Easy · 5 pts</option>
                    <option value={10}>Medium · 10 pts</option>
                    <option value={20}>Hard · 20 pts</option>
                  </select>
                </div>
              )}
              {pendingCmd.type === 'reward' && (
                <div className="row2" style={{ marginTop: '8px' }}>
                  <input type="number" value={editPoints} onChange={e => setEditPoints(Number(e.target.value))} min="1" placeholder="Points needed" />
                </div>
              )}
            </>
          )}
          <div className="row2" style={{ marginTop: '10px' }}>
            <button className="add-btn" onClick={confirmCommand}>{pendingCmd.type === 'delete' ? '✓ Delete' : '✓ Confirm'}</button>
            <button className="add-btn secondary" style={{ background: 'var(--danger)' }} onClick={() => setPendingCmd(null)}>✕ Cancel</button>
          </div>
        </div>
      )}

      <div className="voice-examples">
        Try: "Wake up Jarvis", "add task buy groceries", "update team meeting", "mark buy groceries as done".
      </div>
    </div>
  );
};

export default VoiceAssistant;
