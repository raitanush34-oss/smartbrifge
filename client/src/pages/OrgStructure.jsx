import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, ChevronDown, Network, Plus, Search, Users } from 'lucide-react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';

const OrgStructure = () => {
  const { hasRole } = useAuth();
  const canManage = hasRole('admin', 'manager');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [departmentForm, setDepartmentForm] = useState({ name: '', code: '', description: '', head: '' });

  const loadStructure = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/org/structure');
      setDepartments(response.data?.data || []);
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Could not load organization structure' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(loadStructure);
  }, [loadStructure]);

  const allEmployees = useMemo(() => departments.flatMap((department) => department.employees), [departments]);
  const visibleDepartments = departments.filter((department) => {
    if (departmentFilter !== 'All' && department.name !== departmentFilter) return false;
    const hasMatch = department.employees.some((employee) => {
      const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
      return !search || fullName.includes(search.toLowerCase())
        || employee.designation?.toLowerCase().includes(search.toLowerCase())
        || employee.employeeCode?.toLowerCase().includes(search.toLowerCase());
    });
    return hasMatch || (!search && department.employees.length === 0);
  });
  const totalHeadcount = departments.reduce((total, department) => total + department.employeeCount, 0);
  const managerCount = allEmployees.filter((employee) => employee.role === 'manager' || employee.role === 'admin').length;

  const createDepartment = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/org/departments', departmentForm);
      setToast({ type: 'success', message: `${departmentForm.name} department created` });
      setDepartmentForm({ name: '', code: '', description: '', head: '' });
      setIsCreateOpen(false);
      await loadStructure();
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Could not create department' });
    } finally {
      setSaving(false);
    }
  };

  const saveReportingLine = async (employee, values) => {
    setSaving(true);
    try {
      await api.patch(`/org/employees/${employee._id}/reporting`, values);
      setToast({ type: 'success', message: `Reporting structure updated for ${employee.firstName}` });
      await loadStructure();
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Could not update reporting structure' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">People directory</p>
          <h1 className="flex items-center gap-2.5 text-2xl font-black tracking-tight text-slate-900 dark:text-white"><Network className="h-6 w-6 text-teal-700 dark:text-teal-300" /> Organization Structure</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Explore teams, department leads, and employee reporting lines.</p>
        </div>
        {canManage && <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-800"><Plus className="h-4 w-4" /> Add department</button>}
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Organization summary">
        <Summary label="Departments" value={departments.length} icon={Building2} />
        <Summary label="Active employees" value={totalHeadcount} icon={Users} />
        <Summary label="People leads" value={managerCount} icon={Network} />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a person, role, or employee code" className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-white" /></label>
        <select aria-label="Filter by department" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"><option>All</option>{departments.map((department) => <option key={department.name}>{department.name}</option>)}</select>
      </div>

      {loading ? <div className="py-16 text-center text-sm text-slate-500">Loading organization structure...</div> : visibleDepartments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900"><Network className="mx-auto h-8 w-8 text-slate-400" /><h2 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100">No matching teams</h2><p className="mt-1 text-xs text-slate-500">Try a different search or department filter.</p></div>
      ) : <div className="space-y-4">
        {visibleDepartments.map((department) => <DepartmentSection key={department.name} department={department} employees={allEmployees} canManage={canManage} saving={saving} search={search} onSaveReporting={saveReportingLine} />)}
      </div>}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add department">
        <form onSubmit={createDepartment} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Department name *<input required maxLength="80" value={departmentForm.name} onChange={(event) => setDepartmentForm((current) => ({ ...current, name: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Department code *<input required maxLength="12" value={departmentForm.code} onChange={(event) => setDepartmentForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} placeholder="ENG" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs uppercase dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 sm:col-span-2">Department lead<select value={departmentForm.head} onChange={(event) => setDepartmentForm((current) => ({ ...current, head: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="">Choose a lead (optional)</option>{allEmployees.map((employee) => <option key={employee._id} value={employee._id}>{employee.firstName} {employee.lastName} · {employee.department}</option>)}</select></label>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 sm:col-span-2">Description<textarea rows="3" maxLength="500" value={departmentForm.description} onChange={(event) => setDepartmentForm((current) => ({ ...current, description: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800"><button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancel</button><button disabled={saving} className="rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Create department'}</button></div>
        </form>
      </Modal>
    </div>
  );
};

const Summary = ({ label, value, icon: Icon }) => <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{value}</p></div><Icon className="h-5 w-5 text-teal-700 dark:text-teal-300" /></div>;

const DepartmentSection = ({ department, employees, canManage, saving, search, onSaveReporting }) => {
  const [expanded, setExpanded] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const visibleEmployees = department.employees.filter((employee) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(query)
      || employee.designation?.toLowerCase().includes(query)
      || employee.employeeCode?.toLowerCase().includes(query);
  });
  const visibleEmployeeIds = new Set(visibleEmployees.map((employee) => employee._id));
  const roots = visibleEmployees.filter((employee) => !employee.manager || !visibleEmployeeIds.has(employee.manager._id));
  const sectionLead = department.head || department.employees.find((employee) => employee.role === 'manager') || null;

  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
    <button onClick={() => setExpanded((value) => !value)} className="flex w-full items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 text-left dark:border-slate-800">
      <div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300"><Building2 className="h-5 w-5" /></div><div className="min-w-0"><h2 className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{department.name}</h2><p className="mt-0.5 text-[11px] text-slate-500">{department.code || 'Department'} · {department.employeeCount} {department.employeeCount === 1 ? 'person' : 'people'}{sectionLead && ` · Lead: ${sectionLead.firstName} ${sectionLead.lastName}`}</p></div></div>
      <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
    </button>
    {expanded && <div className="p-4 sm:p-5">
      {visibleEmployees.length === 0 ? <p className="py-6 text-center text-xs text-slate-500">No employees match this search in {department.name}.</p> : <div className="space-y-3">{roots.map((employee) => <EmployeeNode key={`${employee._id}-${employee.manager?._id || 'root'}-${employee.department}`} employee={employee} employees={visibleEmployees} allEmployees={employees} canManage={canManage} saving={saving} editingId={editingId} setEditingId={setEditingId} onSaveReporting={onSaveReporting} />)}</div>}
    </div>}
  </section>;
};

const EmployeeNode = ({ employee, employees, allEmployees, canManage, saving, editingId, setEditingId, onSaveReporting, ancestors = [] }) => {
  const isEditing = editingId === employee._id;
  const [managerId, setManagerId] = useState(employee.manager?._id || '');
  const [department, setDepartment] = useState(employee.department);
  if (ancestors.includes(employee._id)) return null;
  const nextAncestors = [...ancestors, employee._id];
  const directReports = employees.filter((person) => person.manager?._id === employee._id);
  const initials = `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`;

  return <div className="relative">
    <article className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {employee.avatar ? <img src={employee.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" /> : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-200">{initials}</div>}
          <div className="min-w-0"><p className="truncate text-xs font-bold text-slate-900 dark:text-white">{employee.firstName} {employee.lastName}<span className="ml-2 rounded bg-white px-1.5 py-0.5 font-mono text-[9px] font-semibold text-slate-500 dark:bg-slate-800">{employee.employeeCode}</span></p><p className="mt-0.5 truncate text-[11px] text-slate-500">{employee.designation} · {employee.workLocation}</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {employee.role === 'manager' || employee.role === 'admin' ? <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-teal-800 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300">People lead</span> : null}
          <span className="rounded-full bg-slate-200/70 px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{directReports.length} reports</span>
          {canManage && <button onClick={() => setEditingId(isEditing ? null : employee._id)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:border-teal-300 hover:text-teal-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{isEditing ? 'Close' : 'Edit reporting'}</button>}
        </div>
      </div>
      {isEditing && <div className="mt-3 grid gap-2 border-t border-slate-200 pt-3 dark:border-slate-800 sm:grid-cols-[1fr_1fr_auto]">
        <label className="text-[10px] font-bold text-slate-500">Department<select value={department} onChange={(event) => setDepartment(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white">{Array.from(new Set(allEmployees.map((person) => person.department))).sort().map((name) => <option key={name}>{name}</option>)}</select></label>
        <label className="text-[10px] font-bold text-slate-500">Reports to<select value={managerId} onChange={(event) => setManagerId(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="">No manager</option>{allEmployees.filter((person) => person._id !== employee._id).map((person) => <option key={person._id} value={person._id}>{person.firstName} {person.lastName} · {person.department}</option>)}</select></label>
        <button disabled={saving} onClick={() => onSaveReporting(employee, { managerId: managerId || null, department })} className="self-end rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Save</button>
      </div>}
    </article>
    {directReports.length > 0 && <div className="ml-4 mt-3 space-y-3 border-l-2 border-teal-100 pl-3 dark:border-teal-950 sm:ml-7 sm:pl-4">{directReports.map((report) => <EmployeeNode key={report._id} employee={report} employees={employees} allEmployees={allEmployees} canManage={canManage} saving={saving} editingId={editingId} setEditingId={setEditingId} onSaveReporting={onSaveReporting} ancestors={nextAncestors} />)}</div>}
  </div>;
};

export default OrgStructure;
