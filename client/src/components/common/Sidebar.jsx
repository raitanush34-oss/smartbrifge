import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarCheck,
  CreditCard,
  Briefcase,
  Megaphone,
  ShieldCheck,
  X,
  Building2,
  ClipboardList,
  GraduationCap,
  ReceiptIndianRupee,
  Network,
  ClipboardCheck,
  Box,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'employee'] },
    { name: 'Employees', to: '/employees', icon: Users, roles: ['admin', 'manager', 'employee'] },
    { name: 'Attendance', to: '/attendance', icon: Clock, roles: ['admin', 'manager', 'employee'] },
    { name: 'Leave Workflow', to: '/leaves', icon: CalendarCheck, roles: ['admin', 'manager', 'employee'] },
    { name: 'Payroll & Payslips', to: '/payroll', icon: CreditCard, roles: ['admin', 'manager', 'employee'] },
    { name: 'Performance Reviews', to: '/reviews', icon: ClipboardList, roles: ['admin', 'manager', 'employee'] },
    { name: 'Training & Skills', to: '/training', icon: GraduationCap, roles: ['admin', 'manager', 'employee'] },
    { name: 'Expense Claims', to: '/expenses', icon: ReceiptIndianRupee, roles: ['admin', 'manager', 'employee'] },
    { name: 'Org Structure', to: '/org', icon: Network, roles: ['admin', 'manager', 'employee'] },
    { name: 'Onboarding & Offboarding', to: '/lifecycle', icon: ClipboardCheck, roles: ['admin', 'manager', 'employee'] },
    { name: 'Company Assets', to: '/assets', icon: Box, roles: ['admin', 'manager', 'employee'] },
    { name: 'Recruitment Kanban', to: '/recruitment', icon: Briefcase, roles: ['admin', 'manager'] },
    { name: 'Notice Board', to: '/announcements', icon: Megaphone, roles: ['admin', 'manager', 'employee'] },
    { name: 'Audit Logs', to: '/audit', icon: ShieldCheck, roles: ['admin'] },
  ];

  const allowedNav = navigation.filter((item) =>
    item.roles.includes(user?.role?.toLowerCase() || 'employee')
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white/95 shadow-sm transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900/95 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Mobile Close button */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-700 to-emerald-500 text-white font-black shadow-md shadow-teal-700/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-slate-900 dark:text-white">
                Staff<span className="text-blue-600">Sync</span>
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400">
                Workspace
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Workforce Navigation
          </div>
          <nav className="space-y-1">
            {allowedNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.to}
                  onClick={() => onClose?.()}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 dark:bg-blue-600'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'
                        }`}
                      />
                      <span>{item.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info widget */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              <span>Current Session</span>
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              {user?.email}
            </p>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold uppercase mt-0.5">
              Role: {user?.role}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
