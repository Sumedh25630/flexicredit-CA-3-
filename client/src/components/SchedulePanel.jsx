import { useState } from 'react';
import axios from 'axios';
import { useData } from '../context/DataContext';
import { useSettings } from '../context/SettingsContext';

const SchedulePanel = () => {
  const { schedules, setSchedules, awardPoints, revokePoints, fireConfetti } = useData();
  const { settings } = useSettings();
  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState(10);
  const [url, setUrl] = useState('');

  const is24Hr = settings?.preferences?.use24HourClock || false;

  const formatTime = (timeStr) => {
    if (is24Hr || !timeStr) return timeStr;
    const [h, m] = timeStr.split(':');
    let hr = parseInt(h, 10);
    const ap = hr >= 12 ? 'PM' : 'AM';
    hr = hr % 12 || 12;
    return `${hr}:${m} ${ap}`;
  };

  const addSchedule = async () => {
    if (!time || !title) return;
    try {
      const normalizedUrl = url.trim() ? (!/^https?:\/\//i.test(url.trim()) ? 'https://' + url.trim() : url.trim()) : '';
      const res = await axios.post('/api/schedules', { time, title, points, url: normalizedUrl });
      setSchedules([...schedules, res.data].sort((a, b) => a.time.localeCompare(b.time)));
      setTime(''); setTitle(''); setUrl('');
    } catch (err) { console.error(err); }
  };

  const markSchedule = async (sched, newStatus) => {
    try {
      const wasDone = sched.status === 'done';
      const status = sched.status === newStatus ? 'pending' : newStatus;
      const res = await axios.put(`/api/schedules/${sched._id}`, { ...sched, status, alerted: true });
      setSchedules(schedules.map(s => s._id === sched._id ? res.data : s));
      if (status === 'done' && !wasDone) { awardPoints(sched.points); fireConfetti(); }
      if (wasDone && status !== 'done') { revokePoints(sched.points); }
    } catch (err) { console.error(err); }
  };

  const deleteSched = async (id) => {
    try {
      await axios.delete(`/api/schedules/${id}`);
      setSchedules(schedules.filter(s => s._id !== id));
    } catch (err) { console.error(err); }
  };

  const toggleSubtask = async (sched, subId) => {
    const updatedTasks = sched.tasks.map(t => t._id === subId ? { ...t, done: !t.done } : t);
    try {
      const res = await axios.put(`/api/schedules/${sched._id}`, { ...sched, tasks: updatedTasks });
      setSchedules(schedules.map(s => s._id === sched._id ? res.data : s));
    } catch (err) { console.error(err); }
  };

  const deleteSubtask = async (sched, subId) => {
    const updatedTasks = sched.tasks.filter(t => t._id !== subId);
    try {
      const res = await axios.put(`/api/schedules/${sched._id}`, { ...sched, tasks: updatedTasks });
      setSchedules(schedules.map(s => s._id === sched._id ? res.data : s));
    } catch (err) { console.error(err); }
  };

  const addCustomField = async (sched, label, value) => {
    if (!label) return;
    const updated = { ...sched, customFields: [...(sched.customFields || []), { label, value }] };
    try {
      const res = await axios.put(`/api/schedules/${sched._id}`, updated);
      setSchedules(schedules.map(s => s._id === sched._id ? res.data : s));
    } catch (err) { console.error(err); }
  };

  const deleteCustomField = async (sched, fieldId) => {
    const updated = { ...sched, customFields: (sched.customFields || []).filter(f => f._id !== fieldId) };
    try {
      const res = await axios.put(`/api/schedules/${sched._id}`, updated);
      setSchedules(schedules.map(s => s._id === sched._id ? res.data : s));
    } catch (err) { console.error(err); }
  };

  const exportSchedule = () => {
    if (schedules.length === 0) { alert('No schedule items to download.'); return; }
    const today = new Date().toISOString().slice(0, 10);
    const lines = [`Nightlist — Today's Schedule (${today})`, ''];
    schedules.forEach(s => {
      lines.push(`${s.time}  ${s.title}  [${s.status.toUpperCase()}]  (${s.points} pts)`);
      (s.tasks || []).forEach(t => lines.push(`    - [${t.done ? 'x' : ' '}] ${t.text}`));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `schedule-${today}.txt`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const hostFromUrl = (u) => { try { return new URL(u).hostname.replace('www.', ''); } catch { return u; } };

  return (
    <div className="card">
      <div className="sec-header">
        <h2 className="section-title">Today's Schedule</h2>
        <button className="icon-btn" onClick={exportSchedule} title="Download schedule">⬇</button>
      </div>

      <div className="form-panel active" style={{ marginBottom: '14px' }}>
        <div className="hint">Add a time block for your day</div>
        <div className="row1">
          <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ flex: '0 0 130px' }} />
          <input type="text" placeholder="What's happening at this time?" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="row2">
          <select value={points} onChange={e => setPoints(Number(e.target.value))}>
            <option value={5}>Easy · 5 pts</option>
            <option value={10}>Medium · 10 pts</option>
            <option value={20}>Hard · 20 pts</option>
          </select>
          <input type="url" placeholder="Site (optional)" value={url} onChange={e => setUrl(e.target.value)} style={{ maxWidth: '160px' }} />
          <button className="add-btn secondary" onClick={addSchedule}>Add block</button>
        </div>
      </div>

      <div>
        {schedules.length === 0 && <div className="empty-inline">No time blocks scheduled yet.</div>}
        {schedules.map(s => (
          <div key={s._id} className={`sched-item status-${s.status}`}>
            <div className="sched-item-top">
              <div className="sched-time">{formatTime(s.time)}</div>
              <div className="sched-body">
                <div className="sched-text">{s.title}</div>
                <div className="task-meta">
                  <span className="pts-tag">{s.points} pts</span>
                  {s.url && <button className="site-btn" onClick={() => window.open(s.url, '_blank')}>↗ {hostFromUrl(s.url)}</button>}
                </div>
              </div>
              <div className="sched-actions">
                <button className={`sched-btn tick ${s.status === 'done' ? 'active' : ''}`} onClick={() => markSchedule(s, 'done')}>✓</button>
                <button className={`sched-btn cross ${s.status === 'missed' ? 'active' : ''}`} onClick={() => markSchedule(s, 'missed')}>✕</button>
              </div>
              <button className="sched-del" onClick={() => deleteSched(s._id)}>×</button>
            </div>

            {/* Subtasks */}
            {(s.tasks && s.tasks.length > 0) ? (
              <div className="subtasks">
                {s.tasks.map(t => (
                  <div key={t._id} className={`subtask ${t.done ? 'done' : ''}`}>
                    <div className={`sub-check ${t.done ? 'checked' : ''}`} onClick={() => toggleSubtask(s, t._id)}>{t.done ? '✓' : ''}</div>
                    <div className="subtask-text">{t.text}</div>
                    <button className="sub-del" onClick={() => deleteSubtask(s, t._id)}>×</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="subtasks-empty">No checklist items — add via Task mode above.</div>
            )}

            {/* Custom Fields */}
            <CustomFields item={s} onAdd={(l, v) => addCustomField(s, l, v)} onDelete={(fid) => deleteCustomField(s, fid)} />
          </div>
        ))}
      </div>
    </div>
  );
};

const CustomFields = ({ item, onAdd, onDelete }) => {
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const fields = item.customFields || [];

  const handleAdd = () => {
    if (!label.trim()) return;
    onAdd(label.trim(), value.trim());
    setLabel(''); setValue('');
  };

  return (
    <div className="cf-wrap">
      <div className="cf-chips">
        {fields.map(f => (
          <span key={f._id} className="cf-chip">
            {f.label}{f.value ? ': ' + f.value : ''}
            <button className="cf-chip-del" onClick={() => onDelete(f._id)}>×</button>
          </span>
        ))}
      </div>
      <div className="cf-add-row">
        <input type="text" className="cf-input" placeholder="Field name" value={label} onChange={e => setLabel(e.target.value)} />
        <input type="text" className="cf-input" placeholder="Value (optional)" value={value} onChange={e => setValue(e.target.value)} />
        <button className="cf-add-btn" onClick={handleAdd} title="Add custom field">+</button>
      </div>
    </div>
  );
};

export { CustomFields };
export default SchedulePanel;
