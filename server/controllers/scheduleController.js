const Schedule = require('../models/Schedule');

const getSchedules = async (req, res) => {
  const schedules = await Schedule.find({ user: req.user._id }).sort({ time: 1 });
  res.json(schedules);
};

const setSchedule = async (req, res) => {
  const schedule = await Schedule.create({
    time: req.body.time,
    title: req.body.title,
    user: req.user._id,
    points: req.body.points || 0,
    url: req.body.url || '',
    status: req.body.status || 'pending',
    alerted: req.body.alerted || false,
    tasks: req.body.tasks || [],
    customFields: req.body.customFields || []
  });
  res.status(201).json(schedule);
};

const updateSchedule = async (req, res) => {
  const schedule = await Schedule.findById(req.params.id);
  if (!schedule || schedule.user.toString() !== req.user._id.toString()) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  const updatedSchedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updatedSchedule);
};

const deleteSchedule = async (req, res) => {
  const schedule = await Schedule.findById(req.params.id);
  if (!schedule || schedule.user.toString() !== req.user._id.toString()) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  await schedule.deleteOne();
  res.json({ id: req.params.id });
};

module.exports = { getSchedules, setSchedule, updateSchedule, deleteSchedule };
