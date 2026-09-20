import { useState, useEffect } from 'react';

const AlertModal = ({ schedules, onDone, onMissed }) => {
  const [currentAlert, setCurrentAlert] = useState(null);

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hhmm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      
      for (const item of schedules) {
        if (item.status === 'pending' && !item.alerted && item.time <= hhmm) {
          setCurrentAlert(item);
          return;
        }
      }
    };

    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, [schedules]);

  if (!currentAlert) return null;

  const handleYes = () => {
    onDone(currentAlert);
    setCurrentAlert(null);
  };

  const handleNo = () => {
    onMissed(currentAlert);
    setCurrentAlert(null);
  };

  return (
    <div className="modal-overlay show">
      <div className="modal-card">
        <div className="tag">Scheduled task</div>
        <h3>{currentAlert.title}</h3>
        <div className="time">Scheduled for {currentAlert.time}</div>
        <div className="modal-actions">
          <button className="modal-btn yes" onClick={handleYes}>✓ Yes, done</button>
          <button className="modal-btn no" onClick={handleNo}>✕ Not yet</button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
