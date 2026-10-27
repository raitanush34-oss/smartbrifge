import React, { useState, useEffect } from 'react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import {
  CreditCard,
  Download,
  Calendar,
  FileText,
  Play,
  TrendingUp,
  Receipt,
  Eye,
  Building,
  CheckCircle2,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatINR = (val) => Number(val || 0).toLocaleString('en-IN');

const Payroll = () => {
  const { user, hasRole } = useAuth();
  const isAdminOrManager = hasRole('admin', 'manager');

  const [activeTab, setActiveTab] = useState(isAdminOrManager ? 'all' : 'my');
  const [summary, setSummary] = useState(null);
  const [payrollList, setPayrollList] = useState([]);
  const [myPayrolls, setMyPayrolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Batch generation modal
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchMonth, setBatchMonth] = useState(new Date().getMonth() + 1);
  const [batchYear, setBatchYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);

  // Payslip preview modal
  const [previewPayroll, setPreviewPayroll] = useState(null);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/payroll/summary');
      if (res.data?.success) setSummary(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAllPayroll = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payroll/all');
      if (res.data?.success) setPayrollList(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPayroll = async () => {
    try {
      const res = await api.get('/payroll/my');
      if (res.data?.success) setMyPayrolls(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isAdminOrManager) {
      fetchSummary();
      fetchAllPayroll();
    }
    fetchMyPayroll();
  }, []);

  const handleGenerateBatch = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await api.post('/payroll/generate-batch', {
        month: batchMonth,
        year: batchYear,
      });

      if (res.data?.success) {
        setToast({ type: 'success', message: res.data.message });
        setBatchModalOpen(false);
        fetchAllPayroll();
        fetchSummary();
        fetchMyPayroll();
      }
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Batch generation failed' });
    } finally {
      setGenerating(false);
    }
  };

  // Indian Corporate PDF Payslip Generator
  const handleDownloadPDF = (record) => {
    const doc = new jsPDF();
    const emp = record.employee || {};

    // Header Branding
    doc.setFillColor(30, 58, 138); // Deep Navy
    doc.rect(0, 0, 210, 32, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('STAFFSYNC TECHNOLOGIES INDIA PVT. LTD.', 14, 14);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Ecospace Tech Park, Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103', 14, 21);
    doc.text('CIN: U72200KA2021PTC145892 | EPFO & ESIC Compliant', 14, 26);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SALARY PAYSLIP', 196, 15, { align: 'right' });
    doc.setFontSize(8.5);
    doc.text(`${record.monthName} ${record.year}`, 196, 23, { align: 'right' });

    // Employee & Tax Info Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 38, 182, 38, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 38, 182, 38, 2, 2, 'D');

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Employee Name:', 18, 46);
    doc.text('Employee Code:', 18, 54);
    doc.text('Department:', 18, 62);
    doc.text('Designation:', 18, 70);

    doc.setFont('helvetica', 'normal');
    doc.text(`${emp.firstName || ''} ${emp.lastName || ''}`, 52, 46);
    doc.text(`${emp.employeeCode || 'EMP-1001'}`, 52, 54);
    doc.text(`${emp.department || 'Engineering'}`, 52, 62);
    doc.text(`${emp.designation || 'Specialist'}`, 52, 70);

    doc.setFont('helvetica', 'bold');
    doc.text('PAN Card No:', 108, 46);
    doc.text('PF / UAN No:', 108, 54);
    doc.text('Bank & Account:', 108, 62);
    doc.text('IFSC Code:', 108, 70);

    doc.setFont('helvetica', 'normal');
    doc.text(`${emp.panNumber || 'ABCPS1234F'}`, 142, 46);
    doc.text(`${emp.uanNumber || '101299887766'}`, 142, 54);
    doc.text(`${emp.bankDetails?.bankName || 'HDFC Bank'} - ${emp.bankDetails?.accountNo || '5010045612'}`, 142, 62);
    doc.text(`${emp.bankDetails?.ifscCode || 'HDFC0000240'}`, 142, 70);

    // Earnings and Deductions Table
    const tableData = [
      ['Basic Salary', `Rs. ${formatINR(record.basic)}`, 'Provident Fund (EPF 12%)', `Rs. ${formatINR(record.pf)}`],
      ['House Rent Allowance (HRA)', `Rs. ${formatINR(record.hra)}`, 'Professional Tax (PT)', `Rs. ${formatINR(record.professionalTax || 200)}`],
      ['Special Allowance', `Rs. ${formatINR(record.allowances)}`, 'Income Tax (TDS on Salary)', `Rs. ${formatINR(record.tax)}`],
      ['Conveyance Reimbursement', `Rs. ${formatINR(record.conveyance || 3500)}`, 'Other Recoveries', `Rs. ${formatINR(record.deductions || 0)}`],
      ['Festive Bonus / Allowance', `Rs. ${formatINR(record.bonus || 0)}`, '', ''],
      ['Gross Earnings (A)', `Rs. ${formatINR(record.totalEarnings)}`, 'Total Deductions (B)', `Rs. ${formatINR(record.totalDeductions)}`],
    ];

    autoTable(doc, {
      startY: 82,
      head: [['Earnings Head', 'Amount', 'Deductions Head', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 },
    });

    const finalY = doc.lastAutoTable.finalY + 8;

    // Take-Home Box
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(134, 239, 172);
    doc.roundedRect(14, finalY, 182, 20, 2, 2, 'FD');

    doc.setTextColor(6, 95, 70);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text('NET TAKE-HOME SALARY (A - B):', 20, finalY + 13);

    doc.setFontSize(14);
    doc.text(`Rs. ${formatINR(record.netPay)}`, 188, finalY + 14, { align: 'right' });

    // Statutory Note & Signature
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Income Tax deducted under Section 192 of the Income Tax Act, 1961.', 14, finalY + 36);
    doc.text('This is an electronically generated statement certified by StaffSync HRMS India.', 14, finalY + 42);

    doc.save(`StaffSync_Payslip_${emp.employeeCode || 'EMP'}_${record.monthName}_${record.year}.pdf`);
    setToast({ type: 'success', message: 'Payslip PDF generated & downloaded!' });
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <CreditCard className="h-6 w-6 text-blue-600" />
            Payroll & Monthly Salary Slips (INR ₹)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            EPF, HRA, Professional Tax (PT), TDS calculations, and compliant Indian payslips.
          </p>
        </div>

        {isAdminOrManager && (
          <button
            onClick={() => setBatchModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700"
          >
            <Play className="h-4 w-4" /> Run Monthly Payroll Batch
          </button>
        )}
      </div>

      {/* Summary Metrics for Admin */}
      {isAdminOrManager && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Monthly Net Payroll
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              ₹{formatINR(summary.totalPayroll)}
            </p>
            <span className="text-[11px] text-emerald-600 font-semibold">{summary.currentMonth} {summary.currentYear}</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Gross Disbursal
            </span>
            <p className="text-2xl font-black text-blue-600 mt-1">
              ₹{formatINR(summary.totalEarnings)}
            </p>
            <span className="text-[11px] text-slate-400">Before EPF & TDS deductions</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              EPF & Tax Remittance
            </span>
            <p className="text-2xl font-black text-rose-600 mt-1">
              ₹{formatINR(summary.totalDeductions)}
            </p>
            <span className="text-[11px] text-slate-400">Deposited to EPFO & IT Dept</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tech Employees Paid
            </span>
            <p className="text-2xl font-black text-purple-600 mt-1">
              {summary.processedCount} / {summary.activeEmployeesCount}
            </p>
            <span className="text-[11px] text-slate-400">Indian Tech Roster</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        {isAdminOrManager && (
          <button
            onClick={() => setActiveTab('all')}
            className={`border-b-2 px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            All Company Payslips ({payrollList.length})
          </button>
        )}
        <button
          onClick={() => setActiveTab('my')}
          className={`border-b-2 px-4 py-2.5 text-xs font-bold transition ${
            activeTab === 'my'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          My Payslips ({myPayrolls.length})
        </button>
      </div>

      {/* Tab: My Payslips */}
      {activeTab === 'my' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                <th className="p-4">Pay Period</th>
                <th className="p-4">Gross Earnings</th>
                <th className="p-4">EPF & Deductions</th>
                <th className="p-4">Net In-Hand Pay</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
              {myPayrolls.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    No payslips available yet for your profile.
                  </td>
                </tr>
              ) : (
                myPayrolls.map((rec) => (
                  <tr key={rec._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {rec.monthName} {rec.year}
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">₹{formatINR(rec.totalEarnings)}</td>
                    <td className="p-4 text-rose-600">-₹{formatINR(rec.totalDeductions)}</td>
                    <td className="p-4 font-black text-emerald-600 text-sm">
                      ₹{formatINR(rec.netPay)}
                    </td>
                    <td className="p-4">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 uppercase">
                        {rec.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setPreviewPayroll(rec)}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200"
                        >
                          <Eye className="h-3.5 w-3.5" /> Preview
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(rec)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
                        >
                          <Download className="h-3.5 w-3.5" /> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: All Payroll (Admin/Manager) */}
      {isAdminOrManager && activeTab === 'all' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                <th className="p-4">Employee</th>
                <th className="p-4">Period</th>
                <th className="p-4">Basic Pay</th>
                <th className="p-4">HRA & Allowances</th>
                <th className="p-4">EPF & TDS</th>
                <th className="p-4">Net Salary</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
              {payrollList.map((rec) => (
                <tr key={rec._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="p-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rec.employee?.avatar || 'https://via.placeholder.com/32'}
                        alt=""
                        className="h-7 w-7 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {rec.employee?.firstName} {rec.employee?.lastName}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {rec.employee?.employeeCode} &bull; {rec.employee?.department}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    {rec.monthName} {rec.year}
                  </td>
                  <td className="p-4">₹{formatINR(rec.basic)}</td>
                  <td className="p-4 text-blue-600">+₹{formatINR(rec.hra + rec.allowances + (rec.conveyance || 0))}</td>
                  <td className="p-4 text-rose-600">-₹{formatINR(rec.totalDeductions)}</td>
                  <td className="p-4 font-black text-emerald-600 text-sm">
                    ₹{formatINR(rec.netPay)}
                  </td>
                  <td className="p-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => setPreviewPayroll(rec)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300"
                        title="View Breakdown"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(rec)}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300"
                      >
                        <Download className="h-3 w-3" /> PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payslip Preview Modal */}
      {previewPayroll && (
        <Modal
          isOpen={!!previewPayroll}
          onClose={() => setPreviewPayroll(null)}
          title={`Payslip Preview: ${previewPayroll.monthName} ${previewPayroll.year}`}
        >
          <div className="space-y-4 text-xs">
            {/* Header branding */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-950/30">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-extrabold text-blue-900 dark:text-blue-200">
                    STAFFSYNC TECHNOLOGIES INDIA PVT. LTD.
                  </h4>
                  <p className="text-[10px] text-blue-700 dark:text-blue-300">
                    Bengaluru HQ &bull; PAN: {previewPayroll.employee?.panNumber} &bull; UAN: {previewPayroll.employee?.uanNumber}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                  {previewPayroll.paymentStatus}
                </span>
              </div>
            </div>

            {/* Employee info */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 block">Employee</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {previewPayroll.employee?.firstName} {previewPayroll.employee?.lastName} ({previewPayroll.employee?.employeeCode})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Bank Account</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {previewPayroll.employee?.bankDetails?.bankName} ({previewPayroll.employee?.bankDetails?.accountNo})
                </span>
              </div>
            </div>

            {/* Earnings vs Deductions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <span className="font-bold uppercase text-[10px] text-blue-600 block mb-2">Earnings Components</span>
                <div className="space-y-1.5">
                  <div className="flex justify-between"><span>Basic Salary</span><b>₹{formatINR(previewPayroll.basic)}</b></div>
                  <div className="flex justify-between"><span>HRA</span><b>₹{formatINR(previewPayroll.hra)}</b></div>
                  <div className="flex justify-between"><span>Special Allowance</span><b>₹{formatINR(previewPayroll.allowances)}</b></div>
                  <div className="flex justify-between"><span>Conveyance</span><b>₹{formatINR(previewPayroll.conveyance || 3500)}</b></div>
                  <div className="flex justify-between"><span>Festive Bonus</span><b>₹{formatINR(previewPayroll.bonus || 0)}</b></div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 text-blue-600 font-bold">
                    <span>Total Gross</span><span>₹{formatINR(previewPayroll.totalEarnings)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <span className="font-bold uppercase text-[10px] text-rose-600 block mb-2">Deductions & Statutory</span>
                <div className="space-y-1.5">
                  <div className="flex justify-between"><span>EPF (12%)</span><b>₹{formatINR(previewPayroll.pf)}</b></div>
                  <div className="flex justify-between"><span>Professional Tax (PT)</span><b>₹{formatINR(previewPayroll.professionalTax || 200)}</b></div>
                  <div className="flex justify-between"><span>TDS (Income Tax)</span><b>₹{formatINR(previewPayroll.tax)}</b></div>
                  <div className="flex justify-between"><span>Other Recoveries</span><b>₹{formatINR(previewPayroll.deductions || 0)}</b></div>
                  <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-700 text-rose-600 font-bold">
                    <span>Total Deductions</span><span>₹{formatINR(previewPayroll.totalDeductions)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Take home */}
            <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                  Net In-Hand Salary Credited
                </span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                  ₹{formatINR(previewPayroll.netPay)}
                </span>
              </div>
              <button
                onClick={() => handleDownloadPDF(previewPayroll)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
              >
                <Download className="h-4 w-4" /> Download Certified PDF
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Batch Generator Modal */}
      <Modal isOpen={batchModalOpen} onClose={() => setBatchModalOpen(false)} title="Generate Indian Monthly Payroll Batch">
        <form onSubmit={handleGenerateBatch} className="space-y-4">
          <p className="text-xs text-slate-500">
            This will calculate salaries, EPF (12%), Professional Tax (₹200), Section 192 TDS withholding, and generate verified payslips for all active Indian staff.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Month</label>
              <select
                value={batchMonth}
                onChange={(e) => setBatchMonth(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              >
                {[
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ].map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Year</label>
              <input
                type="number"
                value={batchYear}
                onChange={(e) => setBatchYear(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setBatchModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generating}
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? 'Processing Disbursal...' : 'Disburse & Certify Payroll'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Payroll;
