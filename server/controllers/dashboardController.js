import { Employee } from '../models/Employee.js';
import { Attendance } from '../models/Attendance.js';
import { Leave } from '../models/Leave.js';
import { Payroll } from '../models/Payroll.js';
import { AuditLog } from '../models/AuditLog.js';
import { Announcement } from '../models/Announcement.js';

export const getDashboardMetrics = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Total Employees & Active count
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'active' });
    const onLeaveEmployees = await Employee.countDocuments({ status: 'on_leave' });

    // 2. Today's Attendance breakdown
    const todayAttendances = await Attendance.find({ date: todayStr }).populate('employee', 'firstName lastName department avatar');
    const presentToday = todayAttendances.filter((a) => a.status === 'present').length;
    const lateToday = todayAttendances.filter((a) => a.status === 'late').length;
    const halfDayToday = todayAttendances.filter((a) => a.status === 'half_day').length;
    const totalCheckedIn = todayAttendances.length;
    const attendancePercentage = activeEmployees > 0 ? Math.round((totalCheckedIn / activeEmployees) * 100) : 0;

    // 3. Pending Leave Requests
    const pendingLeaves = await Leave.find({ status: 'pending' })
      .populate('employee', 'firstName lastName employeeCode department avatar')
      .sort({ createdAt: -1 })
      .limit(5);
    const pendingLeaveCount = await Leave.countDocuments({ status: 'pending' });

    // 4. Department-wise Headcount distribution (for Recharts Pie/Bar)
    const departmentStats = await Employee.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $project: { name: '$_id', value: '$count', _id: 0 } },
      { $sort: { value: -1 } },
    ]);

    // 5. Recent 7 Days Attendance Trend (for Recharts Area/Bar Chart)
    const past7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      past7Days.push(d.toISOString().split('T')[0]);
    }

    const attendanceTrend = await Promise.all(
      past7Days.map(async (date) => {
        const count = await Attendance.countDocuments({ date, status: { $in: ['present', 'late', 'half_day'] } });
        const dayLabel = new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
        return {
          date,
          day: dayLabel,
          present: count,
        };
      })
    );

    // 6. Upcoming Birthdays and Anniversaries
    // Check birthdays and joining dates within the current month
    const currentMonth = new Date().getMonth(); // 0-indexed
    const allEmployees = await Employee.find({ status: 'active' }).select('firstName lastName department avatar dob joiningDate employeeCode');

    const upcomingBirthdays = allEmployees
      .filter((emp) => emp.dob && new Date(emp.dob).getMonth() === currentMonth)
      .map((emp) => ({
        _id: emp._id,
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.department,
        avatar: emp.avatar,
        date: new Date(emp.dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }))
      .slice(0, 5);

    const upcomingAnniversaries = allEmployees
      .filter((emp) => emp.joiningDate && new Date(emp.joiningDate).getMonth() === currentMonth)
      .map((emp) => {
        const years = new Date().getFullYear() - new Date(emp.joiningDate).getFullYear();
        return {
          _id: emp._id,
          name: `${emp.firstName} ${emp.lastName}`,
          department: emp.department,
          avatar: emp.avatar,
          years: Math.max(1, years),
          date: new Date(emp.joiningDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        };
      })
      .slice(0, 5);

    // 7. Recent Announcements
    const announcements = await Announcement.find().sort({ isPinned: -1, createdAt: -1 }).limit(4);

    // 8. Recent Audit Logs
    const recentActivity = await AuditLog.find().sort({ createdAt: -1 }).limit(6);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalEmployees,
          activeEmployees,
          onLeaveEmployees,
          totalCheckedIn,
          presentToday,
          lateToday,
          halfDayToday,
          attendancePercentage,
          pendingLeaveCount,
        },
        departmentStats,
        attendanceTrend,
        pendingLeaves,
        upcomingBirthdays,
        upcomingAnniversaries,
        announcements,
        recentActivity,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
