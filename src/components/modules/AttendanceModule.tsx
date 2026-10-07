import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Users,
  Download,
  Upload,
  Plus,
  CheckCircle2,
  Filter,
  RotateCcw,
  Pencil,
  Trash2,
  Search,
  ArrowUpDown,
} from 'lucide-react';
import { AttendanceRecord, CompanyRecord, Employee } from '../../types';
import { StorageService } from '../../utils/storage';
import { safeEvalMath, cleanTimeFormat, formatDateCustom, formatDateForInput } from '../../utils/formatters';

interface AttendanceModuleProps {
  companies: CompanyRecord[];
  employees: Employee[];
  theme: 'dark' | 'light';
  currentUsername: string;
}

export const AttendanceModule: React.FC<AttendanceModuleProps> = ({
  companies,
  employees,
  theme,
  currentUsername,
}) => {
  const [subTab, setSubTab] = useState<'entry' | 'report'>('entry');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedPlant, setSelectedPlant] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Attendance Entry Rows State
  const [entryRows, setEntryRows] = useState<any[]>([
    {
      shift: 'Day',
      empName: '',
      contact: '',
      inTime: '07:00',
      outTime: '19:00',
      totalHours: '12:00',
      extraHours: '04:00',
      payment: 800,
      paymentStatus: 'Pending',
      payer: currentUsername,
      extraPayment: 0,
      type: 'PhonePe',
      remark: '-',
    },
  ]);

  // Report State
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterPlant, setFilterPlant] = useState('');
  const [filterEmpName, setFilterEmpName] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Edit Modal State
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    setAttendanceHistory(StorageService.getAttendance());
    const handler = () => setAttendanceHistory(StorageService.getAttendance());
    window.addEventListener('nexxus_storage_updated', handler);
    return () => window.removeEventListener('nexxus_storage_updated', handler);
  }, []);

  // Update plants list based on selected company
  const availablePlants = companies
    .filter((c) => !selectedCompany || c.companyName.toUpperCase() === selectedCompany.toUpperCase())
    .map((c) => c.plant)
    .filter(Boolean);

  // Recalculate hours & payment for a single row
  const calcRowHoursAndPay = (inTimeStr: string, outTimeStr: string) => {
    if (!inTimeStr || !outTimeStr) {
      return { totalHours: '00:00', extraHours: '00:00', calculatedSysPayment: 0 };
    }
    const [inH, inM] = inTimeStr.split(':').map(Number);
    const [outH, outM] = outTimeStr.split(':').map(Number);
    if (isNaN(inH) || isNaN(outH)) {
      return { totalHours: '00:00', extraHours: '00:00', calculatedSysPayment: 0 };
    }

    const inTotalMins = inH * 60 + inM;
    let outTotalMins = outH * 60 + outM;
    if (outTotalMins < inTotalMins) outTotalMins += 24 * 60;
    const diffMins = outTotalMins - inTotalMins;

    const totalH = Math.floor(diffMins / 60);
    const totalM = diffMins % 60;
    const totalHours = `${String(totalH).padStart(2, '0')}:${String(totalM).padStart(2, '0')}`;

    let basePayment = 0;
    let extraMins = 0;
    let calculatedSysPayment = 0;

    if (diffMins < 720) {
      basePayment = 530;
      if (diffMins > 480) extraMins = diffMins - 480;
      const otBlocks = Math.floor(extraMins / 30);
      calculatedSysPayment = basePayment + otBlocks * 31;
    } else {
      basePayment = 800;
      if (diffMins > 720) extraMins = diffMins - 720;
      const otBlocks = Math.floor(extraMins / 30);
      calculatedSysPayment = basePayment + otBlocks * 33;
    }

    const exH = Math.floor(extraMins / 60);
    const exM = extraMins % 60;
    const extraHours = `${String(exH).padStart(2, '0')}:${String(exM).padStart(2, '0')}`;

    return { totalHours, extraHours, calculatedSysPayment };
  };

  const updateEntryRow = (idx: number, field: string, value: any) => {
    const updated = [...entryRows];
    updated[idx][field] = value;

    if (field === 'inTime' || field === 'outTime') {
      const { totalHours, extraHours, calculatedSysPayment } = calcRowHoursAndPay(
        updated[idx].inTime,
        updated[idx].outTime
      );
      updated[idx].totalHours = totalHours;
      updated[idx].extraHours = extraHours;
      updated[idx].payment = calculatedSysPayment;
    }

    if (field === 'empName') {
      const matched = employees.find(
        (e) => e.fullName.trim().toLowerCase() === String(value).trim().toLowerCase()
      );
      if (matched) {
        updated[idx].contact = matched.mobile || '';
      }
    }

    setEntryRows(updated);
  };

  const addRow = () => {
    setEntryRows([
      ...entryRows,
      {
        shift: 'Day',
        empName: '',
        contact: '',
        inTime: '07:00',
        outTime: '19:00',
        totalHours: '12:00',
        extraHours: '04:00',
        payment: 800,
        paymentStatus: 'Pending',
        payer: currentUsername,
        extraPayment: 0,
        type: 'PhonePe',
        remark: '-',
      },
    ]);
  };

  const removeRow = (idx: number) => {
    if (entryRows.length === 1) return;
    setEntryRows(entryRows.filter((_, i) => i !== idx));
  };

  const handleSaveAttendance = () => {
    if (!selectedCompany) {
      alert('Please select a Company!');
      return;
    }
    if (!selectedPlant) {
      alert('Please select a Plant!');
      return;
    }
    if (!selectedDate) {
      alert('Please select Date!');
      return;
    }

    const validRows = entryRows.filter((r) => r.empName.trim() !== '');
    if (validRows.length === 0) {
      alert('Please enter at least one employee name!');
      return;
    }

    const formattedList: AttendanceRecord[] = validRows.map((r, idx) => ({
      srNo: idx + 1,
      company: selectedCompany,
      plant: selectedPlant,
      date: selectedDate,
      shift: r.shift,
      empName: r.empName.trim(),
      contact: r.contact.trim(),
      inTime: cleanTimeFormat(r.inTime),
      outTime: cleanTimeFormat(r.outTime),
      totalHours: r.totalHours,
      extraHours: r.extraHours,
      payment: safeEvalMath(r.payment),
      paymentStatus: r.paymentStatus,
      payer: r.payer,
      extraPayment: safeEvalMath(r.extraPayment),
      type: r.type,
      remark: r.remark,
    }));

    StorageService.addAttendanceRows(formattedList);
    setAttendanceHistory(StorageService.getAttendance());
    StorageService.addNotification(
      'Attendance Saved',
      `${formattedList.length} attendance records logged for ${selectedCompany} on ${formatDateCustom(selectedDate)}.`,
      'success'
    );
    alert('Attendance saved successfully!');
    setSubTab('report');
  };

  const downloadSampleExcel = () => {
    const sample = [
      {
        Shift: 'Day',
        'Employee Name': 'Rahul Sambhaji More',
        'Contact Number': '9822114455',
        'In Time': '07:00',
        'Out Time': '19:00',
        'Total Working Hours': '12:00',
        'Extra Working Hours': '04:00',
        'System Generated Payment': 800,
        'Payment Status': 'Pending',
        Payer: 'Admin',
        'Extra Payment': 100,
        'Payment Type': 'PhonePe',
        Remark: 'Good',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'AttendanceSample');
    XLSX.writeFile(wb, 'Attendance_Sample.xlsx');
  };

  const handleBulkExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        if (rows && rows.length > 0) {
          const parsed = rows.map((r) => {
            const inT = r['In Time'] || '07:00';
            const outT = r['Out Time'] || '19:00';
            const { totalHours, extraHours, calculatedSysPayment } = calcRowHoursAndPay(inT, outT);
            return {
              shift: r['Shift'] || 'Day',
              empName: r['Employee Name'] || '',
              contact: r['Contact Number'] || '',
              inTime: inT,
              outTime: outT,
              totalHours: r['Total Working Hours'] || totalHours,
              extraHours: r['Extra Working Hours'] || extraHours,
              payment: r['System Generated Payment'] || calculatedSysPayment,
              paymentStatus: r['Payment Status'] || 'Pending',
              payer: r['Payer'] || currentUsername,
              extraPayment: r['Extra Payment'] || 0,
              type: r['Payment Type'] || 'PhonePe',
              remark: r['Remark'] || '-',
            };
          });
          setEntryRows(parsed);
          alert(`${parsed.length} rows imported from Excel!`);
        }
      } catch (err: any) {
        alert('Failed to read Excel file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // Filtered & Sorted Report Data (Newest First by Default)
  const filteredReport = attendanceHistory.filter((item) => {
    let matchDate = true;
    if (filterFromDate && item.date < filterFromDate) matchDate = false;
    if (filterToDate && item.date > filterToDate) matchDate = false;

    const matchComp = !filterCompany || item.company.toLowerCase().includes(filterCompany.toLowerCase());
    const matchPlant = !filterPlant || item.plant.toLowerCase().includes(filterPlant.toLowerCase());
    const matchEmp = !filterEmpName || item.empName.toLowerCase().includes(filterEmpName.toLowerCase());
    const matchStatus = !filterStatus || item.paymentStatus === filterStatus;

    return matchDate && matchComp && matchPlant && matchEmp && matchStatus;
  });

  const sortedReport = [...filteredReport].sort((a, b) => {
    const dComp = (b.date || '').localeCompare(a.date || '');
    if (dComp !== 0) return sortOrder === 'desc' ? dComp : -dComp;
    return sortOrder === 'desc' ? (b.srNo || 0) - (a.srNo || 0) : (a.srNo || 0) - (b.srNo || 0);
  });

  const repTotalPayment = filteredReport.reduce((acc, r) => acc + (parseFloat(String(r.payment)) || 0), 0);
  const repTotalExtra = filteredReport.reduce((acc, r) => acc + (parseFloat(String(r.extraPayment)) || 0), 0);
  const repDistributed = repTotalPayment + repTotalExtra;

  const handleExport = (type: 'excel' | 'csv') => {
    if (sortedReport.length === 0) {
      alert('No data available to export!');
      return;
    }
    const exportData = sortedReport.map((r, i) => ({
      Sr: i + 1,
      Company: r.company,
      Plant: r.plant,
      Date: r.date,
      Shift: r.shift,
      'Employee Name': r.empName,
      Contact: r.contact,
      'In Time': r.inTime,
      'Out Time': r.outTime,
      'Total Hours': r.totalHours,
      'Extra Hours': r.extraHours,
      'System Payment': r.payment,
      Status: r.paymentStatus,
      Payer: r.payer,
      'Extra Payment': r.extraPayment,
      Type: r.type,
      Remark: r.remark,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'AttendanceReport');
    if (type === 'excel') {
      XLSX.writeFile(wb, `Attendance_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } else {
      XLSX.writeFile(wb, `Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    }
  };

  const handleSaveEdit = () => {
    if (!editRecord) return;
    const history = [...attendanceHistory];
    const idx = history.findIndex((h) => h.srNo === editRecord.srNo);
    if (idx !== -1) {
      history[idx] = editRecord;
      StorageService.saveAttendance(history);
      setAttendanceHistory(StorageService.getAttendance());
      alert('Attendance record updated successfully!');
      setEditRecord(null);
    }
  };

  const handleDeleteRecord = (srNo: number) => {
    if (confirm('Are you sure you want to delete this attendance record?')) {
      const updated = attendanceHistory.filter((h) => h.srNo !== srNo);
      StorageService.saveAttendance(updated);
      setAttendanceHistory(StorageService.getAttendance());
      if (editRecord && editRecord.srNo === srNo) {
        setEditRecord(null);
      }
    }
  };

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-[#131b26] border-neutral-800 text-white shadow-md' : 'bg-white border-slate-200 text-slate-800 shadow-sm';
  const subCardBg = isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-slate-50 border-slate-200';
  const inputClass = isDark
    ? 'bg-[#0d131d] border-neutral-700 text-white focus:border-[#FF8500]'
    : 'bg-white border-slate-300 text-slate-900 focus:border-[#FF8500] shadow-2xs';
  const tableBodyClass = isDark ? 'divide-y divide-neutral-800 bg-[#0d131d]/60 text-white' : 'divide-y divide-slate-200 bg-white text-slate-900';
  const trHoverClass = isDark ? 'hover:bg-neutral-800/40 transition-colors' : 'hover:bg-slate-50 transition-colors';

  return (
    <div className="space-y-4">
      {/* Subtab Toggle Buttons */}
      <div className="flex items-center gap-3 border-b border-neutral-700/60 pb-3">
        <button
          onClick={() => setSubTab('entry')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${
            subTab === 'entry'
              ? 'bg-[#FF8500] text-black shadow-md'
              : isDark
              ? 'bg-neutral-800 text-neutral-300 hover:text-white'
              : 'bg-slate-200 text-slate-700 hover:text-black'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Attendance Entry</span>
        </button>
        <button
          onClick={() => setSubTab('report')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${
            subTab === 'report'
              ? 'bg-[#FF8500] text-black shadow-md'
              : isDark
              ? 'bg-neutral-800 text-neutral-300 hover:text-white'
              : 'bg-slate-200 text-slate-700 hover:text-black'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Attendance & Payment Report</span>
        </button>
      </div>

      {/* ---------------- SUBTAB 1: ATTENDANCE ENTRY ---------------- */}
      {subTab === 'entry' && (
        <div className={`p-5 rounded-xl border ${cardBg}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h3 className="text-lg font-bold text-[#FF8500] flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>Shift Attendance Data Entry</span>
            </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={downloadSampleExcel}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  isDark ? 'border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Sample Excel</span>
              </button>
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-600/40 bg-emerald-900/30 hover:bg-emerald-900/50 text-xs font-semibold text-emerald-400 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Bulk Upload</span>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleBulkExcelUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => handleExport('excel')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  isDark ? 'border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Master Selector Row */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl mb-5 border ${subCardBg}`}>
            <div>
              <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>Company *</label>
              <select
                value={selectedCompany}
                onChange={(e) => {
                  setSelectedCompany(e.target.value);
                  setSelectedPlant('');
                }}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${inputClass}`}
              >
                <option value="">-- Select Company --</option>
                {companies.map((c, i) => (
                  <option key={i} value={c.companyName}>
                    {c.companyName} {c.plant ? `(${c.plant})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>Plant *</label>
              <select
                value={selectedPlant}
                onChange={(e) => setSelectedPlant(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${inputClass}`}
              >
                <option value="">-- Select Plant --</option>
                {availablePlants.map((p, i) => (
                  <option key={i} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>Attendance Date *</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${inputClass}`}
              />
            </div>
          </div>

          {/* Controls DIRECTLY ABOVE the Table Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-700/30">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-[#FF8500]">Shift Attendance Table</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20">
                {entryRows.length} Rows
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addRow}
                className="btn-3d-orange px-4 py-2 text-xs"
                title="Add new employee row"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Row</span>
              </button>
              <button
                type="button"
                onClick={handleSaveAttendance}
                className="btn-3d-emerald px-4 py-2 text-xs"
                title="Save attendance records"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Save Attendance</span>
              </button>
            </div>
          </div>

          {/* Entry Grid */}
          <div className={`overflow-x-auto rounded-xl border mb-4 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
            <table className="w-full min-w-[1300px] text-xs text-left">
              <thead className="bg-[#1A365D] text-white font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-2.5 text-center w-12">Sr</th>
                  <th className="p-2.5 w-24">Shift</th>
                  <th className="p-2.5 w-48">Employee Name</th>
                  <th className="p-2.5 w-32">Mobile</th>
                  <th className="p-2.5 w-24">In Time</th>
                  <th className="p-2.5 w-24">Out Time</th>
                  <th className="p-2.5 text-center w-24">Total Hrs</th>
                  <th className="p-2.5 text-center w-24">Extra Hrs</th>
                  <th className="p-2.5 text-right w-28">Sys Pay (₹)</th>
                  <th className="p-2.5 w-24">Status</th>
                  <th className="p-2.5 w-32">Payer</th>
                  <th className="p-2.5 text-right w-24">Extra (₹)</th>
                  <th className="p-2.5 w-28">Type</th>
                  <th className="p-2.5">Remark</th>
                  <th className="p-2.5 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className={tableBodyClass}>
                {entryRows.map((row, idx) => (
                  <tr key={idx} className={trHoverClass}>
                    <td className="p-2 text-center font-bold opacity-60">{idx + 1}</td>
                    <td className="p-2">
                      <select
                        value={row.shift}
                        onChange={(e) => updateEntryRow(idx, 'shift', e.target.value)}
                        className={`w-full p-1 border rounded ${inputClass}`}
                      >
                        <option value="Day">Day</option>
                        <option value="Night">Night</option>
                        <option value="General">General</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        list="emp_datalist"
                        value={row.empName}
                        onChange={(e) => updateEntryRow(idx, 'empName', e.target.value)}
                        placeholder="Employee Name"
                        className={`w-full p-1 border rounded capitalize font-medium ${inputClass}`}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        maxLength={10}
                        value={row.contact}
                        onChange={(e) => updateEntryRow(idx, 'contact', e.target.value)}
                        placeholder="Mobile"
                        className={`w-full p-1 border rounded font-mono ${inputClass}`}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="time"
                        value={row.inTime}
                        onChange={(e) => updateEntryRow(idx, 'inTime', e.target.value)}
                        className={`w-full p-1 border rounded text-center font-mono ${inputClass}`}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="time"
                        value={row.outTime}
                        onChange={(e) => updateEntryRow(idx, 'outTime', e.target.value)}
                        className={`w-full p-1 border rounded text-center font-mono ${inputClass}`}
                      />
                    </td>
                    <td className={`p-2 text-center font-mono font-bold ${isDark ? 'text-white bg-black/20' : 'text-slate-900 bg-slate-100'}`}>
                      {row.totalHours}
                    </td>
                    <td className={`p-2 text-center font-mono font-bold text-[#FF8500] ${isDark ? 'bg-black/20' : 'bg-slate-100'}`}>
                      {row.extraHours}
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.payment}
                        onChange={(e) => updateEntryRow(idx, 'payment', e.target.value)}
                        className={`w-full p-1 border rounded text-emerald-600 dark:text-emerald-400 font-bold text-right font-mono ${inputClass}`}
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={row.paymentStatus}
                        onChange={(e) => updateEntryRow(idx, 'paymentStatus', e.target.value)}
                        className={`w-full p-1 border rounded ${inputClass}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.payer}
                        onChange={(e) => updateEntryRow(idx, 'payer', e.target.value)}
                        className={`w-full p-1 border rounded ${inputClass}`}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.extraPayment}
                        onChange={(e) => updateEntryRow(idx, 'extraPayment', e.target.value)}
                        className={`w-full p-1 border rounded text-right font-mono ${inputClass}`}
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={row.type}
                        onChange={(e) => updateEntryRow(idx, 'type', e.target.value)}
                        className={`w-full p-1 border rounded ${inputClass}`}
                      >
                        <option value="PhonePe">PhonePe</option>
                        <option value="Google Pay">Google Pay</option>
                        <option value="Paytm">Paytm</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.remark}
                        onChange={(e) => updateEntryRow(idx, 'remark', e.target.value)}
                        className={`w-full p-1 border rounded ${inputClass}`}
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => removeRow(idx)}
                        className="p-1 rounded text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={addRow}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <Plus className="w-4 h-4 text-[#FF8500]" />
              <span>+ Add Employee Row</span>
            </button>

            <button
              onClick={handleSaveAttendance}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF8500] hover:bg-[#e07500] text-black font-extrabold text-sm transition-all shadow-lg cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>SAVE SHIFT ATTENDANCE</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------- SUBTAB 2: ATTENDANCE REPORT ---------------- */}
      {subTab === 'report' && (
        <div className="space-y-4">
          {/* Summary Stat Cards - Uniform Sizing */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className={`p-3.5 rounded-xl border flex flex-col justify-between h-20 border-blue-500/30 ${cardBg}`}>
              <span className="text-slate-400 block font-semibold text-xs truncate uppercase tracking-wider">
                Total Logs Count
              </span>
              <span className="text-base font-bold font-mono tracking-tight text-blue-500 truncate">
                {filteredReport.length} Records
              </span>
            </div>
            <div className={`p-3.5 rounded-xl border flex flex-col justify-between h-20 border-emerald-500/30 ${cardBg}`}>
              <span className="text-slate-400 block font-semibold text-xs truncate uppercase tracking-wider">
                Total Base Wage Pay
              </span>
              <span className="text-base font-bold text-emerald-500 font-mono tracking-tight truncate">
                ₹ {repTotalPayment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className={`p-3.5 rounded-xl border flex flex-col justify-between h-20 border-amber-500/30 ${cardBg}`}>
              <span className="text-slate-400 block font-semibold text-xs truncate uppercase tracking-wider">
                Total Extra Pay
              </span>
              <span className="text-base font-bold text-amber-500 font-mono tracking-tight truncate">
                ₹ {repTotalExtra.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className={`p-3.5 rounded-xl border flex flex-col justify-between h-20 border-[#FF8500]/40 ${cardBg}`}>
              <span className="text-slate-400 block font-semibold text-xs truncate uppercase tracking-wider">
                Distributed Net Total
              </span>
              <span className="text-base font-bold text-[#FF8500] font-mono tracking-tight truncate">
                ₹ {repDistributed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Filters Bar - Uniform Box Sizes */}
          <div className={`p-4 rounded-xl border ${cardBg}`}>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold mb-1.5 opacity-75">From Date</label>
                <input
                  type="date"
                  value={filterFromDate}
                  onChange={(e) => setFilterFromDate(e.target.value)}
                  className={`w-full h-9 px-2.5 py-1.5 border rounded-lg text-xs ${inputClass}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 opacity-75">To Date</label>
                <input
                  type="date"
                  value={filterToDate}
                  onChange={(e) => setFilterToDate(e.target.value)}
                  className={`w-full h-9 px-2.5 py-1.5 border rounded-lg text-xs ${inputClass}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 opacity-75">Company</label>
                <input
                  type="text"
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                  placeholder="Search company"
                  className={`w-full h-9 px-2.5 py-1.5 border rounded-lg text-xs ${inputClass}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 opacity-75">Plant</label>
                <input
                  type="text"
                  value={filterPlant}
                  onChange={(e) => setFilterPlant(e.target.value)}
                  placeholder="Search plant"
                  className={`w-full h-9 px-2.5 py-1.5 border rounded-lg text-xs ${inputClass}`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold opacity-75 mb-1">Employee Name</label>
                <input
                  type="text"
                  value={filterEmpName}
                  onChange={(e) => setFilterEmpName(e.target.value)}
                  placeholder="Search employee"
                  className={`w-full px-2 py-1.5 border rounded-lg text-xs ${inputClass}`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold opacity-75 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`w-full px-2 py-1.5 border rounded-lg text-xs ${inputClass}`}
                >
                  <option value="">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            <div className={`flex items-center justify-between mt-3 pt-3 border-t ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
              <button
                onClick={() => {
                  setFilterFromDate('');
                  setFilterToDate('');
                  setFilterCompany('');
                  setFilterPlant('');
                  setFilterEmpName('');
                  setFilterStatus('');
                }}
                className="flex items-center gap-1 text-xs opacity-70 hover:opacity-100 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                  className="btn-3d-secondary px-3 py-1.5 text-xs"
                  title="Toggle Ascending / Descending sorting"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#FF8500]" />
                  <span>{sortOrder === 'desc' ? '↓ New Data On Top' : '↑ Old Data First'}</span>
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="btn-3d-emerald px-3 py-1.5 text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Excel</span>
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="btn-3d-secondary px-3 py-1.5 text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Report Table */}
          <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
            <table className="w-full min-w-[1350px] text-xs text-left">
              <thead className="bg-[#1A365D] text-white font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-1.5 px-2 text-center w-10">Sr</th>
                  <th className="py-1.5 px-2 w-32">Company</th>
                  <th className="py-1.5 px-2 w-28">Plant</th>
                  <th className="py-1.5 px-2 w-20">Date</th>
                  <th className="py-1.5 px-2 w-14">Shift</th>
                  <th className="py-1.5 px-2 w-40">Employee Name</th>
                  <th className="py-1.5 px-2 w-24">Contact</th>
                  <th className="py-1.5 px-2 text-center w-14">In</th>
                  <th className="py-1.5 px-2 text-center w-14">Out</th>
                  <th className="py-1.5 px-2 text-center w-16">Total Hrs</th>
                  <th className="py-1.5 px-2 text-center w-16">Extra Hrs</th>
                  <th className="py-1.5 px-2 text-right w-20">Sys Pay</th>
                  <th className="py-1.5 px-2 text-center w-16">Status</th>
                  <th className="py-1.5 px-2 w-20">Payer</th>
                  <th className="py-1.5 px-2 text-right w-20">Extra Pay</th>
                  <th className="py-1.5 px-2 w-20">Type</th>
                  <th className="py-1.5 px-2">Remark</th>
                  <th className="py-1.5 px-2 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className={tableBodyClass}>
                {sortedReport.length === 0 ? (
                  <tr>
                    <td colSpan={18} className="py-6 text-center opacity-60">
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  sortedReport.map((rec, idx) => (
                    <tr key={idx} className={trHoverClass}>
                      <td className="py-1 px-2 text-center opacity-60 font-semibold">{idx + 1}</td>
                      <td className="py-1 px-2 font-medium">{rec.company}</td>
                      <td className="py-1 px-2 opacity-80">{rec.plant}</td>
                      <td className="py-1 px-2 font-mono">{formatDateCustom(rec.date)}</td>
                      <td className="py-1 px-2">{rec.shift}</td>
                      <td className="py-1 px-2 font-bold capitalize">{rec.empName}</td>
                      <td className="py-1 px-2 font-mono">{rec.contact}</td>
                      <td className="py-1 px-2 text-center font-mono">{rec.inTime}</td>
                      <td className="py-1 px-2 text-center font-mono">{rec.outTime}</td>
                      <td className="py-1 px-2 text-center font-mono font-semibold">{rec.totalHours}</td>
                      <td className="py-1 px-2 text-center font-mono font-semibold text-[#FF8500]">{rec.extraHours}</td>
                      <td className="py-1 px-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ₹ {parseFloat(String(rec.payment || 0)).toFixed(2)}
                      </td>
                      <td className="py-1 px-2 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            rec.paymentStatus === 'Paid'
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {rec.paymentStatus}
                        </span>
                      </td>
                      <td className="py-1 px-2">{rec.payer}</td>
                      <td className="py-1 px-2 text-right font-mono">
                        ₹ {parseFloat(String(rec.extraPayment || 0)).toFixed(2)}
                      </td>
                      <td className="py-1 px-2">{rec.type}</td>
                      <td className="py-1 px-2 opacity-75 truncate max-w-[120px]">{rec.remark}</td>
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditRecord({ ...rec })}
                            className="p-1 rounded text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(rec.srNo)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Record Modal */}
      {editRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div
            className={`w-full max-w-2xl rounded-2xl border p-6 shadow-2xl ${
              isDark ? 'bg-[#131b26] border-neutral-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <h3 className="font-bold text-base text-[#FF8500] mb-4 flex items-center gap-2">
              <Pencil className="w-4 h-4" /> Edit Attendance Record: {editRecord.empName}
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
              <div>
                <label className="block opacity-70 mb-1">In Time</label>
                <input
                  type="time"
                  value={editRecord.inTime}
                  onChange={(e) => {
                    const newIn = e.target.value;
                    const { totalHours, extraHours, calculatedSysPayment } = calcRowHoursAndPay(
                      newIn,
                      editRecord.outTime
                    );
                    setEditRecord({
                      ...editRecord,
                      inTime: newIn,
                      totalHours,
                      extraHours,
                      payment: calculatedSysPayment,
                    });
                  }}
                  className={`w-full p-2 border rounded ${inputClass}`}
                />
              </div>
              <div>
                <label className="block opacity-70 mb-1">Out Time</label>
                <input
                  type="time"
                  value={editRecord.outTime}
                  onChange={(e) => {
                    const newOut = e.target.value;
                    const { totalHours, extraHours, calculatedSysPayment } = calcRowHoursAndPay(
                      editRecord.inTime,
                      newOut
                    );
                    setEditRecord({
                      ...editRecord,
                      outTime: newOut,
                      totalHours,
                      extraHours,
                      payment: calculatedSysPayment,
                    });
                  }}
                  className={`w-full p-2 border rounded ${inputClass}`}
                />
              </div>
              <div>
                <label className="block opacity-70 mb-1">Total Hours</label>
                <input
                  type="text"
                  readOnly
                  value={editRecord.totalHours}
                  className={`w-full p-2 border rounded font-mono text-center opacity-80 ${inputClass}`}
                />
              </div>
              <div>
                <label className="block opacity-70 mb-1">Extra Hours</label>
                <input
                  type="text"
                  readOnly
                  value={editRecord.extraHours}
                  className={`w-full p-2 border rounded font-mono text-center font-bold text-[#FF8500] ${inputClass}`}
                />
              </div>

              <div>
                <label className="block opacity-70 mb-1">Payment (₹)</label>
                <input
                  type="number"
                  value={editRecord.payment}
                  onChange={(e) => setEditRecord({ ...editRecord, payment: parseFloat(e.target.value) || 0 })}
                  className={`w-full p-2 border rounded text-emerald-600 dark:text-emerald-400 font-bold ${inputClass}`}
                />
              </div>
              <div>
                <label className="block opacity-70 mb-1">Extra Payment (₹)</label>
                <input
                  type="number"
                  value={editRecord.extraPayment}
                  onChange={(e) => setEditRecord({ ...editRecord, extraPayment: parseFloat(e.target.value) || 0 })}
                  className={`w-full p-2 border rounded ${inputClass}`}
                />
              </div>
              <div>
                <label className="block opacity-70 mb-1">Payment Status</label>
                <select
                  value={editRecord.paymentStatus}
                  onChange={(e) => setEditRecord({ ...editRecord, paymentStatus: e.target.value as any })}
                  className={`w-full p-2 border rounded ${inputClass}`}
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              <div>
                <label className="block opacity-70 mb-1">Payer</label>
                <input
                  type="text"
                  value={editRecord.payer}
                  onChange={(e) => setEditRecord({ ...editRecord, payer: e.target.value })}
                  className={`w-full p-2 border rounded ${inputClass}`}
                />
              </div>

              <div className="col-span-2">
                <label className="block opacity-70 mb-1">Payment Type</label>
                <select
                  value={editRecord.type}
                  onChange={(e) => setEditRecord({ ...editRecord, type: e.target.value })}
                  className={`w-full p-2 border rounded ${inputClass}`}
                >
                  <option value="PhonePe">PhonePe</option>
                  <option value="Google Pay">Google Pay</option>
                  <option value="Paytm">Paytm</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block opacity-70 mb-1">Remark</label>
                <input
                  type="text"
                  value={editRecord.remark}
                  onChange={(e) => setEditRecord({ ...editRecord, remark: e.target.value })}
                  className={`w-full p-2 border rounded ${inputClass}`}
                />
              </div>
            </div>

            <div className={`flex items-center justify-between pt-3 border-t ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => handleDeleteRecord(editRecord.srNo)}
                className="btn-3d-rose px-4 py-2 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditRecord(null)}
                  className="btn-3d-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="btn-3d-emerald px-5 py-2 text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Update Record</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Autocomplete datalist */}
      <datalist id="emp_datalist">
        {employees.map((e, idx) => (
          <option key={idx} value={e.fullName} />
        ))}
      </datalist>
    </div>
  );
};
