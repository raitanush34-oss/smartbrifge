import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ClipboardList, Plus, Star, Target, X } from 'lucide-react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';

const ratingOptions = [1, 2, 3, 4, 5];

const formatDate = (value) => value
  ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : 'Not set';

const statusStyle = {
  self_review: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
  manager_review: 'border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
};

const statusLabel = {
  self_review: 'Self review',
  manager_review: 'Manager review',
  completed: 'Completed',
};

const RatingSelect = ({ value, onChange, label, disabled = false }) => (
  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
    <span>{label}</span>
    <select
      value={value ?? ''}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
      className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800"
    >
      <option value="">Rate</option>
      {ratingOptions.map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}
    </select>
  </label>
);

const Reviews = () => {
  const { user, hasRole } = useAuth();
  const isManager = hasRole('admin', 'manager');
  const isAdmin = hasRole('admin');
  const currentEmployeeId = user?.employeeId || user?.employee?._id;
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeReviewId, setActiveReviewId] = useState(null);
  const [selfForms, setSelfForms] = useState({});
  const [managerForms, setManagerForms] = useState({});
  const [filters, setFilters] = useState({ status: 'All', department: 'All' });
  const [newReview, setNewReview] = useState({
    employeeId: '',
    cycleName: '',
    periodStart: '',
    periodEnd: '',
    dueDate: '',
    goals: [{ title: '', description: '' }],
  });

  const fetchReviews = useCallback(async () => {
    try {
      const endpoint = isManager ? '/reviews' : '/reviews/my';
      const params = isManager ? filters : undefined;
      const response = await api.get(endpoint, { params });
      setReviews(response.data?.data || []);
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Could not load performance reviews' });
    } finally {
      setLoading(false);
    }
  }, [filters, isManager]);

  useEffect(() => {
    Promise.resolve().then(fetchReviews);
  }, [fetchReviews]);

  useEffect(() => {
    if (!isManager) return;
    api.get('/employees', { params: { limit: 500, sort: 'firstName' } })
      .then((response) => setEmployees(response.data?.data || []))
      .catch(() => setToast({ type: 'error', message: 'Could not load employee directory' }));
  }, [isManager]);

  const updateGoal = (index, field, value) => {
    setNewReview((current) => ({
      ...current,
      goals: current.goals.map((goal, goalIndex) => goalIndex === index ? { ...goal, [field]: value } : goal),
    }));
  };

  const handleCreateReview = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...newReview, goals: newReview.goals.filter((goal) => goal.title.trim()) };
      const response = await api.post('/reviews', payload);
      setToast({ type: 'success', message: `Review cycle created for ${response.data.data.employee.firstName} ${response.data.data.employee.lastName}` });
      setIsCreateOpen(false);
      setNewReview((current) => ({ ...current, employeeId: '', goals: [{ title: '', description: '' }] }));
      fetchReviews();
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Could not create review cycle' });
    } finally {
      setSaving(false);
    }
  };

  const getSelfForm = (review) => selfForms[review._id] || {
    employeeSummary: review.employeeSummary || '',
    goals: review.goals.map((goal) => ({ goalId: goal._id, selfRating: goal.selfRating, selfComment: goal.selfComment || '' })),
  };

  const updateSelfForm = (review, field, value, goalId) => {
    const form = getSelfForm(review);
    if (goalId) {
      form.goals = form.goals.map((goal) => goal.goalId === goalId ? { ...goal, [field]: value } : goal);
    } else {
      form[field] = value;
    }
    setSelfForms((current) => ({ ...current, [review._id]: { ...form } }));
  };

  const submitSelfReview = async (review) => {
    const form = getSelfForm(review);
    if (form.goals.some((goal) => !goal.selfRating)) {
      setToast({ type: 'error', message: 'Please rate every goal before submitting' });
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/reviews/${review._id}/self`, form);
      setToast({ type: 'success', message: 'Self-review submitted to your manager' });
      setActiveReviewId(null);
      fetchReviews();
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Could not submit self-review' });
    } finally {
      setSaving(false);
    }
  };

  const getManagerForm = (review) => managerForms[review._id] || {
    overallRating: review.overallRating,
    managerSummary: review.managerSummary || '',
    strengths: review.strengths || '',
    improvementAreas: review.improvementAreas || '',
    goals: review.goals.map((goal) => ({ goalId: goal._id, managerRating: goal.managerRating, managerComment: goal.managerComment || '' })),
  };

  const updateManagerForm = (review, field, value, goalId) => {
    const form = getManagerForm(review);
    if (goalId) {
      form.goals = form.goals.map((goal) => goal.goalId === goalId ? { ...goal, [field]: value } : goal);
    } else {
      form[field] = value;
    }
    setManagerForms((current) => ({ ...current, [review._id]: { ...form } }));
  };

  const completeManagerReview = async (review) => {
    const form = getManagerForm(review);
    if (!form.overallRating || form.goals.some((goal) => !goal.managerRating)) {
      setToast({ type: 'error', message: 'Add an overall rating and rate every goal before completing' });
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/reviews/${review._id}/manager`, form);
      setToast({ type: 'success', message: 'Performance review completed' });
      setActiveReviewId(null);
      fetchReviews();
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Could not complete manager review' });
    } finally {
      setSaving(false);
    }
  };

  const visibleReviews = reviews;
  const pendingCount = visibleReviews.filter((review) => review.status !== 'completed').length;

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">People development</p>
          <h1 className="flex items-center gap-2.5 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            <ClipboardList className="h-6 w-6 text-teal-700 dark:text-teal-300" /> Performance Reviews
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Goals, reflection, and manager feedback in one review cycle.</p>
        </div>
        {isManager && (
          <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-800">
            <Plus className="h-4 w-4" /> Start review cycle
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total reviews</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{visibleReviews.length}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/20">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">In progress</p>
          <p className="mt-1 text-2xl font-black text-amber-900 dark:text-amber-200">{pendingCount}</p>
        </div>
        <div className="col-span-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/20 sm:col-span-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Completed</p>
          <p className="mt-1 text-2xl font-black text-emerald-900 dark:text-emerald-200">{visibleReviews.filter((review) => review.status === 'completed').length}</p>
        </div>
      </div>

      {isManager && (
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
          <label className="text-xs font-semibold text-slate-500">Status
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="ml-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <option>All</option><option value="self_review">Self review</option><option value="manager_review">Manager review</option><option value="completed">Completed</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-500">Department
            <select value={filters.department} onChange={(event) => setFilters((current) => ({ ...current, department: event.target.value }))} className="ml-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              {['All', ...new Set(employees.map((employee) => employee.department).filter(Boolean))].map((department) => <option key={department}>{department}</option>)}
            </select>
          </label>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading reviews...</div>
      ) : visibleReviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <Target className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100">No reviews yet</h2>
          <p className="mt-1 text-xs text-slate-500">{isManager ? 'Start a review cycle to begin collecting employee reflections.' : 'Your review cycles will appear here when assigned.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleReviews.map((review) => {
            const employee = review.employee || {};
            const assignedReviewerId = review.reviewer?._id || review.reviewer;
            const canSelfReview = review.status === 'self_review' && currentEmployeeId && employee._id === currentEmployeeId;
            const canManagerReview = isManager && review.status === 'manager_review' && (isAdmin || assignedReviewerId === currentEmployeeId);
            const isActive = activeReviewId === review._id;
            const managerForm = getManagerForm(review);
            const selfForm = getSelfForm(review);

            return (
              <article key={review._id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{review.cycleName}</h2>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusStyle[review.status]}`}>{statusLabel[review.status]}</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {isManager ? `${employee.firstName || ''} ${employee.lastName || ''}` : 'Your review'}
                      {isManager && <span className="font-normal text-slate-400"> · {employee.designation} · {employee.department}</span>}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">Review period: {formatDate(review.periodStart)} – {formatDate(review.periodEnd)} <span className="mx-1 text-slate-300">|</span> Due: {formatDate(review.dueDate)}</p>
                    <p className="mt-3 text-xs font-semibold text-slate-600 dark:text-slate-300">{review.goals.length} {review.goals.length === 1 ? 'goal' : 'goals'}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {review.status === 'completed' && <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"><Star className="h-3.5 w-3.5" /> {review.overallRating} / 5</span>}
                    {(canSelfReview || canManagerReview) && (
                      <button onClick={() => setActiveReviewId(isActive ? null : review._id)} className="rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-teal-800">
                        {isActive ? 'Close review' : canSelfReview ? 'Write self-review' : 'Write manager review'}
                      </button>
                    )}
                  </div>
                </div>

                {isActive && canSelfReview && (
                  <div className="border-t border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="space-y-4">
                      {review.goals.map((goal) => {
                        const formGoal = selfForm.goals.find((item) => item.goalId === goal._id) || {};
                        return <div key={goal._id} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div><h3 className="text-sm font-bold text-slate-900 dark:text-white">{goal.title}</h3>{goal.description && <p className="mt-1 text-xs text-slate-500">{goal.description}</p>}</div>
                            <RatingSelect label="Self rating" value={formGoal.selfRating} onChange={(value) => updateSelfForm(review, 'selfRating', value, goal._id)} />
                          </div>
                          <textarea value={formGoal.selfComment || ''} onChange={(event) => updateSelfForm(review, 'selfComment', event.target.value, goal._id)} rows="2" placeholder="Share progress or evidence for this goal" className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                        </div>;
                      })}
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">Overall reflection
                        <textarea value={selfForm.employeeSummary} onChange={(event) => updateSelfForm(review, 'employeeSummary', event.target.value)} rows="3" placeholder="What progress are you most proud of? What support would help next?" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                      </label>
                      <div className="flex justify-end"><button disabled={saving} onClick={() => submitSelfReview(review)} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> Submit self-review</button></div>
                    </div>
                  </div>
                )}

                {isActive && canManagerReview && (
                  <div className="border-t border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="mb-4 rounded-lg border border-teal-100 bg-teal-50/70 p-4 dark:border-teal-900 dark:bg-teal-950/30">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">Employee reflection</p>
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-700 dark:text-slate-300">{review.employeeSummary || 'No overall reflection provided.'}</p>
                    </div>
                    <div className="space-y-4">
                      {review.goals.map((goal) => {
                        const formGoal = managerForm.goals.find((item) => item.goalId === goal._id) || {};
                        return <div key={goal._id} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div><h3 className="text-sm font-bold text-slate-900 dark:text-white">{goal.title}</h3><p className="mt-1 text-xs text-slate-500">Self rating: {goal.selfRating || '—'} / 5</p>{goal.selfComment && <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">“{goal.selfComment}”</p>}</div>
                            <RatingSelect label="Manager rating" value={formGoal.managerRating} onChange={(value) => updateManagerForm(review, 'managerRating', value, goal._id)} />
                          </div>
                          <textarea value={formGoal.managerComment || ''} onChange={(event) => updateManagerForm(review, 'managerComment', event.target.value, goal._id)} rows="2" placeholder="Feedback for this goal" className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                        </div>;
                      })}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Overall rating
                          <select value={managerForm.overallRating || ''} onChange={(event) => updateManagerForm(review, 'overallRating', event.target.value ? Number(event.target.value) : null)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="">Select rating</option>{ratingOptions.map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}</select>
                        </label>
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Strengths
                          <textarea value={managerForm.strengths} onChange={(event) => updateManagerForm(review, 'strengths', event.target.value)} rows="2" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                        </label>
                      </div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">Growth areas
                        <textarea value={managerForm.improvementAreas} onChange={(event) => updateManagerForm(review, 'improvementAreas', event.target.value)} rows="2" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                      </label>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">Manager summary
                        <textarea value={managerForm.managerSummary} onChange={(event) => updateManagerForm(review, 'managerSummary', event.target.value)} rows="3" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                      </label>
                      <div className="flex justify-end"><button disabled={saving} onClick={() => completeManagerReview(review)} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> Complete review</button></div>
                    </div>
                  </div>
                )}

                {review.status === 'completed' && (
                  <div className="grid gap-4 border-t border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/30 sm:grid-cols-2">
                    <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Employee reflection</p><p className="mt-1 whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-300">{review.employeeSummary || 'No reflection submitted.'}</p></div>
                    <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Manager summary</p><p className="mt-1 whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-300">{review.managerSummary || 'No manager summary provided.'}</p></div>
                    {review.strengths && <div><p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Strengths</p><p className="mt-1 text-xs text-slate-700 dark:text-slate-300">{review.strengths}</p></div>}
                    {review.improvementAreas && <div><p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Growth areas</p><p className="mt-1 text-xs text-slate-700 dark:text-slate-300">{review.improvementAreas}</p></div>}
                    <div className="sm:col-span-2"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Goal ratings</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{review.goals.map((goal) => <div key={goal._id} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{goal.title}</span><span className="text-xs font-bold text-teal-800 dark:text-teal-300">{goal.managerRating} / 5</span></div>{goal.managerComment && <p className="mt-1 text-xs text-slate-500">{goal.managerComment}</p>}</div>)}</div></div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Start a performance review cycle">
        <form onSubmit={handleCreateReview} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 sm:col-span-2">Employee *
              <select required value={newReview.employeeId} onChange={(event) => setNewReview((current) => ({ ...current, employeeId: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="">Choose employee</option>{employees.filter((employee) => isAdmin || employee._id !== currentEmployeeId).map((employee) => <option key={employee._id} value={employee._id}>{employee.firstName} {employee.lastName} · {employee.department}</option>)}</select>
            </label>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 sm:col-span-2">Cycle name *
              <input required value={newReview.cycleName} onChange={(event) => setNewReview((current) => ({ ...current, cycleName: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            </label>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Period start *
              <input required type="date" value={newReview.periodStart} onChange={(event) => setNewReview((current) => ({ ...current, periodStart: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            </label>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Period end *
              <input required type="date" value={newReview.periodEnd} onChange={(event) => setNewReview((current) => ({ ...current, periodEnd: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            </label>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 sm:col-span-2">Due date
              <input type="date" value={newReview.dueDate} onChange={(event) => setNewReview((current) => ({ ...current, dueDate: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            </label>
          </div>

          <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className="flex items-center justify-between"><div><h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">Goals</h3><p className="text-[11px] text-slate-500">Add the outcomes to discuss in this cycle.</p></div><button type="button" onClick={() => setNewReview((current) => ({ ...current, goals: [...current.goals, { title: '', description: '' }] }))} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"><Plus className="h-3.5 w-3.5" /> Add goal</button></div>
            {newReview.goals.map((goal, index) => <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input aria-label={`Goal ${index + 1} title`} value={goal.title} onChange={(event) => updateGoal(index, 'title', event.target.value)} placeholder={`Goal ${index + 1} title`} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" /><input aria-label={`Goal ${index + 1} description`} value={goal.description} onChange={(event) => updateGoal(index, 'description', event.target.value)} placeholder="Description (optional)" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" />{newReview.goals.length > 1 && <button type="button" aria-label="Remove goal" onClick={() => setNewReview((current) => ({ ...current, goals: current.goals.filter((_, goalIndex) => goalIndex !== index) }))} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"><X className="h-4 w-4" /></button>}</div>)}
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800"><button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancel</button><button disabled={saving} className="rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving ? 'Creating…' : 'Create review'}</button></div>
        </form>
      </Modal>
    </div>
  );
};

export default Reviews;
