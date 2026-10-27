import React, { useState, useEffect } from 'react';
import api from '../../api/axiosClient';
import { Clock, CheckCircle2, LogIn, LogOut, MapPin, AlertTriangle } from 'lucide-react';

const SHIFT_LOCATIONS = [
  '🏢 Bengaluru HQ (Bellandur)',
  '🏢 Mumbai BKC Hub',
  '🏢 Hyderabad HITEC City',
  '🏢 Pune Hinjawadi Phase 1',
  '🏠 Work From Home (WFH)',
  '✈️ Client Site / On-Duty (OD)',
];

const ClockWidget = ({ onStatusChange }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [elapsed, setElapsed] = useState('00:00:00');
  const [selectedLocation, setSelectedLocation] = useState(SHIFT_LOCATIONS[0]);

  // Live clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's status
  const fetchStatus = async () => {
    try {
      const res = await api.get('/attendance/today');
      if (res.data?.success) {
        setAttendance(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Live elapsed counter if checked in and not checked out
  useEffect(() => {
    if (attendance?.checkIn && !attendance?.checkOut) {
      const interval = setInterval(() => {
        const start = new Date(attendance.checkIn).getTime();
        const now = new Date().getTime();
        const diff = Math.max(0, now - start);

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setElapsed(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      }, 1000);
      return () => clearInterval(interval);
    } else if (attendance?.workHours) {
      const totalMinutes = Math.round(attendance.workHours * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      setElapsed(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
    } else {
      setElapsed('00:00:00');
    }
  }, [attendance]);

  const handleCheckIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/attendance/check-in', {
        location: selectedLocation,
      });
      if (res.data?.success) {
        setAttendance(res.data.data);
        onStatusChange?.(res.data.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/attendance/check-out');
      if (res.data?.success) {
        setAttendance(res.data.data);
        onStatusChange?.(res.data.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Check-out failed');
    } finally {
      setLoading(false);
    }
  };

  const isCheckedIn = !!attendance?.checkIn;
  const isCheckedOut = !!attendance?.checkOut;

  // Cutoff check: 09:30 AM IST
  const isPastCutoff = currentTime.getHours() > 9 || (currentTime.getHours() === 9 && currentTime.getMinutes() > 30);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left: Clock display */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <Clock className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                IST Biometric Shift Time
              </p>
              <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                Standard: 09:30 AM Cutoff
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                {currentTime.toLocaleTimeString('en-IN')}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {currentTime.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Shift status & duration */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Active Shift Duration
          </p>
          <div className="text-2xl font-black font-mono tracking-tight text-blue-600 dark:text-blue-400">
            {elapsed}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {isCheckedOut ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Shift Logged ({attendance.workHours}h total)
              </span>
            ) : isCheckedIn ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Clocked In ({attendance.status?.toUpperCase()})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                {isPastCutoff ? '⚠️ Not Clocked In (Late Flag Active)' : 'Awaiting Clock In'}
              </span>
            )}
          </div>
        </div>

        {/* Right: Location selector & Clock in/out triggers */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto justify-end">
          {!isCheckedIn && (
            <div className="relative w-full sm:w-auto">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {SHIFT_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          )}

          {!isCheckedIn ? (
            <button
              onClick={handleCheckIn}
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/25 transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              Clock In Shift
            </button>
          ) : !isCheckedOut ? (
            <button
              onClick={handleCheckOut}
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-500/25 transition-all hover:bg-rose-700 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              Clock Out Shift
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Shift Completed
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <p className="mt-3 text-xs font-semibold text-rose-500 text-center lg:text-left">
          {errorMsg}
        </p>
      )}
    </div>
  );
};

export default ClockWidget;
