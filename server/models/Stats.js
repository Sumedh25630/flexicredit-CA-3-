const mongoose = require('mongoose');

const statsSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  totalPoints: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastCompletionDate: { type: String, default: null },
  completedDates: { type: Map, of: Number, default: {} },
  pointsHistory: { type: Map, of: Number, default: {} },
  scheduleDate: { type: String, default: null },
  siteVisits: { 
    type: Map, 
    of: mongoose.Schema({ count: Number, url: String })
  },
  rewards: [{
    name: String,
    threshold: Number
  }]
}, { timestamps: true });

module.exports = mongoose.model('Stats', statsSchema);
