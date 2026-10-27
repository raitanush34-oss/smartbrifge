import express from 'express';
import {
  assignAsset,
  createAsset,
  getAssets,
  getMyAssets,
  returnAsset,
  updateAssetStatus,
} from '../controllers/assetController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verifyToken);
router.get('/my', getMyAssets);
router.get('/', authorizeRoles('admin', 'manager'), getAssets);
router.post('/', authorizeRoles('admin', 'manager'), createAsset);
router.post('/:id/assign', authorizeRoles('admin', 'manager'), assignAsset);
router.patch('/:id/return', returnAsset);
router.patch('/:id/status', authorizeRoles('admin', 'manager'), updateAssetStatus);

export default router;