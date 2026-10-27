import express from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  toggleEmployeeStatus,
  uploadDocument,
} from '../controllers/employeeController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router
  .route('/')
  .get(getEmployees)
  .post(authorizeRoles('admin', 'manager'), createEmployee);

router
  .route('/:id')
  .get(getEmployeeById)
  .put(updateEmployee);

router.patch('/:id/status', authorizeRoles('admin', 'manager'), toggleEmployeeStatus);
router.post('/:id/documents', uploadDocument);

export default router;
