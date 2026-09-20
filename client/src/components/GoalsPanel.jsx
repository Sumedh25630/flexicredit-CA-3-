import { useState } from 'react';
import axios from 'axios';
import { useData } from '../context/DataContext';
import { CustomFields } from './SchedulePanel';

const GoalsPanel = () => {
  const { goals, setGoals, awardPoints, revokePoints, fireConfetti } = useData();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const addGoal = async () => {
    if (!title.trim()) return;
    const normalizedUrl = url.trim() ? (!/^https?:\/\//i.test(url.trim()) ? 'https://' + url.trim() : url.trim()) : '';
    try {
      const res = await axios.post('/api/goals', { title: title.trim(), url: normalizedUrl });
      setGoals([...goals, res.data]);
      setTitle(''); setUrl('');
    } catch (err) { console.error(err); }
  };

  const deleteGoal = async (id) => {
    try { await axios.delete(`/api/goals/${id}`); setGoals(goals.filter(g => g._id !== id)); } catch (err) { console.error(err); }
  };

  const addSubtask = async (goal, text) => {
    if (!text.trim()) return;
    const updated = { ...goal, tasks: [...(goal.tasks || []), { text: text.trim(), done: false }] };
    try {
      const res = await axios.put(`/api/goals/${goal._id}`, updated);
      setGoals(goals.map(g => g._id === goal._id ? res.data : g));
    } catch (err) { console.error(err); }
  };

  const toggleSubtask = async (goal, subId) => {
    const sub = goal.tasks.find(t => t._id === subId);
    if (!sub) return;
    const updatedTasks = goal.tasks.map(t => t._id === subId ? { ...t, done: !t.done } : t);
    try {
      const res = await axios.put(`/api/goals/${goal._id}`, { ...goal, tasks: updatedTasks });
      setGoals(goals.map(g => g._id === goal._id ? res.data : g));
      if (!sub.done) { awardPoints(5); fireConfetti(); }
      else { revokePoints(5); }
    } catch (err) { console.error(err); }
  };

  const deleteSubtask = async (goal, subId) => {
    const updatedTasks = goal.tasks.filter(t => t._id !== subId);
    try {
      const res = await axios.put(`/api/goals/${goal._id}`, { ...goal, tasks: updatedTasks });
      setGoals(goals.map(g => g._id === goal._id ? res.data : g));
    } catch (err) { console.error(err); }
  };

  const addCustomField = async (goal, label, value) => {
    const updated = { ...goal, customFields: [...(goal.customFields || []), { label, value }] };
    try {
      const res = await axios.put(`/api/goals/${goal._id}`, updated);
      setGoals(goals.map(g => g._id === goal._id ? res.data : g));
    } catch (err) { console.error(err); }
  };

  const deleteCustomField = async (goal, fieldId) => {
    const updated = { ...goal, customFields: (goal.customFields || []).filter(f => f._id !== fieldId) };
    try {
      const res = await axios.put(`/api/goals/${goal._id}`, updated);
      setGoals(goals.map(g => g._id === goal._id ? res.data : g));
    } catch (err) { console.error(err); }
  };

  const hostFromUrl = (u) => { try { return new URL(u).hostname.replace('www.', ''); } catch { return u; } };

  return (
    <div className="card">
      <h2 className="section-title">Long-term Goals</h2>
      <div className="row1">
        <input type="text" placeholder="Goal, e.g. Learn Spanish" value={title} onChange={e => setTitle(e.target.value)} />
        <input type="url" placeholder="Site (optional)" value={url} onChange={e => setUrl(e.target.value)} style={{ maxWidth: '150px' }} />
        <button className="add-btn secondary" onClick={addGoal}>Add goal</button>
      </div>
      <div className="hint">Goals have no due date — break them into steps below. Each step earns 5 pts.</div>

      <div>
        {goals.length === 0 && <div className="empty-inline">Add a long-term goal — steps you add earn 5 pts each.</div>}
        {goals.map(g => {
          const total = (g.tasks || []).length;
          const done = (g.tasks || []).filter(t => t.done).length;
          const pct = total ? Math.round((done / total) * 100) : 0;
          return (
            <div key={g._id} className="goal-item">
              <div className="goal-head">
                <div className="goal-title">{g.title}</div>
                <button className="reward-del" onClick={() => deleteGoal(g._id)}>×</button>
              </div>
              {g.url && (
                <div className="task-meta" style={{ marginBottom: '8px' }}>
                  <button className="site-btn" onClick={() => window.open(g.url, '_blank')}>↗ {hostFromUrl(g.url)}</button>
                </div>
              )}
              <div className="goal-progress-txt">{done} of {total} steps done</div>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }}></div></div>

              <div className="goal-subtasks">
                {(g.tasks || []).length === 0 && <div className="empty-inline">No steps yet — add one below.</div>}
                {(g.tasks || []).map(t => (
                  <div key={t._id} className={`subtask ${t.done ? 'done' : ''}`} style={{ paddingLeft: 0 }}>
                    <div className={`sub-check ${t.done ? 'checked' : ''}`} onClick={() => toggleSubtask(g, t._id)}>{t.done ? '✓' : ''}</div>
                    <div className="subtask-text">{t.text}</div>
                    <button className="sub-del" onClick={() => deleteSubtask(g, t._id)}>×</button>
                  </div>
                ))}
              </div>

              <SubtaskAdder onAdd={(text) => addSubtask(g, text)} placeholder="Add a step" />
              <CustomFields item={g} onAdd={(l, v) => addCustomField(g, l, v)} onDelete={(fid) => deleteCustomField(g, fid)} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SubtaskAdder = ({ onAdd, placeholder }) => {
  const [text, setText] = useState('');
  const handleAdd = () => { if (text.trim()) { onAdd(text.trim()); setText(''); } };
  return (
    <div className="goal-add-row">
      <input type="text" placeholder={placeholder} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
      <button onClick={handleAdd}>Add</button>
    </div>
  );
};

export { SubtaskAdder };
export default GoalsPanel;
