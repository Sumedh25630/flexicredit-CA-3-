const Settings = require('../models/Settings');

const getSettings = async (req, res) => {
  let settings = await Settings.findOne({ user: req.user._id });
  if (!settings) {
    settings = await Settings.create({ user: req.user._id });
  }
  res.json(settings);
};

const updateSettings = async (req, res) => {
  let settings = await Settings.findOne({ user: req.user._id });
  if (!settings) {
    settings = await Settings.create({ user: req.user._id, ...req.body });
    return res.status(201).json(settings);
  }
  
  const updatedSettings = await Settings.findByIdAndUpdate(settings._id, req.body, { new: true });
  res.json(updatedSettings);
};

module.exports = { getSettings, updateSettings };
