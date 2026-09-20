import { useEffect, useState, useMemo } from 'react';

const WeatherEffects = ({ weather }) => {
  const [particles, setParticles] = useState([]);
  
  const type = weather?.type || 'clear';
  const isDay = weather?.isDay === 1;

  useEffect(() => {
    if (type === 'clear' || type === 'cloudy') {
      setParticles([]);
      return;
    }

    let count = 0;
    let className = '';

    if (type === 'rain') { count = 40; className = 'drop'; }
    if (type === 'heavyrain' || type === 'storm') { count = 100; className = 'drop fast'; }
    if (type === 'snow') { count = 50; className = 'snowflake'; }

    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      animDuration: 0.5 + Math.random() * 1.5,
      delay: Math.random() * 2,
      opacity: 0.2 + Math.random() * 0.4
    }));
    
    setParticles(newParticles);
  }, [type]);

  return (
    <div className={`weather-ambient-container ${type} ${isDay ? 'day' : 'night'}`}>
      {/* Lightning effect for storms */}
      {type === 'storm' && <div className="lightning-flash"></div>}

      {/* Sun glow for clear days */}
      {type === 'clear' && isDay && <div className="sun-glow"></div>}

      {/* Cloud layer */}
      {(type === 'cloudy' || type === 'rain' || type === 'heavyrain' || type === 'storm' || type === 'snow') && (
        <div className="ambient-clouds">
          <div className="cloud c1"></div>
          <div className="cloud c2"></div>
        </div>
      )}

      {/* Rain/Snow Particles */}
      {particles.map(p => (
        <div 
          key={p.id} 
          className={`ambient-particle ${type === 'snow' ? 'snowflake' : 'drop'} ${type === 'heavyrain' || type === 'storm' ? 'fast' : ''}`}
          style={{
            left: `${p.left}vw`,
            animationDuration: `${p.animDuration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity
          }}
        ></div>
      ))}
    </div>
  );
};

export default WeatherEffects;
