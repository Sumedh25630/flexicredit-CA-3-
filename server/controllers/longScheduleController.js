const LongSchedule = require('../models/LongSchedule');

const getLongSchedules = async (req, res) => {
  const longSchedules = await LongSchedule.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(longSchedules);
};

const setLongSchedule = async (req, res) => {
  const longSchedule = await LongSchedule.create({
    title: req.body.title,
    user: req.user._id,
    url: req.body.url || '',
    tasks: req.body.tasks || [],
    customFields: req.body.customFields || []
  });
  res.status(201).json(longSchedule);
};

const updateLongSchedule = async (req, res) => {
  const longSchedule = await LongSchedule.findById(req.params.id);
  if (!longSchedule || longSchedule.user.toString() !== req.user._id.toString()) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  const updatedLongSchedule = await LongSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updatedLongSchedule);
};

const deleteLongSchedule = async (req, res) => {
  const longSchedule = await LongSchedule.findById(req.params.id);
  if (!longSchedule || longSchedule.user.toString() !== req.user._id.toString()) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  await longSchedule.deleteOne();
  res.json({ id: req.params.id });
};

module.exports = { getLongSchedules, setLongSchedule, updateLongSchedule, deleteLongSchedule };
