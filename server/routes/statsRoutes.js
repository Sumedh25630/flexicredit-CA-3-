const express = require('express');
const router = express.Router();
const { getStats, updateStats } = require('../controllers/statsController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getStats).put(protect, updateStats);

module.exports = router;
