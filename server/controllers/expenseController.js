import { Employee } from '../models/Employee.js';
import { ExpenseClaim } from '../models/ExpenseClaim.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const isValidReceiptUrl = (value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};

// @route POST /api/expenses
export const createExpenseClaim = async (req, res) => {
  try {
    const { category, merchant, amount, expenseDate, description, receiptUrl = '' } = req.body;
    if (!req.user.employeeId) {
      return res.status(400).json({ success: false, message: 'No employee profile linked to this user' });
    }
    if (!category || !merchant?.trim() || !amount || !expenseDate || !description?.trim()) {
      return res.status(400).json({ success: false, message: 'Category, merchant, amount, date, and description are required' });
    }
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than zero' });
    }
    if (Number(amount) > 10000000) {
      return res.status(400).json({ success: false, message: 'Claim amount exceeds the allowed limit' });
    }
    if (Number.isNaN(new Date(expenseDate).getTime())) {
      return res.status(400).json({ success: false, message: 'Expense date is invalid' });
    }
    if (!isValidReceiptUrl(receiptUrl)) {
      return res.status(400).json({ success: false, message: 'Receipt link must be a valid HTTP or HTTPS URL' });
    }

    const claim = await ExpenseClaim.create({
      employee: req.user.employeeId,
      category,
      merchant: merchant.trim(),
      amount: Number(amount),
      expenseDate,
      description: description.trim(),
      receiptUrl: receiptUrl.trim(),
    });

    await logAuditEvent({
      req,
      action: 'EXPENSE_CLAIM_SUBMITTED',
      entityType: 'ExpenseClaim',
      entityId: claim._id,
      details: `Submitted ${category} expense claim for INR ${claim.amount}`,
    });

    res.status(201).json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/expenses/my
export const getMyExpenseClaims = async (req, res) => {
  try {
    if (!req.user.employeeId) {
      return res.status(400).json({ success: false, message: 'No employee profile linked to this user' });
    }
    const claims = await ExpenseClaim.find({ employee: req.user.employeeId })
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: claims.length, data: claims });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/expenses/all
export const getAllExpenseClaims = async (req, res) => {
  try {
    const { status = 'All', department = 'All' } = req.query;
    const query = {};
    if (status !== 'All') query.status = status;

    let claims = await ExpenseClaim.find(query)
      .populate('employee', 'firstName lastName employeeCode department designation avatar')
      .populate('reviewedBy', 'firstName lastName')
      .populate('reimbursedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    if (department !== 'All') {
      claims = claims.filter((claim) => claim.employee?.department === department);
    }
    res.status(200).json({ success: true, count: claims.length, data: claims });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PATCH /api/expenses/:id/review
export const reviewExpenseClaim = async (req, res) => {
  try {
    const { status, reviewNote = '' } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }
    const claim = await ExpenseClaim.findById(req.params.id).populate('employee', 'firstName lastName');
    if (!claim) return res.status(404).json({ success: false, message: 'Expense claim not found' });
    if (claim.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending expense claims can be reviewed' });
    }
    if (req.user.employeeId && claim.employee._id.toString() === req.user.employeeId.toString()) {
      return res.status(403).json({ success: false, message: 'You cannot review your own expense claim' });
    }

    claim.status = status;
    claim.reviewedBy = req.user.employeeId || null;
    claim.reviewerName = req.user.name || 'HR Management';
    claim.reviewNote = reviewNote.trim();
    claim.reviewedAt = new Date();
    await claim.save();

    await logAuditEvent({
      req,
      action: `EXPENSE_CLAIM_${status.toUpperCase()}`,
      entityType: 'ExpenseClaim',
      entityId: claim._id,
      details: `${status.toUpperCase()} INR ${claim.amount} expense claim for ${claim.employee.firstName} ${claim.employee.lastName}`,
    });
    res.status(200).json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PATCH /api/expenses/:id/reimburse
export const reimburseExpenseClaim = async (req, res) => {
  try {
    const claim = await ExpenseClaim.findById(req.params.id);
    if (!claim) return res.status(404).json({ success: false, message: 'Expense claim not found' });
    if (claim.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Only approved claims can be marked reimbursed' });
    }

    claim.status = 'reimbursed';
    claim.reimbursedBy = req.user.employeeId || null;
    claim.reimbursedAt = new Date();
    await claim.save();

    await logAuditEvent({
      req,
      action: 'EXPENSE_CLAIM_REIMBURSED',
      entityType: 'ExpenseClaim',
      entityId: claim._id,
      details: `Marked INR ${claim.amount} expense claim as reimbursed`,
    });
    res.status(200).json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/expenses/departments
export const getExpenseDepartments = async (_req, res) => {
  try {
    const departments = await Employee.distinct('department', { status: 'active' });
    res.status(200).json({ success: true, data: departments.sort() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};