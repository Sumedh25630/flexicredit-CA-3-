import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useSettings } from '../context/SettingsContext';
import axios from 'axios';
import Sky from '../components/Sky';
import ClockCard from '../components/ClockCard';
import SettingsModal from '../components/SettingsModal';
import SchedulePanel from '../components/SchedulePanel';
import GoalsPanel from '../components/GoalsPanel';
import LongSchedulePanel from '../components/LongSchedulePanel';
import RewardsPanel from '../components/RewardsPanel';
import GraphPanel from '../components/GraphPanel';
import SitesPanel from '../components/SitesPanel';
import GamesPanel from '../components/GamesPanel';
import VoiceAssistant from '../components/VoiceAssistant';
import FamilyPanel from '../components/FamilyPanel';
import ChatbotPanel from '../components/ChatbotPanel';
import CalculatorPanel from '../components/CalculatorPanel';
import WeatherPanel from '../components/WeatherPanel';
import WeatherEffects from '../components/WeatherEffects';
import CodeEditorModal from '../components/CodeEditorModal';

const Dashboard = () => {
  const { logout } = useAuth();
  const { tasks, setTasks, schedules, setSchedules, goals, longSchedules, stats, loading, awardPoints, revokePoints, fireConfetti } = useData();
  const { settings } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);

  // Mode toggle: schedule or task
  const [mode, setMode] = useState('sched');
  const [taskInput, setTaskInput] = useState('');
  const [taskPoints, setTaskPoints] = useState(10);
  const [taskUrl, setTaskUrl] = useState('');
  const [taskTarget, setTaskTarget] = useState(''); // "sched:id", "goal:id", "longsched:id", or ""

  // Schedule form
  const [schedTime, setSchedTime] = useState('');
  const [schedText, setSchedText] = useState('');
  const [schedPts, setSchedPts] = useState(10);
  const [schedUrl, setSchedUrl] = useState('');

  // Weather state for ambient effects
  const [weather, setWeather] = useState(null);

  const normalizeUrl = (u) => {
    if (!u || !u.trim()) return '';
    u = u.trim();
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    return u;
  };

  // --- Add Task (General or as subtask) ---
  const addTask = async () => {
    const text = taskInput.trim();
    if (!text) return;

    if (taskTarget) {
      // Add as subtask to schedule/goal/longsched
      const [kind, id] = taskTarget.split(':');
      if (kind === 'sched') {
        const block = schedules.find(s => s._id === id);
        if (block) {
          const updated = { ...block, tasks: [...(block.tasks || []), { text, done: false }] };
          const res = await axios.put(`/api/schedules/${id}`, updated);
          setSchedules(schedules.map(s => s._id === id ? res.data : s));
        }
      } else if (kind === 'goal') {
        const goal = goals.find(g => g._id === id);
        if (goal) {
          const updated = { ...goal, tasks: [...(goal.tasks || []), { text, done: false }] };
          const res = await axios.put(`/api/goals/${id}`, updated);
          // goals are in DataContext, need to trigger refresh
        }
      } else if (kind === 'longsched') {
        const ls = longSchedules.find(l => l._id === id);
        if (ls) {
          const updated = { ...ls, tasks: [...(ls.tasks || []), { text, done: false }] };
          await axios.put(`/api/longschedules/${id}`, updated);
        }
      }
      setTaskInput('');
      return;
    }

    // General task
    try {
      const res = await axios.post('/api/tasks', { text, points: taskPoints, url: normalizeUrl(taskUrl) });
      setTasks([res.data, ...tasks]);
      setTaskInput(''); setTaskUrl('');
    } catch (err) { console.error(err); }
  };

  // --- Add Schedule Block ---
  const addScheduleBlock = async () => {
    if (!schedTime || !schedText.trim()) return;
    try {
      const res = await axios.post('/api/schedules', {
        time: schedTime, title: schedText.trim(), points: schedPts, url: normalizeUrl(schedUrl)
      });
      setSchedules([...schedules, res.data].sort((a, b) => a.time.localeCompare(b.time)));
      setSchedTime(''); setSchedText(''); setSchedUrl('');
    } catch (err) { console.error(err); }
  };

  // --- Toggle / Delete Task ---
  const toggleTask = async (task) => {
    try {
      const updated = { ...task, completed: !task.completed };
      const res = await axios.put(`/api/tasks/${task._id}`, updated);
      setTasks(tasks.map(t => t._id === task._id ? res.data : t));
      if (updated.completed) { awardPoints(task.points); fireConfetti(); }
      else { revokePoints(task.points); }
    } catch (err) { console.error(err); }
  };

  const deleteTask = async (id) => {
    try { await axios.delete(`/api/tasks/${id}`); setTasks(tasks.filter(t => t._id !== id)); } catch (err) { console.error(err); }
  };

  // --- Export Tasks ---
  const exportTasks = () => {
    if (tasks.length === 0) { alert('No tasks to download.'); return; }
    const today = new Date().toISOString().slice(0, 10);
    const lines = [`Nightlist — Tasks (${today})`, ''];
    tasks.forEach(t => lines.push(`[${t.completed ? 'x' : ' '}] ${t.text}  (${t.points} pts)${t.url ? '  ' + t.url : ''}`));
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `tasks-${today}.txt`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  // --- Build schedule select options ---
  const buildTargetOptions = () => {
    const opts = [<option key="" value="">No time block — general task</option>];
    if (schedules.length > 0) {
      opts.push(<optgroup key="sched" label="Today's schedule">{schedules.map(s => <option key={s._id} value={`sched:${s._id}`}>{s.time} · {s.title}</option>)}</optgroup>);
    }
    if (goals.length > 0) {
      opts.push(<optgroup key="goal" label="Long-term goals">{goals.map(g => <option key={g._id} value={`goal:${g._id}`}>{g.title}</option>)}</optgroup>);
    }
    if (longSchedules.length > 0) {
      opts.push(<optgroup key="ls" label="Long-term schedule">{longSchedules.map(l => <option key={l._id} value={`longsched:${l._id}`}>{l.title}</option>)}</optgroup>);
    }
    return opts;
  };

  const hostFromUrl = (u) => { try { return new URL(u).hostname.replace('www.', ''); } catch { return u; } };

  if (loading) return <div className="wrap" style={{ color: 'var(--ink)', textAlign: 'center', marginTop: '100px', fontFamily: "'Fraunces',serif", fontSize: '24px' }}>Loading Nightlist...</div>;

  return (
    <>
      <WeatherEffects weather={weather} />
      <div className="wrap" style={{ position: 'relative', zIndex: 10 }}>
        <button className="gear-btn" onClick={() => setShowSettings(true)} title="Settings">⚙</button>
        <button className="gear-btn" onClick={logout} title="Logout" style={{ right: '45px' }}>🚪</button>
        <button className="gear-btn" onClick={() => setShowCodeEditor(true)} title="AI Code Editor" style={{ right: '90px', fontFamily: 'monospace', fontWeight: 'bold' }}>&lt;/&gt;</button>

        <Sky />
        <WeatherPanel onWeatherChange={setWeather} />
        <VoiceAssistant weather={weather} />
        <ClockCard />
      <FamilyPanel />
      <SitesPanel />
      <RewardsPanel />
      <GraphPanel />

      {/* ===== Plan Your Day ===== */}
      <div className="card">
        <h2 className="section-title">Plan your day</h2>
        <div className="mode-toggle">
          <button className={`mode-btn sched-mode ${mode === 'sched' ? 'active' : ''}`} onClick={() => setMode('sched')}>📅 Schedule</button>
          <button className={`mode-btn task-mode ${mode === 'task' ? 'active' : ''}`} onClick={() => setMode('task')}>✓ Task</button>
        </div>

        {/* Schedule mode */}
        <div className={`form-panel ${mode === 'sched' ? 'active' : ''}`}>
          <div className="hint">Add a time block for your day</div>
          <div className="row1">
            <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)} style={{ maxWidth: '130px' }} />
            <input type="text" placeholder="What's happening at this time?" value={schedText} onChange={e => setSchedText(e.target.value)} />
          </div>
          <div className="row2">
            <select value={schedPts} onChange={e => setSchedPts(Number(e.target.value))}>
              <option value={5}>Easy · 5 pts</option>
              <option value={10}>Medium · 10 pts</option>
              <option value={20}>Hard · 20 pts</option>
            </select>
            <input type="url" placeholder="Site (optional)" value={schedUrl} onChange={e => setSchedUrl(e.target.value)} style={{ maxWidth: '160px' }} />
            <button className="add-btn secondary" onClick={addScheduleBlock}>Add block</button>
          </div>
        </div>

        {/* Task mode */}
        <div className={`form-panel ${mode === 'task' ? 'active' : ''}`}>
          <div className="hint">{taskTarget ? 'This will appear as a checklist item — just for clarity.' : 'Add a task — attach it to a time block or goal, or keep it general.'}</div>
          <div className="row1">
            <input type="text" placeholder="What do you need to do?" value={taskInput} onChange={e => setTaskInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} />
          </div>
          <div className="row1">
            <select value={taskTarget} onChange={e => setTaskTarget(e.target.value)} style={{ flex: 1 }}>
              {buildTargetOptions()}
            </select>
          </div>
          {!taskTarget && (
            <div className="row2">
              <input type="url" placeholder="Website (optional)" value={taskUrl} onChange={e => setTaskUrl(e.target.value)} />
              <select value={taskPoints} onChange={e => setTaskPoints(Number(e.target.value))}>
                <option value={5}>Easy · 5 pts</option>
                <option value={10}>Medium · 10 pts</option>
                <option value={20}>Hard · 20 pts</option>
              </select>
              <button className="add-btn" onClick={addTask}>Add task</button>
            </div>
          )}
          {taskTarget && (
            <div className="row2">
              <button className="add-btn" onClick={addTask}>Add task</button>
            </div>
          )}
        </div>
      </div>

      {/* ===== Schedule List ===== */}
      <SchedulePanel />

      {/* ===== Tasks List ===== */}
      <div className="card">
        <div className="sec-header">
          <h2 className="section-title">Tasks</h2>
          <button className="icon-btn" onClick={exportTasks} title="Download tasks">⬇</button>
        </div>
        <div>
          {tasks.length === 0 && <div className="empty"><div className="big">Clear sky</div>Add your first task above.</div>}
          {tasks.map(t => (
            <div key={t._id} className={`task ${t.completed ? 'done' : ''}`}>
              <div className={`check ${t.completed ? 'checked' : ''}`} onClick={() => toggleTask(t)}>{t.completed ? '✓' : ''}</div>
              <div className="task-body">
                <div className="task-text">{t.text}</div>
                <div className="task-meta">
                  <span className="pts-tag">{t.points} pts</span>
                  {t.url && <button className="site-btn" onClick={() => window.open(t.url, '_blank')}>↗ {hostFromUrl(t.url)}</button>}
                </div>
              </div>
              <button className="del-btn" onClick={() => deleteTask(t._id)}>×</button>
            </div>
          ))}
        </div>
      </div>

      <GoalsPanel />
      <LongSchedulePanel />
      <GamesPanel />
      {settings?.sections?.showChatbot !== false && <ChatbotPanel />}
      {settings?.sections?.showCalculator !== false && <CalculatorPanel />}

        <SettingsModal show={showSettings} onClose={() => setShowSettings(false)} />
        <CodeEditorModal show={showCodeEditor} onClose={() => setShowCodeEditor(false)} />
      </div>
    </>
  );
};

export default Dashboard;
