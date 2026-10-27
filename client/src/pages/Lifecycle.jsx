import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, CalendarDays, Check, CheckCircle2, ClipboardCheck, Plus, UserRound, X } from 'lucide-react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';

const templates = {
  onboarding: [
    { title: 'Prepare workstation and access', category: 'it', description: 'Set up laptop, accounts, and required system access.' },
    { title: 'Complete payroll and bank details', category: 'payroll', description: 'Confirm payroll, tax, and bank information.' },
    { title: 'Review company policies', category: 'compliance', description: 'Read and acknowledge required policies.' },
    { title: 'Meet the team and manager', category: 'manager', description: 'Schedule introductions and role expectations.' },
  ],
  offboarding: [
    { title: 'Transfer knowledge and open work', category: 'manager', description: 'Document handover notes and transfer active work.' },
    { title: 'Return equipment and access badge', category: 'facilities', description: 'Record return of company-issued items.' },
    { title: 'Revoke system access', category: 'it', description: 'Disable accounts and recover company data.' },
    { title: 'Complete final payroll and clearance', category: 'payroll', description: 'Confirm final pay, benefits, and exit documents.' },
  ],
};

const taskCategories = ['people', 'it', 'payroll', 'manager', 'employee', 'facilities', 'compliance', 'other'];
const caseStatusLabels = { active: 'In progress', completed: 'Completed', cancelled: 'Cancelled' };
const taskStatusLabels = { pending: 'To do', in_progress: 'In progress', completed: 'Done', skipped: 'Skipped' };

