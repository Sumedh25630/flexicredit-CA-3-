const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./db');

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

app.use(express.json());

let dbPromise;

const ensureDB = async () => {
  if (!dbPromise) {
    dbPromise = connectDB();
  }

  return dbPromise;
};

app.use(async (req, res, next) => {
  try {
    await ensureDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/schedules', require('./routes/scheduleRoutes'));
app.use('/api/goals', require('./routes/goalRoutes'));
app.use('/api/longschedules', require('./routes/longScheduleRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/code', require('./routes/codeRoutes'));

app.get('/', (req, res) => {
  res.json({
    message: 'Nightlist API is running'
  });
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;