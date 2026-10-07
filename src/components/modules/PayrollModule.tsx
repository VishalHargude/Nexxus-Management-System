import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  BadgeIndianRupee,
  Printer,
  Plus,
  Download,
  Upload,
  Pencil,
  Trash2,
  FileText,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';
import { PayrollRecord, CompanyRecord, Employee } from '../../types';
import { StorageService } from '../../utils/storage';
import { formatCurrencyINR, safeEvalMath } from '../../utils/formatters';
import { printSinglePayslip, printBulkPayslips } from '../../utils/pdfGenerators';

interface Props {
  companies: CompanyRecord[];
  employees: Employee[];
  theme: 'dark' | 'light';
}

export const PayrollModule: React.FC<Props> = ({ companies, employees, theme }) => {
  const [payrollList, setPayrollList] = useState<PayrollRecord[]>([]);
  const [selectedRowIndices, setSelectedRowIndices] = useState<number[]>([]);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Filters
  const [filterMonth, setFilterMonth] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterPlant, setFilterPlant] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<PayrollRecord | null>(null);

  useEffect(() => {
    const load = () => setPayrollList(StorageService.getPayroll());
    load();
    window.addEventListener('nexxus_storage_updated', load);
    return () => window.removeEventListener('nexxus_storage_updated', load);
  }, []);

  const filtered = payrollList.filter((r) => {
    if (filterMonth && !r.salaryMonth.toLowerCase().includes(filterMonth.toLowerCase())) return false;
    if (filterName && !r.employeeName.toLowerCase().includes(filterName.toLowerCase())) return false;
    if (filterCompany && !r.company.toLowerCase().includes(filterCompany.toLowerCase())) return false;
    if (filterPlant && !r.plant.toLowerCase().includes(filterPlant.toLowerCase())) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  const activeCount = filtered.filter((r) => r.status.toLowerCase() === 'active').length;
  const inactiveCount = filtered.length - activeCount;
  const totNet = filtered.reduce((s, r) => s + (parseFloat(String(r.netSalary)) || 0), 0);
  const totCompliance = filtered.reduce(
    (s, r) => s + (parseFloat(String(r.grossDeduction || 0)) + parseFloat(String(r.subTotalEmp || 0))),
    0
  );
  const totGst = filtered.reduce((s, r) => s + (parseFloat(String(r.gst)) || 0), 0);
  const totService = filtered.reduce((s, r) => s + (parseFloat(String(r.serviceCharge)) || 0), 0);

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRowIndices(filtered.map((r) => r.rowIndex));
    } else {
      setSelectedRowIndices([]);
    }
  };

  const toggleRow = (rowIndex: number) => {
    if (selectedRowIndices.includes(rowIndex)) {
      setSelectedRowIndices(selectedRowIndices.filter((id) => id !== rowIndex));
    } else {
      setSelectedRowIndices([...selectedRowIndices, rowIndex]);
    }
  };

  const handlePrintSelected = () => {
    const selected = payrollList.filter((r) => selectedRowIndices.includes(r.rowIndex));
    if (selected.length === 0) {
      alert('Please select at least one employee checkbox to print payslips!');
      return;
    }
    printBulkPayslips(selected);
  };

  const handleOpenAdd = () => {
    setEditingRow({
      rowIndex: 0,
      srNo: payrollList.length + 1,
      salaryMonth: 'September 2026',
      company: 'NEXXUS FACILITY',
      vendor: 'NEXXUS FACILITY',
      plant: 'Pune Plant',
      eCode: '',
      employeeName: '',
      status: 'Active',
      acNo: '',
      bank: '',
      epfNo: '',
      panNo: '',
      pfUan: '',
      department: 'Operations',
      designation: 'Staff',
      actualPayDay: 30,
      basicDa: 15000,
      hra: 3500,
      conv: 1500,
      bonusEarn: 1200,
      otAmt: 0,
      attInc1: 0,
      attInc2: 0,
      totalEarnings: 21200,
      pf12: 1800,
      esic: 159,
      profTax: 200,
      lwf: 25,
      grossDeduction: 2184,
      subTotalEmp: 19016,
      netSalary: 19016,
      gst: 3422,
      serviceCharge: 1500,
      ctc: 22700,
      ctcPostGst: 24200,
      doj: new Date().toISOString().split('T')[0],
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (rec: PayrollRecord) => {
    setEditingRow({ ...rec });
    setModalOpen(true);
  };

  const sortedPayroll = [...filtered].sort((a, b) => {
    const dComp = (b.salaryMonth || '').localeCompare(a.salaryMonth || '');
    if (dComp !== 0) return sortOrder === 'desc' ? dComp : -dComp;
    return sortOrder === 'desc' ? (b.rowIndex || 0) - (a.rowIndex || 0) : (a.rowIndex || 0) - (b.rowIndex || 0);
  });

  const handleSaveModal = () => {
    if (!editingRow || !editingRow.employeeName) {
      alert('Employee Name is required!');
      return;
    }
    StorageService.saveOrUpdatePayroll(editingRow);
    setPayrollList(StorageService.getPayroll());
    setModalOpen(false);
    setEditingRow(null);
  };

  const handleDeleteModal = () => {
    if (!editingRow) return;
    if (confirm('Are you sure you want to delete this payroll record?')) {
      StorageService.deletePayroll(editingRow.rowIndex);
      setPayrollList(StorageService.getPayroll());
      setModalOpen(false);
      setEditingRow(null);
    }
  };

  const handleExportData = () => {
    if (sortedPayroll.length === 0) {
      alert('No data to export!');
      return;
    }
    const data = sortedPayroll.map((r, i) => ({
      'Sr No': i + 1,
      'Salary Month': r.salaryMonth,
      Company: r.company,
      Plant: r.plant,
      'E Code': r.eCode,
      'Employee Name': r.employeeName,
      Status: r.status,
      CTC: r.ctc,
      'Gross Deduction': r.grossDeduction,
      'Net Salary': r.netSalary,
      'GST @ 18%': r.gst,
      'Service Charge': r.serviceCharge,
      'Actual Pay Day': r.actualPayDay,
      'OT Hours': r.totalOtHrs || 0,
      'CTC Post GST': r.ctcPostGst,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PayrollRecords');
    XLSX.writeFile(wb, `Payroll_Records_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const downloadSampleExcel = () => {
    const sample = [
      {
        'Salary Month': 'September 2026',
        Company: 'NEXXUS FACILITY',
        Plant: 'Pune Plant',
        'E Code': '1001',
        'Employee Name': 'Ramesh Suresh Patil',
        Status: 'Active',
        DOJ: '2023-04-01',
        CTC: 28500,
        GROSS_DEDUCTION: 2223,
        'Sub Total _ Emp': 24277,
        NET_SALARY: 24277,
        'GST @ 18%': 4370,
        'Service Charge': 2000,
        'Actual pay day': 30,
        'OT Hours': 5,
        'CTC Post GST': 30647,
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PayrollSample');
    XLSX.writeFile(wb, 'Payroll_Sample.xlsx');
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        if (rows && rows.length > 0) {
          const parsed = rows.map((r, idx) => ({
            rowIndex: payrollList.length + 2 + idx,
            srNo: payrollList.length + 1 + idx,
            salaryMonth: r['Salary Month'] || 'September 2026',
            company: r['Company'] || 'NEXXUS FACILITY',
            vendor: r['Vendor'] || 'NEXXUS FACILITY',
            plant: r['Plant'] || 'Main Plant',
            eCode: r['E Code'] || `EMP-${idx + 100}`,
            employeeName: r['Employee Name'] || '',
            status: r['Status'] || 'Active',
            ctc: safeEvalMath(r['CTC']),
            grossDeduction: safeEvalMath(r['GROSS_DEDUCTION']),
            netSalary: safeEvalMath(r['NET_SALARY']),
            gst: safeEvalMath(r['GST @ 18%']),
            serviceCharge: safeEvalMath(r['Service Charge']),
            actualPayDay: safeEvalMath(r['Actual pay day']) || 30,
            totalOtHrs: safeEvalMath(r['OT Hours']),
            ctcPostGst: safeEvalMath(r['CTC Post GST']),
            doj: r['DOJ'] || '',
          }));
          const existing = [...payrollList];
          parsed.forEach((p) => existing.unshift(p as any));
          StorageService.savePayroll(existing);
          alert(`${parsed.length} payroll records imported!`);
        }
      } catch (err: any) {
        alert('Upload Error: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-[#FF8500] flex items-center gap-2">
          <BadgeIndianRupee className="w-5 h-5" />
          <span>Payroll Records & Payslip Management</span>
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="btn-3d-secondary px-3 py-1.5 text-xs"
            title="Toggle Ascending / Descending sorting"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#FF8500]" />
            <span>{sortOrder === 'desc' ? '↓ New Data On Top' : '↑ Old Data First'}</span>
          </button>
          <button
            onClick={downloadSampleExcel}
            className="btn-3d-secondary px-3 py-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span>Sample Excel</span>
          </button>
          <label className="btn-3d-secondary px-3 py-1.5 text-xs cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-emerald-500" />
            <span>Bulk Upload</span>
            <input type="file" accept=".xlsx, .xls" onChange={handleBulkUpload} className="hidden" />
          </label>
          <button
            onClick={handleOpenAdd}
            className="btn-3d-orange px-3.5 py-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Record</span>
          </button>
          <button
            onClick={handlePrintSelected}
            className="btn-3d-rose px-3.5 py-1.5 text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Payslips</span>
          </button>
          <button
            onClick={handleExportData}
            className="btn-3d-secondary px-3 py-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* KPI Cards - Uniform Box Sizes & Typography */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
        <div
          className={`p-2.5 px-3.5 rounded-xl border flex flex-col justify-between h-16 border-blue-500/30 transition-all ${
            theme === 'dark' ? 'bg-[#111928]' : 'bg-white shadow-2xs'
          }`}
        >
          <span className="text-slate-400 block font-semibold text-[11px] truncate uppercase tracking-wider">
            Active / Inactive
          </span>
          <span className={`text-sm font-bold font-mono tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            <span className="text-emerald-500">{activeCount}</span> Act / <span className="text-rose-500">{inactiveCount}</span> Inact
          </span>
        </div>
        <div
          className={`p-2.5 px-3.5 rounded-xl border flex flex-col justify-between h-16 border-emerald-500/30 transition-all ${
            theme === 'dark' ? 'bg-[#111928]' : 'bg-white shadow-2xs'
          }`}
        >
          <span className="text-slate-400 block font-semibold text-[11px] truncate uppercase tracking-wider">
            Total Net Salary
          </span>
          <span className="text-sm font-bold text-emerald-500 font-mono tracking-tight truncate">
            {formatCurrencyINR(totNet)}
          </span>
        </div>
        <div
          className={`p-2.5 px-3.5 rounded-xl border flex flex-col justify-between h-16 border-amber-500/30 transition-all ${
            theme === 'dark' ? 'bg-[#111928]' : 'bg-white shadow-2xs'
          }`}
        >
          <span className="text-slate-400 block font-semibold text-[11px] truncate uppercase tracking-wider">
            Total Compliance
          </span>
          <span className="text-sm font-bold text-amber-500 font-mono tracking-tight truncate">
            {formatCurrencyINR(totCompliance)}
          </span>
        </div>
        <div
          className={`p-2.5 px-3.5 rounded-xl border flex flex-col justify-between h-16 border-sky-500/30 transition-all ${
            theme === 'dark' ? 'bg-[#111928]' : 'bg-white shadow-2xs'
          }`}
        >
          <span className="text-slate-400 block font-semibold text-[11px] truncate uppercase tracking-wider">
            Total GST
          </span>
          <span className="text-sm font-bold text-sky-500 font-mono tracking-tight truncate">
            {formatCurrencyINR(totGst)}
          </span>
        </div>
        <div
          className={`p-2.5 px-3.5 rounded-xl border flex flex-col justify-between h-16 border-purple-500/30 transition-all ${
            theme === 'dark' ? 'bg-[#111928]' : 'bg-white shadow-2xs'
          }`}
        >
          <span className="text-slate-400 block font-semibold text-[11px] truncate uppercase tracking-wider">
            Service Charge
          </span>
          <span className="text-sm font-bold text-purple-500 font-mono tracking-tight truncate">
            {formatCurrencyINR(totService)}
          </span>
        </div>
      </div>

      {/* Filters Bar - Uniform Box Sizes */}
      <div
        className={`p-4 rounded-xl border ${
          theme === 'dark' ? 'bg-[#111928] border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs items-end">
          <div>
            <label className={`block font-bold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Salary Month</label>
            <input
              type="text"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              placeholder="e.g. September"
              className={`w-full h-9 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
                theme === 'dark' ? 'bg-[#0a0f1d] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
              }`}
            />
          </div>
          <div>
            <label className={`block font-bold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Employee Name</label>
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Search name"
              className={`w-full h-9 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
                theme === 'dark' ? 'bg-[#0a0f1d] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
              }`}
            />
          </div>
          <div>
            <label className={`block font-bold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Company</label>
            <input
              type="text"
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              placeholder="Search company"
              className={`w-full h-9 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
                theme === 'dark' ? 'bg-[#0a0f1d] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
              }`}
            />
          </div>
          <div>
            <label className={`block font-bold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Plant</label>
            <input
              type="text"
              value={filterPlant}
              onChange={(e) => setFilterPlant(e.target.value)}
              placeholder="Search plant"
              className={`w-full h-9 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
                theme === 'dark' ? 'bg-[#0a0f1d] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
              }`}
            />
          </div>
          <div>
            <label className={`block font-bold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`w-full h-9 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
                theme === 'dark' ? 'bg-[#0a0f1d] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
              }`}
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Left">Left</option>
            </select>
          </div>
          <div>
            <button
              onClick={() => {
                setFilterMonth('');
                setFilterName('');
                setFilterCompany('');
                setFilterPlant('');
                setFilterStatus('');
              }}
              className={`w-full h-9 rounded-lg border font-bold text-xs transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full min-w-[1400px] text-xs text-left">
          <thead className="bg-[#1A365D] text-white font-bold uppercase text-[10px]">
            <tr>
              <th className="py-1.5 px-2 text-center w-8">
                <input
                  type="checkbox"
                  onChange={toggleSelectAll}
                  checked={filtered.length > 0 && selectedRowIndices.length === filtered.length}
                  className="rounded accent-[#FF8500]"
                />
              </th>
              <th className="py-1.5 px-2 text-center w-10">Sr</th>
              <th className="py-1.5 px-2 w-24">Salary Month</th>
              <th className="py-1.5 px-2 w-32">Company</th>
              <th className="py-1.5 px-2 w-28">Plant</th>
              <th className="py-1.5 px-2 w-20">E Code</th>
              <th className="py-1.5 px-2 w-40">Employee Name</th>
              <th className="py-1.5 px-2 text-center w-16">Status</th>
              <th className="py-1.5 px-2 w-20">DOJ</th>
              <th className="py-1.5 px-2 text-right w-20">CTC</th>
              <th className="py-1.5 px-2 text-right w-20">Compliance</th>
              <th className="py-1.5 px-2 text-right w-20 text-emerald-400">Net Salary</th>
              <th className="py-1.5 px-2 text-right w-20">GST</th>
              <th className="py-1.5 px-2 text-right w-20">Service Chg</th>
              <th className="py-1.5 px-2 text-center w-16">Pay Days</th>
              <th className="py-1.5 px-2 text-center w-16">OT Hrs</th>
              <th className="py-1.5 px-2 text-right w-20 text-[#FF8500]">CTC Post GST</th>
              <th className="py-1.5 px-2 text-center w-20">Action</th>
            </tr>
          </thead>
          <tbody className={theme === 'dark' ? 'divide-y divide-slate-800 bg-[#0a0f1d]/60 text-slate-100' : 'divide-y divide-slate-200 bg-white text-slate-900'}>
            {sortedPayroll.length === 0 ? (
              <tr>
                <td colSpan={18} className="py-6 text-center opacity-60">
                  No payroll records found.
                </td>
              </tr>
            ) : (
              sortedPayroll.map((r, i) => {
                const isSelected = selectedRowIndices.includes(r.rowIndex);
                const complianceVal =
                  (parseFloat(String(r.grossDeduction || 0)) || 0) +
                  (parseFloat(String(r.subTotalEmp || 0)) || 0);

                return (
                  <tr
                    key={i}
                    className={`hover:bg-neutral-800/40 transition-colors ${
                      isSelected ? 'bg-neutral-800/60' : ''
                    }`}
                  >
                    <td className="py-1 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(r.rowIndex)}
                        className="rounded accent-[#FF8500]"
                      />
                    </td>
                    <td className="py-1 px-2 text-center text-neutral-400">{i + 1}</td>
                    <td className="py-1 px-2 font-mono">{r.salaryMonth}</td>
                    <td className="py-1 px-2 font-medium">{r.company}</td>
                    <td className="py-1 px-2 text-neutral-300">{r.plant}</td>
                    <td className="py-1 px-2 font-mono font-bold text-white">{r.eCode}</td>
                    <td className="py-1 px-2 font-bold text-sky-400 capitalize">{r.employeeName}</td>
                    <td className="py-1 px-2 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status.toLowerCase() === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-1 px-2 font-mono text-[11px] text-neutral-400">{r.doj || '-'}</td>
                    <td className="py-1 px-2 text-right font-mono font-bold text-white">
                      ₹ {parseFloat(String(r.ctc || 0)).toLocaleString('en-IN')}
                    </td>
                    <td className="py-1 px-2 text-right font-mono font-bold text-amber-400">
                      ₹ {complianceVal.toLocaleString('en-IN')}
                    </td>
                    <td className="py-1 px-2 text-right font-mono font-bold text-emerald-400">
                      ₹ {parseFloat(String(r.netSalary || 0)).toLocaleString('en-IN')}
                    </td>
                    <td className="py-1 px-2 text-right font-mono">
                      ₹ {parseFloat(String(r.gst || 0)).toLocaleString('en-IN')}
                    </td>
                    <td className="py-1 px-2 text-right font-mono">
                      ₹ {parseFloat(String(r.serviceCharge || 0)).toLocaleString('en-IN')}
                    </td>
                    <td className="py-1 px-2 text-center font-mono font-bold">{r.actualPayDay || 30}</td>
                    <td className="py-1 px-2 text-center font-mono">{r.totalOtHrs || 0}</td>
                    <td className="py-1 px-2 text-right font-mono font-bold text-[#FF8500]">
                      ₹ {parseFloat(String(r.ctcPostGst || 0)).toLocaleString('en-IN')}
                    </td>
                    <td className="p-2 text-center space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(r)}
                        className="p-1 rounded text-amber-400 hover:bg-neutral-800"
                        title="Edit Record"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => printSinglePayslip(r)}
                        className="p-1 rounded text-rose-400 hover:bg-neutral-800"
                        title="Download / Print Exact PDF Payslip"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Payroll Modal */}
      {modalOpen && editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-[#1e1e1e] border border-neutral-700 rounded-2xl p-6 shadow-2xl text-white text-xs">
            <h4 className="font-bold text-sm text-[#FF8500] mb-3">
              {editingRow.rowIndex ? 'Edit Payroll Record' : 'Add New Payroll Record'}
            </h4>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-neutral-400 mb-1">Salary Month</label>
                <input
                  type="text"
                  value={editingRow.salaryMonth}
                  onChange={(e) => setEditingRow({ ...editingRow, salaryMonth: e.target.value })}
                  className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Company</label>
                <input
                  type="text"
                  value={editingRow.company}
                  onChange={(e) => setEditingRow({ ...editingRow, company: e.target.value })}
                  className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Plant</label>
                <input
                  type="text"
                  value={editingRow.plant}
                  onChange={(e) => setEditingRow({ ...editingRow, plant: e.target.value })}
                  className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">E Code</label>
                <input
                  type="text"
                  value={editingRow.eCode}
                  onChange={(e) => setEditingRow({ ...editingRow, eCode: e.target.value })}
                  className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Employee Name</label>
                <input
                  type="text"
                  value={editingRow.employeeName}
                  onChange={(e) => setEditingRow({ ...editingRow, employeeName: e.target.value })}
                  className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Status</label>
                <select
                  value={editingRow.status}
                  onChange={(e) => setEditingRow({ ...editingRow, status: e.target.value })}
                  className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Left">Left</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Basic + DA</label>
                <input
                  type="number"
                  value={editingRow.basicDa}
                  onChange={(e) => {
                    const b = parseFloat(e.target.value) || 0;
                    setEditingRow({ ...editingRow, basicDa: b, netSalary: b });
                  }}
                  className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Gross Deduction</label>
                <input
                  type="number"
                  value={editingRow.grossDeduction}
                  onChange={(e) => setEditingRow({ ...editingRow, grossDeduction: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Net Salary</label>
                <input
                  type="number"
                  value={editingRow.netSalary}
                  onChange={(e) => setEditingRow({ ...editingRow, netSalary: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-emerald-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Total CTC</label>
                <input
                  type="number"
                  value={editingRow.ctc}
                  onChange={(e) => setEditingRow({ ...editingRow, ctc: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">GST @ 18%</label>
                <input
                  type="number"
                  value={editingRow.gst}
                  onChange={(e) => setEditingRow({ ...editingRow, gst: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Service Charge</label>
                <input
                  type="number"
                  value={editingRow.serviceCharge}
                  onChange={(e) => setEditingRow({ ...editingRow, serviceCharge: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
                />
              </div>
            </div>

            <div className="flex justify-between pt-3 border-t border-neutral-800">
              {editingRow.rowIndex > 0 ? (
                <button
                  onClick={handleDeleteModal}
                  className="px-4 py-2 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 font-bold cursor-pointer"
                >
                  Delete Record
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveModal}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
