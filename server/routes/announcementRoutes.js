import express from 'express';
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcementController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.route('/')
  .get(getAnnouncements)
  .post(authorizeRoles('admin', 'manager'), createAnnouncement);

router.delete('/:id', authorizeRoles('admin'), deleteAnnouncement);

export default router;
