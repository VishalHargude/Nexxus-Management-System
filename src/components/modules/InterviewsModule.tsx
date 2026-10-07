import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Plus,
  Save,
  Pencil,
  Trash2,
  Check,
  X,
  Phone,
  PhoneCall,
  Download,
  Upload,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { InterviewCandidate } from '../../types';
import { StorageService } from '../../utils/storage';
import { toTitleCase, formatToDDMMYYYY } from '../../utils/formatters';

interface Props {
  theme: 'dark' | 'light';
  totalActiveEmployees: number;
}

export const InterviewsModule: React.FC<Props> = ({ theme, totalActiveEmployees }) => {
  const [interviews, setInterviews] = useState<InterviewCandidate[]>([]);

  // Inline Add Rows State
  const [inlineRows, setInlineRows] = useState<any[]>([
    {
      name: '',
      mobile: '',
      position: 'Helper',
      address: 'Pune',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      status: 'Scheduled',
      joinDate: '',
      remark: 'Walk-in candidate',
    },
  ]);

  // Filters
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  // Editing Row State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editObj, setEditObj] = useState<InterviewCandidate | null>(null);

  useEffect(() => {
    const load = () => setInterviews(StorageService.getInterviews());
    load();
    window.addEventListener('nexxus_storage_updated', load);
    return () => window.removeEventListener('nexxus_storage_updated', load);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Metric counts
  const todayCount = interviews.filter((i) => i.date === todayStr).length;
  const upcomingCount = interviews.filter((i) => i.date > todayStr).length;
  const pendingCount = interviews.filter(
    (i) => (i.status === 'Scheduled' || i.status === 'Rescheduled') && i.date < todayStr
  ).length;
  const joinedCount = interviews.filter((i) => {
    if (i.status === 'Joined' && i.joinDate) {
      const d = new Date(i.joinDate);
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    }
    return false;
  }).length;

  const addInlineRow = () => {
    setInlineRows([
      ...inlineRows,
      {
        name: '',
        mobile: '',
        position: 'Helper',
        address: 'Pune',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        status: 'Scheduled',
        joinDate: '',
        remark: '',
      },
    ]);
  };

  const removeInlineRow = (idx: number) => {
    if (inlineRows.length === 1) return;
    setInlineRows(inlineRows.filter((_, i) => i !== idx));
  };

  const updateInlineRow = (idx: number, field: string, val: string) => {
    const updated = [...inlineRows];
    updated[idx][field] = val;
    setInlineRows(updated);
  };

  const handleSaveCandidates = () => {
    const valid = inlineRows.filter((r) => r.name.trim() !== '' && r.mobile.length === 10);
    if (valid.length === 0) {
      alert('Please enter valid Name and 10-digit Mobile for at least one candidate!');
      return;
    }

    const records: InterviewCandidate[] = valid.map((r, i) => ({
      id: 'INT-' + Date.now() + '-' + i,
      name: toTitleCase(r.name),
      mobile: r.mobile,
      position: toTitleCase(r.position),
      address: toTitleCase(r.address),
      date: r.date,
      time: r.time,
      status: r.status,
      joinDate: r.joinDate,
      remark: toTitleCase(r.remark),
    }));

    StorageService.addInterviews(records);
    alert(`${records.length} candidates added successfully!`);
    setInlineRows([
      {
        name: '',
        mobile: '',
        position: '',
        address: '',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        status: 'Scheduled',
        joinDate: '',
        remark: '',
      },
    ]);
  };

  const filtered = interviews.filter((r) => {
    if (filterFromDate && r.date < filterFromDate) return false;
    if (filterToDate && r.date > filterToDate) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      if (!r.name.toLowerCase().includes(q) && !r.mobile.includes(q)) return false;
    }
    return true;
  });

  const startEdit = (cand: InterviewCandidate) => {
    setEditingId(cand.id);
    setEditObj({ ...cand });
  };

  const saveEdit = () => {
    if (!editObj) return;
    const list = interviews.map((c) => (c.id === editObj.id ? editObj : c));
    StorageService.saveInterviews(list);
    setEditingId(null);
    setEditObj(null);
  };

  const deleteCandidate = (id: string) => {
    if (confirm('Delete this candidate record?')) {
      StorageService.deleteInterview(id);
    }
  };

  const downloadSampleExcel = () => {
    const sample = [
      {
        'Candidate Name': 'Sachin Ramesh Patil',
        Mobile: '9876543210',
        Position: 'Helper',
        Address: 'Pune',
        'Interview Date': '2026-10-10',
        Time: '10:00',
        Status: 'Scheduled',
        'Join Date': '2026-10-15',
        Remark: 'Walk-in candidate',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SampleCandidates');
    XLSX.writeFile(wb, 'Interview_Candidates_Sample.xlsx');
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
        if (rows.length > 0) {
          const parsed: InterviewCandidate[] = rows.map((r, i) => ({
            id: 'c_' + Date.now() + '_' + i,
            name: r['Candidate Name'] || r['Name'] || '',
            mobile: String(r['Mobile'] || '').replace(/\D/g, ''),
            position: r['Position'] || 'Helper',
            address: r['Address'] || 'Pune',
            date: r['Interview Date'] || r['Date'] || new Date().toISOString().split('T')[0],
            time: r['Time'] || '10:00',
            status: r['Status'] || 'Scheduled',
            joinDate: r['Join Date'] || '',
            remark: r['Remark'] || 'Bulk Upload',
          }));
          const existing = StorageService.getInterviews();
          StorageService.saveInterviews([...existing, ...parsed]);
          setInterviews(StorageService.getInterviews());
          alert(`${parsed.length} candidate records imported successfully!`);
        }
      } catch (err: any) {
        alert('File upload error: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      alert('No interview data to export!');
      return;
    }
    const data = filtered.map((r, i) => ({
      'Sr No': i + 1,
      Date: r.date,
      Time: r.time,
      'Candidate Name': r.name,
      Position: r.position,
      Address: r.address,
      Mobile: r.mobile,
      Status: r.status,
      'Join Date': r.joinDate || '-',
      Remark: r.remark || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Interviews');
    XLSX.writeFile(wb, `Interviews_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Top Header with Sample Excel, Bulk Upload, and Export Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-[#FF8500] flex items-center gap-2">
          <CalendarCheck className="w-5 h-5" />
          <span>Interviews & Recruitment Planning</span>
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={downloadSampleExcel}
            className="btn-3d-secondary px-3 py-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span>Sample Excel</span>
          </button>
          <label className="btn-3d-emerald px-3 py-1.5 text-xs cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Bulk Upload</span>
            <input type="file" accept=".xlsx, .xls" onChange={handleBulkUpload} className="hidden" />
          </label>
          <button
            onClick={handleExport}
            className="btn-3d-secondary px-3 py-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Cards - Compact Uniform Sizing & Typography */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
        <div
          className={`p-2.5 px-3.5 rounded-xl border flex flex-col justify-between h-16 border-emerald-500/40 transition-all ${
            theme === 'dark' ? 'bg-[#111928]' : 'bg-white shadow-2xs'
          }`}
        >
          <span className="text-slate-400 block font-semibold text-[11px] truncate uppercase tracking-wider">Total Active Employees</span>
          <span className="text-sm font-bold text-emerald-500 font-mono tracking-tight truncate">{totalActiveEmployees} Staff</span>
        </div>
        <div
          className={`p-2.5 px-3.5 rounded-xl border flex flex-col justify-between h-16 border-amber-500/40 transition-all ${
            theme === 'dark' ? 'bg-[#111928]' : 'bg-white shadow-2xs'
          }`}
        >
          <span className="text-slate-400 block font-semibold text-[11px] truncate uppercase tracking-wider">Today's Interviews</span>
          <span className="text-sm font-bold text-amber-500 font-mono tracking-tight truncate">{todayCount}</span>
        </div>
        <div
          className={`p-2.5 px-3.5 rounded-xl border flex flex-col justify-between h-16 border-sky-500/40 transition-all ${
            theme === 'dark' ? 'bg-[#111928]' : 'bg-white shadow-2xs'
          }`}
        >
          <span className="text-slate-400 block font-semibold text-[11px] truncate uppercase tracking-wider">Joined This Month</span>
          <span className="text-sm font-bold text-sky-500 font-mono tracking-tight truncate">{joinedCount}</span>
        </div>
        <div
          className={`p-2.5 px-3.5 rounded-xl border flex flex-col justify-between h-16 border-rose-500/40 transition-all ${
            theme === 'dark' ? 'bg-[#111928]' : 'bg-white shadow-2xs'
          }`}
        >
          <span className="text-slate-400 block font-semibold text-[11px] truncate uppercase tracking-wider">Pending Follow-ups</span>
          <span className="text-sm font-bold text-rose-500 font-mono tracking-tight truncate">{pendingCount}</span>
        </div>
        <div
          className={`p-2.5 px-3.5 rounded-xl border flex flex-col justify-between h-16 border-purple-500/40 transition-all ${
            theme === 'dark' ? 'bg-[#111928]' : 'bg-white shadow-2xs'
          }`}
        >
          <span className="text-slate-400 block font-semibold text-[11px] truncate uppercase tracking-wider">Upcoming Interviews</span>
          <span className="text-sm font-bold text-purple-500 font-mono tracking-tight truncate">{upcomingCount}</span>
        </div>
      </div>

      {/* Inline Quick Add Candidates Card */}
      <div
        className={`p-5 rounded-xl border shadow-sm ${
          theme === 'dark' ? 'bg-[#1e1e1e] border-neutral-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm text-[#FF8500] flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Quick Add Candidates
          </h4>
          <button
            onClick={addInlineRow}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#FF8500]" />
            <span>+ Add Row</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-800 mb-3">
          <table className="w-full min-w-[1100px] text-xs text-left">
            <thead className="bg-[#1A365D] text-white font-bold uppercase text-[11px]">
              <tr>
                <th className="p-2 w-44">Name *</th>
                <th className="p-2 w-32">Mobile *</th>
                <th className="p-2 w-32">Position</th>
                <th className="p-2 w-36">Address</th>
                <th className="p-2 w-28">Date</th>
                <th className="p-2 w-24">Time</th>
                <th className="p-2 w-32">Status</th>
                <th className="p-2 w-28">Join Date</th>
                <th className="p-2">Remark</th>
                <th className="p-2 text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 bg-neutral-900/40">
              {inlineRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-neutral-800/40">
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateInlineRow(idx, 'name', e.target.value)}
                      placeholder="Candidate Name"
                      className="w-full p-1 bg-neutral-800 border border-neutral-700 rounded text-white capitalize font-bold"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      maxLength={10}
                      value={row.mobile}
                      onChange={(e) => updateInlineRow(idx, 'mobile', e.target.value.replace(/\D/g, ''))}
                      placeholder="10 Digits"
                      className="w-full p-1 bg-neutral-800 border border-neutral-700 rounded text-white font-mono"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.position}
                      onChange={(e) => updateInlineRow(idx, 'position', e.target.value)}
                      placeholder="Position"
                      className="w-full p-1 bg-neutral-800 border border-neutral-700 rounded text-white"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.address}
                      onChange={(e) => updateInlineRow(idx, 'address', e.target.value)}
                      placeholder="Address"
                      className="w-full p-1 bg-neutral-800 border border-neutral-700 rounded text-white"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateInlineRow(idx, 'date', e.target.value)}
                      className="w-full p-1 bg-neutral-800 border border-neutral-700 rounded text-white text-center font-mono"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="time"
                      value={row.time}
                      onChange={(e) => updateInlineRow(idx, 'time', e.target.value)}
                      className="w-full p-1 bg-neutral-800 border border-neutral-700 rounded text-white text-center font-mono"
                    />
                  </td>
                  <td className="p-1.5">
                    <select
                      value={row.status}
                      onChange={(e) => updateInlineRow(idx, 'status', e.target.value)}
                      className="w-full p-1 bg-neutral-800 border border-neutral-700 rounded text-white"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Selected">Selected</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Not Present">Not Present</option>
                      <option value="Rescheduled">Rescheduled</option>
                      <option value="Joined">Joined</option>
                    </select>
                  </td>
                  <td className="p-1.5">
                    <input
                      type="date"
                      value={row.joinDate}
                      onChange={(e) => updateInlineRow(idx, 'joinDate', e.target.value)}
                      className="w-full p-1 bg-neutral-800 border border-neutral-700 rounded text-white text-center font-mono"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.remark}
                      onChange={(e) => updateInlineRow(idx, 'remark', e.target.value)}
                      placeholder="Remark"
                      className="w-full p-1 bg-neutral-800 border border-neutral-700 rounded text-white"
                    />
                  </td>
                  <td className="p-1.5 text-center">
                    <button
                      onClick={() => removeInlineRow(idx)}
                      className="p-1 rounded text-rose-400 hover:bg-neutral-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={handleSaveCandidates}
          className="w-full py-2.5 bg-[#FF8500] hover:bg-[#e07500] text-black font-extrabold text-sm rounded-xl shadow-lg cursor-pointer"
        >
          SAVE CANDIDATES
        </button>
      </div>

      {/* Filter Bar */}
      <div
        className={`p-3.5 rounded-xl border ${
          theme === 'dark' ? 'bg-[#1e1e1e] border-neutral-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div>
            <label className="block text-neutral-400 font-bold mb-1">From Date</label>
            <input
              type="date"
              value={filterFromDate}
              onChange={(e) => setFilterFromDate(e.target.value)}
              className="w-full p-1.5 bg-neutral-900 border border-neutral-700 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-neutral-400 font-bold mb-1">To Date</label>
            <input
              type="date"
              value={filterToDate}
              onChange={(e) => setFilterToDate(e.target.value)}
              className="w-full p-1.5 bg-neutral-900 border border-neutral-700 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-neutral-400 font-bold mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-1.5 bg-neutral-900 border border-neutral-700 rounded text-white"
            >
              <option value="">All Status</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Selected">Selected</option>
              <option value="Rejected">Rejected</option>
              <option value="Not Present">Not Present</option>
              <option value="Rescheduled">Rescheduled</option>
              <option value="Joined">Joined</option>
            </select>
          </div>
          <div>
            <label className="block text-neutral-400 font-bold mb-1">Search (Name / Mobile)</label>
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Candidate search"
              className="w-full p-1.5 bg-neutral-900 border border-neutral-700 rounded text-white"
            />
          </div>
        </div>
      </div>

      {/* Candidate List Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full min-w-[1200px] text-xs text-left">
          <thead className="bg-[#1A365D] text-white font-bold uppercase text-[10px]">
            <tr>
              <th className="py-1.5 px-2 text-center w-10">Sr</th>
              <th className="py-1.5 px-2 w-20">Date</th>
              <th className="py-1.5 px-2 w-16">Time</th>
              <th className="py-1.5 px-2 w-40">Candidate Name</th>
              <th className="py-1.5 px-2 w-28">Position</th>
              <th className="py-1.5 px-2 w-32">Address</th>
              <th className="py-1.5 px-2 w-28">Mobile No</th>
              <th className="py-1.5 px-2 text-center w-24">Status</th>
              <th className="py-1.5 px-2 w-20">Join Date</th>
              <th className="py-1.5 px-2">Remark</th>
              <th className="py-1.5 px-2 text-center w-16">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800 bg-neutral-900/40">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-6 text-center text-neutral-400">
                  No interview records match.
                </td>
              </tr>
            ) : (
              filtered.map((r, idx) => {
                const isEditing = editingId === r.id;
                return (
                  <tr key={r.id} className="hover:bg-neutral-800/40">
                    <td className="py-1 px-2 text-center text-neutral-400">{idx + 1}</td>
                    <td className="py-1 px-2 font-mono">{formatToDDMMYYYY(r.date)}</td>
                    <td className="py-1 px-2 font-mono font-semibold">{r.time}</td>
                    <td className="py-1 px-2 font-bold text-white capitalize">{r.name}</td>
                    <td className="py-1 px-2 text-neutral-300">{r.position}</td>
                    <td className="py-1 px-2 text-neutral-400">{r.address}</td>
                    <td className="py-1 px-2 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-400 font-bold">{r.mobile}</span>
                        <a
                          href={`tel:${r.mobile}`}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-400 text-[10px] font-bold border border-emerald-500/40 transition-colors shadow-2xs"
                          title={`Call Candidate ${r.name} at ${r.mobile}`}
                        >
                          <PhoneCall className="w-3 h-3 text-emerald-400" />
                          <span>Call</span>
                        </a>
                      </div>
                    </td>
                    <td className="py-1 px-2 text-center">
                      {isEditing && editObj ? (
                        <select
                          value={editObj.status}
                          onChange={(e) => setEditObj({ ...editObj, status: e.target.value as any })}
                          className="p-1 bg-neutral-800 border border-neutral-700 rounded text-xs text-white"
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="Completed">Completed</option>
                          <option value="Selected">Selected</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Not Present">Not Present</option>
                          <option value="Rescheduled">Rescheduled</option>
                          <option value="Joined">Joined</option>
                        </select>
                      ) : (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === 'Selected' || r.status === 'Joined'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : r.status === 'Rejected'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {r.status}
                        </span>
                      )}
                    </td>
                    <td className="py-1 px-2 font-mono text-[11px]">{r.joinDate ? formatToDDMMYYYY(r.joinDate) : '-'}</td>
                    <td className="py-1 px-2 text-neutral-300">{r.remark || '-'}</td>
                    <td className="py-1 px-2 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={saveEdit} className="p-1 text-emerald-400 hover:bg-neutral-800 rounded">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-neutral-400 hover:bg-neutral-800 rounded">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => startEdit(r)}
                            className="p-1 text-amber-400 hover:bg-neutral-800 rounded"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteCandidate(r.id)}
                            className="p-1 text-rose-400 hover:bg-neutral-800 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
