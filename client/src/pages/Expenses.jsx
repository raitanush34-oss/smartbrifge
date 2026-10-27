import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ExternalLink, ReceiptIndianRupee, RotateCcw, X } from 'lucide-react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';

const categories = [
  { value: 'travel', label: 'Travel' },
  { value: 'meals', label: 'Meals' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'communication', label: 'Communication' },
  { value: 'other', label: 'Other' },
];

const statusLabels = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  reimbursed: 'Reimbursed',
};

const statusStyles = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
  approved: 'border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300',
  rejected: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300',
  reimbursed: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
};

const TODAY = new Date().toISOString().slice(0, 10);

const formatINR = (amount) => Number(amount || 0).toLocaleString('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric',
});

const Expenses = () => {
  const { hasRole } = useAuth();
  const isManager = hasRole('admin', 'manager');
  const [claims, setClaims] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('my');
  const [filters, setFilters] = useState({ status: 'All', department: 'All' });
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    category: 'travel', merchant: '', amount: '', expenseDate: TODAY,
    description: '', receiptUrl: '',
  });

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const response = activeTab === 'team' && isManager
        ? await api.get('/expenses/all', { params: filters })
        : await api.get('/expenses/my');
      setClaims(response.data?.data || []);
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Could not load expense claims' });
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters, isManager]);

  useEffect(() => {
    Promise.resolve().then(fetchClaims);
  }, [fetchClaims]);

  useEffect(() => {
    if (!isManager) return;
    api.get('/expenses/departments')
      .then((response) => setDepartments(response.data?.data || []))
      .catch(() => setDepartments([]));
  }, [isManager]);

  const totals = useMemo(() => ({
    pending: claims.filter((claim) => claim.status === 'pending').reduce((sum, claim) => sum + claim.amount, 0),
    approved: claims.filter((claim) => claim.status === 'approved').reduce((sum, claim) => sum + claim.amount, 0),
    reimbursed: claims.filter((claim) => claim.status === 'reimbursed').reduce((sum, claim) => sum + claim.amount, 0),
  }), [claims]);

  const submitClaim = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/expenses', { ...form, amount: Number(form.amount) });
      setToast({ type: 'success', message: 'Expense claim submitted for review' });
      setIsSubmitOpen(false);
      setForm({ category: 'travel', merchant: '', amount: '', expenseDate: TODAY, description: '', receiptUrl: '' });
      setActiveTab('my');
      await fetchClaims();
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Could not submit expense claim' });
    } finally {
      setSaving(false);
    }
  };

  const reviewClaim = async (claim, status, reviewNote) => {
    setSaving(true);
    try {
      await api.patch(`/expenses/${claim._id}/review`, { status, reviewNote });
      setToast({ type: 'success', message: `Claim ${status}` });
      await fetchClaims();
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Could not review claim' });
    } finally {
      setSaving(false);
    }
  };

  const reimburseClaim = async (claim) => {
    if (!window.confirm(`Mark ${formatINR(claim.amount)} for ${claim.employee?.firstName} ${claim.employee?.lastName} as reimbursed?`)) return;
    setSaving(true);
    try {
      await api.patch(`/expenses/${claim._id}/reimburse`);
      setToast({ type: 'success', message: 'Claim marked as reimbursed' });
      await fetchClaims();
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Could not update reimbursement status' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">Finance operations</p>
          <h1 className="flex items-center gap-2.5 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            <ReceiptIndianRupee className="h-6 w-6 text-teal-700 dark:text-teal-300" /> Expense Claims
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Submit work expenses, review claims, and track reimbursement status.</p>
        </div>
        <button onClick={() => setIsSubmitOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-800">
          <ReceiptIndianRupee className="h-4 w-4" /> Submit an expense
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryItem label="Awaiting review" amount={totals.pending} tone="amber" />
        <SummaryItem label="Approved for payment" amount={totals.approved} tone="teal" />
        <SummaryItem label="Reimbursed" amount={totals.reimbursed} tone="emerald" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-1">
          <button onClick={() => setActiveTab('my')} className={`border-b-2 px-3 py-3 text-xs font-bold ${activeTab === 'my' ? 'border-teal-700 text-teal-800 dark:border-teal-400 dark:text-teal-300' : 'border-transparent text-slate-500'}`}>My claims</button>
          {isManager && <button onClick={() => setActiveTab('team')} className={`border-b-2 px-3 py-3 text-xs font-bold ${activeTab === 'team' ? 'border-teal-700 text-teal-800 dark:border-teal-400 dark:text-teal-300' : 'border-transparent text-slate-500'}`}>Team claims</button>}
        </div>
        {activeTab === 'team' && isManager && <div className="flex flex-wrap gap-2 pb-2 sm:pb-0">
          <select aria-label="Filter by status" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"><option>All</option><option value="pending">Pending review</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="reimbursed">Reimbursed</option></select>
          <select aria-label="Filter by department" value={filters.department} onChange={(event) => setFilters((current) => ({ ...current, department: event.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"><option>All</option>{departments.map((department) => <option key={department}>{department}</option>)}</select>
        </div>}
      </div>

      {loading ? <div className="py-16 text-center text-sm text-slate-500">Loading expense claims...</div> : claims.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <ReceiptIndianRupee className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100">No claims to show</h2>
          <p className="mt-1 text-xs text-slate-500">{activeTab === 'team' ? 'Team claims will appear here when submitted.' : 'Submit a work expense to start tracking it here.'}</p>
        </div>
      ) : <div className="space-y-3">
        {claims.map((claim) => <ClaimRow key={claim._id} claim={claim} isManager={isManager && activeTab === 'team'} saving={saving} onReview={reviewClaim} onReimburse={reimburseClaim} />)}
      </div>}

      <Modal isOpen={isSubmitOpen} onClose={() => setIsSubmitOpen(false)} title="Submit an expense claim">
        <form onSubmit={submitClaim} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Expense category *
              <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white">{categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select>
            </label>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Amount (INR) *
              <input required type="number" min="0.01" max="10000000" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            </label>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Merchant / vendor *
              <input required maxLength="120" value={form.merchant} onChange={(event) => setForm((current) => ({ ...current, merchant: event.target.value }))} placeholder="Vendor or merchant" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            </label>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Expense date *
              <input required type="date" max={TODAY} value={form.expenseDate} onChange={(event) => setForm((current) => ({ ...current, expenseDate: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            </label>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 sm:col-span-2">Receipt link
              <input type="url" value={form.receiptUrl} onChange={(event) => setForm((current) => ({ ...current, receiptUrl: event.target.value }))} placeholder="https://..." className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            </label>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 sm:col-span-2">Business purpose *
              <textarea required maxLength="1500" rows="3" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Describe why this expense was required for work" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800"><button type="button" onClick={() => setIsSubmitOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancel</button><button disabled={saving} className="rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving ? 'Submitting…' : 'Submit claim'}</button></div>
        </form>
      </Modal>
    </div>
  );
};

const SummaryItem = ({ label, amount, tone }) => {
  const tones = {
    amber: 'border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200',
    teal: 'border-teal-200 bg-teal-50/70 text-teal-900 dark:border-teal-900 dark:bg-teal-950/20 dark:text-teal-200',
    emerald: 'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200',
  };
  return <div className={`rounded-xl border p-4 ${tones[tone]}`}><p className="text-[11px] font-bold uppercase tracking-wider opacity-80">{label}</p><p className="mt-1 text-xl font-black">{formatINR(amount)}</p></div>;
};

const ClaimRow = ({ claim, isManager, saving, onReview, onReimburse }) => {
  const [reviewNote, setReviewNote] = useState(claim.reviewNote || '');
  const category = categories.find((item) => item.value === claim.category)?.label || claim.category;
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-extrabold text-slate-900 dark:text-white">{claim.merchant}</h2><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusStyles[claim.status]}`}>{statusLabels[claim.status]}</span></div>
          <p className="mt-1 text-xs text-slate-500">{category} · {formatDate(claim.expenseDate)}{claim.employee && <span> · {claim.employee.firstName} {claim.employee.lastName} ({claim.employee.department})</span>}</p>
          <p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-slate-700 dark:text-slate-300">{claim.description}</p>
          {claim.reviewNote && <p className="mt-2 text-xs text-slate-500"><span className="font-semibold">Review note:</span> {claim.reviewNote}</p>}
          {claim.receiptUrl && <a href={claim.receiptUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:underline dark:text-teal-300">View receipt <ExternalLink className="h-3 w-3" /></a>}
        </div>
        <div className="flex flex-col items-start gap-3 lg:items-end">
          <p className="text-xl font-black text-slate-900 dark:text-white">{formatINR(claim.amount)}</p>
          {isManager && claim.status === 'pending' && <div className="flex flex-col gap-2 sm:flex-row">
            <input aria-label="Review note" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Decision note (optional)" className="min-w-44 rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            <button disabled={saving} onClick={() => onReview(claim, 'approved', reviewNote)} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Check className="h-3.5 w-3.5" /> Approve</button>
            <button disabled={saving} onClick={() => onReview(claim, 'rejected', reviewNote)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300"><X className="h-3.5 w-3.5" /> Reject</button>
          </div>}
          {isManager && claim.status === 'approved' && <button disabled={saving} onClick={() => onReimburse(claim)} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><RotateCcw className="h-3.5 w-3.5" /> Mark reimbursed</button>}
        </div>
      </div>
    </article>
  );
};

export default Expenses;
