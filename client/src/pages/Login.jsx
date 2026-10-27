import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Building2, Lock, Mail, ArrowRight, Shield, UserCheck, Briefcase, Sun, Moon, MapPin } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setError('Please provide email and password');
      return;
    }

    setSubmitting(true);
    setError('');

    const res = await login(email, password);
    setSubmitting(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  const handleQuickLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    login(demoEmail, 'Password123!').then((res) => {
      if (res.success) {
        navigate('/');
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-950 dark:to-teal-950 p-4 transition-colors">
      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition-all hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
        </button>
      </div>

      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-8 shadow-xl shadow-slate-900/5 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-black/20">
          {/* Logo & Headline */}
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-700 to-emerald-500 text-white font-black shadow-lg shadow-teal-700/25 mb-4">
              <Building2 className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Staff<span className="text-blue-600">Sync</span>
            </h2>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Enterprise Workforce & HRMS Suite
              </span>
              <span className="rounded bg-amber-50 px-1.5 py-0.2 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                🇮🇳 India Edition
              </span>
            </div>
          </div>

          {/* Quick Demo Login Personas with Indian Profiles */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center mb-3">
              ⚡ 1-Click Persona Login (Pre-Configured)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Admin Persona */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@staffsync.com')}
                className="flex flex-col items-start rounded-xl border border-purple-200 bg-purple-50/70 p-3 text-left transition hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    Admin / HR
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">Rajesh Sharma</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">VP People & Culture</span>
                <span className="text-[9px] text-purple-700 dark:text-purple-300 font-semibold mt-1">📍 Bengaluru HQ</span>
              </button>

              {/* Manager Persona */}
              <button
                type="button"
                onClick={() => handleQuickLogin('manager@staffsync.com')}
                className="flex flex-col items-start rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-left transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Manager
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">Priya Patel</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Director Engineering</span>
                <span className="text-[9px] text-blue-700 dark:text-blue-300 font-semibold mt-1">📍 Whitefield Hub</span>
              </button>

              {/* Employee Persona */}
              <button
                type="button"
                onClick={() => handleQuickLogin('employee@staffsync.com')}
                className="flex flex-col items-start rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-left transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                    Employee
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">Amit Verma</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Sr. Full Stack Dev</span>
                <span className="text-[9px] text-emerald-700 dark:text-emerald-300 font-semibold mt-1">📍 Pune Center</span>
              </button>
            </div>
          </div>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <span className="relative bg-white px-3 text-xs font-medium text-slate-400 dark:bg-slate-900">
              or sign in with credentials
            </span>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@staffsync.com"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 transition-all focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white dark:focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Password
                </label>
                <span className="text-xs text-slate-400">Default: Password123!</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 transition-all focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white dark:focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/30 transition hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-600">
          StaffSync Technologies India &bull; Bengaluru &bull; Mumbai &bull; Pune &bull; Hyderabad
        </p>
      </div>
    </div>
  );
};

export default Login;
