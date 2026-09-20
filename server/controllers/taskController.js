const Task = require('../models/Task');

const getTasks = async (req, res) => {
  const tasks = await Task.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(tasks);
};

const setTask = async (req, res) => {
  const task = await Task.create({
    text: req.body.text,
    user: req.user._id,
    points: req.body.points || 0,
    url: req.body.url || '',
    completed: req.body.completed || false,
    customFields: req.body.customFields || []
  });
  res.status(201).json(task);
};

const updateTask = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task || task.user.toString() !== req.user._id.toString()) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updatedTask);
};

const deleteTask = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task || task.user.toString() !== req.user._id.toString()) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  await task.deleteOne();
  res.json({ id: req.params.id });
};

module.exports = { getTasks, setTask, updateTask, deleteTask };
