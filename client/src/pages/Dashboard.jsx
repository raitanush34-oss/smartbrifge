import React, { useState, useEffect } from 'react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/common/StatCard';
import ClockWidget from '../components/attendance/ClockWidget';
import {
  Users,
  CheckCircle,
  Calendar,
  AlertCircle,
  Cake,
  Award,
  Megaphone,
  TrendingUp,
  Activity,
  ArrowRight,
  MapPin,
  Building,
  Sparkles,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Link } from 'react-router-dom';

const COLORS = ['#0f766e', '#10b981', '#f59e0b', '#e8795a', '#3b82a0', '#84a98c'];

const formatINR = (val) => Number(val || 0).toLocaleString('en-IN');

const Dashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/dashboard/metrics');
      if (res.data?.success) {
        setMetrics(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load dashboard metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const summary = metrics?.summary || {};
  const departmentStats = metrics?.departmentStats || [];
  const attendanceTrend = metrics?.attendanceTrend || [];
  const birthdays = metrics?.upcomingBirthdays || [];
  const anniversaries = metrics?.upcomingAnniversaries || [];
  const announcements = metrics?.announcements || [];
  const pendingLeaves = metrics?.pendingLeaves || [];

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner with Indian Tech Hub Context */}
      <div className="rounded-2xl bg-gradient-to-br from-teal-800 via-teal-700 to-emerald-700 p-7 text-white shadow-xl shadow-teal-900/15">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>🇮🇳 Bengaluru &bull; Mumbai &bull; Pune &bull; Hyderabad &bull; Gurugram</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">
              Namaste, {user?.name}! 🙏
            </h1>
            <p className="mt-1 text-sm text-blue-100 max-w-xl">
              StaffSync India Workforce Operations Center. Track biometric attendance, leave approvals, Indian statutory payroll, and team pipelines.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/attendance"
              className="rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
            >
              My Shifts
            </Link>
            <Link
              to="/leaves"
              className="rounded-xl bg-blue-600/60 border border-white/20 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-600"
            >
              Apply Leave
            </Link>
          </div>
        </div>
      </div>

      {/* Live Self Attendance Clock Widget */}
      <ClockWidget onStatusChange={fetchMetrics} />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="All-India Headcount"
          value={summary.totalEmployees || 0}
          subtitle={`${summary.activeEmployees || 0} active on tech payroll`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Today's Attendance"
          value={`${summary.attendancePercentage || 0}%`}
          subtitle={`${summary.totalCheckedIn || 0} clocked in on IST biometric`}
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Pending Leave Approvals"
          value={summary.pendingLeaveCount || 0}
          subtitle="Casual / Sick / Privilege leaves"
          icon={Calendar}
          color="amber"
        />
        <StatCard
          title="Shift Punctuality"
          value={`${summary.lateToday || 0} Late`}
          subtitle={`${summary.halfDayToday || 0} half-day shifts recorded`}
          icon={Activity}
          color="purple"
        />
      </div>

      {/* Recharts Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Distribution (Donut Chart) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white">
              Department Distribution
            </h3>
            <span className="text-xs text-slate-400">Tech & Ops</span>
          </div>

          <div className="h-64 w-full">
            {departmentStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentStats}
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {departmentStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No department data available
              </div>
            )}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            {departmentStats.slice(0, 4).map((dept, i) => (
              <div key={dept.name} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="truncate text-slate-600 dark:text-slate-400">{dept.name}</span>
                <span className="font-bold text-slate-900 dark:text-white ml-auto">{dept.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 7-Day Attendance Trend (Bar Chart) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white">
              7-Day Shift Attendance Activity
            </h3>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" /> Biometric Logs
            </span>
          </div>

          <div className="h-64 w-full">
            {attendanceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="present" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Employees Present" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No attendance trend available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row: Celebrations (Birthdays & Anniversaries) + Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Celebrations Widget */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 mb-4">
            <Cake className="h-5 w-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">
              Festivals & Celebrations
            </h3>
          </div>

          <div className="space-y-4">
            {/* Festival banner */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900 dark:bg-amber-950/30">
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-200">
                <Sparkles className="h-4 w-4 text-amber-600" /> 🪔 Diwali Festival Holidays
              </span>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
                Office closed Oct 31st & Nov 1st across Bengaluru, Mumbai, Pune, and Hyderabad.
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                🎂 Birthdays this month
              </p>
              {birthdays.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No birthdays this month</p>
              ) : (
                <div className="space-y-2">
                  {birthdays.map((b) => (
                    <div key={b._id} className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                      <div className="flex items-center gap-2.5">
                        <img src={b.avatar || 'https://via.placeholder.com/32'} alt="" className="h-7 w-7 rounded-full object-cover" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{b.name}</p>
                          <p className="text-[10px] text-slate-400">{b.department}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                        {b.date}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                🎖️ Work Anniversaries
              </p>
              {anniversaries.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No anniversaries this month</p>
              ) : (
                <div className="space-y-2">
                  {anniversaries.map((a) => (
                    <div key={a._id} className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                      <div className="flex items-center gap-2.5">
                        <img src={a.avatar || 'https://via.placeholder.com/32'} alt="" className="h-7 w-7 rounded-full object-cover" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{a.name}</p>
                          <p className="text-[10px] text-slate-400">{a.department}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
                        {a.years} yr{a.years > 1 ? 's' : ''} ({a.date})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pending Leave Requests */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              Pending Leave Requests
            </h3>
            <Link to="/leaves" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
              View all &rarr;
            </Link>
          </div>

          {pendingLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">All approvals cleared!</p>
              <p className="text-[11px] text-slate-400">No pending leave applications awaiting review.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingLeaves.map((leave) => (
                <div key={leave._id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {leave.employee?.firstName} {leave.employee?.lastName}
                    </p>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 uppercase">
                      {leave.leaveType} ({leave.daysCount}d)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                    "{leave.reason}"
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(leave.startDate).toLocaleDateString('en-IN')} &rarr; {new Date(leave.endDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Company Announcements / Notice Board Preview */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-purple-500" />
              India Notice Board
            </h3>
            <Link to="/announcements" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
              All notices &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {announcements.slice(0, 3).map((a) => (
              <div key={a._id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                    {a.title}
                  </p>
                  <span
                    className={`rounded px-1.5 py-0.2 text-[9px] uppercase font-bold shrink-0 ${
                      a.priority === 'urgent'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : a.priority === 'high'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    }`}
                  >
                    {a.priority}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {a.content}
                </p>
                <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                  <span>By {a.authorName}</span>
                  <span>{new Date(a.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
