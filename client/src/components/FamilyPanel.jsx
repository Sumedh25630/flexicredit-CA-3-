import { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

const FamilyPanel = () => {
  const { settings, saveSettings } = useSettings();
  const [familyCode, setFamilyCode] = useState('');
  const [memberName, setMemberName] = useState('');

  const [members, setMembers] = useState([]);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    if (settings?.familyCode) {
      // Mock fetching from a shared source
      const storedMembers = JSON.parse(localStorage.getItem(`family-members-${settings.familyCode}`) || '[]');
      const storedActivity = JSON.parse(localStorage.getItem(`family-activity-${settings.familyCode}`) || '[]');
      setMembers(storedMembers);
      setActivity(storedActivity);
    }
  }, [settings?.familyCode]);

  const joinFamily = () => {
    if (!familyCode || !memberName) return;
    const slug = familyCode.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    let stored = JSON.parse(localStorage.getItem(`family-members-${slug}`) || '[]');
    if (!stored.includes(memberName)) {
      if (stored.length >= 5) { alert('Family full'); return; }
      stored.push(memberName);
      localStorage.setItem(`family-members-${slug}`, JSON.stringify(stored));
    }
    
    saveSettings({ ...settings, familyCode: slug, memberName });
  };

  const leaveFamily = () => {
    const slug = settings.familyCode;
    let stored = JSON.parse(localStorage.getItem(`family-members-${slug}`) || '[]');
    stored = stored.filter(m => m !== settings.memberName);
    localStorage.setItem(`family-members-${slug}`, JSON.stringify(stored));
    saveSettings({ ...settings, familyCode: '', memberName: '' });
  };

  if (!settings?.familyCode) {
    return (
      <div className="card">
        <div className="sec-header">
          <h2 className="section-title">Family Sync</h2>
        </div>
        <div className="hint">Create or join a family with a shared code (max 5 members).</div>
        <div className="form-panel active">
          <div className="row1">
            <input type="text" placeholder="Family code" value={familyCode} onChange={e => setFamilyCode(e.target.value)} />
            <input type="text" placeholder="Your name" value={memberName} onChange={e => setMemberName(e.target.value)} />
          </div>
          <div className="row2">
            <button className="add-btn secondary" onClick={joinFamily}>Join / create family</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="sec-header">
        <h2 className="section-title">Family Activity</h2>
      </div>
      <div className="family-code-tag">Family code: {settings.familyCode} · {members.length}/5 members</div>
      <div className="family-members">
        {members.map(m => (
          <div key={m} className={`member-chip ${m === settings.memberName ? 'you' : ''}`}>
            <span className="member-dot"></span>{m} {m === settings.memberName ? '(you)' : ''}
          </div>
        ))}
      </div>
      <div style={{ marginTop: '10px' }}>
        {activity.length === 0 && <div className="empty-inline">No activity yet.</div>}
        {activity.map((a, i) => (
          <div key={i} className="activity-item">
            <div className="activity-left">
              <span className="activity-member">{a.member}</span>
              <span>{a.text} · +{a.points} pts</span>
            </div>
            <span className="activity-time">just now</span>
          </div>
        ))}
      </div>
      <button className="family-leave" onClick={leaveFamily} style={{ marginTop: '14px' }}>Leave family</button>
    </div>
  );
};

export default FamilyPanel;
