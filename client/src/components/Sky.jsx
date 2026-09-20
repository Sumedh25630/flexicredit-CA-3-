import { useData } from '../context/DataContext';

const Sky = () => {
  const { stats, getDoneToday, isStreakAtRisk } = useData();
  const points = stats?.totalPoints || 0;
  const streak = stats?.streak || 0;
  const doneToday = getDoneToday();

  // Deterministic stars — same formula as original HTML
  const count = Math.min(45, Math.floor(points / 5) + 6);
  const stars = Array.from({ length: count }).map((_, i) => ({
    x: ((Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1) * 600,
    y: ((Math.sin(i * 78.233) * 93758.5453 % 1 + 1) % 1) * 140,
    r: 0.6 + (i % 3) * 0.5,
    op: 0.3 + (i % 5) * 0.12
  }));

  return (
    <div className="sky">
      <svg className="stars" viewBox="0 0 600 140">
        {stars.map((s, i) => (
          <circle key={i} cx={s.x.toFixed(1)} cy={s.y.toFixed(1)} r={s.r} fill="var(--gold)" opacity={s.op.toFixed(2)} />
        ))}
      </svg>
      <h1>Nightlist</h1>
      <div className="sub">Every finished task lights up the sky.</div>
      <div className="scoreboard">
        <div className="stat"><div className="num">{points}</div><div className="label">points</div></div>
        <div className="stat"><div className="num streak">{streak}</div><div className="label">day streak</div></div>
        <div className="stat"><div className="num done-today">{doneToday}</div><div className="label">done today</div></div>
      </div>
      {isStreakAtRisk() && (
        <div className="streak-warn">⚡ Streak at risk — finish one task today to keep it alive.</div>
      )}
    </div>
  );
};

export default Sky;
