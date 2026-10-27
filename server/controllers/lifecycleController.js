import { Employee } from '../models/Employee.js';
import { LifecycleCase } from '../models/LifecycleCase.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const taskStatuses = ['pending', 'in_progress', 'completed', 'skipped'];

const populateLifecycleCase = (query) => query
  .populate('employee', 'firstName lastName employeeCode department designation avatar joiningDate status')
  .populate('createdBy', 'firstName lastName')
  .populate('tasks.owner', 'firstName lastName employeeCode department');

// @route GET /api/lifecycle/my
export const getMyLifecycleCases = async (req, res) => {
  try {
    if (!req.user.employeeId) {
      return res.status(400).json({ success: false, message: 'No employee profile linked to this user' });
    }
    const cases = await populateLifecycleCase(LifecycleCase.find({
      $or: [
        { employee: req.user.employeeId },
        { 'tasks.owner': req.user.employeeId },
      ],
    }))
      .sort({ createdAt: -1 });
    const data = cases.map((lifecycleCase) => {
      const result = lifecycleCase.toObject();
      if (result.employee?._id?.toString() !== req.user.employeeId.toString()) {
        result.tasks = result.tasks.filter((task) => task.owner?._id?.toString() === req.user.employeeId.toString());
      }
      return result;
    });
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/lifecycle/all
export const getAllLifecycleCases = async (req, res) => {
  try {
    const { type = 'All', status = 'All', department = 'All' } = req.query;
    const query = {};
    if (type !== 'All') query.type = type;
    if (status !== 'All') query.status = status;
    let cases = await populateLifecycleCase(LifecycleCase.find(query)).sort({ startDate: -1 });
    if (department !== 'All') {
      cases = cases.filter((lifecycleCase) => lifecycleCase.employee?.department === department);
    }
    res.status(200).json({ success: true, count: cases.length, data: cases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/lifecycle
export const createLifecycleCase = async (req, res) => {
  try {
    const { employeeId, type, title, startDate, targetDate = null, tasks = [] } = req.body;
    if (!employeeId || !['onboarding', 'offboarding'].includes(type) || !title?.trim() || !startDate) {
      return res.status(400).json({ success: false, message: 'Employee, lifecycle type, title, and start date are required' });
    }
    if (!Array.isArray(tasks) || tasks.length === 0 || tasks.some((task) => !task.title?.trim())) {
      return res.status(400).json({ success: false, message: 'Add at least one checklist task with a title' });
    }
    if (targetDate && new Date(targetDate) < new Date(startDate)) {
      return res.status(400).json({ success: false, message: 'Target date cannot be before the start date' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    const normalizedTasks = [];
    for (const task of tasks) {
      const owner = task.owner || employee._id;
      const activeOwner = await Employee.exists({ _id: owner, status: { $ne: 'deactivated' } });
      if (!activeOwner) return res.status(400).json({ success: false, message: 'Every task owner must be an active employee' });
      normalizedTasks.push({
        title: task.title.trim(),
        description: task.description || '',
        category: task.category || 'other',
        owner,
        dueDate: task.dueDate || targetDate || null,
      });
    }

    const lifecycleCase = await LifecycleCase.create({
      employee: employee._id,
      type,
      title: title.trim(),
      startDate,
      targetDate: targetDate || null,
      tasks: normalizedTasks,
      createdBy: req.user.employeeId || null,
    });
    await logAuditEvent({
      req,
      action: `LIFECYCLE_${type.toUpperCase()}_CREATED`,
      entityType: 'LifecycleCase',
      entityId: lifecycleCase._id,
      details: `Created ${type} checklist for ${employee.firstName} ${employee.lastName}`,
    });
    const populated = await populateLifecycleCase(LifecycleCase.findById(lifecycleCase._id));
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PATCH /api/lifecycle/:id/tasks/:taskId
export const updateLifecycleTask = async (req, res) => {
  try {
    const { status, note = '' } = req.body;
    if (!taskStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Task status must be one of: ${taskStatuses.join(', ')}` });
    }
    const lifecycleCase = await LifecycleCase.findById(req.params.id);
    if (!lifecycleCase) return res.status(404).json({ success: false, message: 'Lifecycle checklist not found' });
    if (lifecycleCase.status !== 'active') {
      return res.status(400).json({ success: false, message: 'This lifecycle checklist is no longer active' });
    }

    const task = lifecycleCase.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Checklist task not found' });
    const isAdminOrManager = ['admin', 'manager'].includes(req.user.role?.toLowerCase());
    const isOwner = req.user.employeeId && task.owner?.toString() === req.user.employeeId.toString();
    if (!isAdminOrManager && !isOwner) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this checklist task' });
    }
    if (status === 'skipped' && !isAdminOrManager) {
      return res.status(403).json({ success: false, message: 'Only managers can skip checklist tasks' });
    }

    task.status = status;
    task.note = note.trim();
    task.completedAt = status === 'completed' ? task.completedAt || new Date() : null;
    const allTasksComplete = lifecycleCase.tasks.every((item) => ['completed', 'skipped'].includes(item.status));
    if (allTasksComplete) {
      lifecycleCase.status = 'completed';
      lifecycleCase.completedAt = new Date();
    }
    await lifecycleCase.save();

    await logAuditEvent({
      req,
      action: 'LIFECYCLE_TASK_UPDATED',
      entityType: 'LifecycleCase',
      entityId: lifecycleCase._id,
      details: `Updated '${task.title}' to ${status}`,
    });
    const populated = await populateLifecycleCase(LifecycleCase.findById(lifecycleCase._id));
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PATCH /api/lifecycle/:id/cancel
export const cancelLifecycleCase = async (req, res) => {
  try {
    const lifecycleCase = await LifecycleCase.findById(req.params.id);
    if (!lifecycleCase) return res.status(404).json({ success: false, message: 'Lifecycle checklist not found' });
    if (lifecycleCase.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Only active checklists can be cancelled' });
    }
    lifecycleCase.status = 'cancelled';
    await lifecycleCase.save();
    await logAuditEvent({
      req,
      action: 'LIFECYCLE_CASE_CANCELLED',
      entityType: 'LifecycleCase',
      entityId: lifecycleCase._id,
      details: `Cancelled ${lifecycleCase.type} checklist '${lifecycleCase.title}'`,
    });
    res.status(200).json({ success: true, data: lifecycleCase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};