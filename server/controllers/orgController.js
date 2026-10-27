import { Department } from '../models/Department.js';
import { Employee } from '../models/Employee.js';
import { logAuditEvent } from '../utils/auditLogger.js';

// @route GET /api/org/structure
export const getOrgStructure = async (_req, res) => {
  try {
    const [employees, departments] = await Promise.all([
      Employee.find({ status: { $ne: 'deactivated' } })
        .select('firstName lastName employeeCode email department designation role manager avatar status workLocation')
        .populate('manager', 'firstName lastName employeeCode designation department avatar'),
      Department.find().populate('head', 'firstName lastName employeeCode designation avatar'),
    ]);

    const departmentMap = new Map(departments.map((department) => [department.name, department.toObject()]));
    for (const employee of employees) {
      if (!departmentMap.has(employee.department)) {
        departmentMap.set(employee.department, {
          _id: null,
          name: employee.department,
          code: '',
          description: '',
          head: null,
          isDirectoryOnly: true,
        });
      }
    }

    const structure = Array.from(departmentMap.values())
      .map((department) => {
        const departmentEmployees = employees.filter((employee) => employee.department === department.name);
        const headId = department.head?._id?.toString();
        return {
          ...department,
          employeeCount: departmentEmployees.length,
          employees: departmentEmployees,
          head: department.head || departmentEmployees.find((employee) => employee.role === 'manager') || null,
          headId,
        };
      })
      .sort((left, right) => left.name.localeCompare(right.name));

    res.status(200).json({ success: true, data: structure });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/org/departments
export const createDepartment = async (req, res) => {
  try {
    const { name, code, description = '', head = null } = req.body;
    if (!name?.trim() || !code?.trim()) {
      return res.status(400).json({ success: false, message: 'Department name and code are required' });
    }
    if (head) {
      const headEmployee = await Employee.findOne({ _id: head, status: { $ne: 'deactivated' } });
      if (!headEmployee) return res.status(400).json({ success: false, message: 'Department head must be an active employee' });
    }

    const department = await Department.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim(),
      head,
    });
    await logAuditEvent({
      req,
      action: 'DEPARTMENT_CREATED',
      entityType: 'Department',
      entityId: department._id,
      details: `Created department ${department.name} (${department.code})`,
    });
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    const statusCode = error.code === 11000 ? 409 : 500;
    const message = error.code === 11000 ? 'Department name or code already exists' : error.message;
    res.status(statusCode).json({ success: false, message });
  }
};

// @route PATCH /api/org/departments/:id
export const updateDepartment = async (req, res) => {
  try {
    const { name, code, description, head } = req.body;
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ success: false, message: 'Department not found' });

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ success: false, message: 'Department name cannot be empty' });
    }
    if (code !== undefined && !code.trim()) {
      return res.status(400).json({ success: false, message: 'Department code cannot be empty' });
    }
    if (head) {
      const headEmployee = await Employee.findOne({ _id: head, status: { $ne: 'deactivated' } });
      if (!headEmployee) return res.status(400).json({ success: false, message: 'Department head must be an active employee' });
    }

    const previousName = department.name;
    if (name !== undefined) department.name = name.trim();
    if (code !== undefined) department.code = code.trim().toUpperCase();
    if (description !== undefined) department.description = description.trim();
    if (head !== undefined) department.head = head || null;
    await department.save();

    if (previousName !== department.name) {
      await Employee.updateMany({ department: previousName }, { $set: { department: department.name } });
    }

    await logAuditEvent({
      req,
      action: 'DEPARTMENT_UPDATED',
      entityType: 'Department',
      entityId: department._id,
      details: `Updated department ${department.name}`,
    });
    res.status(200).json({ success: true, data: department });
  } catch (error) {
    const statusCode = error.code === 11000 ? 409 : 500;
    const message = error.code === 11000 ? 'Department name or code already exists' : error.message;
    res.status(statusCode).json({ success: false, message });
  }
};

// @route PATCH /api/org/employees/:id/reporting
export const updateReportingLine = async (req, res) => {
  try {
    const { managerId = null, department } = req.body;
    const employee = await Employee.findById(req.params.id);
    if (!employee || employee.status === 'deactivated') {
      return res.status(404).json({ success: false, message: 'Active employee not found' });
    }

    if (managerId) {
      if (managerId === req.params.id) {
        return res.status(400).json({ success: false, message: 'An employee cannot report to themselves' });
      }
      let currentManager = await Employee.findOne({ _id: managerId, status: { $ne: 'deactivated' } }).select('manager');
      if (!currentManager) {
        return res.status(400).json({ success: false, message: 'Reporting manager must be an active employee' });
      }
      const visited = new Set();
      while (currentManager) {
        const currentId = currentManager._id.toString();
        if (currentId === req.params.id || visited.has(currentId)) {
          return res.status(400).json({ success: false, message: 'This reporting change would create a management cycle' });
        }
        visited.add(currentId);
        currentManager = currentManager.manager
          ? await Employee.findById(currentManager.manager).select('manager')
          : null;
      }
    }

    if (department !== undefined) {
      if (!department.trim()) return res.status(400).json({ success: false, message: 'Department cannot be empty' });
      const knownDepartment = await Department.exists({ name: department.trim() });
      const employeeHasDepartment = await Employee.exists({ department: department.trim() });
      if (!knownDepartment && !employeeHasDepartment) {
        return res.status(400).json({ success: false, message: 'Create the department before assigning employees to it' });
      }
      employee.department = department.trim();
    }

    employee.manager = managerId || null;
    await employee.save();
    const updated = await Employee.findById(employee._id)
      .populate('manager', 'firstName lastName employeeCode designation department avatar');

    await logAuditEvent({
      req,
      action: 'ORG_REPORTING_LINE_UPDATED',
      entityType: 'Employee',
      entityId: employee._id,
      details: `Updated reporting line and department for ${employee.firstName} ${employee.lastName}`,
    });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};