import PDFDocument from 'pdfkit';

/**
 * Indian Rupee Formatter helper
 */
const formatINR = (val) => {
  return Number(val || 0).toLocaleString('en-IN');
};

/**
 * Generate a PDF Payslip stream for an employee and payroll record (Indian HRMS Standard)
 * @param {Object} payroll - The payroll document populated with employee
 * @param {Object} res - Express response stream
 */
export const generatePayslipPDF = (payroll, res) => {
  const doc = new PDFDocument({ margin: 35, size: 'A4' });

  // Stream directly to response
  doc.pipe(res);

  const primaryColor = '#1e3a8a';
  const accentColor = '#2563eb';
  const tableBg = '#f8fafc';

  // 1. Header Banner
  doc
    .rect(0, 0, doc.page.width, 95)
    .fill(primaryColor);

  doc
    .fillColor('#ffffff')
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('STAFFSYNC TECHNOLOGIES INDIA PVT. LTD.', 35, 20, { characterSpacing: 0.5 });

  doc
    .fontSize(8.5)
    .font('Helvetica')
    .text('Ecospace Tech Park, Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103', 35, 45)
    .text('CIN: U72200KA2021PTC145892 | Registered with EPFO & ESIC India', 35, 58);

  doc
    .fontSize(15)
    .font('Helvetica-Bold')
    .text('SALARY PAYSLIP', 380, 25, { align: 'right' });

  doc
    .fontSize(9)
    .font('Helvetica')
    .text(`Pay Period: ${payroll.monthName || 'Month'} ${payroll.year}`, 380, 45, { align: 'right' })
    .text(`Status: ${(payroll.paymentStatus || 'PAID').toUpperCase()}`, 380, 58, { align: 'right' });

  doc.moveDown(3);

  // 2. Employee Details Grid
  const emp = payroll.employee || {};
  const startY = 110;

  doc
    .rect(35, startY, 525, 95)
    .fill(tableBg)
    .stroke('#e2e8f0');

  doc.fillColor('#1e293b').fontSize(8.5).font('Helvetica-Bold');
  doc.text('Employee Name:', 45, startY + 10);
  doc.text('Employee Code:', 45, startY + 28);
  doc.text('Department:', 45, startY + 46);
  doc.text('Designation:', 45, startY + 64);
  doc.text('Work Location:', 45, startY + 82);

  doc.font('Helvetica');
  doc.text(`${emp.firstName || ''} ${emp.lastName || ''}`, 135, startY + 10);
  doc.text(`${emp.employeeCode || 'EMP-1001'}`, 135, startY + 28);
  doc.text(`${emp.department || 'Engineering'}`, 135, startY + 46);
  doc.text(`${emp.designation || 'Specialist'}`, 135, startY + 64);
  doc.text(`${emp.workLocation || 'Bengaluru HQ'}`, 135, startY + 82);

  // Right column of info
  doc.font('Helvetica-Bold');
  doc.text('PAN Card No:', 310, startY + 10);
  doc.text('PF / UAN No:', 310, startY + 28);
  doc.text('Bank Name:', 310, startY + 46);
  doc.text('Account No:', 310, startY + 64);
  doc.text('IFSC Code:', 310, startY + 82);

  doc.font('Helvetica');
  doc.text(`${emp.panNumber || 'ABCDE1234F'}`, 400, startY + 10);
  doc.text(`${emp.uanNumber || '101234567890'}`, 400, startY + 28);
  doc.text(`${emp.bankDetails?.bankName || 'HDFC Bank'}`, 400, startY + 46);
  doc.text(`${emp.bankDetails?.accountNo || '50100234567890'}`, 400, startY + 64);
  doc.text(`${emp.bankDetails?.ifscCode || 'HDFC0001234'}`, 400, startY + 82);

  // 3. Earnings & Deductions Tables
  const tableTop = 220;

  // Header earnings
  doc.rect(35, tableTop, 255, 22).fill(accentColor);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9).text('EARNINGS COMPONENTS', 45, tableTop + 6);
  doc.text('AMOUNT (INR)', 210, tableTop + 6, { align: 'right' });

  // Header deductions
  doc.rect(300, tableTop, 260, 22).fill('#dc2626');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9).text('DEDUCTIONS & RECOVERIES', 310, tableTop + 6);
  doc.text('AMOUNT (INR)', 480, tableTop + 6, { align: 'right' });

  // Data rows
  const earnings = [
    { label: 'Basic Salary', amount: payroll.basic },
    { label: 'House Rent Allowance (HRA)', amount: payroll.hra },
    { label: 'Special Allowance', amount: payroll.allowances },
    { label: 'Conveyance & Travel Reimbursement', amount: payroll.conveyance || 3500 },
    { label: 'Performance / Festive Bonus', amount: payroll.bonus || 0 },
  ];

  const deductions = [
    { label: 'Provident Fund (EPF 12%)', amount: payroll.pf },
    { label: 'Professional Tax (PT)', amount: payroll.professionalTax || 200 },
    { label: 'Income Tax (TDS on Salary)', amount: payroll.tax },
    { label: 'Other Voluntary Deductions', amount: payroll.deductions },
  ];

  let currentY = tableTop + 22;
  const maxRows = Math.max(earnings.length, deductions.length);

  for (let i = 0; i < maxRows; i++) {
    const rowY = currentY + i * 20;
    const isEven = i % 2 === 0;

    if (isEven) {
      doc.rect(35, rowY, 255, 20).fill('#f8fafc');
      doc.rect(300, rowY, 260, 20).fill('#f8fafc');
    }

    // Earnings cell
    if (earnings[i]) {
      doc.fillColor('#334155').font('Helvetica').fontSize(8.5).text(earnings[i].label, 45, rowY + 5);
      doc.font('Helvetica-Bold').text(`Rs. ${formatINR(earnings[i].amount)}`, 210, rowY + 5, { align: 'right' });
    }

    // Deductions cell
    if (deductions[i]) {
      doc.fillColor('#334155').font('Helvetica').fontSize(8.5).text(deductions[i].label, 310, rowY + 5);
      doc.font('Helvetica-Bold').text(`Rs. ${formatINR(deductions[i].amount)}`, 480, rowY + 5, { align: 'right' });
    }
  }

  const totalsY = currentY + maxRows * 20 + 8;

  // Subtotal lines
  doc.rect(35, totalsY, 255, 22).fill('#e2e8f0');
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9).text('Gross Earnings (A)', 45, totalsY + 6);
  doc.text(`Rs. ${formatINR(payroll.totalEarnings)}`, 210, totalsY + 6, { align: 'right' });

  doc.rect(300, totalsY, 260, 22).fill('#fee2e2');
  doc.fillColor('#991b1b').font('Helvetica-Bold').fontSize(9).text('Total Deductions (B)', 310, totalsY + 6);
  doc.text(`Rs. ${formatINR(payroll.totalDeductions)}`, 480, totalsY + 6, { align: 'right' });

  // 4. Net Pay Big Highlight Box
  const netPayY = totalsY + 38;
  doc.rect(35, netPayY, 525, 50).fill('#ecfdf5').stroke('#86efac');
  doc.fillColor('#065f46').font('Helvetica-Bold').fontSize(12).text('NET IN-HAND TAKE-HOME PAY (A - B)', 50, netPayY + 16);
  doc.fontSize(18).text(`Rs. ${formatINR(payroll.netPay)}`, 380, netPayY + 14, { align: 'right' });

  // 5. Statutory Notes & Signatures
  const footerY = 560;
  doc.moveTo(35, footerY).lineTo(560, footerY).stroke('#cbd5e1');

  doc.fillColor('#64748b').fontSize(7.5).font('Helvetica');
  doc.text('Note: Income tax deductions are calculated under Section 192 of the Income Tax Act, 1961.', 35, footerY + 10);
  doc.text('EPF contribution deposited under Employee Provident Fund Scheme, 1952. For queries, write to payroll.india@staffsync.internal.', 35, footerY + 22);

  // Digital Signatures
  doc.rect(35, footerY + 45, 180, 45).stroke('#e2e8f0');
  doc.text('Authorized Signatory for Employer', 45, footerY + 50);
  doc.font('Helvetica-Bold').text('StaffSync Technologies India', 45, footerY + 70);

  doc.rect(380, footerY + 45, 180, 45).stroke('#e2e8f0');
  doc.font('Helvetica').text('Employee Digital Acceptance', 390, footerY + 50);
  doc.font('Helvetica-Oblique').text('Certified & Verified in Portal', 390, footerY + 70);

  doc.end();
};
