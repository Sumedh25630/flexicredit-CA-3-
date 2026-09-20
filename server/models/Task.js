const mongoose = require('mongoose');

const customFieldSchema = mongoose.Schema({
  label: String,
  value: String
});

const taskSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  text: { type: String, required: true },
  points: { type: Number, default: 0 },
  url: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  customFields: [customFieldSchema]
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
