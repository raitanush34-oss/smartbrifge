import express from 'express';
import {
  createExpenseClaim,
  getAllExpenseClaims,
  getExpenseDepartments,
  getMyExpenseClaims,
  reimburseExpenseClaim,
  reviewExpenseClaim,
} from '../controllers/expenseController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verifyToken);
router.post('/', createExpenseClaim);
router.get('/my', getMyExpenseClaims);
router.get('/departments', authorizeRoles('admin', 'manager'), getExpenseDepartments);
router.get('/all', authorizeRoles('admin', 'manager'), getAllExpenseClaims);
router.patch('/:id/review', authorizeRoles('admin', 'manager'), reviewExpenseClaim);
router.patch('/:id/reimburse', authorizeRoles('admin', 'manager'), reimburseExpenseClaim);

export default router;