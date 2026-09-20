import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings');
      setSettings(res.data);
      applyTheme(res.data.theme, res.data.layout);
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      const res = await axios.put('/api/settings', newSettings);
      setSettings(res.data);
      applyTheme(res.data.theme, res.data.layout);
    } catch (err) {
      console.error('Failed to save settings', err);
    }
  };

  const applyTheme = (theme, layout) => {
    if (!theme || !layout) return;
    const root = document.documentElement;
    root.style.setProperty('--navy-deep', theme.navyDeep);
    root.style.setProperty('--navy', theme.navy);
    root.style.setProperty('--navy-light', theme.navyLight);
    root.style.setProperty('--ink', theme.ink);
    root.style.setProperty('--slate', theme.slate);
    root.style.setProperty('--gold', theme.gold);
    root.style.setProperty('--gold-dim', theme.goldDim);
    root.style.setProperty('--teal', theme.teal);
    root.style.setProperty('--danger', theme.danger);
    root.style.setProperty('--pink', theme.pink);
    
    root.style.setProperty('--layout-maxwidth', layout.maxWidth + 'px');
  };

  return (
    <SettingsContext.Provider value={{ settings, saveSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
