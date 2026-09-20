import { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

const SECTION_LABELS = {
  voice: 'Voice assistant', clock: 'Live clock', family: 'Family',
  sites: 'Frequent sites', rewards: 'Rewards', graph: 'Progress graph',
  games: 'Games', goals: 'Long-term goals', longschedule: 'Long-term schedule',
  schedule: "Today's schedule", tasks: 'Tasks', chatbot: 'Chatbot', calculator: 'Calculator'
};
const WIDTH_OPTIONS = [[12, 'Full width'], [8, 'Two-thirds'], [6, 'Half'], [4, 'Third']];

const SettingsModal = ({ show, onClose }) => {
  const { settings, saveSettings } = useSettings();
  const [local, setLocal] = useState(null);

  useEffect(() => {
    if (settings && show) {
      setLocal(JSON.parse(JSON.stringify(settings)));
    }
  }, [settings, show]);

  if (!show || !local) return null;

  const set = (path, value) => {
    setLocal(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const handleSave = () => {
    saveSettings(local);
    onClose();
  };

  const theme = local.theme || {};
  const layout = local.layout || {};
  const sections = local.sections || {};
  const pointPresets = local.pointPresets || {};

  return (
    <div className="modal-overlay show" style={{ display: 'flex' }}>
      <div className="modal-card settings-card" style={{ position: 'relative', maxWidth: '460px' }}>
        <button className="settings-close" onClick={onClose}>×</button>
        <h3>Customize Nightlist</h3>

        <div className="set-group">
          <label>Clock Preferences</label>
          <div className="toggle-row">
            <span>Use 24-Hour Clock</span>
            <label className="switch">
              <input type="checkbox" checked={local.preferences?.use24HourClock || false}
                onChange={e => set('preferences.use24HourClock', e.target.checked)} />
              <span className="slider-tg"></span>
            </label>
          </div>
        </div>

        <div className="set-group">
          <label>Accent Color</label>
          <div className="color-row">
            <input type="color" value={theme.gold || '#E8B94E'} onChange={e => set('theme.gold', e.target.value)} />
            <span style={{ fontSize: '12px', color: 'var(--slate)' }}>{theme.gold || '#E8B94E'}</span>
          </div>
        </div>

        <div className="set-group">
          <label>Point Presets (Easy / Medium / Hard)</label>
          <div className="pts-presets">
            <input type="number" min="1" value={pointPresets.small || 5} onChange={e => set('pointPresets.small', Number(e.target.value))} />
            <input type="number" min="1" value={pointPresets.medium || 10} onChange={e => set('pointPresets.medium', Number(e.target.value))} />
            <input type="number" min="1" value={pointPresets.large || 20} onChange={e => set('pointPresets.large', Number(e.target.value))} />
          </div>
        </div>

        <div className="set-group">
          <label>Page Width (Laptop Layout)</label>
          <div className="range-row">
            <input type="range" min="600" max="1400" step="20" value={layout.maxWidth || 600} onChange={e => set('layout.maxWidth', e.target.value)} />
            <div className="range-val">{layout.maxWidth || 600}px</div>
          </div>
        </div>

        <div className="set-group">
          <label>Colors</label>
          <div className="color-grid">
            <div><input type="color" value={theme.navyDeep || '#0B0F1F'} onChange={e => set('theme.navyDeep', e.target.value)} /><label>Background</label></div>
            <div><input type="color" value={theme.navy || '#12172B'} onChange={e => set('theme.navy', e.target.value)} /><label>Cards</label></div>
            <div><input type="color" value={theme.ink || '#EDEDF2'} onChange={e => set('theme.ink', e.target.value)} /><label>Text</label></div>
            <div><input type="color" value={theme.teal || '#4FD1C5'} onChange={e => set('theme.teal', e.target.value)} /><label>Secondary</label></div>
          </div>
        </div>

        <div className="set-group">
          <label>Sections Shown</label>
          {Object.keys(SECTION_LABELS).map(key => (
            <div key={key} className="toggle-row">
              <span>{SECTION_LABELS[key]}</span>
              <label className="switch">
                <input type="checkbox" checked={sections[`show${key.charAt(0).toUpperCase() + key.slice(1)}`] !== false}
                  onChange={e => set(`sections.show${key.charAt(0).toUpperCase() + key.slice(1)}`, e.target.checked)} />
                <span className="slider-tg"></span>
              </label>
            </div>
          ))}
        </div>

        <button className="settings-save" onClick={handleSave}>Save Changes</button>
      </div>
    </div>
  );
};

export default SettingsModal;
