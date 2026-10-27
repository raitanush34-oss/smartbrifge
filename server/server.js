import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { User } from './models/User.js';
import { seedDatabase } from './utils/seeder.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import payrollRoutes from './routes/payrollRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import recruitmentRoutes from './routes/recruitmentRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import trainingRoutes from './routes/trainingRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import orgRoutes from './routes/orgRoutes.js';
import lifecycleRoutes from './routes/lifecycleRoutes.js';
import assetRoutes from './routes/assetRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', '*'],
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    platform: 'StaffSync HRMS Enterprise API',
    timestamp: new Date().toISOString(),
  });
});

// Seed API endpoint for easy data reset
app.post('/api/seed', async (req, res) => {
  try {
    await seedDatabase();
    res.status(200).json({ success: true, message: 'Database seeded with enterprise HRMS demo records!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/lifecycle', lifecycleRoutes);
app.use('/api/assets', assetRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Start server after connecting to database
const startServer = async () => {
  const isConnected = await connectDB();

  if (isConnected) {
    try {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('No users found in database. Auto-populating initial enterprise seed data...');
        await seedDatabase();
      }
    } catch (e) {
      console.log('Auto-seed check note:', e.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`\x1b[32m✔ StaffSync Backend Server running on port ${PORT}\x1b[0m`);
    console.log(`\x1b[36m👉 API Health Check: http://localhost:${PORT}/api/health\x1b[0m`);
  });
};

startServer();
