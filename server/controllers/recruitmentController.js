import { JobOpening } from '../models/JobOpening.js';
import { Candidate } from '../models/Candidate.js';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { logAuditEvent } from '../utils/auditLogger.js';

// @desc    Get all job openings
// @route   GET /api/recruitment/jobs
export const getJobs = async (req, res) => {
  try {
    const jobs = await JobOpening.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create job opening
// @route   POST /api/recruitment/jobs
export const createJob = async (req, res) => {
  try {
    const job = await JobOpening.create(req.body);
    await logAuditEvent({
      req,
      action: 'JOB_OPENING_CREATED',
      entityType: 'Recruitment',
      entityId: job._id,
      details: `Created job posting for ${job.title} in ${job.department}`,
    });
    res.status(201).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all candidates
// @route   GET /api/recruitment/candidates
export const getCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find()
      .populate('jobOpening', 'title department')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: candidates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add candidate
// @route   POST /api/recruitment/candidates
export const addCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.create(req.body);
    await logAuditEvent({
      req,
      action: 'CANDIDATE_ADDED',
      entityType: 'Recruitment',
      entityId: candidate._id,
      details: `Added candidate ${candidate.name} for position ${candidate.jobTitle}`,
    });
    res.status(201).json({ success: true, data: candidate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update candidate stage (Kanban Drag/Drop)
// @route   PATCH /api/recruitment/candidates/:id/stage
export const updateCandidateStage = async (req, res) => {
  try {
    const { stage, notes } = req.body;
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    const prevStage = candidate.stage;
    candidate.stage = stage;
    if (notes) candidate.notes = notes;
    await candidate.save();

    await logAuditEvent({
      req,
      action: 'CANDIDATE_STAGE_MOVED',
      entityType: 'Recruitment',
      entityId: candidate._id,
      details: `Moved candidate ${candidate.name} from '${prevStage}' to '${stage}'`,
    });

    res.status(200).json({ success: true, data: candidate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Convert Hired Candidate to Employee
// @route   POST /api/recruitment/candidates/:id/convert-to-employee
export const convertCandidateToEmployee = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    // Check if already employee
    const existing = await Employee.findOne({ email: candidate.email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Employee with this email already exists' });
    }

    const count = await Employee.countDocuments();
    const employeeCode = `EMP-${(1000 + count + 1)}`;
    const [firstName, ...lastNames] = candidate.name.split(' ');
    const lastName = lastNames.join(' ') || 'Candidate';

    const employee = await Employee.create({
      employeeCode,
      firstName,
      lastName,
      email: candidate.email,
      phone: candidate.phone,
      department: req.body.department || 'Engineering',
      designation: candidate.jobTitle,
      role: 'employee',
      joiningDate: new Date(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}_${lastName}`,
    });

    const user = await User.create({
      email: employee.email,
      password: 'Password123!',
      role: 'employee',
      employeeId: employee._id,
    });

    employee.userId = user._id;
    await employee.save();

    candidate.stage = 'hired';
    await candidate.save();

    await logAuditEvent({
      req,
      action: 'CANDIDATE_HIRED_AND_ONBOARDED',
      entityType: 'Employee',
      entityId: employee._id,
      details: `Converted candidate ${candidate.name} to full Employee (${employee.employeeCode})`,
    });

    res.status(200).json({
      success: true,
      message: `Candidate converted to Employee (${employee.employeeCode}) successfully!`,
      data: employee,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
