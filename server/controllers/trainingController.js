import { Employee } from '../models/Employee.js';
import { TrainingCourse } from '../models/TrainingCourse.js';
import { TrainingEnrollment } from '../models/TrainingEnrollment.js';
import { logAuditEvent } from '../utils/auditLogger.js';

// @route GET /api/training/courses
export const getCourses = async (_req, res) => {
  try {
    const courses = await TrainingCourse.find({ status: 'active' }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/training/courses
export const createCourse = async (req, res) => {
  try {
    const { title, description, category, skills = [], provider, durationHours, format, courseUrl = '' } = req.body;
    if (!title?.trim() || !description?.trim() || !category?.trim() || !durationHours) {
      return res.status(400).json({ success: false, message: 'Title, description, category, and duration are required' });
    }
    if (!Number.isFinite(Number(durationHours)) || Number(durationHours) <= 0) {
      return res.status(400).json({ success: false, message: 'Duration must be a positive number of hours' });
    }
    if (courseUrl && !/^https?:\/\//i.test(courseUrl)) {
      return res.status(400).json({ success: false, message: 'Course URL must begin with http:// or https://' });
    }

    const course = await TrainingCourse.create({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      skills: Array.isArray(skills) ? skills.map((skill) => String(skill).trim()).filter(Boolean) : [],
      provider: provider?.trim() || 'Internal Learning',
      durationHours: Number(durationHours),
      format,
      courseUrl,
      createdBy: req.user.employeeId || null,
    });

    await logAuditEvent({
      req,
      action: 'TRAINING_COURSE_CREATED',
      entityType: 'TrainingCourse',
      entityId: course._id,
      details: `Created training course: ${course.title}`,
    });
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/training/my
export const getMyTraining = async (req, res) => {
  try {
    if (!req.user.employeeId) {
      return res.status(400).json({ success: false, message: 'No employee profile linked to this user' });
    }
    const enrollments = await TrainingEnrollment.find({ employee: req.user.employeeId })
      .populate('course')
      .sort({ updatedAt: -1 });
    res.status(200).json({ success: true, count: enrollments.length, data: enrollments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/training/team
export const getTeamTraining = async (_req, res) => {
  try {
    const enrollments = await TrainingEnrollment.find()
      .populate('employee', 'firstName lastName employeeCode department designation avatar')
      .populate('course', 'title category skills durationHours')
      .sort({ updatedAt: -1 });
    res.status(200).json({ success: true, count: enrollments.length, data: enrollments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/training/courses/:id/enroll
export const enrollInCourse = async (req, res) => {
  try {
    if (!req.user.employeeId) {
      return res.status(400).json({ success: false, message: 'No employee profile linked to this user' });
    }
    const course = await TrainingCourse.findOne({ _id: req.params.id, status: 'active' });
    if (!course) return res.status(404).json({ success: false, message: 'Active course not found' });

    const enrollment = await TrainingEnrollment.findOneAndUpdate(
      { employee: req.user.employeeId, course: course._id },
      { $setOnInsert: { employee: req.user.employeeId, course: course._id } },
      { new: true, upsert: true, runValidators: true }
    ).populate('course');

    await logAuditEvent({
      req,
      action: 'TRAINING_ENROLLED',
      entityType: 'TrainingEnrollment',
      entityId: enrollment._id,
      details: `Enrolled in training course: ${course.title}`,
    });
    res.status(200).json({ success: true, data: enrollment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PATCH /api/training/enrollments/:id/progress
export const updateTrainingProgress = async (req, res) => {
  try {
    const progress = Number(req.body.progress);
    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      return res.status(400).json({ success: false, message: 'Progress must be a whole number from 0 to 100' });
    }
    if (!req.user.employeeId) {
      return res.status(400).json({ success: false, message: 'No employee profile linked to this user' });
    }

    const enrollment = await TrainingEnrollment.findById(req.params.id).populate('course', 'title');
    if (!enrollment) return res.status(404).json({ success: false, message: 'Training enrollment not found' });
    if (enrollment.employee.toString() !== req.user.employeeId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only update your own training progress' });
    }

    enrollment.progress = progress;
    enrollment.status = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'enrolled';
    enrollment.completedAt = progress === 100 ? enrollment.completedAt || new Date() : null;
    await enrollment.save();

    await logAuditEvent({
      req,
      action: 'TRAINING_PROGRESS_UPDATED',
      entityType: 'TrainingEnrollment',
      entityId: enrollment._id,
      details: `Updated ${enrollment.course.title} progress to ${progress}%`,
    });
    res.status(200).json({ success: true, data: enrollment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PATCH /api/training/enrollments/:id/due-date
export const updateTrainingDueDate = async (req, res) => {
  try {
    const { dueDate } = req.body;
    if (dueDate && Number.isNaN(new Date(dueDate).getTime())) {
      return res.status(400).json({ success: false, message: 'Due date is invalid' });
    }
    const enrollment = await TrainingEnrollment.findByIdAndUpdate(
      req.params.id,
      { dueDate: dueDate || null },
      { new: true, runValidators: true }
    );
    if (!enrollment) return res.status(404).json({ success: false, message: 'Training enrollment not found' });
    res.status(200).json({ success: true, data: enrollment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEmployeesForTraining = async (_req, res) => {
  try {
    const employees = await Employee.find({ status: 'active' }).select('firstName lastName employeeCode department designation');
    res.status(200).json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};