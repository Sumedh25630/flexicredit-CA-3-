const mongoose = require('mongoose');

const settingsSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  theme: {
    navyDeep: { type: String, default: '#0B0F1F' },
    navy: { type: String, default: '#12172B' },
    navyLight: { type: String, default: '#1B2140' },
    ink: { type: String, default: '#EDEDF2' },
    slate: { type: String, default: '#8A93AC' },
    gold: { type: String, default: '#E8B94E' },
    goldDim: { type: String, default: '#8a7238' },
    teal: { type: String, default: '#4FD1C5' },
    danger: { type: String, default: '#E27D7D' },
    pink: { type: String, default: '#E2839C' }
  },
  layout: {
    maxWidth: { type: String, default: '600' },
    skySpan: { type: String, default: '12' },
    clockSpan: { type: String, default: '12' },
    familySpan: { type: String, default: '12' },
    gameSpan: { type: String, default: '12' }
  },
  pointPresets: {
    small: { type: Number, default: 10 },
    medium: { type: Number, default: 30 },
    large: { type: Number, default: 100 }
  },
  sections: {
    showSchedule: { type: Boolean, default: true },
    showGoals: { type: Boolean, default: true },
    showLongSched: { type: Boolean, default: true },
    showSites: { type: Boolean, default: true },
    showGraph: { type: Boolean, default: true },
    showFamily: { type: Boolean, default: true },
    showGames: { type: Boolean, default: true },
    showVoice: { type: Boolean, default: true },
    showChatbot: { type: Boolean, default: true },
    showCalculator: { type: Boolean, default: true }
  },
  preferences: {
    use24HourClock: { type: Boolean, default: false }
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
