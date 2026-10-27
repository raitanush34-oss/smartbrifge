import express from 'express';
import {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  reviewLeave,
  getTeamLeaveCalendar,
} from '../controllers/leaveController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.post('/apply', applyLeave);
router.get('/my', getMyLeaves);
router.get('/all', authorizeRoles('admin', 'manager'), getAllLeaves);
router.patch('/:id/review', authorizeRoles('admin', 'manager'), reviewLeave);
router.get('/team-calendar', getTeamLeaveCalendar);

export default router;
