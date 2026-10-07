import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileCheck2,
  Printer,
  Download,
  Mail,
  RotateCcw,
  Check,
} from 'lucide-react';
import { CompanyRecord, PayrollRecord, Employee } from '../../types';
import { StorageService } from '../../utils/storage';
import { formatCurrencyINR } from '../../utils/formatters';

interface Props {
  companies: CompanyRecord[];
  employees: Employee[];
  theme: 'dark' | 'light';
}

export const BankDraftModule: React.FC<Props> = ({ companies, employees, theme }) => {
  const [payrollList, setPayrollList] = useState<PayrollRecord[]>([]);

  // Filters & Bank Inputs
  const [salaryMonth, setSalaryMonth] = useState('September 2026');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('NEXXUS FACILITY');
  const [chequeNo, setChequeNo] = useState('984512');
  const [letterDate, setLetterDate] = useState(new Date().toISOString().split('T')[0]);

  // Sender Bank Details (auto-fetched from Company Master)
  const [senderBankName, setSenderBankName] = useState('IDBI Bank');
  const [senderAccNo, setSenderAccNo] = useState('0157102000018492');
  const [senderIfsc, setSenderIfsc] = useState('IBKL0000157');
  const [senderBankAddress, setSenderBankAddress] = useState(
    'IDBI Bank, Pune Main Branch, Pune, Maharashtra - 411014'
  );
  const [companyMasterAddress, setCompanyMasterAddress] = useState(
    'Plot No. 45, Hadapsar Industrial Area, Pune, Maharashtra - 411013 | Email: contact@nexxusfacility.com'
  );

  // Checkbox selection of employee rows
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  // Email Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('branchmanager@bank.com');
  const [emailSubject, setEmailSubject] = useState('Salary Disbursement Request - September 2026');
  const [emailBody, setEmailBody] = useState('');

  useEffect(() => {
    const load = () => setPayrollList(StorageService.getPayroll());
    load();
    window.addEventListener('nexxus_storage_updated', load);
    return () => window.removeEventListener('nexxus_storage_updated', load);
  }, []);

  // Update bank details when vendor changes
  useEffect(() => {
    const matched = companies.find(
      (c) => c.companyName.toLowerCase() === selectedVendor.toLowerCase()
    );
    if (matched) {
      setSenderBankName(matched.bankName || 'IDBI Bank');
      setSenderAccNo(matched.accountNo || '0157102000018492');
      setSenderIfsc(matched.ifsc || 'IBKL0000157');
      const isVendorPune =
        selectedVendor.toUpperCase().includes('NEXXUS') ||
        selectedVendor.toUpperCase().includes('SUPREME') ||
        (matched.address && matched.address.toLowerCase().includes('pune'));
      let cleanAddr = matched.address && !matched.address.toLowerCase().includes('sanaswadi')
        ? matched.address
        : 'Plot No. 45, Hadapsar Industrial Area, Pune, Maharashtra - 411013 | Email: contact@nexxusfacility.com';
      if (isVendorPune && cleanAddr.toLowerCase().includes('sanaswadi')) {
        cleanAddr = 'Plot No. 45, Hadapsar Industrial Area, Pune, Maharashtra - 411013 | Email: contact@nexxusfacility.com';
      }
      setCompanyMasterAddress(cleanAddr);
      setSenderBankAddress(
        `${matched.bankName || 'IDBI Bank'}, Pune Main Branch, Pune, Maharashtra - 411014`
      );
    }
  }, [selectedVendor, companies]);

  // Filtered rows for the letterhead
  const draftRows = payrollList.filter((r) => {
    if (salaryMonth && !r.salaryMonth.toLowerCase().includes(salaryMonth.toLowerCase())) return false;
    if (selectedCompany && !r.company.toLowerCase().includes(selectedCompany.toLowerCase())) return false;
    if (selectedVendor && r.vendor && !r.vendor.toLowerCase().includes(selectedVendor.toLowerCase())) return false;
    return true;
  });

  // Select all rows by default when rows change
  useEffect(() => {
    setSelectedIndices(draftRows.map((_, i) => i));
  }, [payrollList, salaryMonth, selectedCompany, selectedVendor]);

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIndices(draftRows.map((_, i) => i));
    } else {
      setSelectedIndices([]);
    }
  };

  const toggleIndex = (idx: number) => {
    if (selectedIndices.includes(idx)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== idx));
    } else {
      setSelectedIndices([...selectedIndices, idx]);
    }
  };

  const selectedRows = draftRows.filter((_, i) => selectedIndices.includes(i));
  const totalDisbursementAmount = selectedRows.reduce(
    (s, r) => s + (parseFloat(String(r.netSalary)) || 0),
    0
  );

  const formattedLetterDate = () => {
    if (!letterDate) return '--';
    const parts = letterDate.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return letterDate;
  };

  const isNexxus = selectedVendor.toUpperCase().includes('NEXXUS') || selectedVendor.toUpperCase().includes('NEX');

  const handleDownloadPDF = () => {
    if (selectedRows.length === 0) {
      alert('Please select at least one employee!');
      return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const compName = selectedVendor.toUpperCase();
    const curDate = formattedLetterDate();
    const formattedTotal = 'Rs. ' + totalDisbursementAmount.toLocaleString('en-IN');

    // Header with exact NEXXUS brand colors
    doc.setFont('helvetica', 'bold');
    if (isNexxus) {
      doc.setFontSize(26);
      const nexWidth = doc.getTextWidth('NEX');
      const xWidth = doc.getTextWidth('X');
      const usWidth = doc.getTextWidth('US ');
      const facilityWidth = doc.getTextWidth('FACILITY');
      const totalWidth = nexWidth + xWidth + usWidth + facilityWidth;
      const startX = (210 - totalWidth) / 2;
      doc.setTextColor(10, 30, 63); // Navy #0a1e3f
      doc.text('NEX', startX, 16);
      doc.setTextColor(255, 133, 0); // Orange #FF8500
      doc.text('X', startX + nexWidth, 16);
      doc.setTextColor(10, 30, 63); // Navy #0a1e3f
      doc.text('US ', startX + nexWidth + xWidth, 16);
      doc.text('FACILITY', startX + nexWidth + xWidth + usWidth, 16);
    } else {
      doc.setFontSize(22);
      doc.setTextColor(10, 30, 63);
      doc.text(compName, 105, 16, { align: 'center' });
    }

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    const splitAddr = doc.splitTextToSize(companyMasterAddress, 190);
    doc.text(splitAddr, 105, 23, { align: 'center' });

    const nextStartY = 24 + splitAddr.length * 4.5;
    doc.setDrawColor(255, 133, 0); // Brand Orange #FF8500
    doc.setLineWidth(0.8);
    doc.line(8, nextStartY, 202, nextStartY);

    const bodyStartY = nextStartY + 6;

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('To,', 10, bodyStartY);
    doc.setFont('helvetica', 'normal');
    doc.text(`The Branch Manager\n${senderBankName}, ${senderBankAddress}`, 10, bodyStartY + 4);

    doc.setFont('helvetica', 'bold');
    doc.text('Date: ' + curDate, 200, bodyStartY, { align: 'right' });

    doc.text(`Subject: Request to process salary disbursement for ${salaryMonth}`, 10, bodyStartY + 20);

    doc.text('Dear Sir/Madam,', 10, bodyStartY + 26);
    doc.setFont('helvetica', 'normal');

    const introText = `We request you to kindly process the salary payments for the ${salaryMonth} salary period as per the employee-wise bank details provided below. The total salary disbursement amount is ${formattedTotal}/- against Cheque Number ${chequeNo}.`;
    doc.text(introText, 10, bodyStartY + 31, { maxWidth: 190 });

    const tableData = selectedRows.map((r, idx) => {
      // Find matching employee address from EmployeeMaster
      const matchEmp = employees.find((e) => e.empId === r.eCode || e.fullName === r.employeeName);
      const empCity = matchEmp?.address && !matchEmp.address.toLowerCase().includes('sanaswadi')
        ? matchEmp.address
        : 'Pune, Maharashtra';
      return [
        idx + 1,
        parseFloat(String(r.netSalary || 0)).toLocaleString('en-IN'),
        senderAccNo,
        r.epfNo || matchEmp?.ifsc || 'MAHB0000456',
        r.acNo || matchEmp?.accNo || '60145892145',
        'Saving',
        r.employeeName,
        empCity,
        'Salary Payment',
        'Salary Payment',
      ];
    });

    autoTable(doc, {
      startY: bodyStartY + 40,
      margin: { left: 8, right: 8 },
      head: [
        [
          'Sr.No',
          'AMT (Rs.)',
          'SENDER A/C NO',
          'BENEFICIARY IFSC CODE',
          'BENEFICIARY A/C NO',
          'ACCOUNT TYPE',
          'BENEFICIARY NAME',
          'BENEFICIARY ADDRESS',
          'SENDER TO RECEIVER INFO',
          'ORIGINATOR OF REMITTANCE',
        ],
      ],
      body: tableData,
      foot: [['Total', formattedTotal, '', '', '', '', '', '', '', '']],
      theme: 'grid',
      showHead: 'everyPage',
      showFoot: 'lastPage',
      headStyles: {
        fillColor: [26, 54, 93], // Corporate Navy #1A365D
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 6.5,
        halign: 'center',
        valign: 'middle',
        cellPadding: 1.5,
      },
      footStyles: {
        fillColor: [245, 245, 245],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'right',
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [0, 0, 0],
        cellPadding: 1.2,
        valign: 'middle',
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 17, halign: 'right', fontStyle: 'bold', textColor: [220, 53, 69] },
        2: { cellWidth: 24, halign: 'center' },
        3: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 13, halign: 'center' },
        6: { cellWidth: 36, halign: 'left' },
        7: { cellWidth: 15, halign: 'center' },
        8: { cellWidth: 17, halign: 'center' },
        9: { cellWidth: 17, halign: 'center' },
      },
    });

    const extDoc = doc as any;
    let finalY = extDoc.lastAutoTable ? extDoc.lastAutoTable.finalY + 15 : bodyStartY + 60;
    if (finalY > 250) {
      doc.addPage();
      finalY = 25;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('For ' + compName, 145, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Authorised Signatory & Stamp', 145, finalY + 22);

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`${compName} | Salary Disbursement - ${salaryMonth}`, 105, 290, { align: 'center' });
    }

    doc.save(`Bank_Salary_Letter_${salaryMonth.replace(/\s+/g, '_')}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    setEmailBody(
      `To,\nThe Branch Manager,\n${senderBankName}\n\nDear Sir/Madam,\n\nWe request you to kindly process the salary payments for ${salaryMonth} as per our employee list (${selectedRows.length} employees).\nTotal Salary Amount: Rs. ${totalDisbursementAmount.toLocaleString('en-IN')}\nCheque Number: ${chequeNo}\n\nThanking you,\n${selectedVendor}`
    );
    setShowEmailModal(true);
  };

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-[#111928] border-slate-800 text-slate-100 glow-card-dark' : 'bg-white border-slate-200 text-slate-900 glow-card-light';
  const inputClass = isDark
    ? 'bg-[#0a0f1d] border-slate-700 text-white focus:border-[#FF8500]'
    : 'bg-white border-slate-300 text-slate-900 focus:border-[#FF8500] shadow-2xs';
  const labelClass = isDark ? 'text-slate-300 font-semibold' : 'text-slate-700 font-bold';

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-[#FF8500] flex items-center gap-2">
          <FileCheck2 className="w-5 h-5" />
          <span>Bank Salary Draft & Letterhead Generator</span>
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setSalaryMonth('');
              setSelectedCompany('');
              setChequeNo('');
            }}
            className={`btn-3d-secondary flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
              isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="btn-3d-blue flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs cursor-pointer shadow-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Letter PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="btn-3d-emerald flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer shadow-md transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Hard Copy</span>
          </button>
          <button
            onClick={handleSendEmail}
            className="btn-3d-orange flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF8500] hover:bg-[#e07500] text-black font-extrabold text-xs cursor-pointer shadow-md transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Send Email</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Boxes - Compact Uniform Sizing & Typography */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div
          className={`p-2.5 px-3.5 rounded-xl border flex flex-col justify-between h-16 border-blue-500/30 transition-all ${
            isDark ? 'bg-[#111928]' : 'bg-white shadow-2xs'
          }`}
        >
          <span className="text-slate-400 block font-semibold text-[11px] truncate uppercase tracking-wider">
            Selected Staff
          </span>
          <span className="text-sm font-bold font-mono tracking-tight text-blue-500 truncate">
            {selectedRows.length} / {draftRows.length} Employees
          </span>
        </div>
        <div
          className={`p-2.5 px-3.5 rounded-xl border flex flex-col justify-between h-16 border-emerald-500/30 transition-all ${
            isDark ? 'bg-[#111928]' : 'bg-white shadow-2xs'
          }`}
        >
          <span className="text-slate-400 block font-semibold text-[11px] truncate uppercase tracking-wider">
            Total Net Amount
          </span>
          <span className="text-sm font-bold font-mono tracking-tight text-emerald-500 truncate">
            {formatCurrencyINR(totalDisbursementAmount)}
          </span>
        </div>
        <div
          className={`p-2.5 px-3.5 rounded-xl border flex flex-col justify-between h-16 border-amber-500/30 transition-all ${
            isDark ? 'bg-[#111928]' : 'bg-white shadow-2xs'
          }`}
        >
          <span className="text-slate-400 block font-semibold text-[11px] truncate uppercase tracking-wider">
            Disbursing Bank
          </span>
          <span className="text-sm font-bold font-mono tracking-tight text-amber-500 truncate">
            {senderBankName} ({senderIfsc})
          </span>
        </div>
        <div
          className={`p-2.5 px-3.5 rounded-xl border flex flex-col justify-between h-16 border-[#FF8500]/30 transition-all ${
            isDark ? 'bg-[#111928]' : 'bg-white shadow-2xs'
          }`}
        >
          <span className="text-slate-400 block font-semibold text-[11px] truncate uppercase tracking-wider">
            Cheque Reference
          </span>
          <span className="text-sm font-bold font-mono tracking-tight text-[#FF8500] truncate">
            {chequeNo ? `Cheque #${chequeNo}` : 'No Cheque'}
          </span>
        </div>
      </div>

      {/* Input Configuration Card - Uniform Box Sizes & Text Sizes */}
      <div className={`p-5 rounded-2xl border shadow-sm text-xs ${cardBg}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 mb-3.5">
          <div className="flex flex-col justify-end">
            <label className={`block text-xs font-bold mb-1.5 ${labelClass}`}>Salary Month *</label>
            <input
              type="text"
              value={salaryMonth}
              onChange={(e) => setSalaryMonth(e.target.value)}
              placeholder="e.g. September 2026"
              className={`w-full h-10 px-3 py-2 border rounded-lg text-xs font-semibold ${inputClass}`}
            />
          </div>
          <div className="flex flex-col justify-end">
            <label className={`block text-xs font-bold mb-1.5 ${labelClass}`}>Company / Client Name</label>
            <input
              type="text"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              placeholder="e.g. Zepto"
              className={`w-full h-10 px-3 py-2 border rounded-lg text-xs font-semibold ${inputClass}`}
            />
          </div>
          <div className="flex flex-col justify-end">
            <label className={`block text-xs font-bold mb-1.5 ${labelClass}`}>Vendor (Disbursing Entity) *</label>
            <input
              type="text"
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              placeholder="e.g. NEXXUS FACILITY"
              className={`w-full h-10 px-3 py-2 border rounded-lg text-xs font-semibold uppercase ${inputClass}`}
            />
          </div>
          <div className="flex flex-col justify-end">
            <label className={`block text-xs font-bold mb-1.5 ${labelClass}`}>Cheque Number *</label>
            <input
              type="text"
              value={chequeNo}
              onChange={(e) => setChequeNo(e.target.value)}
              placeholder="Enter Cheque No"
              className={`w-full h-10 px-3 py-2 border rounded-lg text-xs font-mono font-bold ${inputClass}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="flex flex-col justify-end">
            <label className={`block text-xs font-bold mb-1.5 ${labelClass}`}>Sender Bank Name</label>
            <input
              type="text"
              value={senderBankName}
              onChange={(e) => setSenderBankName(e.target.value)}
              className={`w-full h-10 px-3 py-2 border rounded-lg text-xs font-semibold ${inputClass}`}
            />
          </div>
          <div className="flex flex-col justify-end">
            <label className={`block text-xs font-bold mb-1.5 ${labelClass}`}>Sender Account No</label>
            <input
              type="text"
              value={senderAccNo}
              onChange={(e) => setSenderAccNo(e.target.value)}
              className={`w-full h-10 px-3 py-2 border rounded-lg text-xs font-mono font-bold ${inputClass}`}
            />
          </div>
          <div className="flex flex-col justify-end">
            <label className={`block text-xs font-bold mb-1.5 ${labelClass}`}>Sender IFSC Code</label>
            <input
              type="text"
              value={senderIfsc}
              onChange={(e) => setSenderIfsc(e.target.value.toUpperCase())}
              className={`w-full h-10 px-3 py-2 border rounded-lg text-xs font-mono font-bold ${inputClass}`}
            />
          </div>
          <div className="flex flex-col justify-end">
            <label className={`block text-xs font-bold mb-1.5 ${labelClass}`}>Letter Date</label>
            <input
              type="date"
              value={letterDate}
              onChange={(e) => setLetterDate(e.target.value)}
              className={`w-full h-10 px-3 py-2 border rounded-lg text-xs font-semibold ${inputClass}`}
            />
          </div>
        </div>
      </div>

      {/* Real-Time Exact A4 Letterhead Preview Paper */}
      <div className="flex justify-center py-4">
        <div
          id="printableDraftArea"
          className="w-full max-w-[850px] bg-white text-black p-8 rounded-lg shadow-2xl relative font-sans text-xs border border-slate-300"
          style={{ minHeight: '1000px', fontFamily: "'Segoe UI', Arial, sans-serif" }}
        >
          {/* Letterhead Header with exact NEXXUS profile brand colors */}
          <div className="text-center pb-2 mb-4 border-b-2 border-[#FF8500]">
            <h2 className="text-3xl font-extrabold tracking-wider m-0">
              {isNexxus ? (
                <div className="flex items-center justify-center gap-1 select-none">
                  <span className="text-[#0a1e3f] font-black text-3xl tracking-wider">NEX</span>
                  <span className="text-[#FF8500] font-black text-3xl mx-0.5 drop-shadow-[0_0_12px_rgba(255,133,0,0.85)]">
                    X
                  </span>
                  <span className="text-[#0a1e3f] font-black text-3xl tracking-wider">US FACILITY</span>
                </div>
              ) : (
                <span className="text-[#0a1e3f] uppercase text-2xl font-black">{selectedVendor}</span>
              )}
            </h2>
            <p className="text-[13px] font-bold text-neutral-800 mt-1 mb-0 whitespace-pre-line">
              {companyMasterAddress}
            </p>
          </div>

          {/* Letter Body Meta */}
          <div className="space-y-3 mb-4 text-[12px] leading-relaxed">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold m-0 text-slate-900">To,</p>
                <p className="m-0 text-slate-800">The Branch Manager</p>
                <p className="m-0 font-bold text-[#0a1e3f]">{senderBankName} Branch</p>
                <p className="m-0 text-neutral-600">{senderBankAddress}</p>
              </div>
              <div className="text-right">
                <p className="font-bold m-0 text-slate-900">
                  Date: <span className="font-mono text-slate-800">{formattedLetterDate()}</span>
                </p>
              </div>
            </div>

            <p className="font-bold text-slate-900 m-0">
              Subject: Request to process salary disbursement for{' '}
              <span className="text-rose-600 font-bold">{salaryMonth}</span>.
            </p>

            <p className="m-0 text-slate-900">Dear Sir/Madam,</p>

            <p className="m-0 leading-normal text-slate-800">
              We request you to kindly process the salary payments for the <strong>{salaryMonth}</strong> salary period as
              per the employee-wise bank details provided below. The total salary disbursement amount is{' '}
              <strong className="text-rose-600 font-bold text-sm">
                ₹ {totalDisbursementAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>{' '}
              against Cheque Number{' '}
              <strong className="underline font-bold text-slate-900">{chequeNo}</strong>.
            </p>
          </div>

          {/* Table with matching Corporate Navy Header */}
          <div className="overflow-x-auto mb-4 border border-black">
            <table className="w-full text-[10px] border-collapse text-left border border-black">
              <thead>
                <tr className="bg-[#0a1e3f] text-white font-bold text-center">
                  <th className="p-1 border border-black w-6 text-center">
                    <input
                      type="checkbox"
                      checked={draftRows.length > 0 && selectedIndices.length === draftRows.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-1 border border-black w-8">Sr.No</th>
                  <th className="p-1 border border-black w-16 text-right">AMT (₹)</th>
                  <th className="p-1 border border-black">SENDER ACCOUNT NUMBER</th>
                  <th className="p-1 border border-black">BENEFICIARY IFSC</th>
                  <th className="p-1 border border-black">BENEFICIARY A/C NO</th>
                  <th className="p-1 border border-black">TYPE</th>
                  <th className="p-1 border border-black">BENEFICIARY NAME</th>
                  <th className="p-1 border border-black">ADDRESS</th>
                  <th className="p-1 border border-black">INFO</th>
                </tr>
              </thead>
              <tbody>
                {draftRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-4 text-center text-neutral-500">
                      No payroll records found for this period/company.
                    </td>
                  </tr>
                ) : (
                  draftRows.map((r, idx) => {
                    const isChecked = selectedIndices.includes(idx);
                    const matchEmp = employees.find((e) => e.empId === r.eCode || e.fullName === r.employeeName);
                    return (
                      <tr key={idx} className={isChecked ? 'bg-amber-50/40' : 'opacity-40'}>
                        <td className="p-1 border border-black text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleIndex(idx)}
                          />
                        </td>
                        <td className="p-1 border border-black text-center font-bold">{idx + 1}</td>
                        <td className="p-1 border border-black text-right font-bold text-rose-600 font-mono">
                          {parseFloat(String(r.netSalary || 0)).toLocaleString('en-IN')}
                        </td>
                        <td className="p-1 border border-black text-center font-mono">{senderAccNo}</td>
                        <td className="p-1 border border-black text-center font-mono uppercase">
                          {r.epfNo || matchEmp?.ifsc || 'MAHB0000456'}
                        </td>
                        <td className="p-1 border border-black text-center font-mono">
                          {r.acNo || matchEmp?.accNo || '60145892145'}
                        </td>
                        <td className="p-1 border border-black text-center">Saving</td>
                        <td className="p-1 border border-black font-semibold capitalize">{r.employeeName}</td>
                        <td className="p-1 border border-black text-center">
                          {matchEmp?.village && !matchEmp.village.toLowerCase().includes('sanaswadi')
                            ? matchEmp.village
                            : 'Pune'}
                        </td>
                        <td className="p-1 border border-black text-center">Salary Payment</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-black">
                  <td colSpan={2} className="p-1 border border-black text-center">
                    Total
                  </td>
                  <td className="p-1 border border-black text-right text-rose-600 font-mono font-bold">
                    ₹ {totalDisbursementAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={7} className="p-1 border border-black"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signatory Area with NEXXUS profile colors */}
          <div className="flex justify-end pt-8 pr-4">
            <div className="text-center w-64">
              <div className="border-t border-black pt-2">
                <span className="font-extrabold text-sm text-[#0a1e3f] block">
                  For{' '}
                  {isNexxus ? (
                    <>
                      <span>NEX</span>
                      <span className="text-[#FF8500]">X</span>
                      <span>US FACILITY</span>
                    </>
                  ) : (
                    selectedVendor.toUpperCase()
                  )}
                </span>
                <div className="h-16"></div>
                <span className="text-[11px] text-neutral-600 block">Authorised Signatory & Stamp</span>
              </div>
            </div>
          </div>

          {/* Watermark Footer */}
          <div className="absolute bottom-3 left-0 right-0 text-center text-[10px] text-neutral-400 font-medium tracking-wider">
            {selectedVendor.toUpperCase()} | Salary Disbursement - {salaryMonth}
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className={`w-full max-w-lg border rounded-2xl p-6 shadow-2xl text-xs transition-colors ${cardBg}`}>
            <h4 className="font-bold text-sm text-[#FF8500] mb-3 flex items-center gap-1.5">
              <Mail className="w-4 h-4" /> Send Salary Letter to Bank via Email
            </h4>

            <div className="space-y-3 mb-4">
              <div>
                <label className={`block mb-1 ${labelClass}`}>Recipient Email Address *</label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Message Body</label>
                <textarea
                  rows={6}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className={`w-full p-2 border rounded-lg font-mono ${inputClass}`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowEmailModal(false)}
                className={`px-4 py-2 rounded-lg font-semibold cursor-pointer transition-colors ${
                  isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`Email dispatched to ${emailTo} successfully!`);
                  setShowEmailModal(false);
                }}
                className="px-5 py-2 rounded-lg bg-[#FF8500] hover:bg-[#e07500] text-black font-extrabold cursor-pointer transition-colors"
              >
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
