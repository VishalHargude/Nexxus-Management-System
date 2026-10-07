import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Wrench, Plus, Trash2, Download, Upload, Pencil, CheckCircle2, ArrowUpDown } from 'lucide-react';
import { JobWorkRecord, JobDetailMaster, CompanyRecord, Employee } from '../../types';
import { StorageService } from '../../utils/storage';
import { safeEvalMath, formatDateCustom } from '../../utils/formatters';

interface Props {
  companies: CompanyRecord[];
  employees: Employee[];
  theme: 'dark' | 'light';
}

export const JobWorkModule: React.FC<Props> = ({ companies, employees, theme }) => {
  const [jobWorkList, setJobWorkList] = useState<JobWorkRecord[]>([]);
  const [jobMasters, setJobMasters] = useState<JobDetailMaster[]>([]);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Daily entry state
  const [entryRows, setEntryRows] = useState<any[]>([
    {
      date: new Date().toISOString().split('T')[0],
      company: '',
      plant: '',
      empName: '',
      contact: '',
      jobDetails: '',
      jobWeight: 0,
      qty: 0,
      inKg: 0,
      inTon: 0,
      remark: '',
    },
  ]);

  // Filters for Report
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterEmp, setFilterEmp] = useState('');
  const [filterJob, setFilterJob] = useState('');

  // Edit Modal State
  const [editRecord, setEditRecord] = useState<JobWorkRecord | null>(null);

  useEffect(() => {
    const load = () => {
      setJobWorkList(StorageService.getJobWork());
      setJobMasters(StorageService.getJobs());
    };
    load();
    window.addEventListener('nexxus_storage_updated', load);
    return () => window.removeEventListener('nexxus_storage_updated', load);
  }, []);

  const addRow = () => {
    setEntryRows([
      ...entryRows,
      {
        date: new Date().toISOString().split('T')[0],
        company: '',
        plant: '',
        empName: '',
        contact: '',
        jobDetails: '',
        jobWeight: 0,
        qty: 0,
        inKg: 0,
        inTon: 0,
        remark: '',
      },
    ]);
  };

  const removeRow = (idx: number) => {
    if (entryRows.length === 1) return;
    setEntryRows(entryRows.filter((_, i) => i !== idx));
  };

  const updateRow = (idx: number, field: string, val: any) => {
    const updated = [...entryRows];
    updated[idx][field] = val;

    // Autocomplete mobile from employee
    if (field === 'empName') {
      const match = employees.find((e) => e.fullName.toLowerCase() === String(val).toLowerCase());
      if (match) updated[idx].contact = match.mobile || '';
    }

    // Autocomplete weight from Job Details master
    if (field === 'jobDetails') {
      const matchJob = jobMasters.find((j) => j.jobName.toLowerCase() === String(val).toLowerCase());
      if (matchJob) {
        updated[idx].jobWeight = matchJob.weight;
      }
    }

    // Recalculate weights
    const wt = safeEvalMath(updated[idx].jobWeight);
    const q = safeEvalMath(updated[idx].qty);
    const kg = wt * q;
    updated[idx].inKg = Number(kg.toFixed(2));
    updated[idx].inTon = Number((kg / 1000).toFixed(4));

    setEntryRows(updated);
  };

  const handleSaveJobWork = () => {
    const valid = entryRows.filter((r) => r.empName.trim() !== '' && r.qty > 0);
    if (valid.length === 0) {
      alert('Please fill at least one row with Employee Name and Qty > 0');
      return;
    }

    const records: JobWorkRecord[] = valid.map((r, i) => ({
      srNo: i + 1,
      date: r.date,
      company: r.company,
      plant: r.plant,
      empName: r.empName,
      contact: r.contact,
      jobDetails: r.jobDetails,
      jobWeight: safeEvalMath(r.jobWeight),
      qty: safeEvalMath(r.qty),
      inKg: r.inKg,
      inTon: r.inTon,
      remark: r.remark,
    }));

    StorageService.addJobWork(records);
    setJobWorkList(StorageService.getJobWork());
    alert('Job Work data saved successfully!');
    setEntryRows([
      {
        date: new Date().toISOString().split('T')[0],
        company: '',
        plant: '',
        empName: '',
        contact: '',
        jobDetails: '',
        jobWeight: 0,
        qty: 0,
        inKg: 0,
        inTon: 0,
        remark: '',
      },
    ]);
  };

  // Filtered & Sorted report (New data on top by default)
  const filtered = jobWorkList.filter((r) => {
    if (fromDate && r.date < fromDate) return false;
    if (toDate && r.date > toDate) return false;
    if (filterEmp && !r.empName.toLowerCase().includes(filterEmp.toLowerCase())) return false;
    if (filterJob && !r.jobDetails.toLowerCase().includes(filterJob.toLowerCase())) return false;
    return true;
  });

  const sortedList = [...filtered].sort((a, b) => {
    const dComp = (b.date || '').localeCompare(a.date || '');
    if (dComp !== 0) return sortOrder === 'desc' ? dComp : -dComp;
    return sortOrder === 'desc' ? (b.srNo || 0) - (a.srNo || 0) : (a.srNo || 0) - (b.srNo || 0);
  });

  const totRecords = filtered.length;
  const totQty = filtered.reduce((s, r) => s + (parseFloat(String(r.qty)) || 0), 0);
  const totKg = filtered.reduce((s, r) => s + (parseFloat(String(r.inKg)) || 0), 0);
  const totTon = filtered.reduce((s, r) => s + (parseFloat(String(r.inTon)) || 0), 0);

  const handleSaveEdit = () => {
    if (!editRecord) return;
    const wt = safeEvalMath(editRecord.jobWeight);
    const q = safeEvalMath(editRecord.qty);
    const kg = wt * q;
    const ton = kg / 1000;

    const list = [...jobWorkList];
    const idx = list.findIndex((r) => r.srNo === editRecord.srNo);
    if (idx !== -1) {
      list[idx] = {
        ...editRecord,
        jobWeight: wt,
        qty: q,
        inKg: Number(kg.toFixed(2)),
        inTon: Number(ton.toFixed(4)),
      };
      StorageService.saveJobWork(list);
      setEditRecord(null);
      alert('Job work entry updated successfully!');
    }
  };

  const handleDeleteEdit = () => {
    if (!editRecord) return;
    if (confirm('Are you sure you want to delete this job work record?')) {
      const list = jobWorkList.filter((r) => r.srNo !== editRecord.srNo);
      StorageService.saveJobWork(list);
      setEditRecord(null);
    }
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      alert('No data to export!');
      return;
    }
    const data = filtered.map((r, i) => ({
      Sr: i + 1,
      Date: r.date,
      Company: r.company,
      Plant: r.plant,
      'Employee Name': r.empName,
      Contact: r.contact,
      'Job Details': r.jobDetails,
      'Job Weight': r.jobWeight,
      Qty: r.qty,
      'In KG': r.inKg,
      'In Ton': r.inTon,
      Remark: r.remark,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'JobWorkReport');
    XLSX.writeFile(wb, `JobWork_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const downloadSampleExcel = () => {
    const sample = [
      {
        Date: '2026-10-06',
        Company: 'SUPREME INDUSTRIES LTD',
        Plant: 'Pune Unit 2',
        'Employee Name': 'Sachin Dattatray Shinde',
        'Contact Number': '9765432109',
        'Job Details': 'TCL Heavy Assembly Box',
        'Job Weight': 187.5,
        Qty: 8,
        Remark: 'OK',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'JobWorkSample');
    XLSX.writeFile(wb, 'JobWork_Sample.xlsx');
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
          const parsed = rows.map((r, idx) => {
            const wt = safeEvalMath(r['Job Weight'] || 0);
            const qty = safeEvalMath(r['Qty'] || 0);
            const kg = wt * qty;
            return {
              srNo: jobWorkList.length + 1 + idx,
              date: r['Date'] || new Date().toISOString().split('T')[0],
              company: r['Company'] || '',
              plant: r['Plant'] || '',
              empName: r['Employee Name'] || '',
              contact: r['Contact Number'] || '',
              jobDetails: r['Job Details'] || '',
              jobWeight: wt,
              qty: qty,
              inKg: Number(kg.toFixed(2)),
              inTon: Number((kg / 1000).toFixed(4)),
              remark: r['Remark'] || 'Bulk Upload',
            };
          });
          StorageService.addJobWork(parsed);
          alert(`${parsed.length} job work records imported!`);
        }
      } catch (err: any) {
        alert('File upload error: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-[#111928] border-slate-800 text-slate-100 glow-card-dark' : 'bg-white border-slate-200 text-slate-900 glow-card-light';
  const inputClass = isDark
    ? 'bg-[#0a0f1d] border-slate-700 text-white focus:border-[#FF8500]'
    : 'bg-white border-slate-300 text-slate-900 focus:border-[#FF8500]';
  const labelClass = isDark ? 'text-slate-300 font-semibold' : 'text-slate-700 font-bold';

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-[#FF8500] flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          <span>Job Work & Production Weight Tracker</span>
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadSampleExcel}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
              isDark ? 'border-slate-700 bg-slate-800 text-white hover:bg-slate-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span>Sample Excel</span>
          </button>
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-600/40 bg-emerald-900/30 text-xs font-semibold text-emerald-400 cursor-pointer hover:bg-emerald-900/50">
            <Upload className="w-3.5 h-3.5" />
            <span>Bulk Upload</span>
            <input type="file" accept=".xlsx, .xls" onChange={handleBulkUpload} className="hidden" />
          </label>
          <button
            onClick={handleExport}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards - Compact Uniform Box Sizes & Typography */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className={`p-2.5 px-3.5 rounded-xl border flex flex-col justify-between h-16 border-blue-500/30 transition-all ${cardBg}`}>
          <span className="text-slate-400 block font-semibold text-[11px] truncate uppercase tracking-wider">Total Job Records</span>
          <span className={`text-sm font-bold font-mono tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{totRecords} Records</span>
        </div>
        <div className={`p-2.5 px-3.5 rounded-xl border flex flex-col justify-between h-16 border-amber-500/30 transition-all ${cardBg}`}>
          <span className="text-slate-400 block font-semibold text-[11px] truncate uppercase tracking-wider">Total Quantity (Qty)</span>
          <span className="text-sm font-bold text-[#FF8500] font-mono tracking-tight truncate">{totQty.toLocaleString('en-IN')}</span>
        </div>
        <div className={`p-2.5 px-3.5 rounded-xl border flex flex-col justify-between h-16 border-emerald-500/30 transition-all ${cardBg}`}>
          <span className="text-slate-400 block font-semibold text-[11px] truncate uppercase tracking-wider">Total Weight (In KG)</span>
          <span className="text-sm font-bold text-emerald-500 font-mono tracking-tight truncate">
            {totKg.toLocaleString('en-IN', { minimumFractionDigits: 2 })} KG
          </span>
        </div>
        <div className={`p-2.5 px-3.5 rounded-xl border flex flex-col justify-between h-16 border-sky-500/30 transition-all ${cardBg}`}>
          <span className="text-slate-400 block font-semibold text-[11px] truncate uppercase tracking-wider">Total Weight (In Ton)</span>
          <span className="text-sm font-bold text-sky-500 font-mono tracking-tight truncate">
            {totTon.toLocaleString('en-IN', { minimumFractionDigits: 4 })} Ton
          </span>
        </div>
      </div>

      {/* Daily Job Work Data Entry Card */}
      <div className={`p-5 rounded-2xl border shadow-sm ${cardBg}`}>
        {/* Controls DIRECTLY ABOVE the Table Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-700/30">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-[#FF8500] flex items-center gap-2">
              <Wrench className="w-4 h-4" /> Daily Job Work Data Entry
            </h4>
          </div>

          {/* 3D Animated Buttons Right Above Table Header */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={addRow}
              className="btn-3d-orange px-4 py-2 text-xs"
              title="Add new row to table"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Row</span>
            </button>
            <button
              onClick={handleSaveJobWork}
              className="btn-3d-emerald px-4 py-2 text-xs"
              title="Save all entries to database"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Save Job Work</span>
            </button>
            <button
              onClick={() =>
                setEntryRows([
                  {
                    date: new Date().toISOString().split('T')[0],
                    company: '',
                    plant: '',
                    empName: '',
                    contact: '',
                    jobDetails: '',
                    jobWeight: 0,
                    qty: 0,
                    inKg: 0,
                    inTon: 0,
                    remark: '',
                  },
                ])
              }
              className="btn-3d-rose px-3 py-2 text-xs"
              title="Clear form inputs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        <div className={`overflow-x-auto rounded-xl border mb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <table className="w-full min-w-[1300px] text-xs text-left">
            <thead className="bg-[#1A365D] text-white font-bold uppercase text-[11px]">
              <tr>
                <th className="p-2.5 text-center w-10">Sr</th>
                <th className="p-2.5 w-28">Date</th>
                <th className="p-2.5 w-44">Company</th>
                <th className="p-2.5 w-36">Plant</th>
                <th className="p-2.5 w-44">Employee Name</th>
                <th className="p-2.5 w-28">Contact</th>
                <th className="p-2.5 w-48">Job Details</th>
                <th className="p-2.5 text-center w-24">Unit Wt (KG)</th>
                <th className="p-2.5 text-center w-20">Qty</th>
                <th className="p-2.5 text-right w-24">In KG</th>
                <th className="p-2.5 text-right w-24">In Ton</th>
                <th className="p-2.5">Remark</th>
                <th className="p-2.5 text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody className={isDark ? 'divide-y divide-slate-800 bg-[#0a0f1d]/60 text-slate-100' : 'divide-y divide-slate-200 bg-white text-slate-900'}>
              {entryRows.map((row, idx) => (
                <tr key={idx} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-amber-50/50'}>
                  <td className={`p-2 text-center font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{idx + 1}</td>
                  <td className="p-2">
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateRow(idx, 'date', e.target.value)}
                      className={`w-full p-1 border rounded ${inputClass}`}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      list="jw_comp_list"
                      value={row.company}
                      onChange={(e) => updateRow(idx, 'company', e.target.value)}
                      placeholder="Company"
                      className={`w-full p-1 border rounded ${inputClass}`}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      list="jw_plant_list"
                      value={row.plant}
                      onChange={(e) => updateRow(idx, 'plant', e.target.value)}
                      placeholder="Plant"
                      className={`w-full p-1 border rounded ${inputClass}`}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      list="jw_emp_list"
                      value={row.empName}
                      onChange={(e) => updateRow(idx, 'empName', e.target.value)}
                      placeholder="Employee Name"
                      className={`w-full p-1 border rounded capitalize font-bold ${inputClass}`}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.contact}
                      onChange={(e) => updateRow(idx, 'contact', e.target.value)}
                      placeholder="Mobile"
                      className={`w-full p-1 border rounded ${inputClass}`}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      list="jw_jobs_list"
                      value={row.jobDetails}
                      onChange={(e) => updateRow(idx, 'jobDetails', e.target.value)}
                      placeholder="Select Job"
                      className={`w-full p-1 border rounded font-bold ${inputClass}`}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.jobWeight}
                      onChange={(e) => updateRow(idx, 'jobWeight', e.target.value)}
                      onBlur={() => {
                        const calculated = safeEvalMath(row.jobWeight);
                        if (calculated > 0 || row.jobWeight === '0') {
                          updateRow(idx, 'jobWeight', calculated);
                        }
                      }}
                      placeholder="e.g. 1.25 or 2.5/2"
                      title="Supports math calculations e.g. 10+10, 20*1.5"
                      className={`w-full p-1 border rounded text-amber-500 text-center font-bold ${inputClass}`}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.qty}
                      onChange={(e) => updateRow(idx, 'qty', e.target.value)}
                      onBlur={() => {
                        const calculated = safeEvalMath(row.qty);
                        if (calculated > 0 || row.qty === '0') {
                          updateRow(idx, 'qty', calculated);
                        }
                      }}
                      placeholder="e.g. 100 or 10+20"
                      title="Supports math calculations e.g. 10+10, 5*20"
                      className={`w-full p-1 border rounded text-sky-500 text-center font-bold ${inputClass}`}
                    />
                  </td>
                  <td className="p-2 text-right font-bold text-emerald-500 tabular-nums">{row.inKg}</td>
                  <td className="p-2 text-right font-bold text-blue-500 tabular-nums">{row.inTon}</td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.remark}
                      onChange={(e) => updateRow(idx, 'remark', e.target.value)}
                      className={`w-full p-1 border rounded ${inputClass}`}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => removeRow(idx)}
                      className="p-1 rounded text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end">
          <button
            onClick={handleSaveJobWork}
            className="btn-3d-emerald px-6 py-2.5 text-xs font-black shadow-md cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>SAVE JOB WORK DATA</span>
          </button>
        </div>
      </div>

      {/* Saved Report Card */}
      <div className={`p-5 rounded-2xl border shadow-sm ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h4 className="font-bold text-sm text-[#FF8500] flex items-center gap-2">
            <span>Saved Job Work History</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 font-mono">
              {filtered.length} Records
            </span>
          </h4>

          {/* Ascending / Descending Toggle (New Data on Top) */}
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="btn-3d-secondary px-3 py-1.5 text-xs"
            title="Toggle Ascending / Descending sort order"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#FF8500]" />
            <span>{sortOrder === 'desc' ? '↓ New Data On Top (Latest)' : '↑ Old Data First (Ascending)'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs mb-4 items-end">
          <div>
            <label className={`block mb-1 ${labelClass}`}>From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className={`w-full p-2 border rounded-lg ${inputClass}`}
            />
          </div>
          <div>
            <label className={`block mb-1 ${labelClass}`}>To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className={`w-full p-2 border rounded-lg ${inputClass}`}
            />
          </div>
          <div>
            <label className={`block mb-1 ${labelClass}`}>Filter by Employee</label>
            <input
              type="text"
              value={filterEmp}
              onChange={(e) => setFilterEmp(e.target.value)}
              placeholder="Search employee"
              className={`w-full p-2 border rounded-lg ${inputClass}`}
            />
          </div>
          <div>
            <label className={`block mb-1 ${labelClass}`}>Filter by Job</label>
            <input
              type="text"
              value={filterJob}
              onChange={(e) => setFilterJob(e.target.value)}
              placeholder="Search job"
              className={`w-full p-2 border rounded-lg ${inputClass}`}
            />
          </div>
          <div>
            <button
              onClick={() => {
                setFromDate('');
                setToDate('');
                setFilterEmp('');
                setFilterJob('');
              }}
              className="btn-3d-secondary w-full py-2 text-xs"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <table className="w-full min-w-[1300px] text-xs text-left">
            <thead className="bg-[#1A365D] text-white font-bold uppercase text-[11px]">
              <tr>
                <th className="p-2.5 text-center w-12">Sr</th>
                <th className="py-1.5 px-2 w-20">Date</th>
                <th className="py-1.5 px-2 w-36">Company</th>
                <th className="py-1.5 px-2 w-28">Plant</th>
                <th className="py-1.5 px-2 w-36">Employee Name</th>
                <th className="py-1.5 px-2 w-24">Contact</th>
                <th className="py-1.5 px-2 w-40">Job Details</th>
                <th className="py-1.5 px-2 text-center w-20">Unit Wt</th>
                <th className="py-1.5 px-2 text-center w-16">Qty</th>
                <th className="py-1.5 px-2 text-right w-24">In KG</th>
                <th className="py-1.5 px-2 text-right w-24">In Ton</th>
                <th className="py-1.5 px-2">Remark</th>
                <th className="py-1.5 px-2 text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody className={isDark ? 'divide-y divide-slate-800 bg-[#0a0f1d]/60 text-slate-100' : 'divide-y divide-slate-200 bg-white text-slate-900'}>
              {sortedList.length === 0 ? (
                <tr>
                  <td colSpan={13} className={`py-6 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    No job work records found.
                  </td>
                </tr>
              ) : (
                sortedList.map((r, i) => (
                  <tr key={i} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-amber-50/50'}>
                    <td className={`py-1 px-2 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{i + 1}</td>
                    <td className="py-1 px-2 tabular-nums">{formatDateCustom(r.date)}</td>
                    <td className="py-1 px-2 font-medium">{r.company}</td>
                    <td className={`py-1 px-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{r.plant}</td>
                    <td className={`py-1 px-2 font-bold capitalize ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.empName}</td>
                    <td className="py-1 px-2 tabular-nums">{r.contact}</td>
                    <td className="py-1 px-2 font-semibold text-[#FF8500]">{r.jobDetails}</td>
                    <td className="py-1 px-2 text-center font-bold text-amber-500 tabular-nums">{r.jobWeight}</td>
                    <td className="py-1 px-2 text-center font-bold text-sky-500 tabular-nums">{r.qty}</td>
                    <td className="py-1 px-2 text-right font-bold text-emerald-500 tabular-nums">
                      {parseFloat(String(r.inKg || 0)).toFixed(2)}
                    </td>
                    <td className="py-1 px-2 text-right font-bold text-blue-500 tabular-nums">
                      {parseFloat(String(r.inTon || 0)).toFixed(4)}
                    </td>
                    <td className={`py-1 px-2 truncate max-w-[150px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{r.remark}</td>
                    <td className="py-1 px-2 text-center">
                      <button
                        onClick={() => setEditRecord({ ...r })}
                        className="p-1 rounded text-amber-500 hover:bg-amber-500/10 cursor-pointer"
                        title="Edit Record"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Job Work Modal */}
      {editRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className={`w-full max-w-lg border rounded-2xl p-6 shadow-2xl text-xs transition-all ${cardBg}`}>
            <h4 className="font-bold text-sm text-[#FF8500] mb-3">Edit Job Work Record</h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className={`block mb-1 ${labelClass}`}>Date</label>
                <input
                  type="date"
                  value={editRecord.date}
                  onChange={(e) => setEditRecord({ ...editRecord, date: e.target.value })}
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Company</label>
                <input
                  type="text"
                  value={editRecord.company}
                  onChange={(e) => setEditRecord({ ...editRecord, company: e.target.value })}
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Employee Name</label>
                <input
                  type="text"
                  value={editRecord.empName}
                  onChange={(e) => setEditRecord({ ...editRecord, empName: e.target.value })}
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Contact</label>
                <input
                  type="text"
                  value={editRecord.contact}
                  onChange={(e) => setEditRecord({ ...editRecord, contact: e.target.value })}
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                />
              </div>
              <div className="col-span-2">
                <label className={`block mb-1 ${labelClass}`}>Job Details</label>
                <input
                  type="text"
                  value={editRecord.jobDetails}
                  onChange={(e) => setEditRecord({ ...editRecord, jobDetails: e.target.value })}
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Job Weight (KG)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editRecord.jobWeight}
                  onChange={(e) => setEditRecord({ ...editRecord, jobWeight: parseFloat(e.target.value) || 0 })}
                  className={`w-full p-2 border rounded-lg text-amber-500 font-bold ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Quantity (Qty)</label>
                <input
                  type="number"
                  value={editRecord.qty}
                  onChange={(e) => setEditRecord({ ...editRecord, qty: parseFloat(e.target.value) || 0 })}
                  className={`w-full p-2 border rounded-lg text-sky-500 font-bold ${inputClass}`}
                />
              </div>
              <div className="col-span-2">
                <label className={`block mb-1 ${labelClass}`}>Remark</label>
                <input
                  type="text"
                  value={editRecord.remark}
                  onChange={(e) => setEditRecord({ ...editRecord, remark: e.target.value })}
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={handleDeleteEdit}
                className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold cursor-pointer"
              >
                Delete
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditRecord(null)}
                  className={`px-4 py-2 rounded-lg font-semibold cursor-pointer ${
                    isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Datalists */}
      <datalist id="jw_comp_list">
        {companies.map((c, i) => (
          <option key={i} value={c.companyName} />
        ))}
      </datalist>
      <datalist id="jw_plant_list">
        {companies.map((c, i) => (
          <option key={i} value={c.plant} />
        ))}
      </datalist>
      <datalist id="jw_emp_list">
        {employees.map((e, i) => (
          <option key={i} value={e.fullName} />
        ))}
      </datalist>
      <datalist id="jw_jobs_list">
        {jobMasters.map((j, i) => (
          <option key={i} value={j.jobName} />
        ))}
      </datalist>
    </div>
  );
};
