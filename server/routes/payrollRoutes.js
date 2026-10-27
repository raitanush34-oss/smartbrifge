import express from 'express';
import {
  getPayrollSummary,
  getAllPayroll,
  getMyPayroll,
  generateBatchPayroll,
  downloadPayslipPDF,
} from '../controllers/payrollController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/summary', authorizeRoles('admin', 'manager'), getPayrollSummary);
router.get('/all', authorizeRoles('admin', 'manager'), getAllPayroll);
router.get('/my', getMyPayroll);
router.post('/generate-batch', authorizeRoles('admin', 'manager'), generateBatchPayroll);
router.get('/:id/download-pdf', downloadPayslipPDF);

export default router;
