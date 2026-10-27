import { Leave } from '../models/Leave.js';
import { Employee } from '../models/Employee.js';
import { logAuditEvent } from '../utils/auditLogger.js';

// @desc    Apply for Leave
// @route   POST /api/leaves/apply
export const applyLeave = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'No employee profile linked to user' });
    }

    const { leaveType, startDate, endDate, daysCount, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: 'All fields are required to apply for leave' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return res.status(400).json({ success: false, message: 'End date cannot be earlier than start date' });
    }

    const calculatedDays =
      Number(daysCount) || Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Check balance for non-unpaid leaves
    if (leaveType !== 'unpaid') {
      const currentBalance = employee.leaveBalances?.[leaveType] ?? 0;
      if (currentBalance < calculatedDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${leaveType} leave balance. Available: ${currentBalance} days, requested: ${calculatedDays} days.`,
        });
      }
    }

    const leave = await Leave.create({
      employee: employeeId,
      leaveType,
      startDate: start,
      endDate: end,
      daysCount: calculatedDays,
      reason,
      status: 'pending',
    });

    await logAuditEvent({
      req,
      action: 'LEAVE_APPLIED',
      entityType: 'Leave',
      entityId: leave._id,
      details: `Applied for ${calculatedDays} days of ${leaveType} leave (${start.toLocaleDateString()} - ${end.toLocaleDateString()})`,
    });

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: leave,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user's leave requests and balances
// @route   GET /api/leaves/my
export const getMyLeaves = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'No employee profile linked to user' });
    }

    const employee = await Employee.findById(employeeId).select('leaveBalances firstName lastName');
    const leaves = await Leave.find({ employee: employeeId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        balances: employee.leaveBalances,
        requests: leaves,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all leave requests (Admin/Manager)
// @route   GET /api/leaves/all
export const getAllLeaves = async (req, res) => {
  try {
    const { status = 'All', leaveType = 'All', department = 'All' } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }
    if (leaveType && leaveType !== 'All') {
      query.leaveType = leaveType;
    }

    let leaves = await Leave.find(query)
      .populate('employee', 'firstName lastName employeeCode department designation avatar leaveBalances')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    if (department && department !== 'All') {
      leaves = leaves.filter((l) => l.employee && l.employee.department === department);
    }

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Review leave (Approve or Reject)
// @route   PATCH /api/leaves/:id/review
export const reviewLeave = async (req, res) => {
  try {
    const { status, reviewNote } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'approved' or 'rejected'" });
    }

    const leave = await Leave.findById(req.params.id).populate('employee');
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This leave request is already marked as ${leave.status}`,
      });
    }

    const employee = await Employee.findById(leave.employee._id);

    // If approved, deduct balance
    if (status === 'approved' && leave.leaveType !== 'unpaid') {
      const currentBalance = employee.leaveBalances?.[leave.leaveType] || 0;
      if (currentBalance < leave.daysCount) {
        return res.status(400).json({
          success: false,
          message: `Cannot approve: Employee only has ${currentBalance} days left in ${leave.leaveType} balance.`,
        });
      }

      employee.leaveBalances[leave.leaveType] -= leave.daysCount;
      await employee.save();
    }

    leave.status = status;
    leave.reviewedBy = req.user.employeeId || null;
    leave.reviewerName = req.user.name || 'HR Management';
    leave.reviewNote = reviewNote || (status === 'approved' ? 'Leave approved' : 'Leave request declined');
    leave.reviewedAt = new Date();
    await leave.save();

    await logAuditEvent({
      req,
      action: `LEAVE_${status.toUpperCase()}`,
      entityType: 'Leave',
      entityId: leave._id,
      details: `${status.toUpperCase()} ${leave.daysCount} days of ${leave.leaveType} leave for ${employee.firstName} ${employee.lastName}`,
    });

    res.status(200).json({
      success: true,
      message: `Leave request has been ${status}`,
      data: leave,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get team leave calendar (Approved leaves)
// @route   GET /api/leaves/team-calendar
export const getTeamLeaveCalendar = async (req, res) => {
  try {
    const { month, year } = req.query;
    const query = { status: 'approved' };

    const approvedLeaves = await Leave.find(query)
      .populate('employee', 'firstName lastName department designation avatar employeeCode')
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      data: approvedLeaves,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
