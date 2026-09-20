import { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

const ClockCard = () => {
  const { settings } = useSettings();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  
  const is24Hr = settings?.preferences?.use24HourClock || false;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = is24Hr ? hours.toString().padStart(2, '0') : (hours % 12 || 12);
  const displayMinutes = minutes.toString().padStart(2, '0');
  const displayAmPm = is24Hr ? '' : ` ${ampm}`;
  
  const dateOptions = { weekday: 'long', month: 'short', day: 'numeric' };
  const dateStr = time.toLocaleDateString('en-US', dateOptions);

  // Analog Clock Math
  const sDeg = seconds * 6;
  const mDeg = minutes * 6 + seconds * 0.1;
  const hDeg = (hours % 12) * 30 + minutes * 0.5;

  return (
    <div className="card clock-card">
      <svg width="60" height="60" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r="48" fill="var(--navy-deep)" stroke="var(--gold-dim)" strokeWidth="2"/>
        <line x1="50" y1="50" x2="50" y2="20" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" style={{ transform: `rotate(${hDeg}deg)`, transformOrigin: '50px 50px' }} />
        <line x1="50" y1="50" x2="50" y2="12" stroke="var(--teal)" strokeWidth="3" strokeLinecap="round" style={{ transform: `rotate(${mDeg}deg)`, transformOrigin: '50px 50px' }} />
        <line x1="50" y1="50" x2="50" y2="10" stroke="var(--danger)" strokeWidth="1.5" strokeLinecap="round" style={{ transform: `rotate(${sDeg}deg)`, transformOrigin: '50px 50px' }} />
        <circle cx="50" cy="50" r="3" fill="var(--gold)" />
      </svg>
      <div>
        <div className="digital-time">{displayHours}:{displayMinutes}{displayAmPm}</div>
        <div className="digital-date">{dateStr}</div>
      </div>
    </div>
  );
};

export default ClockCard;
