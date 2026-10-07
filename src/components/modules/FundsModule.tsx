import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Landmark,
  Plus,
  Trash2,
  Pencil,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  ArrowUpDown,
} from 'lucide-react';
import { FundTransaction, InvestmentBalance } from '../../types';
import { StorageService } from '../../utils/storage';
import { formatCurrencyINR, safeEvalMath, formatDateCustom } from '../../utils/formatters';

interface Props {
  theme: 'dark' | 'light';
}

export const FundsModule: React.FC<Props> = ({ theme }) => {
  const [funds, setFunds] = useState<FundTransaction[]>([]);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Daily Entry state
  const [entryRows, setEntryRows] = useState<any[]>([
    {
      date: new Date().toISOString().split('T')[0],
      from: 'NEXXUS',
      to: 'Vishal',
      amount: '',
      purpose: 'Fund Transfer',
      remark: 'Operations advance',
    },
  ]);

  // Filters
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  // Editing modal
  const [editTx, setEditTx] = useState<FundTransaction | null>(null);

  useEffect(() => {
    const load = () => setFunds(StorageService.getFunds());
    load();
    window.addEventListener('nexxus_storage_updated', load);
    return () => window.removeEventListener('nexxus_storage_updated', load);
  }, []);

  // Compute Balances
  let firmBalance = 0;
  const personBalances: Record<string, number> = {};

  funds.forEach((t) => {
    const fromIsFirm = t.from.toUpperCase() === 'NEXXUS' || t.from.toUpperCase() === 'FIRM';
    const toIsFirm = t.to.toUpperCase() === 'NEXXUS' || t.to.toUpperCase() === 'FIRM';
    const amt = parseFloat(String(t.amount || 0));

    if (fromIsFirm) firmBalance -= amt;
    if (toIsFirm) firmBalance += amt;

    if (!fromIsFirm) {
      personBalances[t.from] = (personBalances[t.from] || 0) + amt;
    }
    if (!toIsFirm) {
      personBalances[t.to] = (personBalances[t.to] || 0) - amt;
    }
  });

  const balancesList: InvestmentBalance[] = [
    { name: 'NEXXUS', current: firmBalance },
    ...Object.keys(personBalances).map((name) => ({
      name,
      current: personBalances[name],
    })),
  ];

  const addRow = () => {
    setEntryRows([
      ...entryRows,
      {
        date: new Date().toISOString().split('T')[0],
        from: 'NEXXUS',
        to: '',
        amount: '',
        purpose: 'Fund Transfer',
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
    setEntryRows(updated);
  };

  const handleSaveEntries = () => {
    const valid = entryRows.filter((r) => r.from.trim() && r.to.trim() && safeEvalMath(r.amount) > 0);
    if (valid.length === 0) {
      alert('Please fill From, To, and Amount > 0 for at least one transaction!');
      return;
    }

    const newTxns: FundTransaction[] = valid.map((r, i) => ({
      txId: 'TXN-' + Date.now() + '-' + i,
      date: r.date,
      rawDate: r.date,
      from: r.from.trim(),
      to: r.to.trim(),
      amount: safeEvalMath(r.amount),
      purpose: r.purpose || 'Fund Transfer',
      fundId: 'FUND-' + Math.floor(100 + Math.random() * 900),
      remark: r.remark || '',
    }));

    const existing = [...funds];
    newTxns.forEach((tx) => existing.unshift(tx));
    StorageService.saveFunds(existing);
    setFunds(StorageService.getFunds());
    alert(`${newTxns.length} fund transactions recorded!`);
    setEntryRows([
      {
        date: new Date().toISOString().split('T')[0],
        from: 'NEXXUS',
        to: '',
        amount: '',
        purpose: 'Fund Transfer',
        remark: '',
      },
    ]);
  };

  const filtered = funds.filter((t) => {
    if (filterFromDate && t.date < filterFromDate) return false;
    if (filterToDate && t.date > filterToDate) return false;
    if (filterFrom && !t.from.toLowerCase().includes(filterFrom.toLowerCase())) return false;
    if (filterTo && !t.to.toLowerCase().includes(filterTo.toLowerCase())) return false;
    return true;
  });

  const visibleTotalAmt = filtered.reduce((s, t) => s + (parseFloat(String(t.amount)) || 0), 0);

  const handleSaveEdit = () => {
    if (!editTx) return;
    const list = funds.map((t) => (t.txId === editTx.txId ? editTx : t));
    StorageService.saveFunds(list);
    setFunds(StorageService.getFunds());
    setEditTx(null);
  };

  const handleDeleteTx = (txId: string) => {
    if (confirm('Delete this transaction? Balances will recalculate automatically.')) {
      StorageService.deleteFundTransaction(txId);
      setFunds(StorageService.getFunds());
    }
  };

  const sortedFunds = [...filtered].sort((a, b) => {
    const dComp = (b.date || '').localeCompare(a.date || '');
    if (dComp !== 0) return sortOrder === 'desc' ? dComp : -dComp;
    const aId = String(a.txId || a.fundId || '');
    const bId = String(b.txId || b.fundId || '');
    return sortOrder === 'desc' ? bId.localeCompare(aId) : aId.localeCompare(bId);
  });

  const handleExport = (type: 'excel' | 'csv' | 'pdf') => {
    if (sortedFunds.length === 0) {
      alert('No data to export!');
      return;
    }
    const data = sortedFunds.map((r, i) => ({
      'Sr. No.': i + 1,
      Date: formatDateCustom(r.date),
      From: r.from,
      To: r.to,
      Amount: r.amount,
      Purpose: r.purpose,
      'Fund ID': r.fundId,
      Remark: r.remark,
    }));

    if (type === 'excel' || type === 'csv') {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'FundsLedger');
      XLSX.writeFile(wb, `Funds_Ledger_${new Date().toISOString().slice(0, 10)}.${type === 'csv' ? 'csv' : 'xlsx'}`);
    } else {
      const doc = new jsPDF('l', 'mm', 'a4');
      doc.setFont('helvetica', 'bold');
      doc.text('Funds Ledger Report', 14, 15);
      autoTable(doc, {
        head: [['Sr. No.', 'Date', 'From', 'To', 'Amount', 'Purpose', 'Fund ID', 'Remark']],
        body: data.map((d) => [
          d['Sr. No.'],
          d.Date,
          d.From,
          d.To,
          formatCurrencyINR(d.Amount),
          d.Purpose,
          d['Fund ID'],
          d.Remark,
        ]),
        startY: 20,
        styles: { fontSize: 8.5 },
      });
      doc.save(`Funds_Ledger_${new Date().toISOString().slice(0, 10)}.pdf`);
    }
  };

  const downloadSampleExcel = () => {
    const sample = [
      {
        'Sr. No.': 1,
        Date: '2026-10-06',
        From: 'NEXXUS',
        To: 'Vishal',
        Amount: 50000,
        Purpose: 'Investment',
        Remark: 'Advance',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample');
    XLSX.writeFile(wb, 'Funds_Upload_Sample.xlsx');
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
          const parsed: FundTransaction[] = rows.map((r, i) => ({
            txId: 'TXN-' + Date.now() + '-' + i,
            date: r['Date'] || new Date().toISOString().split('T')[0],
            rawDate: r['Date'] || new Date().toISOString().split('T')[0],
            from: r['From'] || 'NEXXUS',
            to: r['To'] || 'Person',
            amount: safeEvalMath(r['Amount']),
            purpose: r['Purpose'] || 'Fund Transfer',
            fundId: 'FUND-' + Math.floor(100 + Math.random() * 900),
            remark: r['Remark'] || '',
          }));
          const existing = [...funds];
          parsed.forEach((tx) => existing.unshift(tx));
          StorageService.saveFunds(existing);
          alert(`${parsed.length} fund transactions uploaded!`);
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
  const subCardBg = isDark ? 'bg-[#0a0f1d] border-slate-800' : 'bg-slate-50 border-slate-200';
  const inputClass = isDark
    ? 'bg-[#0a0f1d] border-slate-700 text-white focus:border-[#FF8500]'
    : 'bg-white border-slate-300 text-slate-900 focus:border-[#FF8500] shadow-2xs';
  const labelClass = isDark ? 'text-slate-300 font-semibold' : 'text-slate-700 font-bold';

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-[#FF8500] flex items-center gap-2">
          <Landmark className="w-5 h-5" />
          <span>Funds Ledger & Investment Balances</span>
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={downloadSampleExcel}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
              isDark ? 'border-slate-700 bg-slate-800 text-white hover:bg-slate-700' : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span>Sample</span>
          </button>
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-600/40 bg-sky-900/30 text-xs font-semibold text-sky-400 cursor-pointer hover:bg-sky-900/50 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Bulk Upload</span>
            <input type="file" accept=".xlsx, .xls" onChange={handleBulkUpload} className="hidden" />
          </label>

          {/* Visible Total Box */}
          <div className={`px-3.5 py-1.5 rounded-xl border text-xs flex items-center gap-2 ${
            isDark ? 'border-slate-700 bg-[#0a0f1d]' : 'border-slate-200 bg-slate-100'
          }`}>
            <span className={isDark ? 'text-slate-400 font-semibold' : 'text-slate-600 font-bold'}>Total Amount:</span>
            <span className="text-[#FF8500] font-bold font-mono text-sm">
              {formatCurrencyINR(visibleTotalAmt)}
            </span>
          </div>

          {/* Export Buttons */}
          <button
            onClick={() => handleExport('excel')}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              isDark ? 'bg-slate-800 border-slate-700 text-amber-400 hover:border-amber-400' : 'bg-white border-slate-300 text-amber-600 hover:border-amber-500 shadow-2xs'
            }`}
            title="Export Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleExport('csv')}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              isDark ? 'bg-slate-800 border-slate-700 text-amber-400 hover:border-amber-400' : 'bg-white border-slate-300 text-amber-600 hover:border-amber-500 shadow-2xs'
            }`}
            title="Export CSV"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              isDark ? 'bg-slate-800 border-slate-700 text-amber-400 hover:border-amber-400' : 'bg-white border-slate-300 text-amber-600 hover:border-amber-500 shadow-2xs'
            }`}
            title="Export PDF"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Compact Summary Boxes */}
      <div className={`p-4 rounded-2xl border flex flex-wrap gap-2.5 items-center ${cardBg}`}>
        {balancesList.map((bal, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs shadow-inner ${
              isDark ? 'bg-[#0a0f1d] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span className={`font-bold uppercase ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{bal.name}:</span>
            <span
              className={`font-mono font-extrabold text-sm ${
                bal.name === 'NEXXUS'
                  ? 'text-amber-500'
                  : bal.current >= 0
                  ? 'text-emerald-500'
                  : 'text-rose-500'
              }`}
            >
              {formatCurrencyINR(bal.current)}
            </span>
          </div>
        ))}
      </div>

      {/* Daily Funds Entry Section */}
      <div className={`p-5 rounded-2xl border shadow-sm ${cardBg}`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm text-[#FF8500] flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Daily Funds Entry
          </h4>
          <button
            onClick={addRow}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-[#FF8500]" />
            <span>+ Add Row</span>
          </button>
        </div>

        <div className={`overflow-x-auto rounded-xl border mb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <table className="w-full text-xs text-left min-w-[850px]">
            <thead className="bg-[#1A365D] text-white font-bold uppercase text-[11px]">
              <tr>
                <th className="p-2.5 text-center w-10">Sr</th>
                <th className="p-2.5 w-28">Date</th>
                <th className="p-2.5 w-36">From</th>
                <th className="p-2.5 w-36">To</th>
                <th className="p-2.5 text-right w-28">Amount (₹)</th>
                <th className="p-2.5 w-36">Purpose</th>
                <th className="p-2.5">Remark</th>
                <th className="p-2.5 text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody className={isDark ? 'divide-y divide-slate-800 bg-[#0a0f1d]/60 text-slate-100' : 'divide-y divide-slate-200 bg-white text-slate-900'}>
              {entryRows.map((row, idx) => (
                <tr key={idx} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-amber-50/50'}>
                  <td className={`p-1.5 text-center font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{idx + 1}</td>
                  <td className="p-1.5">
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateRow(idx, 'date', e.target.value)}
                      className={`w-full p-1.5 border rounded-lg text-xs ${inputClass}`}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.from}
                      onChange={(e) => updateRow(idx, 'from', e.target.value)}
                      placeholder="Sender"
                      className={`w-full p-1.5 border rounded-lg uppercase font-bold text-xs ${inputClass}`}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.to}
                      onChange={(e) => updateRow(idx, 'to', e.target.value)}
                      placeholder="Receiver"
                      className={`w-full p-1.5 border rounded-lg uppercase font-bold text-xs ${inputClass}`}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.amount}
                      onChange={(e) => updateRow(idx, 'amount', e.target.value)}
                      placeholder="0.00"
                      className={`w-full p-1.5 border rounded-lg text-amber-500 font-bold text-right font-mono text-xs ${inputClass}`}
                    />
                  </td>
                  <td className="p-1.5">
                    <select
                      value={row.purpose}
                      onChange={(e) => updateRow(idx, 'purpose', e.target.value)}
                      className={`w-full p-1.5 border rounded-lg text-xs ${inputClass}`}
                    >
                      <option value="Fund Transfer">Fund Transfer</option>
                      <option value="Investment">Investment</option>
                      <option value="Salary / Firm Expense">Salary / Firm Expense</option>
                      <option value="Personal Expense">Personal Expense</option>
                      <option value="Bill Received">Bill Received</option>
                      <option value="Other">Other</option>
                    </select>
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.remark}
                      onChange={(e) => updateRow(idx, 'remark', e.target.value)}
                      placeholder="Remark"
                      className={`w-full p-1.5 border rounded-lg text-xs ${inputClass}`}
                    />
                  </td>
                  <td className="p-1.5 text-center">
                    <button
                      onClick={() => removeRow(idx)}
                      className={`p-1.5 rounded transition-colors text-rose-500 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-rose-50'}`}
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
          onClick={handleSaveEntries}
          className="btn-3d-emerald w-full py-2.5 text-xs font-black shadow-md cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          <span>SAVE TRANSACTIONS</span>
        </button>
      </div>

      {/* Saved Funds Report Card */}
      <div className={`p-5 rounded-2xl border shadow-sm ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h4 className="font-bold text-sm text-[#FF8500]">Saved Funds Report</h4>
          <button
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="btn-3d-secondary px-3 py-1.5 text-xs"
            title="Toggle Ascending / Descending sorting"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#FF8500]" />
            <span>{sortOrder === 'desc' ? '↓ New Data On Top' : '↑ Old Data First'}</span>
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs mb-4">
          <div>
            <label className={`block mb-1 ${labelClass}`}>From Date</label>
            <input
              type="date"
              value={filterFromDate}
              onChange={(e) => setFilterFromDate(e.target.value)}
              className={`w-full p-1.5 border rounded-lg ${inputClass}`}
            />
          </div>
          <div>
            <label className={`block mb-1 ${labelClass}`}>To Date</label>
            <input
              type="date"
              value={filterToDate}
              onChange={(e) => setFilterToDate(e.target.value)}
              className={`w-full p-1.5 border rounded-lg ${inputClass}`}
            />
          </div>
          <div>
            <label className={`block mb-1 ${labelClass}`}>From (Sender)</label>
            <input
              type="text"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              placeholder="Filter sender"
              className={`w-full p-1.5 border rounded-lg uppercase ${inputClass}`}
            />
          </div>
          <div>
            <label className={`block mb-1 ${labelClass}`}>To (Receiver)</label>
            <input
              type="text"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              placeholder="Filter receiver"
              className={`w-full p-1.5 border rounded-lg uppercase ${inputClass}`}
            />
          </div>
          <div>
            <button
              onClick={() => {
                setFilterFromDate('');
                setFilterToDate('');
                setFilterFrom('');
                setFilterTo('');
              }}
              className={`w-full mt-4 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <table className="w-full min-w-[900px] text-xs text-left">
            <thead className="bg-[#1A365D] text-white font-bold uppercase text-[10px]">
              <tr>
                <th className="py-1.5 px-2 text-center w-10">Sr</th>
                <th className="py-1.5 px-2 w-20">Date</th>
                <th className="py-1.5 px-2 w-28">From</th>
                <th className="py-1.5 px-2 w-28">To</th>
                <th className="py-1.5 px-2 text-right w-24">Amount</th>
                <th className="py-1.5 px-2 w-32">Purpose</th>
                <th className="py-1.5 px-2 w-24">Fund ID</th>
                <th className="py-1.5 px-2">Remark</th>
                <th className="py-1.5 px-2 text-center w-14">Action</th>
              </tr>
            </thead>
            <tbody className={isDark ? 'divide-y divide-slate-800 bg-[#0a0f1d]/60 text-slate-100' : 'divide-y divide-slate-200 bg-white text-slate-900'}>
              {sortedFunds.length === 0 ? (
                <tr>
                  <td colSpan={9} className={`py-6 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    No transactions found in records.
                  </td>
                </tr>
              ) : (
                sortedFunds.map((t, idx) => (
                  <tr key={t.txId} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-amber-50/50'}>
                    <td className={`py-1 px-2 text-center font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{idx + 1}</td>
                    <td className="py-1 px-2 font-mono">{formatDateCustom(t.date)}</td>
                    <td className={`py-1 px-2 font-bold uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.from}</td>
                    <td className={`py-1 px-2 font-bold uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.to}</td>
                    <td className="py-1 px-2 text-right font-mono font-bold text-amber-500">
                      {formatCurrencyINR(t.amount)}
                    </td>
                    <td className="py-1 px-2 text-sky-500 font-medium">{t.purpose}</td>
                    <td className={`py-1 px-2 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.fundId}</td>
                    <td className={`py-1 px-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t.remark}</td>
                    <td className="py-1 px-2 text-center space-x-1">
                      <button
                        onClick={() => setEditTx({ ...t })}
                        className={`p-1.5 text-amber-500 rounded transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-amber-50'}`}
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTx(t.txId)}
                        className={`p-1.5 text-rose-500 rounded transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-rose-50'}`}
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Transaction Modal */}
      {editTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className={`w-full max-w-md border rounded-2xl p-6 shadow-2xl text-xs transition-colors ${cardBg}`}>
            <h4 className="font-bold text-sm text-[#FF8500] mb-3">Edit Fund Transaction</h4>
            <div className="space-y-3 mb-4">
              <div>
                <label className={`block mb-1 ${labelClass}`}>Date</label>
                <input
                  type="date"
                  value={editTx.date}
                  onChange={(e) => setEditTx({ ...editTx, date: e.target.value })}
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block mb-1 ${labelClass}`}>From</label>
                  <input
                    type="text"
                    value={editTx.from}
                    onChange={(e) => setEditTx({ ...editTx, from: e.target.value.toUpperCase() })}
                    className={`w-full p-2 border rounded-lg uppercase font-bold ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>To</label>
                  <input
                    type="text"
                    value={editTx.to}
                    onChange={(e) => setEditTx({ ...editTx, to: e.target.value.toUpperCase() })}
                    className={`w-full p-2 border rounded-lg uppercase font-bold ${inputClass}`}
                  />
                </div>
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editTx.amount}
                  onChange={(e) => setEditTx({ ...editTx, amount: parseFloat(e.target.value) || 0 })}
                  className={`w-full p-2 border rounded-lg text-amber-500 font-bold ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Purpose</label>
                <select
                  value={editTx.purpose}
                  onChange={(e) => setEditTx({ ...editTx, purpose: e.target.value })}
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                >
                  <option value="Fund Transfer">Fund Transfer</option>
                  <option value="Investment">Investment</option>
                  <option value="Salary / Firm Expense">Salary / Firm Expense</option>
                  <option value="Personal Expense">Personal Expense</option>
                  <option value="Bill Received">Bill Received</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Remark</label>
                <input
                  type="text"
                  value={editTx.remark}
                  onChange={(e) => setEditTx({ ...editTx, remark: e.target.value })}
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditTx(null)}
                className={`px-4 py-2 rounded-lg font-semibold cursor-pointer transition-colors ${
                  isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-lg bg-[#FF8500] hover:bg-[#e07500] text-black font-extrabold cursor-pointer transition-colors"
              >
                Update Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
