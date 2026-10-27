import { Employee } from '../models/Employee.js';
import { Review } from '../models/Review.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const isValidRating = (rating) => Number.isInteger(Number(rating)) && Number(rating) >= 1 && Number(rating) <= 5;

// @route GET /api/reviews
export const getReviews = async (req, res) => {
  try {
    const { status = 'All', department = 'All' } = req.query;
    const query = {};
    if (status !== 'All') query.status = status;

    let reviews = await Review.find(query)
      .populate('employee', 'firstName lastName employeeCode department designation avatar manager')
      .populate('reviewer', 'firstName lastName')
      .sort({ dueDate: 1, updatedAt: -1 });

    if (department !== 'All') {
      reviews = reviews.filter((review) => review.employee?.department === department);
    }

    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/reviews/my
export const getMyReviews = async (req, res) => {
  try {
    if (!req.user.employeeId) {
      return res.status(400).json({ success: false, message: 'No employee profile linked to this user' });
    }

    const reviews = await Review.find({ employee: req.user.employeeId })
      .populate('employee', 'firstName lastName employeeCode department designation avatar')
      .populate('reviewer', 'firstName lastName')
      .sort({ periodEnd: -1, createdAt: -1 });

    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/reviews
export const createReview = async (req, res) => {
  try {
    const { employeeId, cycleName, periodStart, periodEnd, dueDate, goals = [] } = req.body;
    if (!employeeId || !cycleName?.trim() || !periodStart || !periodEnd) {
      return res.status(400).json({ success: false, message: 'Employee, cycle name, and review period are required' });
    }
    if (new Date(periodEnd) < new Date(periodStart)) {
      return res.status(400).json({ success: false, message: 'Review period end must be on or after its start' });
    }
    if (!Array.isArray(goals) || goals.some((goal) => !goal.title?.trim())) {
      return res.status(400).json({ success: false, message: 'Each goal must have a title' });
    }
    if (goals.length === 0) {
      return res.status(400).json({ success: false, message: 'Add at least one goal to the review cycle' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    if (req.user.employeeId && employee._id.toString() === req.user.employeeId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot create a review for yourself' });
    }

    const review = await Review.create({
      employee: employee._id,
      reviewer: req.user.employeeId || null,
      cycleName: cycleName.trim(),
      periodStart,
      periodEnd,
      dueDate: dueDate || null,
      goals: goals.map(({ title, description = '' }) => ({ title: title.trim(), description })),
    });

    await logAuditEvent({
      req,
      action: 'PERFORMANCE_REVIEW_CREATED',
      entityType: 'Review',
      entityId: review._id,
      details: `Created ${review.cycleName} review for ${employee.firstName} ${employee.lastName}`,
    });

    const populatedReview = await Review.findById(review._id)
      .populate('employee', 'firstName lastName employeeCode department designation avatar manager')
      .populate('reviewer', 'firstName lastName');
    res.status(201).json({ success: true, data: populatedReview });
  } catch (error) {
    const statusCode = error.code === 11000 ? 409 : 500;
    const message = error.code === 11000
      ? 'A review already exists for this employee and cycle'
      : error.message;
    res.status(statusCode).json({ success: false, message });
  }
};

// @route PATCH /api/reviews/:id/self
export const submitSelfReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (!req.user.employeeId || review.employee.toString() !== req.user.employeeId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only submit your own review' });
    }
    if (review.status !== 'self_review') {
      return res.status(400).json({ success: false, message: 'This review is no longer accepting a self-review' });
    }

    const { goals = [], employeeSummary = '' } = req.body;
    if (!Array.isArray(goals)) {
      return res.status(400).json({ success: false, message: 'Goals must be provided as a list' });
    }

    for (const goalUpdate of goals) {
      const goal = review.goals.id(goalUpdate.goalId);
      if (!goal) continue;
      if (goalUpdate.selfRating !== undefined && goalUpdate.selfRating !== null && !isValidRating(goalUpdate.selfRating)) {
        return res.status(400).json({ success: false, message: 'Goal ratings must be whole numbers from 1 to 5' });
      }
      if (goalUpdate.selfRating !== undefined) goal.selfRating = goalUpdate.selfRating;
      if (goalUpdate.selfComment !== undefined) goal.selfComment = goalUpdate.selfComment;
    }

    if (review.goals.some((goal) => !goal.selfRating)) {
      return res.status(400).json({ success: false, message: 'Rate every goal before submitting your self-review' });
    }

    review.employeeSummary = employeeSummary;
    review.status = 'manager_review';
    review.submittedAt = new Date();
    await review.save();

    await logAuditEvent({
      req,
      action: 'PERFORMANCE_SELF_REVIEW_SUBMITTED',
      entityType: 'Review',
      entityId: review._id,
      details: `Submitted self-review for ${review.cycleName}`,
    });

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PATCH /api/reviews/:id/manager
export const completeManagerReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate('employee', 'firstName lastName');
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (review.status !== 'manager_review') {
      return res.status(400).json({ success: false, message: 'The employee must submit their self-review first' });
    }
    const isAdmin = req.user.role?.toLowerCase() === 'admin';
    const isAssignedReviewer = req.user.employeeId && review.reviewer?.toString() === req.user.employeeId.toString();
    if (!isAdmin && !isAssignedReviewer) {
      return res.status(403).json({ success: false, message: 'Only the assigned reviewer can complete this review' });
    }

    const { goals = [], overallRating, managerSummary = '', strengths = '', improvementAreas = '' } = req.body;
    if (!isValidRating(overallRating)) {
      return res.status(400).json({ success: false, message: 'Overall rating must be a whole number from 1 to 5' });
    }
    if (!Array.isArray(goals)) {
      return res.status(400).json({ success: false, message: 'Goals must be provided as a list' });
    }

    for (const goalUpdate of goals) {
      const goal = review.goals.id(goalUpdate.goalId);
      if (!goal) continue;
      if (!isValidRating(goalUpdate.managerRating)) {
        return res.status(400).json({ success: false, message: 'Every goal needs a whole-number manager rating from 1 to 5' });
      }
      goal.managerRating = goalUpdate.managerRating;
      goal.managerComment = goalUpdate.managerComment || '';
    }

    if (review.goals.some((goal) => !goal.managerRating)) {
      return res.status(400).json({ success: false, message: 'Rate every goal before completing the review' });
    }

    review.reviewer = req.user.employeeId || review.reviewer;
    review.overallRating = overallRating;
    review.managerSummary = managerSummary;
    review.strengths = strengths;
    review.improvementAreas = improvementAreas;
    review.status = 'completed';
    review.completedAt = new Date();
    await review.save();

    await logAuditEvent({
      req,
      action: 'PERFORMANCE_REVIEW_COMPLETED',
      entityType: 'Review',
      entityId: review._id,
      details: `Completed ${review.cycleName} review for ${review.employee.firstName} ${review.employee.lastName}`,
    });

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};