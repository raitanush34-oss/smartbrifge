import React, { useState, useEffect } from 'react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import ClockWidget from '../components/attendance/ClockWidget';
import Toast from '../components/common/Toast';
import {
  Clock,
  Download,
  Calendar,
  Filter,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Building,
} from 'lucide-react';

const Attendance = () => {
  const { user, hasRole } = useAuth();
  const isAdminOrManager = hasRole('admin', 'manager');

  const [activeTab, setActiveTab] = useState('my'); // 'my' or 'report'
  const [myAttendance, setMyAttendance] = useState([]);
  const [mySummary, setMySummary] = useState(null);

  // Admin report state
  const [adminRecords, setAdminRecords] = useState([]);
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportStatus, setReportStatus] = useState('All');
  const [reportDepartment, setReportDepartment] = useState('All');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchMyAttendance = async () => {
    try {
      const res = await api.get('/attendance/my');
      if (res.data?.success) {
        setMyAttendance(res.data.data);
        setMySummary(res.data.summary);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/admin-report', {
        params: {
          date: reportDate,
          status: reportStatus,
          department: reportDepartment,
        },
      });
      if (res.data?.success) {
        setAdminRecords(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAttendance();
  }, []);

  useEffect(() => {
    if (isAdminOrManager && activeTab === 'report') {
      fetchAdminReport();
    }
  }, [activeTab, reportDate, reportStatus, reportDepartment]);

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/attendance/export-csv', {
        params: { date: reportDate },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `staffsync_attendance_${reportDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setToast({ type: 'success', message: 'Attendance report exported as CSV!' });
    } catch (err) {
      setToast({ type: 'error', message: 'CSV export failed' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'present':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200';
      case 'late':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200';
      case 'half_day':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200';
      default:
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200';
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Clock className="h-6 w-6 text-blue-600" />
            Attendance & Time Tracking
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time biometric shift logs, late marking, work duration counters, and enterprise reporting.
          </p>
        </div>

        {/* Tab switch for Admin/Manager */}
        {isAdminOrManager && (
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setActiveTab('my')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === 'my'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              My Shifts
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === 'report'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Admin Report & CSV
            </button>
          </div>
        )}
      </div>

      {/* Clock Widget for Current User */}
      <ClockWidget onStatusChange={fetchMyAttendance} />

      {/* Tab: My Attendance */}
      {activeTab === 'my' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          {mySummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Days Present</span>
                <p className="text-2xl font-black text-emerald-600 mt-1">{mySummary.present}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Late Arrivals</span>
                <p className="text-2xl font-black text-amber-500 mt-1">{mySummary.late}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Half-Day Shifts</span>
                <p className="text-2xl font-black text-purple-600 mt-1">{mySummary.halfDay}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Hours Worked</span>
                <p className="text-2xl font-black text-blue-600 mt-1">{Math.round(mySummary.totalHours * 10) / 10}h</p>
              </div>
            </div>
          )}

          {/* Personal Attendance Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                My Shift Attendance Logs
              </h3>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                  <th className="p-4">Date</th>
                  <th className="p-4">Clock In</th>
                  <th className="p-4">Clock Out</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Location / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
                {myAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-400">
                      No attendance records found yet. Use the clock widget above to record your first shift!
                    </td>
                  </tr>
                ) : (
                  myAttendance.map((rec) => (
                    <tr key={rec._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="p-4 font-semibold text-slate-900 dark:text-white">{rec.date}</td>
                      <td className="p-4 font-mono">{rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString('en-IN') : '-'}</td>
                      <td className="p-4 font-mono">{rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString('en-IN') : '-'}</td>
                      <td className="p-4 font-bold text-blue-600 dark:text-blue-400">{rec.workHours ? `${rec.workHours} hrs` : '-'}</td>
                      <td className="p-4">
                        <span className={`border text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getStatusBadge(rec.status)}`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 max-w-xs truncate">{rec.notes || rec.location}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Admin Report & CSV Export */}
      {isAdminOrManager && activeTab === 'report' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Select Date</label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="rounded-xl border border-slate-200 p-2 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status Filter</label>
                <select
                  value={reportStatus}
                  onChange={(e) => setReportStatus(e.target.value)}
                  className="rounded-xl border border-slate-200 p-2 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  <option value="All">All Statuses</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="half_day">Half Day</option>
                  <option value="absent">Absent</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Department</label>
                <select
                  value={reportDepartment}
                  onChange={(e) => setReportDepartment(e.target.value)}
                  className="rounded-xl border border-slate-200 p-2 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  <option value="All">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Product">Product</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 w-full md:w-auto justify-center"
            >
              <Download className="h-4 w-4" /> Export CSV Report
            </button>
          </div>

          {/* Admin Records Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Company Shift Roster for {reportDate}
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {adminRecords.length} records found
              </span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                  <th className="p-4">Employee</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Clock In</th>
                  <th className="p-4">Clock Out</th>
                  <th className="p-4">Hours</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
                {adminRecords.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400">
                      No attendance records found for the selected date and filters.
                    </td>
                  </tr>
                ) : (
                  adminRecords.map((rec) => (
                    <tr key={rec._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={rec.employee?.avatar || 'https://via.placeholder.com/32'}
                            alt=""
                            className="h-7 w-7 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {rec.employee?.firstName} {rec.employee?.lastName}
                            </p>
                            <span className="text-[10px] font-mono text-slate-400">{rec.employee?.employeeCode}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">{rec.employee?.department}</td>
                      <td className="p-4 font-mono">{rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString('en-IN') : '-'}</td>
                      <td className="p-4 font-mono">{rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString('en-IN') : '-'}</td>
                      <td className="p-4 font-bold text-blue-600 dark:text-blue-400">{rec.workHours ? `${rec.workHours} hrs` : '-'}</td>
                      <td className="p-4">
                        <span className={`border text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getStatusBadge(rec.status)}`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 max-w-xs truncate">{rec.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
