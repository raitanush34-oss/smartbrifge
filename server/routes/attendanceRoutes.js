import express from 'express';
import {
  checkIn,
  checkOut,
  getTodayStatus,
  getMyAttendance,
  getAdminReport,
  exportAttendanceCSV,
} from '../controllers/attendanceController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/today', getTodayStatus);
router.get('/my', getMyAttendance);
router.get('/admin-report', authorizeRoles('admin', 'manager'), getAdminReport);
router.get('/export-csv', authorizeRoles('admin', 'manager'), exportAttendanceCSV);

export default router;