const Lifecycle = () => {
  const { hasRole, user } = useAuth();
  const canManage = hasRole('admin', 'manager');
  const currentEmployeeId = user?.employeeId || user?.employee?._id;
  const [cases, setCases] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('onboarding');
  const [filters, setFilters] = useState({ status: 'All', department: 'All' });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [caseForm, setCaseForm] = useState({
    employeeId: '', type: 'onboarding', title: 'New hire onboarding', startDate: '', targetDate: '', tasks: templates.onboarding.map((task) => ({ ...task, owner: '', dueDate: '' })),
  });

  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      const response = canManage
        ? await api.get('/lifecycle/all', { params: { type: activeTab, ...filters } })
        : await api.get('/lifecycle/my');
      const allCases = response.data?.data || [];
      setCases(canManage ? allCases : allCases.filter((item) => item.type === activeTab));
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Could not load lifecycle checklists' });
    } finally {
      setLoading(false);
    }
  }, [activeTab, canManage, filters]);

  useEffect(() => {
    Promise.resolve().then(loadCases);
  }, [loadCases]);

  useEffect(() => {
    if (!canManage) return;
    api.get('/employees', { params: { limit: 500, sort: 'firstName' } })
      .then((response) => setEmployees(response.data?.data || []))
      .catch(() => setToast({ type: 'error', message: 'Could not load employee directory' }));
  }, [canManage]);

  const summary = useMemo(() => ({
    total: cases.length,
    active: cases.filter((item) => item.status === 'active').length,
    completed: cases.filter((item) => item.status === 'completed').length,
  }), [cases]);
  const departments = useMemo(() => ['All', ...new Set(employees.map((employee) => employee.department).filter(Boolean))], [employees]);

  const updateFormTask = (index, field, value) => {
    setCaseForm((current) => ({
      ...current,
      tasks: current.tasks.map((task, taskIndex) => taskIndex === index ? { ...task, [field]: value } : task),
    }));
  };

  const changeCaseType = (type) => {
    const title = type === 'onboarding' ? 'New hire onboarding' : 'Employee offboarding';
    setCaseForm((current) => ({
      ...current,
      type,
      title,
      tasks: templates[type].map((task) => ({ ...task, owner: '', dueDate: '' })),
    }));
  };

  const createCase = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/lifecycle', caseForm);
      setToast({ type: 'success', message: `${caseForm.type === 'onboarding' ? 'Onboarding' : 'Offboarding'} checklist created` });
      setIsCreateOpen(false);
      setCaseForm((current) => ({ ...current, employeeId: '', startDate: '', targetDate: '' }));
      await loadCases();
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Could not create lifecycle checklist' });
    } finally {
      setSaving(false);
    }
  };

  const updateTask = async (lifecycleCase, task, status, note = task.note || '') => {
    setSaving(true);
    try {
      const response = await api.patch(`/lifecycle/${lifecycleCase._id}/tasks/${task._id}`, { status, note });
      setCases((current) => current.map((item) => item._id === lifecycleCase._id ? response.data.data : item));
      setToast({ type: 'success', message: status === 'completed' ? 'Checklist step completed' : 'Checklist step updated' });
      await loadCases();
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Could not update checklist step' });
    } finally {
      setSaving(false);
    }
  };

  const cancelCase = async (lifecycleCase) => {
    if (!window.confirm(`Cancel ${lifecycleCase.title}? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await api.patch(`/lifecycle/${lifecycleCase._id}/cancel`);
      setToast({ type: 'success', message: 'Checklist cancelled' });
      await loadCases();
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Could not cancel checklist' });
    } finally {
      setSaving(false);
    }
  };

  const activeCases = cases.filter((item) => item.type === activeTab);
  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">People operations</p>
          <h1 className="flex items-center gap-2.5 text-2xl font-black tracking-tight text-slate-900 dark:text-white"><BriefcaseBusiness className="h-6 w-6 text-teal-700 dark:text-teal-300" /> Onboarding & Offboarding</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Coordinate employee transitions with clear owners and due dates.</p>
        </div>
        {canManage && <button onClick={() => { changeCaseType(activeTab); setIsCreateOpen(true); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-800"><Plus className="h-4 w-4" /> Create checklist</button>}
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Summary label="Total" value={summary.total} />
        <Summary label="In progress" value={summary.active} tone="amber" />
        <Summary label="Completed" value={summary.completed} tone="emerald" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-1">
          {['onboarding', 'offboarding'].map((type) => <button key={type} onClick={() => setActiveTab(type)} className={`border-b-2 px-3 py-3 text-xs font-bold capitalize ${activeTab === type ? 'border-teal-700 text-teal-800 dark:border-teal-400 dark:text-teal-300' : 'border-transparent text-slate-500'}`}>{type}</button>)}
        </div>
        {canManage && <div className="flex gap-2 pb-2 sm:pb-0">
          <select aria-label="Filter lifecycle status" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"><option>All</option><option value="active">In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
          <select aria-label="Filter lifecycle department" value={filters.department} onChange={(event) => setFilters((current) => ({ ...current, department: event.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">{departments.map((department) => <option key={department}>{department}</option>)}</select>
        </div>}
      </div>

      {loading ? <div className="py-16 text-center text-sm text-slate-500">Loading checklists...</div> : activeCases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900"><ClipboardCheck className="mx-auto h-8 w-8 text-slate-400" /><h2 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100">No {activeTab} checklists</h2><p className="mt-1 text-xs text-slate-500">{canManage ? 'Create a checklist to coordinate the next employee transition.' : 'Assigned checklists and tasks will appear here.'}</p></div>
      ) : <div className="space-y-4">{activeCases.map((lifecycleCase) => <LifecycleCard key={lifecycleCase._id} lifecycleCase={lifecycleCase} canManage={canManage} currentEmployeeId={currentEmployeeId} saving={saving} today={today} onUpdateTask={updateTask} onCancel={cancelCase} />)}</div>}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create transition checklist">
        <form onSubmit={createCase} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Employee *<select required value={caseForm.employeeId} onChange={(event) => setCaseForm((current) => ({ ...current, employeeId: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="">Choose employee</option>{employees.filter((employee) => employee.status !== 'deactivated').map((employee) => <option key={employee._id} value={employee._id}>{employee.firstName} {employee.lastName} · {employee.department}</option>)}</select></label>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Transition type<select value={caseForm.type} onChange={(event) => changeCaseType(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="onboarding">Onboarding</option><option value="offboarding">Offboarding</option></select></label>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 sm:col-span-2">Checklist title *<input required maxLength="120" value={caseForm.title} onChange={(event) => setCaseForm((current) => ({ ...current, title: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Start date *<input required type="date" value={caseForm.startDate} onChange={(event) => setCaseForm((current) => ({ ...current, startDate: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Target date<input type="date" min={caseForm.startDate || undefined} value={caseForm.targetDate} onChange={(event) => setCaseForm((current) => ({ ...current, targetDate: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
          </div>

          <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className="flex items-center justify-between"><div><h2 className="text-xs font-bold text-slate-800 dark:text-slate-100">Checklist tasks</h2><p className="text-[11px] text-slate-500">Use the suggested tasks or customize owners and dates.</p></div><button type="button" onClick={() => setCaseForm((current) => ({ ...current, tasks: [...current.tasks, { title: '', description: '', category: 'other', owner: '', dueDate: '' }] }))} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"><Plus className="h-3.5 w-3.5" /> Add task</button></div>
            {caseForm.tasks.map((task, index) => <div key={index} className="grid gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]"><input required aria-label={`Task ${index + 1} title`} value={task.title} onChange={(event) => updateFormTask(index, 'title', event.target.value)} placeholder={`Task ${index + 1} title`} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" />{caseForm.tasks.length > 1 && <button type="button" aria-label="Remove task" onClick={() => setCaseForm((current) => ({ ...current, tasks: current.tasks.filter((_, taskIndex) => taskIndex !== index) }))} className="rounded-lg p-2 text-slate-400 hover:text-rose-600"><X className="h-4 w-4" /></button>}</div>
              <input aria-label={`Task ${index + 1} description`} value={task.description} onChange={(event) => updateFormTask(index, 'description', event.target.value)} placeholder="Task details (optional)" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
              <div className="grid gap-2 sm:grid-cols-3"><select aria-label={`Task ${index + 1} category`} value={task.category} onChange={(event) => updateFormTask(index, 'category', event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs capitalize dark:border-slate-700 dark:bg-slate-900 dark:text-white">{taskCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select><select aria-label={`Task ${index + 1} owner`} value={task.owner} onChange={(event) => updateFormTask(index, 'owner', event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="">Employee</option>{employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.firstName} {employee.lastName}</option>)}</select><input aria-label={`Task ${index + 1} due date`} type="date" min={caseForm.startDate || undefined} value={task.dueDate} onChange={(event) => updateFormTask(index, 'dueDate', event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></div>
            </div>)}
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800"><button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancel</button><button disabled={saving} className="rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving ? 'Creating…' : 'Create checklist'}</button></div>
        </form>
      </Modal>
    </div>
  );
};

const Summary = ({ label, value, tone = 'slate' }) => {
  const tones = {
    slate: 'border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white',
    amber: 'border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200',
    emerald: 'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200',
  };
  return <div className={`rounded-xl border p-4 ${tones[tone]}`}><p className="text-[11px] font-bold uppercase tracking-wider opacity-75">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>;
};

const LifecycleCard = ({ lifecycleCase, canManage, currentEmployeeId, saving, today, onUpdateTask, onCancel }) => {
  const [expanded, setExpanded] = useState(true);
  const completedTasks = lifecycleCase.tasks.filter((task) => ['completed', 'skipped'].includes(task.status)).length;
  const progress = lifecycleCase.tasks.length ? Math.round((completedTasks / lifecycleCase.tasks.length) * 100) : 0;
  const isSubject = String(lifecycleCase.employee?._id) === String(currentEmployeeId);
  const overdue = lifecycleCase.targetDate && lifecycleCase.status === 'active' && lifecycleCase.targetDate.slice(0, 10) < today;

  return <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
    <button onClick={() => setExpanded((current) => !current)} className="flex w-full flex-col gap-4 p-5 text-left sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase ${lifecycleCase.type === 'onboarding' ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'}`}>{lifecycleCase.type}</span><span className="rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">{caseStatusLabels[lifecycleCase.status]}</span>{overdue && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">Past target</span>}</div><h2 className="mt-2 truncate text-sm font-extrabold text-slate-900 dark:text-white">{lifecycleCase.title}</h2><p className="mt-1 text-xs text-slate-500">{lifecycleCase.employee?.firstName} {lifecycleCase.employee?.lastName} · {lifecycleCase.employee?.department} · Starts {formatDate(lifecycleCase.startDate)}</p></div>
      <div className="w-full sm:max-w-52"><div className="mb-1.5 flex justify-between text-[10px] font-semibold text-slate-500"><span>{completedTasks}/{lifecycleCase.tasks.length} steps</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-1.5 text-[10px] text-slate-400">Target {formatDate(lifecycleCase.targetDate)}</p></div>
    </button>
    {expanded && <div className="space-y-2 border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/30 sm:p-5">{lifecycleCase.tasks.map((task) => {
      const ownerId = task.owner?._id || task.owner;
      const canUpdate = canManage || isSubject || String(ownerId) === String(currentEmployeeId);
      const overdueTask = task.dueDate && task.status !== 'completed' && task.status !== 'skipped' && task.dueDate.slice(0, 10) < today;
      return <div key={task._id} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3"><div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${task.status === 'completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>{task.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : <ClipboardCheck className="h-4 w-4" />}</div><div className="min-w-0"><h3 className="text-xs font-bold text-slate-900 dark:text-white">{task.title}</h3>{task.description && <p className="mt-0.5 text-[11px] text-slate-500">{task.description}</p>}<div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-400"><span className="capitalize">{task.category}</span><span>·</span><span className="inline-flex items-center gap-1"><UserRound className="h-3 w-3" />{task.owner ? `${task.owner.firstName} ${task.owner.lastName}` : 'Unassigned'}</span><span>·</span><span className={`inline-flex items-center gap-1 ${overdueTask ? 'font-bold text-rose-600' : ''}`}><CalendarDays className="h-3 w-3" />{formatDate(task.dueDate)}{overdueTask ? ' · overdue' : ''}</span></div>{task.note && <p className="mt-1 text-[10px] text-slate-500">Note: {task.note}</p>}</div></div>
        <div className="flex shrink-0 items-center gap-2 sm:pl-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${task.status === 'completed' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : task.status === 'in_progress' ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300' : task.status === 'skipped' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'}`}>{taskStatusLabels[task.status]}</span>{canUpdate && lifecycleCase.status === 'active' && task.status !== 'completed' && task.status !== 'skipped' && <button disabled={saving} onClick={() => onUpdateTask(lifecycleCase, task, 'completed')} className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-2.5 py-1.5 text-[10px] font-bold text-white disabled:opacity-50"><Check className="h-3 w-3" /> Complete</button>}</div>
      </div>;
    })}{canManage && lifecycleCase.status === 'active' && <div className="flex justify-end pt-2"><button disabled={saving} onClick={() => onCancel(lifecycleCase)} className="text-[10px] font-semibold text-rose-600 hover:underline disabled:opacity-50">Cancel checklist</button></div>}</div>}
  </article>;
};

const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set';

export default Lifecycle;
