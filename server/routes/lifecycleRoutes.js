import express from 'express';
import {
  cancelLifecycleCase,
  createLifecycleCase,
  getAllLifecycleCases,
  getMyLifecycleCases,
  updateLifecycleTask,
} from '../controllers/lifecycleController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verifyToken);
router.get('/my', getMyLifecycleCases);
router.get('/all', authorizeRoles('admin', 'manager'), getAllLifecycleCases);
router.post('/', authorizeRoles('admin', 'manager'), createLifecycleCase);
router.patch('/:id/tasks/:taskId', updateLifecycleTask);
router.patch('/:id/cancel', authorizeRoles('admin', 'manager'), cancelLifecycleCase);

export default router;