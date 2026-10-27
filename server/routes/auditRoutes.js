import express from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verifyToken);
router.use(authorizeRoles('admin', 'manager'));

// @desc    Get audit logs with search & filters
// @route   GET /api/audit
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, entityType, action, search } = req.query;
    const query = {};

    if (entityType && entityType !== 'All') {
      query.entityType = entityType;
    }
    if (action && action !== 'All') {
      query.action = action;
    }
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { actorName: searchRegex },
        { details: searchRegex },
        { action: searchRegex },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
