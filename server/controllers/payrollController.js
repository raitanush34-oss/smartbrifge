import { Payroll } from '../models/Payroll.js';
import { Employee } from '../models/Employee.js';
import { generatePayslipPDF } from '../utils/pdfGenerator.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// @desc    Get Payroll overview summary stats
// @route   GET /api/payroll/summary
export const getPayrollSummary = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const records = await Payroll.find({ month: currentMonth, year: currentYear });
    const totalPayroll = records.reduce((acc, curr) => acc + (curr.netPay || 0), 0);
    const totalEarnings = records.reduce((acc, curr) => acc + (curr.totalEarnings || 0), 0);
    const totalDeductions = records.reduce((acc, curr) => acc + (curr.totalDeductions || 0), 0);

    const activeEmployeesCount = await Employee.countDocuments({ status: 'active' });

    res.status(200).json({
      success: true,
      data: {
        currentMonth: MONTH_NAMES[currentMonth - 1],
        currentYear,
        totalPayroll,
        totalEarnings,
        totalDeductions,
        processedCount: records.length,
        activeEmployeesCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all payroll records (Admin/HR)
// @route   GET /api/payroll/all
export const getAllPayroll = async (req, res) => {
  try {
    const { month, year, department } = req.query;
    const query = {};

    if (month && month !== 'All') query.month = Number(month);
    if (year && year !== 'All') query.year = Number(year);

    let records = await Payroll.find(query)
      .populate('employee', 'firstName lastName employeeCode department designation avatar salary email')
      .sort({ createdAt: -1 });

    if (department && department !== 'All') {
      records = records.filter((r) => r.employee && r.employee.department === department);
    }

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current employee's payslips
// @route   GET /api/payroll/my
export const getMyPayroll = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'No employee profile linked to user' });
    }

    const records = await Payroll.find({ employee: employeeId })
      .populate('employee', 'firstName lastName employeeCode department designation salary')
      .sort({ year: -1, month: -1 });

    res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate batch payroll for all active employees for given month & year
// @route   POST /api/payroll/generate-batch
export const generateBatchPayroll = async (req, res) => {
  try {
    const { month, year } = req.body;
    const targetMonth = Number(month) || new Date().getMonth() + 1;
    const targetYear = Number(year) || new Date().getFullYear();
    const monthName = MONTH_NAMES[targetMonth - 1];

    const activeEmployees = await Employee.find({ status: 'active' });
    let createdCount = 0;
    let updatedCount = 0;

    for (const emp of activeEmployees) {
      const basic = emp.salary?.basic || 45000;
      const hra = emp.salary?.hra || 18000;
      const allowances = emp.salary?.allowances || 7000;
      const pf = emp.salary?.pf || 3500;
      const deductions = emp.salary?.deductions || 2000;
      const tax = Math.round(basic * 0.1); // 10% standard tax estimate
      const totalEarnings = basic + hra + allowances;
      const totalDeductions = pf + deductions + tax;
      const netPay = totalEarnings - totalDeductions;

      const existing = await Payroll.findOne({
        employee: emp._id,
        month: targetMonth,
        year: targetYear,
      });

      if (existing) {
        existing.basic = basic;
        existing.hra = hra;
        existing.allowances = allowances;
        existing.pf = pf;
        existing.tax = tax;
        existing.deductions = deductions;
        existing.totalEarnings = totalEarnings;
        existing.totalDeductions = totalDeductions;
        existing.netPay = netPay;
        existing.monthName = monthName;
        existing.paymentStatus = 'paid';
        await existing.save();
        updatedCount++;
      } else {
        await Payroll.create({
          employee: emp._id,
          month: targetMonth,
          year: targetYear,
          monthName,
          basic,
          hra,
          allowances,
          bonus: 0,
          pf,
          tax,
          deductions,
          totalEarnings,
          totalDeductions,
          netPay,
          paymentStatus: 'paid',
          paymentDate: new Date(),
        });
        createdCount++;
      }
    }

    await logAuditEvent({
      req,
      action: 'BATCH_PAYROLL_GENERATED',
      entityType: 'Payroll',
      details: `Generated payroll for ${monthName} ${targetYear} (${createdCount} created, ${updatedCount} updated)`,
    });

    res.status(200).json({
      success: true,
      message: `Payroll processed for ${monthName} ${targetYear}: ${createdCount} generated, ${updatedCount} updated.`,
      data: { createdCount, updatedCount, month: monthName, year: targetYear },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download PDF Payslip using pdfkit
// @route   GET /api/payroll/:id/download-pdf
export const downloadPayslipPDF = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate('employee');
    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    // Role check: Employee can only download their own payslip
    const isSelf = req.user.employeeId && req.user.employeeId.toString() === payroll.employee._id.toString();
    const isAdminOrHR = ['admin', 'manager'].includes(req.user.role);

    if (!isAdminOrHR && !isSelf) {
      return res.status(403).json({ success: false, message: 'Access forbidden to this payslip' });
    }

    const filename = `Payslip_${payroll.employee.employeeCode || 'EMP'}_${payroll.monthName}_${payroll.year}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    generatePayslipPDF(payroll, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
