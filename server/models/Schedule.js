const mongoose = require('mongoose');

const subtaskSchema = mongoose.Schema({
  text: String,
  done: { type: Boolean, default: false }
});

const customFieldSchema = mongoose.Schema({
  label: String,
  value: String
});

const scheduleSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  time: { type: String, required: true },
  title: { type: String, required: true },
  points: { type: Number, default: 0 },
  url: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'done', 'missed'], default: 'pending' },
  alerted: { type: Boolean, default: false },
  tasks: [subtaskSchema],
  customFields: [customFieldSchema]
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
