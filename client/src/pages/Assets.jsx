import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, Box, Laptop, Plus, Search, Smartphone, Wrench } from 'lucide-react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';

const categories = [
  { value: 'laptop', label: 'Laptop' },
  { value: 'phone', label: 'Phone' },
  { value: 'accessory', label: 'Accessory' },
  { value: 'badge', label: 'Badge' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'other', label: 'Other' },
];
const conditions = [
  { value: 'good', label: 'Good' },
  { value: 'minor_damage', label: 'Minor damage' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'lost', label: 'Lost' },
];
const statusLabels = { available: 'Available', assigned: 'Assigned', maintenance: 'Maintenance', retired: 'Retired', lost: 'Lost' };

const Assets = () => {
  const { hasRole } = useAuth();
  const canManage = hasRole('admin', 'manager');
  const [assets, setAssets] = useState([]);
  const [myAssets, setMyAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [activeTab, setActiveTab] = useState(canManage ? 'inventory' : 'mine');
  const [filters, setFilters] = useState({ status: 'All', category: 'All', search: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [assignmentAsset, setAssignmentAsset] = useState(null);
  const [returnAsset, setReturnAsset] = useState(null);
  const [assetForm, setAssetForm] = useState({
    assetTag: '', name: '', category: 'laptop', manufacturer: '', model: '', serialNumber: '',
    purchaseDate: '', purchaseCost: '', location: '', condition: 'good', notes: '',
  });
  const [assignmentForm, setAssignmentForm] = useState({ employeeId: '', dueBackAt: '', notes: '' });
  const [returnForm, setReturnForm] = useState({ returnCondition: 'good', notes: '' });

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const requests = [api.get('/assets/my')];
      if (canManage) requests.push(api.get('/assets', { params: filters }));
      const [mineResponse, inventoryResponse] = await Promise.all(requests);
      setMyAssets(mineResponse.data?.data || []);
      setAssets(inventoryResponse?.data?.data || []);
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Could not load assets' });
    } finally {
      setLoading(false);
    }
  }, [canManage, filters]);

  useEffect(() => {
    Promise.resolve().then(loadAssets);
  }, [loadAssets]);

  useEffect(() => {
    if (!canManage) return;
    api.get('/employees', { params: { limit: 500, status: 'active', sort: 'firstName' } })
      .then((response) => setEmployees(response.data?.data || []))
      .catch(() => setToast({ type: 'error', message: 'Could not load employee list' }));
  }, [canManage]);

  const summary = useMemo(() => ({
    total: assets.length,
    available: assets.filter((asset) => asset.status === 'available').length,
    assigned: assets.filter((asset) => asset.status === 'assigned').length,
    attention: assets.filter((asset) => ['maintenance', 'lost'].includes(asset.status)).length,
  }), [assets]);

  const createAsset = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/assets', { ...assetForm, purchaseCost: assetForm.purchaseCost || null, purchaseDate: assetForm.purchaseDate || null });
      setToast({ type: 'success', message: 'Asset added to inventory' });
      setIsCreateOpen(false);
      setAssetForm({ assetTag: '', name: '', category: 'laptop', manufacturer: '', model: '', serialNumber: '', purchaseDate: '', purchaseCost: '', location: '', condition: 'good', notes: '' });
      await loadAssets();
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Could not add asset' });
    } finally {
      setSaving(false);
    }
  };

  const assignAsset = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post(`/assets/${assignmentAsset._id}/assign`, assignmentForm);
      setToast({ type: 'success', message: `${assignmentAsset.assetTag} assigned successfully` });
      setAssignmentAsset(null);
      setAssignmentForm({ employeeId: '', dueBackAt: '', notes: '' });
      await loadAssets();
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Could not assign asset' });
    } finally {
      setSaving(false);
    }
  };

  const submitReturn = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/assets/${returnAsset._id}/return`, returnForm);
      setToast({ type: 'success', message: `${returnAsset.assetTag} return recorded` });
      setReturnAsset(null);
      setReturnForm({ returnCondition: 'good', notes: '' });
      await loadAssets();
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Could not record asset return' });
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (asset, status) => {
    setSaving(true);
    try {
      await api.patch(`/assets/${asset._id}/status`, { status });
      setToast({ type: 'success', message: `${asset.assetTag} marked ${statusLabels[status].toLowerCase()}` });
      await loadAssets();
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Could not update asset status' });
    } finally {
      setSaving(false);
    }
  };

  const shownAssets = activeTab === 'inventory' ? assets : myAssets;
  const categoriesInUse = [...new Set(assets.map((asset) => asset.category))];

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">Workplace operations</p>
          <h1 className="flex items-center gap-2.5 text-2xl font-black tracking-tight text-slate-900 dark:text-white"><Box className="h-6 w-6 text-teal-700 dark:text-teal-300" /> Company Assets</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Track equipment assignments, returns, and inventory condition.</p>
        </div>
        {canManage && <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-800"><Plus className="h-4 w-4" /> Add asset</button>}
      </header>

      {canManage && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Summary label="Inventory" value={summary.total} />
        <Summary label="Available" value={summary.available} tone="emerald" />
        <Summary label="Assigned" value={summary.assigned} tone="teal" />
        <Summary label="Needs attention" value={summary.attention} tone="amber" />
      </div>}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-1">
          {canManage && <button onClick={() => setActiveTab('inventory')} className={`border-b-2 px-3 py-3 text-xs font-bold ${activeTab === 'inventory' ? 'border-teal-700 text-teal-800 dark:border-teal-400 dark:text-teal-300' : 'border-transparent text-slate-500'}`}>Inventory</button>}
          <button onClick={() => setActiveTab('mine')} className={`border-b-2 px-3 py-3 text-xs font-bold ${activeTab === 'mine' ? 'border-teal-700 text-teal-800 dark:border-teal-400 dark:text-teal-300' : 'border-transparent text-slate-500'}`}>My equipment</button>
        </div>
        {activeTab === 'inventory' && canManage && <div className="flex flex-wrap gap-2 pb-2 sm:pb-0">
          <label className="relative"><Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" /><input aria-label="Search assets" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Tag, name, serial" className="w-40 rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-2 text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-white" /></label>
          <select aria-label="Filter by asset status" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"><option>All</option>{Object.keys(statusLabels).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select>
          <select aria-label="Filter by asset category" value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"><option>All</option>{categoriesInUse.map((category) => <option key={category} value={category}>{category}</option>)}</select>
        </div>}
      </div>

      {loading ? <div className="py-16 text-center text-sm text-slate-500">Loading asset records...</div> : shownAssets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900"><Box className="mx-auto h-8 w-8 text-slate-400" /><h2 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100">No assets to show</h2><p className="mt-1 text-xs text-slate-500">{activeTab === 'inventory' ? 'Add the first company asset to start tracking assignments.' : 'Assets assigned to you will appear here.'}</p></div>
      ) : <div className="grid gap-3 xl:grid-cols-2">{shownAssets.map((asset) => <AssetCard key={asset._id} asset={asset} canManage={canManage && activeTab === 'inventory'} saving={saving} onAssign={() => { setAssignmentAsset(asset); setAssignmentForm({ employeeId: '', dueBackAt: '', notes: '' }); }} onReturn={() => { setReturnAsset(asset); setReturnForm({ returnCondition: 'good', notes: '' }); }} onChangeStatus={changeStatus} />)}</div>}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add company asset">
        <form onSubmit={createAsset} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2">
          <Field label="Asset tag *"><input required maxLength="32" value={assetForm.assetTag} onChange={(event) => setAssetForm((current) => ({ ...current, assetTag: event.target.value.toUpperCase() }))} placeholder="SS-LAP-1042" className={inputClass} /></Field>
          <Field label="Asset name *"><input required maxLength="100" value={assetForm.name} onChange={(event) => setAssetForm((current) => ({ ...current, name: event.target.value }))} placeholder="Work laptop" className={inputClass} /></Field>
          <Field label="Category"><select value={assetForm.category} onChange={(event) => setAssetForm((current) => ({ ...current, category: event.target.value }))} className={inputClass}>{categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select></Field>
          <Field label="Manufacturer"><input value={assetForm.manufacturer} onChange={(event) => setAssetForm((current) => ({ ...current, manufacturer: event.target.value }))} className={inputClass} /></Field>
          <Field label="Model"><input value={assetForm.model} onChange={(event) => setAssetForm((current) => ({ ...current, model: event.target.value }))} className={inputClass} /></Field>
          <Field label="Serial number"><input value={assetForm.serialNumber} onChange={(event) => setAssetForm((current) => ({ ...current, serialNumber: event.target.value }))} className={inputClass} /></Field>
          <Field label="Purchase date"><input type="date" value={assetForm.purchaseDate} onChange={(event) => setAssetForm((current) => ({ ...current, purchaseDate: event.target.value }))} className={inputClass} /></Field>
          <Field label="Purchase cost (INR)"><input type="number" min="0" step="0.01" value={assetForm.purchaseCost} onChange={(event) => setAssetForm((current) => ({ ...current, purchaseCost: event.target.value }))} className={inputClass} /></Field>
          <Field label="Storage location"><input value={assetForm.location} onChange={(event) => setAssetForm((current) => ({ ...current, location: event.target.value }))} placeholder="Bengaluru HQ" className={inputClass} /></Field>
          <Field label="Condition"><select value={assetForm.condition} onChange={(event) => setAssetForm((current) => ({ ...current, condition: event.target.value }))} className={inputClass}><option value="new">New</option><option value="good">Good</option><option value="fair">Fair</option><option value="damaged">Damaged</option></select></Field>
          <Field label="Notes" className="sm:col-span-2"><textarea rows="2" value={assetForm.notes} onChange={(event) => setAssetForm((current) => ({ ...current, notes: event.target.value }))} className={inputClass} /></Field>
        </div><ModalActions saving={saving} onCancel={() => setIsCreateOpen(false)} submitLabel="Add asset" /></form>
      </Modal>

      <Modal isOpen={Boolean(assignmentAsset)} onClose={() => setAssignmentAsset(null)} title={`Assign ${assignmentAsset?.assetTag || 'asset'}`}>
        <form onSubmit={assignAsset} className="space-y-4"><Field label="Assign to employee *"><select required value={assignmentForm.employeeId} onChange={(event) => setAssignmentForm((current) => ({ ...current, employeeId: event.target.value }))} className={inputClass}><option value="">Choose employee</option>{employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.firstName} {employee.lastName} · {employee.department}</option>)}</select></Field><Field label="Expected return date"><input type="date" value={assignmentForm.dueBackAt} onChange={(event) => setAssignmentForm((current) => ({ ...current, dueBackAt: event.target.value }))} className={inputClass} /></Field><Field label="Assignment notes"><textarea rows="3" value={assignmentForm.notes} onChange={(event) => setAssignmentForm((current) => ({ ...current, notes: event.target.value }))} className={inputClass} /></Field><ModalActions saving={saving} onCancel={() => setAssignmentAsset(null)} submitLabel="Assign asset" /></form>
      </Modal>

      <Modal isOpen={Boolean(returnAsset)} onClose={() => setReturnAsset(null)} title={`Record return: ${returnAsset?.assetTag || 'asset'}`}>
        <form onSubmit={submitReturn} className="space-y-4"><Field label="Return condition *"><select required value={returnForm.returnCondition} onChange={(event) => setReturnForm((current) => ({ ...current, returnCondition: event.target.value }))} className={inputClass}>{conditions.map((condition) => <option key={condition.value} value={condition.value}>{condition.label}</option>)}</select></Field><Field label="Return notes"><textarea rows="3" value={returnForm.notes} onChange={(event) => setReturnForm((current) => ({ ...current, notes: event.target.value }))} className={inputClass} /></Field><p className="text-[11px] text-slate-500">Damaged equipment moves to maintenance. Lost equipment is marked lost.</p><ModalActions saving={saving} onCancel={() => setReturnAsset(null)} submitLabel="Record return" /></form>
      </Modal>
    </div>
  );
};

const inputClass = 'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white';

const Field = ({ label, className = '', children }) => <label className={`block text-xs font-bold text-slate-600 dark:text-slate-300 ${className}`}>{label}{children}</label>;

const ModalActions = ({ saving, onCancel, submitLabel }) => <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800"><button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancel</button><button disabled={saving} className="rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : submitLabel}</button></div>;

const Summary = ({ label, value, tone = 'slate' }) => {
  const colors = { slate: 'border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white', emerald: 'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200', teal: 'border-teal-200 bg-teal-50/70 text-teal-900 dark:border-teal-900 dark:bg-teal-950/20 dark:text-teal-200', amber: 'border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200' };
  return <div className={`rounded-xl border p-4 ${colors[tone]}`}><p className="text-[10px] font-bold uppercase tracking-wider opacity-75">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>;
};

const AssetCard = ({ asset, canManage, saving, onAssign, onReturn, onChangeStatus }) => {
  const currentAssignment = [...(asset.assignmentHistory || [])].reverse().find((assignment) => !assignment.returnedAt);
  const statusColor = asset.status === 'available' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : asset.status === 'assigned' ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300' : asset.status === 'maintenance' ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300';
  const CategoryIcon = asset.category === 'laptop' ? Laptop : asset.category === 'phone' ? Smartphone : Box;
  return <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
    <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300"><CategoryIcon className="h-5 w-5" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-extrabold text-slate-900 dark:text-white">{asset.name}</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusColor}`}>{statusLabels[asset.status]}</span></div><p className="mt-1 text-xs text-slate-500"><span className="font-mono font-semibold">{asset.assetTag}</span> · {asset.category}{asset.manufacturer && ` · ${asset.manufacturer}`} {asset.model}</p><p className="mt-1 text-[11px] text-slate-400">{asset.serialNumber && `S/N ${asset.serialNumber} · `}{asset.location || 'Location not set'} · Condition: {asset.condition}</p></div></div></div>
    {currentAssignment && <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800"><p className="text-slate-600 dark:text-slate-300">Assigned to <strong>{currentAssignment.employee?.firstName} {currentAssignment.employee?.lastName}</strong><span className="text-slate-400"> · {currentAssignment.employee?.department}</span></p><p className="text-slate-500">{currentAssignment.dueBackAt ? `Due ${formatDate(currentAssignment.dueBackAt)}` : 'No return date'}</p></div>}
    {asset.assignmentHistory?.length > 0 && <details className="mt-3 border-t border-slate-100 pt-3 text-[11px] dark:border-slate-800"><summary className="cursor-pointer font-semibold text-slate-500">Assignment history ({asset.assignmentHistory.length})</summary><div className="mt-2 space-y-2">{[...asset.assignmentHistory].reverse().map((entry) => <div key={entry._id} className="flex flex-wrap justify-between gap-2 text-slate-500"><span>{entry.employee?.firstName} {entry.employee?.lastName} · {formatDate(entry.assignedAt)}{entry.returnedAt && ` → returned ${formatDate(entry.returnedAt)} (${entry.returnCondition?.replace('_', ' ')})`}</span>{entry.notes && <span>{entry.notes}</span>}</div>)}</div></details>}
    {canManage && <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">{asset.status === 'available' && <button disabled={saving} onClick={onAssign} className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Assign</button>}{asset.status === 'assigned' && <button disabled={saving} onClick={onReturn} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"><ArrowDownToLine className="h-3.5 w-3.5" /> Record return</button>}{asset.status === 'available' && <select aria-label="Set asset status" disabled={saving} value="" onChange={(event) => onChangeStatus(asset, event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="" disabled>More actions</option><option value="maintenance">Send to maintenance</option><option value="retired">Retire asset</option><option value="lost">Mark lost</option></select>}{asset.status === 'maintenance' && <button disabled={saving} onClick={() => onChangeStatus(asset, 'available')} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 px-3 py-2 text-xs font-bold text-amber-800 disabled:opacity-50 dark:border-amber-900 dark:text-amber-300"><Wrench className="h-3.5 w-3.5" /> Mark available</button>}</div>}
  </article>;
};

const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set';

export default Assets;
