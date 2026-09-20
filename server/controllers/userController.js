const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Stats = require('../models/Stats');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, familyCode } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please add all fields' });
    }
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const user = await User.create({ name, email, password, familyCode: familyCode || '' });
    if (user) {
      await Stats.create({ user: user._id }); // Create initial stats for user
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        familyCode: user.familyCode,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        familyCode: user.familyCode,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMe = async (req, res) => {
  res.json(req.user);
};

const updateFamilyCode = async (req, res) => {
  try {
    const { familyCode } = req.body;
    const user = await User.findById(req.user._id);
    if(user) {
      user.familyCode = familyCode || '';
      await user.save();
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        familyCode: user.familyCode,
        token: generateToken(user._id)
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { registerUser, loginUser, getMe, updateFamilyCode };
