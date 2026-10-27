import express from 'express';
import {
  createDepartment,
  getOrgStructure,
  updateDepartment,
  updateReportingLine,
} from '../controllers/orgController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verifyToken);
router.get('/structure', getOrgStructure);
router.post('/departments', authorizeRoles('admin', 'manager'), createDepartment);
router.patch('/departments/:id', authorizeRoles('admin', 'manager'), updateDepartment);
router.patch('/employees/:id/reporting', authorizeRoles('admin', 'manager'), updateReportingLine);

export default router;