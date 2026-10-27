import express from 'express';
import {
  completeManagerReview,
  createReview,
  getMyReviews,
  getReviews,
  submitSelfReview,
} from '../controllers/reviewController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verifyToken);
router.get('/my', getMyReviews);
router.get('/', authorizeRoles('admin', 'manager'), getReviews);
router.post('/', authorizeRoles('admin', 'manager'), createReview);
router.patch('/:id/self', submitSelfReview);
router.patch('/:id/manager', authorizeRoles('admin', 'manager'), completeManagerReview);

export default router;