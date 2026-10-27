import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { logAuditEvent } from '../utils/auditLogger.js';

// @desc    Get all employees with pagination, search, and department/status filters
// @route   GET /api/employees
export const getEmployees = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      department = '',
      status = '',
      sort = '-createdAt',
    } = req.query;

    const query = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { employeeCode: searchRegex },
        { designation: searchRegex },
      ];
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .populate('manager', 'firstName lastName email designation')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: employees,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single employee by ID
// @route   GET /api/employees/:id
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('manager', 'firstName lastName email designation phone avatar')
      .populate('userId', 'email role isActive lastLogin');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new employee (Admin/HR only)
// @route   POST /api/employees
export const createEmployee = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      department,
      designation,
      role = 'employee',
      manager,
      salary,
      joiningDate,
      dob,
      workLocation,
      avatar,
      initialPassword = 'Password123!',
    } = req.body;

    // Check email uniqueness
    const existingEmployee = await Employee.findOne({ email: email.toLowerCase().trim() });
    if (existingEmployee) {
      return res.status(400).json({ success: false, message: 'Employee with this email already exists' });
    }

    // Auto-generate employee code
    const count = await Employee.countDocuments();
    const employeeCode = `EMP-${(1000 + count + 1)}`;

    // Calculate Net Pay from salary structure
    const basic = Number(salary?.basic || 45000);
    const hra = Number(salary?.hra || 18000);
    const allowances = Number(salary?.allowances || 7000);
    const pf = Number(salary?.pf || 3500);
    const deductions = Number(salary?.deductions || 2000);
    const netPay = basic + hra + allowances - pf - deductions;

    const employee = await Employee.create({
      employeeCode,
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      phone: phone || '',
      department: department || 'Engineering',
      designation: designation || 'Specialist',
      role,
      manager: manager || null,
      joiningDate: joiningDate || new Date(),
      dob: dob || null,
      workLocation: workLocation || 'Headquarters (Hybrid)',
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}_${lastName}`,
      salary: {
        basic,
        hra,
        allowances,
        deductions,
        pf,
        netPay,
      },
      leaveBalances: {
        casual: 12,
        sick: 10,
        paid: 18,
      },
    });

    // Create linked user login account
    let user = await User.findOne({ email: employee.email });
    if (!user) {
      user = await User.create({
        email: employee.email,
        password: initialPassword,
        role: employee.role,
        employeeId: employee._id,
      });
      employee.userId = user._id;
      await employee.save();
    }

    await logAuditEvent({
      req,
      action: 'EMPLOYEE_CREATED',
      entityType: 'Employee',
      entityId: employee._id,
      details: `Created employee ${employee.firstName} ${employee.lastName} (${employee.employeeCode}) in ${employee.department}`,
    });

    res.status(201).json({
      success: true,
      message: 'Employee and user login created successfully',
      data: employee,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
export const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Role check: employees can only update their own phone or avatar, managers/admin can update full
    const isSelf = req.user.employeeId && req.user.employeeId.toString() === req.params.id;
    const isAdminOrHR = ['admin', 'manager'].includes(req.user.role);

    if (!isAdminOrHR && !isSelf) {
      return res.status(403).json({ success: false, message: 'Permission denied to edit this profile' });
    }

    const {
      firstName,
      lastName,
      phone,
      department,
      designation,
      role,
      manager,
      salary,
      workLocation,
      avatar,
      dob,
    } = req.body;

    if (firstName) employee.firstName = firstName;
    if (lastName) employee.lastName = lastName;
    if (phone !== undefined) employee.phone = phone;
    if (avatar) employee.avatar = avatar;
    if (dob) employee.dob = dob;

    if (isAdminOrHR) {
      if (department) employee.department = department;
      if (designation) employee.designation = designation;
      if (manager !== undefined) employee.manager = manager || null;
      if (workLocation) employee.workLocation = workLocation;

      if (role && role !== employee.role) {
        employee.role = role;
        if (employee.userId) {
          await User.findByIdAndUpdate(employee.userId, { role });
        }
      }

      if (salary) {
        const basic = Number(salary.basic ?? employee.salary.basic);
        const hra = Number(salary.hra ?? employee.salary.hra);
        const allowances = Number(salary.allowances ?? employee.salary.allowances);
        const pf = Number(salary.pf ?? employee.salary.pf);
        const deductions = Number(salary.deductions ?? employee.salary.deductions);
        employee.salary = {
          basic,
          hra,
          allowances,
          pf,
          deductions,
          netPay: basic + hra + allowances - pf - deductions,
        };
      }
    }

    const updatedEmployee = await employee.save();

    await logAuditEvent({
      req,
      action: 'EMPLOYEE_UPDATED',
      entityType: 'Employee',
      entityId: employee._id,
      details: `Updated details for ${employee.firstName} ${employee.lastName}`,
    });

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change employee active status (Activate / Deactivate)
// @route   PATCH /api/employees/:id/status
export const toggleEmployeeStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'active', 'deactivated', 'on_leave'
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    employee.status = status || (employee.status === 'active' ? 'deactivated' : 'active');
    await employee.save();

    // Toggle linked user account active status
    if (employee.userId) {
      await User.findByIdAndUpdate(employee.userId, {
        isActive: employee.status === 'active',
      });
    }

    await logAuditEvent({
      req,
      action: 'EMPLOYEE_STATUS_CHANGED',
      entityType: 'Employee',
      entityId: employee._id,
      details: `Changed status of ${employee.firstName} ${employee.lastName} to ${employee.status}`,
    });

    res.status(200).json({
      success: true,
      message: `Employee marked as ${employee.status}`,
      data: employee,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload document for employee
// @route   POST /api/employees/:id/documents
export const uploadDocument = async (req, res) => {
  try {
    const { title, fileUrl, category = 'other', expiresAt = null } = req.body;
    if (!title || !fileUrl) {
      return res.status(400).json({ success: false, message: 'Title and fileUrl are required' });
    }

    const allowedCategories = ['identity', 'tax', 'employment', 'education', 'banking', 'other'];
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid document category' });
    }
    try {
      const url = new URL(fileUrl);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid protocol');
    } catch {
      return res.status(400).json({ success: false, message: 'Document URL must be a valid HTTP or HTTPS link' });
    }
    if (expiresAt && Number.isNaN(new Date(expiresAt).getTime())) {
      return res.status(400).json({ success: false, message: 'Document expiry date is invalid' });
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const isSelf = req.user.employeeId && req.user.employeeId.toString() === employee._id.toString();
    const isAdminOrManager = ['admin', 'manager'].includes(req.user.role?.toLowerCase());
    if (!isSelf && !isAdminOrManager) {
      return res.status(403).json({ success: false, message: 'You can only add documents to your own profile' });
    }

    employee.documents.push({
      title: title.trim(),
      fileUrl,
      category,
      expiresAt: expiresAt || null,
      uploadedAt: new Date(),
    });

    await employee.save();

    await logAuditEvent({
      req,
      action: 'DOCUMENT_UPLOADED',
      entityType: 'Employee',
      entityId: employee._id,
      details: `Uploaded document '${title}' for ${employee.firstName} ${employee.lastName}`,
    });

    res.status(200).json({
      success: true,
      message: 'Document attached successfully',
      data: employee.documents,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
