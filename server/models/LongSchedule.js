const mongoose = require('mongoose');

const subtaskSchema = mongoose.Schema({
  text: String,
  done: { type: Boolean, default: false }
});

const customFieldSchema = mongoose.Schema({
  label: String,
  value: String
});

const longScheduleSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  title: { type: String, required: true },
  url: { type: String, default: '' },
  tasks: [subtaskSchema],
  customFields: [customFieldSchema]
}, { timestamps: true });

module.exports = mongoose.model('LongSchedule', longScheduleSchema);
