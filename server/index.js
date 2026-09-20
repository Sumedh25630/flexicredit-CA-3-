const express = require('express');
const cors = require('cors'); // Trigger restart

const dotenv = require('dotenv');
const connectDB = require('./db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

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
  res.send('Nightlist API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
