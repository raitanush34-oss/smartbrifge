import express from 'express';
import {
  createCourse,
  enrollInCourse,
  getCourses,
  getEmployeesForTraining,
  getMyTraining,
  getTeamTraining,
  updateTrainingDueDate,
  updateTrainingProgress,
} from '../controllers/trainingController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verifyToken);
router.get('/courses', getCourses);
router.post('/courses', authorizeRoles('admin', 'manager'), createCourse);
router.post('/courses/:id/enroll', enrollInCourse);
router.get('/my', getMyTraining);
router.get('/employees', authorizeRoles('admin', 'manager'), getEmployeesForTraining);
router.get('/team', authorizeRoles('admin', 'manager'), getTeamTraining);
router.patch('/enrollments/:id/progress', updateTrainingProgress);
router.patch('/enrollments/:id/due-date', authorizeRoles('admin', 'manager'), updateTrainingDueDate);

export default router;