import { Attendance } from '../models/Attendance.js';
import { Employee } from '../models/Employee.js';
import { logAuditEvent } from '../utils/auditLogger.js';

// Format Date string as YYYY-MM-DD
const getTodayDateString = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// @desc    Employee Check-in
// @route   POST /api/attendance/check-in
export const checkIn = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'No employee profile linked to this user' });
    }

    const todayDate = getTodayDateString();
    let record = await Attendance.findOne({ employee: employeeId, date: todayDate });

    if (record && record.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in today at ' + new Date(record.checkIn).toLocaleTimeString(),
        data: record,
      });
    }

    const now = new Date();
    // Late threshold: 9:30 AM
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);
    const status = isLate ? 'late' : 'present';

    if (!record) {
      record = await Attendance.create({
        employee: employeeId,
        date: todayDate,
        checkIn: now,
        status,
        notes: req.body.notes || (isLate ? 'Checked in after 09:30 AM cutoff' : 'On-time check-in'),
        location: req.body.location || 'Office HQ',
      });
    } else {
      record.checkIn = now;
      record.status = status;
      await record.save();
    }

    await logAuditEvent({
      req,
      action: 'ATTENDANCE_CHECK_IN',
      entityType: 'Attendance',
      entityId: record._id,
      details: `Checked in at ${now.toLocaleTimeString()} (Status: ${status})`,
    });

    res.status(200).json({
      success: true,
      message: `Checked in successfully (${status.toUpperCase()})`,
      data: record,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Employee Check-out
// @route   POST /api/attendance/check-out
export const checkOut = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'No employee profile linked to this user' });
    }

    const todayDate = getTodayDateString();
    const record = await Attendance.findOne({ employee: employeeId, date: todayDate });

    if (!record || !record.checkIn) {
      return res.status(400).json({ success: false, message: 'You have not checked in today yet' });
    }

    if (record.checkOut) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked out today at ' + new Date(record.checkOut).toLocaleTimeString(),
        data: record,
      });
    }

    const now = new Date();
    record.checkOut = now;

    // Calculate duration in hours
    const durationMs = now.getTime() - new Date(record.checkIn).getTime();
    const hours = Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10;
    record.workHours = hours;

    // Half day condition: worked less than 4.5 hours
    if (hours < 4.5 && record.status !== 'late') {
      record.status = 'half_day';
      record.notes = (record.notes ? record.notes + ' | ' : '') + `Worked ${hours} hrs (under 4.5h standard)`;
    }

    await record.save();

    await logAuditEvent({
      req,
      action: 'ATTENDANCE_CHECK_OUT',
      entityType: 'Attendance',
      entityId: record._id,
      details: `Checked out at ${now.toLocaleTimeString()} (${hours} hours worked)`,
    });

    res.status(200).json({
      success: true,
      message: `Checked out successfully! Total: ${hours} hours.`,
      data: record,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Today's Attendance status for Current User
// @route   GET /api/attendance/today
export const getTodayStatus = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(200).json({ success: true, data: null });
    }

    const todayDate = getTodayDateString();
    const record = await Attendance.findOne({ employee: employeeId, date: todayDate });

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get My Attendance history (monthly / paginated)
// @route   GET /api/attendance/my
export const getMyAttendance = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'No employee profile linked to user' });
    }

    const { month, year } = req.query;
    const query = { employee: employeeId };

    if (month && year) {
      const monthPadded = String(month).padStart(2, '0');
      query.date = { $regex: `^${year}-${monthPadded}` };
    }

    const records = await Attendance.find(query).sort({ date: -1 }).limit(31);

    // Summary calculation
    const summary = {
      present: records.filter((r) => r.status === 'present').length,
      late: records.filter((r) => r.status === 'late').length,
      halfDay: records.filter((r) => r.status === 'half_day').length,
      totalHours: records.reduce((acc, curr) => acc + (curr.workHours || 0), 0),
    };

    res.status(200).json({
      success: true,
      data: records,
      summary,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Admin Attendance Report (filter by date, department, employee)
// @route   GET /api/attendance/admin-report
export const getAdminReport = async (req, res) => {
  try {
    const { date, startDate, endDate, department, status } = req.query;
    const query = {};

    if (date) {
      query.date = date;
    } else if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else {
      // Default to today
      query.date = getTodayDateString();
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    let records = await Attendance.find(query)
      .populate('employee', 'firstName lastName employeeCode department designation avatar')
      .sort({ date: -1, 'employee.firstName': 1 });

    if (department && department !== 'All') {
      records = records.filter(
        (r) => r.employee && r.employee.department === department
      );
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

// @desc    Export Attendance to CSV
// @route   GET /api/attendance/export-csv
export const exportAttendanceCSV = async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    const query = {};

    if (date) {
      query.date = date;
    } else if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else {
      query.date = getTodayDateString();
    }

    const records = await Attendance.find(query)
      .populate('employee', 'firstName lastName employeeCode department designation')
      .sort({ date: -1 });

    // Build CSV string
    const headers = [
      'Date',
      'Employee Code',
      'Employee Name',
      'Department',
      'Designation',
      'Check In',
      'Check Out',
      'Work Hours',
      'Status',
      'Location',
      'Notes',
    ];

    const rows = records.map((r) => {
      const emp = r.employee || {};
      const checkInTime = r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '-';
      const checkOutTime = r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '-';
      return [
        `"${r.date}"`,
        `"${emp.employeeCode || 'N/A'}"`,
        `"${emp.firstName || ''} ${emp.lastName || ''}"`,
        `"${emp.department || 'General'}"`,
        `"${emp.designation || 'Staff'}"`,
        `"${checkInTime}"`,
        `"${checkOutTime}"`,
        `"${r.workHours || 0}"`,
        `"${(r.status || 'present').toUpperCase()}"`,
        `"${r.location || 'Office'}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=staffsync_attendance_${query.date || 'report'}.csv`
    );
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
