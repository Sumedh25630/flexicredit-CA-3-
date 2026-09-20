import { useData } from '../context/DataContext';
import axios from 'axios';

const SitesPanel = () => {
  const { stats, setStats } = useData();
  const siteVisits = stats?.siteVisits || {};

  const entries = Object.entries(siteVisits)
    .sort((a, b) => (b[1].count || 0) - (a[1].count || 0))
    .slice(0, 6);

  const visitSite = async (host, data) => {
    const updated = { ...siteVisits };
    updated[host] = { ...data, count: (data.count || 0) + 1 };
    try {
      const res = await axios.put('/api/stats', { siteVisits: updated });
      setStats(res.data);
    } catch (err) { console.error(err); }
    window.open(data.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="card">
      <h2 className="section-title">Frequent Sites</h2>
      <div className="sites-row">
        {entries.length === 0 && <div className="empty-inline">Add a website to a task and visit it — your most-used sites pin here.</div>}
        {entries.map(([host, data], i) => (
          <div key={host} className={`site-pin ${i === 0 ? 'top' : ''}`} onClick={() => visitSite(host, data)}>
            <div className="favicon" style={{ background: `hsl(${host.charCodeAt(0) * 5 % 360}, 60%, 55%)` }}></div>
            <div className="info">
              <div className="host">{i === 0 && <span className="crown">★ </span>}{host}</div>
              <div className="visits">{data.count} visit{data.count === 1 ? '' : 's'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SitesPanel;
