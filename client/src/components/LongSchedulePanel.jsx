import { useState } from 'react';
import axios from 'axios';
import { useData } from '../context/DataContext';
import { CustomFields } from './SchedulePanel';
import { SubtaskAdder } from './GoalsPanel';

const LongSchedulePanel = () => {
  const { longSchedules, setLongSchedules, awardPoints, revokePoints, fireConfetti } = useData();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const addItem = async () => {
    if (!title.trim()) return;
    const normalizedUrl = url.trim() ? (!/^https?:\/\//i.test(url.trim()) ? 'https://' + url.trim() : url.trim()) : '';
    try {
      const res = await axios.post('/api/longschedules', { title: title.trim(), url: normalizedUrl });
      setLongSchedules([...longSchedules, res.data]);
      setTitle(''); setUrl('');
    } catch (err) { console.error(err); }
  };

  const deleteItem = async (id) => {
    try { await axios.delete(`/api/longschedules/${id}`); setLongSchedules(longSchedules.filter(l => l._id !== id)); } catch (err) { console.error(err); }
  };

  const addSubtask = async (item, text) => {
    if (!text.trim()) return;
    const updated = { ...item, tasks: [...(item.tasks || []), { text: text.trim(), done: false }] };
    try {
      const res = await axios.put(`/api/longschedules/${item._id}`, updated);
      setLongSchedules(longSchedules.map(l => l._id === item._id ? res.data : l));
    } catch (err) { console.error(err); }
  };

  const toggleSubtask = async (item, subId) => {
    const sub = item.tasks.find(t => t._id === subId);
    if (!sub) return;
    const updatedTasks = item.tasks.map(t => t._id === subId ? { ...t, done: !t.done } : t);
    try {
      const res = await axios.put(`/api/longschedules/${item._id}`, { ...item, tasks: updatedTasks });
      setLongSchedules(longSchedules.map(l => l._id === item._id ? res.data : l));
      if (!sub.done) { awardPoints(5); fireConfetti(); }
      else { revokePoints(5); }
    } catch (err) { console.error(err); }
  };

  const deleteSubtask = async (item, subId) => {
    const updatedTasks = item.tasks.filter(t => t._id !== subId);
    try {
      const res = await axios.put(`/api/longschedules/${item._id}`, { ...item, tasks: updatedTasks });
      setLongSchedules(longSchedules.map(l => l._id === item._id ? res.data : l));
    } catch (err) { console.error(err); }
  };

  const addCustomField = async (item, label, value) => {
    const updated = { ...item, customFields: [...(item.customFields || []), { label, value }] };
    try {
      const res = await axios.put(`/api/longschedules/${item._id}`, updated);
      setLongSchedules(longSchedules.map(l => l._id === item._id ? res.data : l));
    } catch (err) { console.error(err); }
  };

  const deleteCustomField = async (item, fieldId) => {
    const updated = { ...item, customFields: (item.customFields || []).filter(f => f._id !== fieldId) };
    try {
      const res = await axios.put(`/api/longschedules/${item._id}`, updated);
      setLongSchedules(longSchedules.map(l => l._id === item._id ? res.data : l));
    } catch (err) { console.error(err); }
  };

  const hostFromUrl = (u) => { try { return new URL(u).hostname.replace('www.', ''); } catch { return u; } };

  return (
    <div className="card">
      <h2 className="section-title">Long-term Schedule</h2>
      <div className="row1">
        <input type="text" placeholder="e.g. Study plan for finals" value={title} onChange={e => setTitle(e.target.value)} />
        <input type="url" placeholder="Site (optional)" value={url} onChange={e => setUrl(e.target.value)} style={{ maxWidth: '150px' }} />
        <button className="add-btn secondary" onClick={addItem}>Add</button>
      </div>
      <div className="hint">A long-term schedule item is a parent — only subtasks can be added beneath it. Each subtask earns 5 pts.</div>

      <div>
        {longSchedules.length === 0 && <div className="empty-inline">Add a long-term schedule item.</div>}
        {longSchedules.map(l => {
          const total = (l.tasks || []).length;
          const done = (l.tasks || []).filter(t => t.done).length;
          const pct = total ? Math.round((done / total) * 100) : 0;
          return (
            <div key={l._id} className="lts-item">
              <div className="lts-head">
                <div className="lts-title">{l.title}</div>
                <button className="reward-del" onClick={() => deleteItem(l._id)}>×</button>
              </div>
              {l.url && (
                <div className="task-meta" style={{ marginBottom: '8px' }}>
                  <button className="site-btn" onClick={() => window.open(l.url, '_blank')}>↗ {hostFromUrl(l.url)}</button>
                </div>
              )}
              <div className="lts-progress-txt">{done} of {total} subtasks done</div>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }}></div></div>

              <div className="goal-subtasks">
                {(l.tasks || []).length === 0 && <div className="empty-inline">No subtasks yet — add one below.</div>}
                {(l.tasks || []).map(t => (
                  <div key={t._id} className={`subtask ${t.done ? 'done' : ''}`} style={{ paddingLeft: 0 }}>
                    <div className={`sub-check ${t.done ? 'checked' : ''}`} onClick={() => toggleSubtask(l, t._id)}>{t.done ? '✓' : ''}</div>
                    <div className="subtask-text">{t.text}</div>
                    <button className="sub-del" onClick={() => deleteSubtask(l, t._id)}>×</button>
                  </div>
                ))}
              </div>

              <SubtaskAdder onAdd={(text) => addSubtask(l, text)} placeholder="Add a subtask" />
              <CustomFields item={l} onAdd={(la, v) => addCustomField(l, la, v)} onDelete={(fid) => deleteCustomField(l, fid)} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LongSchedulePanel;
