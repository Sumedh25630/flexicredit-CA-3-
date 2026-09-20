import { useState } from 'react';
import axios from 'axios';
import { useData } from '../context/DataContext';

const RewardsPanel = () => {
  const { stats, setStats } = useData();
  const [name, setName] = useState('');
  const [threshold, setThreshold] = useState('');
  const points = stats?.totalPoints || 0;
  const rewards = stats?.rewards || [];

  const addReward = async () => {
    if (!name.trim() || !threshold || parseInt(threshold) <= 0) return;
    const newReward = { name: name.trim(), threshold: parseInt(threshold) };
    const updatedRewards = [...rewards, newReward].sort((a, b) => a.threshold - b.threshold);
    try {
      const res = await axios.put('/api/stats', { rewards: updatedRewards });
      setStats(res.data);
      setName(''); setThreshold('');
    } catch (err) { console.error(err); }
  };

  const deleteReward = async (index) => {
    const updatedRewards = rewards.filter((_, i) => i !== index);
    try {
      const res = await axios.put('/api/stats', { rewards: updatedRewards });
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="card">
      <h2 className="section-title">Rewards</h2>
      <div className="row1">
        <input type="text" placeholder="Reward, e.g. Pizza night" value={name} onChange={e => setName(e.target.value)} />
        <input type="number" placeholder="Points needed" min="1" value={threshold} onChange={e => setThreshold(e.target.value)} style={{ maxWidth: '120px' }} />
        <button className="add-btn secondary" onClick={addReward}>Add</button>
      </div>

      <div style={{ marginTop: '14px' }}>
        {rewards.length === 0 && <div className="empty-inline">Set a goal — like "Pizza" at 20,000 points — and watch the bar fill.</div>}
        {rewards.map((r, i) => {
          const pct = Math.min(100, (points / r.threshold) * 100);
          const unlocked = points >= r.threshold;
          return (
            <div key={i} className="reward-item">
              <div className="reward-head">
                <div className="name">
                  {r.name} <span className={`badge ${unlocked ? 'unlocked' : ''}`}>
                    {unlocked ? 'Unlocked!' : `${points} / ${r.threshold}`}
                  </span>
                </div>
                <button className="reward-del" onClick={() => deleteReward(i)}>×</button>
              </div>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }}></div></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RewardsPanel;
