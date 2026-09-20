const express = require('express');
const router = express.Router();
const { getLongSchedules, setLongSchedule, updateLongSchedule, deleteLongSchedule } = require('../controllers/longScheduleController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getLongSchedules).post(protect, setLongSchedule);
router.route('/:id').put(protect, updateLongSchedule).delete(protect, deleteLongSchedule);

module.exports = router;
