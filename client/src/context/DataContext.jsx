import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const DataContext = createContext();

function todayKey(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [goals, setGoals] = useState([]);
  const [longSchedules, setLongSchedules] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, schedRes, goalsRes, longSchedRes, statsRes] = await Promise.all([
        axios.get('/api/tasks'),
        axios.get('/api/schedules'),
        axios.get('/api/goals'),
        axios.get('/api/longschedules'),
        axios.get('/api/stats')
      ]);
      setTasks(tasksRes.data);
      setSchedules(schedRes.data);
      setGoals(goalsRes.data);
      setLongSchedules(longSchedRes.data);

      const s = statsRes.data;
      // Ensure nested objects exist
      if (!s.completedDates) s.completedDates = {};
      if (!s.pointsHistory) s.pointsHistory = {};
      if (!s.siteVisits) s.siteVisits = {};
      if (!s.rewards) s.rewards = [];
      checkStreakDecay(s);
      setStats(s);
    } catch (err) {
      console.error('Error fetching data', err);
    }
    setLoading(false);
  };

  // --- Streak ---
  const checkStreakDecay = (s) => {
    if (!s.lastCompletionDate) return;
    const today = todayKey(0), yesterday = todayKey(-1);
    if (s.lastCompletionDate !== today && s.lastCompletionDate !== yesterday) {
      if (s.streak !== 0) {
        s.streak = 0;
        // Save in background
        axios.put('/api/stats', { streak: 0 }).catch(() => {});
      }
    }
  };

  const updateStreak = (s, todayStr) => {
    if (s.lastCompletionDate === todayStr) return;
    const yest = todayKey(-1);
    if (s.lastCompletionDate === yest) { s.streak += 1; }
    else { s.streak = 1; }
    s.lastCompletionDate = todayStr;
  };

  // --- Points Engine (matches original exactly) ---
  const awardPoints = useCallback(async (points) => {
    setStats(prev => {
      if (!prev) return prev;
      const s = { ...prev };
      const key = todayKey(0);
      s.totalPoints = (s.totalPoints || 0) + points;
      const cd = { ...(s.completedDates || {}) };
      cd[key] = (cd[key] || 0) + 1;
      s.completedDates = cd;
      const ph = { ...(s.pointsHistory || {}) };
      ph[key] = (ph[key] || 0) + points;
      s.pointsHistory = ph;
      updateStreak(s, key);

      // Persist
      axios.put('/api/stats', {
        totalPoints: s.totalPoints,
        completedDates: s.completedDates,
        pointsHistory: s.pointsHistory,
        streak: s.streak,
        lastCompletionDate: s.lastCompletionDate
      }).catch(() => {});

      return s;
    });
  }, []);

  const revokePoints = useCallback(async (points) => {
    setStats(prev => {
      if (!prev) return prev;
      const s = { ...prev };
      const key = todayKey(0);
      s.totalPoints = Math.max(0, (s.totalPoints || 0) - points);
      const cd = { ...(s.completedDates || {}) };
      if (cd[key]) cd[key] = Math.max(0, cd[key] - 1);
      s.completedDates = cd;
      const ph = { ...(s.pointsHistory || {}) };
      if (ph[key]) ph[key] = Math.max(0, ph[key] - points);
      s.pointsHistory = ph;

      axios.put('/api/stats', {
        totalPoints: s.totalPoints,
        completedDates: s.completedDates,
        pointsHistory: s.pointsHistory
      }).catch(() => {});

      return s;
    });
  }, []);

  // --- Confetti ---
  const fireConfetti = useCallback(() => {
    const colors = ['#E8B94E', '#4FD1C5', '#E2839C', '#EDEDF2', '#8a7238'];
    for (let i = 0; i < 50; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.left = Math.random() * 100 + 'vw';
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      el.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
      el.style.opacity = (0.7 + Math.random() * 0.3).toString();
      el.style.transform = `rotate(${Math.random() * 360}deg)`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    }
  }, []);

  // --- Helpers ---
  const getDoneToday = () => {
    if (!stats) return 0;
    const cd = stats.completedDates || {};
    return cd[todayKey(0)] || 0;
  };

  const isStreakAtRisk = () => {
    if (!stats || !stats.streak || stats.streak === 0) return false;
    return getDoneToday() === 0;
  };

  return (
    <DataContext.Provider value={{
      tasks, setTasks,
      schedules, setSchedules,
      goals, setGoals,
      longSchedules, setLongSchedules,
      stats, setStats,
      loading, fetchData,
      awardPoints, revokePoints, fireConfetti,
      getDoneToday, isStreakAtRisk, todayKey
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
export { todayKey };
