const Goal = require('../models/Goal');

const getGoals = async (req, res) => {
  const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(goals);
};

const setGoal = async (req, res) => {
  const goal = await Goal.create({
    title: req.body.title,
    user: req.user._id,
    url: req.body.url || '',
    tasks: req.body.tasks || [],
    customFields: req.body.customFields || []
  });
  res.status(201).json(goal);
};

const updateGoal = async (req, res) => {
  const goal = await Goal.findById(req.params.id);
  if (!goal || goal.user.toString() !== req.user._id.toString()) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  const updatedGoal = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updatedGoal);
};

const deleteGoal = async (req, res) => {
  const goal = await Goal.findById(req.params.id);
  if (!goal || goal.user.toString() !== req.user._id.toString()) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  await goal.deleteOne();
  res.json({ id: req.params.id });
};

module.exports = { getGoals, setGoal, updateGoal, deleteGoal };
