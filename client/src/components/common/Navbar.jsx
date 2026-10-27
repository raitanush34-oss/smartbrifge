import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, LogOut, User, Menu, Shield, Briefcase, UserCheck, MapPin } from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  const { user, login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
  };

  const handleQuickSwitch = (email) => {
    login(email, 'Password123!');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 shadow-xs backdrop-blur-xl transition-colors dark:border-slate-800 dark:bg-slate-900/90 lg:px-8">
      {/* Left: Mobile hamburger & title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-700 to-emerald-500 text-white font-bold shadow-md shadow-teal-700/20">
            S
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Staff<span className="text-blue-600">Sync</span>
            </span>
            <span className="hidden text-[11px] font-bold text-amber-600 dark:text-amber-400 sm:inline-block ml-2 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800">
              🇮🇳 India HRMS
            </span>
          </div>
        </div>
      </div>

      {/* Center: 1-Click Persona Switcher for effortless testing */}
      <div className="hidden xl:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-800/50">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
          Quick Persona:
        </span>
        <button
          onClick={() => handleQuickSwitch('admin@staffsync.com')}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
            user?.email === 'admin@staffsync.com'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
          title="Switch to Rajesh Sharma (VP HR)"
        >
          <Shield className="h-3.5 w-3.5" />
          Rajesh (Admin)
        </button>
        <button
          onClick={() => handleQuickSwitch('manager@staffsync.com')}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
            user?.email === 'manager@staffsync.com'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
          title="Switch to Priya Patel (Engineering Director)"
        >
          <Briefcase className="h-3.5 w-3.5" />
          Priya (Manager)
        </button>
        <button
          onClick={() => handleQuickSwitch('employee@staffsync.com')}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
            user?.email === 'employee@staffsync.com'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
          title="Switch to Amit Verma (Senior Software Engineer)"
        >
          <UserCheck className="h-3.5 w-3.5" />
          Amit (Employee)
        </button>
      </div>

      {/* Right: Actions, theme toggle, and profile */}
      <div className="flex items-center gap-3">
        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="rounded-xl border border-slate-200 p-2 text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
        </button>

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 border-l border-slate-200 pl-3 dark:border-slate-800">
            <div className="relative">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-blue-500/30"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 ring-2 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                  <User className="h-4 w-4" />
                </div>
              )}
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
            </div>

            <div className="hidden flex-col text-left md:flex">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                {user.name}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded border ${getRoleBadgeColor(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>
                <span className="text-xs text-slate-400 truncate max-w-[140px]">
                  {user.department}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="ml-2 rounded-xl p-2 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
