const Stats = require('../models/Stats');

const getStats = async (req, res) => {
  let stats = await Stats.findOne({ user: req.user._id });
  if(!stats) {
    stats = await Stats.create({ user: req.user._id });
  }
  res.json(stats);
};

const updateStats = async (req, res) => {
  let stats = await Stats.findOne({ user: req.user._id });
  if (!stats) {
    stats = await Stats.create({ user: req.user._id, ...req.body });
    return res.status(201).json(stats);
  }
  
  const updatedStats = await Stats.findByIdAndUpdate(stats._id, req.body, { new: true });
  res.json(updatedStats);
};

module.exports = { getStats, updateStats };
