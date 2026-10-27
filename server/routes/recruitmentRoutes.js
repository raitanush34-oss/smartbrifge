import express from 'express';
import {
  getJobs,
  createJob,
  getCandidates,
  addCandidate,
  updateCandidateStage,
  convertCandidateToEmployee,
} from '../controllers/recruitmentController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.route('/jobs').get(getJobs).post(authorizeRoles('admin', 'manager'), createJob);
router.route('/candidates').get(getCandidates).post(authorizeRoles('admin', 'manager'), addCandidate);
router.patch('/candidates/:id/stage', authorizeRoles('admin', 'manager'), updateCandidateStage);
router.post('/candidates/:id/convert-to-employee', authorizeRoles('admin', 'manager'), convertCandidateToEmployee);

export default router;
