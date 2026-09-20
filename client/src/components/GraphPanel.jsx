import { useData, todayKey } from '../context/DataContext';

const GraphPanel = () => {
  const { stats } = useData();
  const history = stats?.pointsHistory || {};

  const days = [];
  for (let i = 13; i >= 0; i--) {
    const key = todayKey(-i);
    const d = new Date(key);
    days.push({ key, pts: history[key] || 0, label: d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) });
  }

  const max = Math.max(1, ...days.map(d => d.pts));
  const w = 600, h = 180, padB = 26, padT = 10;
  const gap = (w / days.length) * 0.4, barW = (w / days.length) * 0.6;
  const today = todayKey(0);

  return (
    <div className="card">
      <h2 className="section-title">Progress, last 14 days</h2>
      <div className="graph-wrap">
        <svg className="graph-svg" viewBox={`0 0 ${w} ${h}`}>
          {days.map((d, i) => {
            const slot = w / days.length;
            const x = i * slot + gap / 2;
            const barH = ((h - padB - padT) * d.pts) / max;
            const y = h - padB - barH;
            const isToday = d.key === today;
            return (
              <g key={i}>
                <rect
                  x={x.toFixed(1)} y={y.toFixed(1)}
                  width={barW.toFixed(1)} height={barH.toFixed(1)}
                  rx="4" fill={isToday ? 'var(--gold)' : 'var(--teal)'}
                  opacity={d.pts === 0 ? 0.15 : 0.85}
                />
                {(i % 2 === 0 || i === days.length - 1) && (
                  <text
                    x={(x + barW / 2).toFixed(1)} y={h - 8}
                    fontSize="9" fill="var(--slate)" textAnchor="middle" fontFamily="Inter"
                  >{d.label}</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default GraphPanel;
