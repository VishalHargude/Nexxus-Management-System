import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Coins,
  Plus,
  FolderPlus,
  Download,
  Upload,
  Pencil,
  Trash2,
  CheckCircle2,
  X,
  ArrowUpDown,
} from 'lucide-react';
import { ExpenseRecord, CompanyRecord } from '../../types';
import { StorageService } from '../../utils/storage';
import { safeEvalMath, formatCurrencyINR, formatDateCustom } from '../../utils/formatters';

interface Props {
  companies: CompanyRecord[];
  theme: 'dark' | 'light';
  currentUsername: string;
}

export const ExpensesModule: React.FC<Props> = ({ companies, theme, currentUsername }) => {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Add Category Modal
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Quick Expense Entry Rows
  const [entryRows, setEntryRows] = useState<any[]>([
    {
      date: new Date().toISOString().split('T')[0],
      company: '',
      plant: '',
      category: 'Raw Material',
      transactionDetails: '',
      amount: '',
      gstRate: 0,
      gst: 0,
      totalExpense: 0,
      totalAmountPaid: '',
      paymentStatus: 'Paid',
      paymentType: 'Cash',
      payer: currentUsername,
      remark: '',
    },
  ]);

  // History Filters
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterPlant, setFilterPlant] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPayer, setFilterPayer] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editObj, setEditObj] = useState<ExpenseRecord | null>(null);

  useEffect(() => {
    const load = () => {
      setExpenses(StorageService.getExpenses());
      setCategories(StorageService.getExpenseCategories());
    };
    load();
    window.addEventListener('nexxus_storage_updated', load);
    return () => window.removeEventListener('nexxus_storage_updated', load);
  }, []);

  const addCategory = () => {
    if (!newCatName.trim()) return;
    StorageService.addExpenseCategory(newCatName.trim());
    setCategories(StorageService.getExpenseCategories());
    setNewCatName('');
    setShowAddCatModal(false);
  };

  const addEntryRow = () => {
    setEntryRows([
      ...entryRows,
      {
        date: new Date().toISOString().split('T')[0],
        company: '',
        plant: '',
        category: categories[0] || 'Raw Material',
        transactionDetails: '',
        amount: '',
        gstRate: 0,
        gst: 0,
        totalExpense: 0,
        totalAmountPaid: '',
        paymentStatus: 'Paid',
        paymentType: 'Cash',
        payer: currentUsername,
        remark: '',
      },
    ]);
  };

  const removeEntryRow = (idx: number) => {
    if (entryRows.length === 1) return;
    setEntryRows(entryRows.filter((_, i) => i !== idx));
  };

  const updateEntryRow = (idx: number, field: string, val: any) => {
    const updated = [...entryRows];
    updated[idx][field] = val;

    const amt = safeEvalMath(updated[idx].amount);
    const gstRate = parseFloat(String(updated[idx].gstRate || 0));
    const gstAmt = (amt * gstRate) / 100;
    const tot = amt + gstAmt;

    updated[idx].gst = gstAmt;
    updated[idx].totalExpense = tot;

    setEntryRows(updated);
  };

  const handleSaveExpenses = () => {
    const valid = entryRows.filter((r) => safeEvalMath(r.amount) > 0);
    if (valid.length === 0) {
      alert('Please enter an amount > 0 for at least one expense entry!');
      return;
    }

    const records: ExpenseRecord[] = valid.map((r, i) => {
      const amt = safeEvalMath(r.amount);
      const gstRate = parseFloat(String(r.gstRate || 0));
      const gstAmt = (amt * gstRate) / 100;
      const tot = amt + gstAmt;
      const paid = safeEvalMath(r.totalAmountPaid) || tot;

      return {
        id: Date.now() + i,
        srNo: expenses.length + 1 + i,
        date: r.date,
        company: r.company || 'NEXXUS FACILITY',
        plant: r.plant || 'Pune Plant',
        category: r.category,
        transactionDetails: r.transactionDetails,
        amount: amt,
        gstRate,
        gst: gstAmt,
        totalExpense: tot,
        totalAmountPaid: paid,
        paymentStatus: r.paymentStatus,
        paymentType: r.paymentType,
        payer: r.payer,
        remark: r.remark,
      };
    });

    StorageService.addExpenses(records);
    setExpenses(StorageService.getExpenses());
    alert(`${records.length} expense entries saved successfully!`);
    setEntryRows([
      {
        date: new Date().toISOString().split('T')[0],
        company: '',
        plant: '',
        category: 'Raw Material',
        transactionDetails: '',
        amount: '',
        gstRate: 0,
        gst: 0,
        totalExpense: 0,
        totalAmountPaid: '',
        paymentStatus: 'Paid',
        paymentType: 'Cash',
        payer: currentUsername,
        remark: '',
      },
    ]);
  };

  // Metrics
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const totalExpenseSum = expenses.reduce((s, e) => s + (parseFloat(String(e.totalExpense)) || 0), 0);
  const totalPaidSum = expenses.reduce((s, e) => s + (parseFloat(String(e.totalAmountPaid)) || 0), 0);
  const totalGstSum = expenses.reduce((s, e) => s + (parseFloat(String(e.gst)) || 0), 0);
  const totalPendingSum = totalExpenseSum - totalPaidSum;

  const thisMonthSum = expenses.reduce((s, e) => {
    if (e.date) {
      const d = new Date(e.date);
      if (!isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        return s + (parseFloat(String(e.totalExpense)) || 0);
      }
    }
    return s;
  }, 0);

  // Filtered History
  const filtered = expenses.filter((e) => {
    if (filterFromDate && e.date < filterFromDate) return false;
    if (filterToDate && e.date > filterToDate) return false;
    if (filterCompany && !e.company.toLowerCase().includes(filterCompany.toLowerCase())) return false;
    if (filterPlant && !e.plant.toLowerCase().includes(filterPlant.toLowerCase())) return false;
    if (filterCat && e.category !== filterCat) return false;
    if (filterStatus && e.paymentStatus !== filterStatus) return false;
    if (filterType && e.paymentType !== filterType) return false;
    if (filterPayer && !e.payer.toLowerCase().includes(filterPayer.toLowerCase())) return false;
    return true;
  });

  const startEdit = (rec: ExpenseRecord) => {
    setEditingId(rec.id);
    setEditObj({ ...rec });
  };

  const saveEdit = () => {
    if (!editObj) return;
    const amt = safeEvalMath(editObj.amount);
    const gstRate = parseFloat(String(editObj.gstRate || 0));
    const gstAmt = (amt * gstRate) / 100;
    const tot = amt + gstAmt;

    const updated = expenses.map((e) =>
      e.id === editObj.id
        ? {
            ...editObj,
            amount: amt,
            gstRate,
            gst: gstAmt,
            totalExpense: tot,
          }
        : e
    );
    StorageService.saveExpenses(updated);
    setExpenses(StorageService.getExpenses());
    setEditingId(null);
    setEditObj(null);
  };

  const deleteExpense = (id: string | number) => {
    if (confirm('Delete this expense record?')) {
      StorageService.deleteExpense(id);
      setExpenses(StorageService.getExpenses());
    }
  };

  const sortedExpenses = [...filtered].sort((a, b) => {
    const dComp = (b.date || '').localeCompare(a.date || '');
    if (dComp !== 0) return sortOrder === 'desc' ? dComp : -dComp;
    const aId = Number(a.id) || 0;
    const bId = Number(b.id) || 0;
    return sortOrder === 'desc' ? bId - aId : aId - bId;
  });

  const handleExport = () => {
    if (sortedExpenses.length === 0) {
      alert('No data to export!');
      return;
    }
    const data = sortedExpenses.map((r, i) => ({
      Sr: i + 1,
      Date: r.date,
      Company: r.company,
      Plant: r.plant,
      Category: r.category,
      'Transaction Details': r.transactionDetails,
      Amount: r.amount,
      'GST %': r.gstRate,
      'GST Amount': r.gst,
      'Total Expense': r.totalExpense,
      'Paid Amount': r.totalAmountPaid,
      Status: r.paymentStatus,
      'Payment Type': r.paymentType,
      'Paid By': r.payer,
      Remark: r.remark,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ExpensesReport');
    XLSX.writeFile(wb, `Expenses_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const downloadSampleExcel = () => {
    const sample = [
      {
        Date: '2026-10-06',
        Company: 'NEXXUS FACILITY',
        Plant: 'Pune Plant',
        Category: 'Raw Material',
        'Transaction Details': 'UPI-12345678',
        Amount: 5000,
        'GST %': 18,
        'GST Amt': 900,
        Total: 5900,
        'Paid Amount': 5900,
        Status: 'Paid',
        'Type of Payment': 'Bank Transfer',
        'Payer / Paid By': 'Admin',
        Remark: 'Sample',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ExpenseSample');
    XLSX.writeFile(wb, 'Expense_Sample.xlsx');
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
          const parsed: ExpenseRecord[] = rows.map((r, idx) => {
            const amt = safeEvalMath(r['Amount'] || 0);
            const gstRate = parseFloat(String(r['GST %'] || 0));
            const gstAmt = (amt * gstRate) / 100;
            const tot = amt + gstAmt;
            return {
              id: Date.now() + idx,
              srNo: expenses.length + 1 + idx,
              date: r['Date'] || new Date().toISOString().split('T')[0],
              company: r['Company'] || 'NEXXUS FACILITY',
              plant: r['Plant'] || 'Pune Plant',
              category: r['Category'] || 'Miscellaneous',
              transactionDetails: r['Transaction Details'] || '',
              amount: amt,
              gstRate,
              gst: gstAmt,
              totalExpense: tot,
              totalAmountPaid: safeEvalMath(r['Paid Amount']) || tot,
              paymentStatus: r['Status'] || 'Paid',
              paymentType: r['Type of Payment'] || 'Cash',
              payer: r['Payer / Paid By'] || currentUsername,
              remark: r['Remark'] || 'Bulk Upload',
            };
          });
          StorageService.addExpenses(parsed);
          alert(`${parsed.length} expenses imported from file!`);
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
      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-[#FF8500] flex items-center gap-2">
          <Coins className="w-5 h-5" />
          <span>Expense Management & Petty Cash</span>
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddCatModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF8500] hover:bg-[#e07500] text-black font-extrabold text-xs cursor-pointer shadow-md transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ Add Category</span>
          </button>
          <button
            onClick={downloadSampleExcel}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
              isDark ? 'border-slate-700 bg-slate-800 text-white hover:bg-slate-700' : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span>Sample Excel</span>
          </button>
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-600/40 bg-emerald-900/30 text-xs font-semibold text-emerald-400 cursor-pointer hover:bg-emerald-900/50 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Bulk Upload</span>
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleBulkUpload} className="hidden" />
          </label>
          <button
            onClick={handleExport}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
              isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Cards - Compact Uniform Sizing & Typography */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
        <div className={`p-2.5 px-3.5 rounded-xl border flex flex-col justify-between h-16 border-blue-500/30 transition-all ${cardBg}`}>
          <span className="text-slate-400 block font-semibold text-[11px] truncate uppercase tracking-wider">Total Expense</span>
          <span className={`text-sm font-bold font-mono tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrencyINR(totalExpenseSum)}</span>
        </div>
        <div className={`p-2.5 px-3.5 rounded-xl border flex flex-col justify-between h-16 border-amber-500/30 transition-all ${cardBg}`}>
          <span className="text-slate-400 block font-semibold text-[11px] truncate uppercase tracking-wider">This Month</span>
          <span className="text-sm font-bold text-amber-500 font-mono tracking-tight truncate">{formatCurrencyINR(thisMonthSum)}</span>
        </div>
        <div className={`p-2.5 px-3.5 rounded-xl border flex flex-col justify-between h-16 border-sky-500/30 transition-all ${cardBg}`}>
          <span className="text-slate-400 block font-semibold text-[11px] truncate uppercase tracking-wider">Total GST</span>
          <span className="text-sm font-bold text-sky-500 font-mono tracking-tight truncate">{formatCurrencyINR(totalGstSum)}</span>
        </div>
        <div className={`p-2.5 px-3.5 rounded-xl border flex flex-col justify-between h-16 border-emerald-500/30 transition-all ${cardBg}`}>
          <span className="text-slate-400 block font-semibold text-[11px] truncate uppercase tracking-wider">Total Paid</span>
          <span className="text-sm font-bold text-emerald-500 font-mono tracking-tight truncate">{formatCurrencyINR(totalPaidSum)}</span>
        </div>
        <div className={`p-2.5 px-3.5 rounded-xl border flex flex-col justify-between h-16 border-rose-500/30 transition-all ${cardBg}`}>
          <span className="text-slate-400 block font-semibold text-[11px] truncate uppercase tracking-wider">Pending Amount</span>
          <span className="text-sm font-bold text-rose-500 font-mono tracking-tight truncate">{formatCurrencyINR(totalPendingSum)}</span>
        </div>
      </div>

      {/* Quick Expense Entry Table Card */}
      <div className={`p-5 rounded-2xl border shadow-sm ${cardBg}`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm text-[#FF8500] flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Quick Expense Entry
          </h4>
          <button
            onClick={addEntryRow}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-[#FF8500]" />
            <span>+ Add Row</span>
          </button>
        </div>

        <div className={`overflow-x-auto rounded-xl border mb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <table className="w-full min-w-[1300px] text-xs text-left">
            <thead className="bg-[#1A365D] text-white font-bold uppercase text-[11px]">
              <tr>
                <th className="p-2 w-28">Date</th>
                <th className="p-2 w-36">Company</th>
                <th className="p-2 w-32">Plant</th>
                <th className="p-2 w-36">Category</th>
                <th className="p-2 w-36">Trans. Details</th>
                <th className="p-2 text-right w-24">Amount (₹)</th>
                <th className="p-2 text-center w-20">GST %</th>
                <th className="p-2 text-right w-20">GST (₹)</th>
                <th className="p-2 text-right w-24">Total (₹)</th>
                <th className="p-2 text-right w-24">Paid (₹)</th>
                <th className="p-2 w-24">Status</th>
                <th className="p-2 w-28">Type</th>
                <th className="p-2 w-28">Payer</th>
                <th className="p-2">Remark</th>
                <th className="p-2 text-center w-10">Act</th>
              </tr>
            </thead>
            <tbody className={isDark ? 'divide-y divide-slate-800 bg-[#0a0f1d]/60 text-slate-100' : 'divide-y divide-slate-200 bg-white text-slate-900'}>
              {entryRows.map((row, idx) => (
                <tr key={idx} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-amber-50/50'}>
                  <td className="p-1.5">
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateEntryRow(idx, 'date', e.target.value)}
                      className={`w-full p-1.5 border rounded-lg text-xs ${inputClass}`}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.company}
                      onChange={(e) => updateEntryRow(idx, 'company', e.target.value)}
                      placeholder="Company"
                      className={`w-full p-1.5 border rounded-lg text-xs ${inputClass}`}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.plant}
                      onChange={(e) => updateEntryRow(idx, 'plant', e.target.value)}
                      placeholder="Plant"
                      className={`w-full p-1.5 border rounded-lg text-xs ${inputClass}`}
                    />
                  </td>
                  <td className="p-1.5">
                    <select
                      value={row.category}
                      onChange={(e) => updateEntryRow(idx, 'category', e.target.value)}
                      className={`w-full p-1.5 border rounded-lg text-xs ${inputClass}`}
                    >
                      {categories.map((c, i) => (
                        <option key={i} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.transactionDetails}
                      onChange={(e) => updateEntryRow(idx, 'transactionDetails', e.target.value)}
                      placeholder="Details"
                      className={`w-full p-1.5 border rounded-lg text-xs ${inputClass}`}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.amount}
                      onChange={(e) => updateEntryRow(idx, 'amount', e.target.value)}
                      onBlur={() => {
                        const evaluated = safeEvalMath(row.amount);
                        if (!isNaN(evaluated)) updateEntryRow(idx, 'amount', evaluated);
                      }}
                      placeholder="0.00"
                      className={`w-full p-1.5 border rounded-lg text-right font-mono text-xs ${inputClass}`}
                    />
                  </td>
                  <td className="p-1.5">
                    <select
                      value={row.gstRate}
                      onChange={(e) => updateEntryRow(idx, 'gstRate', e.target.value)}
                      className={`w-full p-1.5 border rounded-lg text-amber-500 font-bold text-center text-xs ${inputClass}`}
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </td>
                  <td className={`p-1.5 text-right font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {parseFloat(String(row.gst || 0)).toFixed(2)}
                  </td>
                  <td className="p-1.5 text-right font-mono font-bold text-emerald-500">
                    {parseFloat(String(row.totalExpense || 0)).toFixed(2)}
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.totalAmountPaid}
                      onChange={(e) => updateEntryRow(idx, 'totalAmountPaid', e.target.value)}
                      onBlur={() => {
                        const evaluated = safeEvalMath(row.totalAmountPaid);
                        if (!isNaN(evaluated)) updateEntryRow(idx, 'totalAmountPaid', evaluated);
                      }}
                      placeholder="Paid"
                      className={`w-full p-1.5 border rounded-lg text-right font-mono text-xs ${inputClass}`}
                    />
                  </td>
                  <td className="p-1.5">
                    <select
                      value={row.paymentStatus}
                      onChange={(e) => updateEntryRow(idx, 'paymentStatus', e.target.value)}
                      className={`w-full p-1.5 border rounded-lg text-xs ${inputClass}`}
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Partial">Partial</option>
                    </select>
                  </td>
                  <td className="p-1.5">
                    <select
                      value={row.paymentType}
                      onChange={(e) => updateEntryRow(idx, 'paymentType', e.target.value)}
                      className={`w-full p-1.5 border rounded-lg text-xs ${inputClass}`}
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="PhonePe">PhonePe</option>
                      <option value="Google Pay">Google Pay</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.payer}
                      onChange={(e) => updateEntryRow(idx, 'payer', e.target.value)}
                      className={`w-full p-1.5 border rounded-lg text-xs ${inputClass}`}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.remark}
                      onChange={(e) => updateEntryRow(idx, 'remark', e.target.value)}
                      className={`w-full p-1.5 border rounded-lg text-xs ${inputClass}`}
                    />
                  </td>
                  <td className="p-1.5 text-center">
                    <button
                      onClick={() => removeEntryRow(idx)}
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
          onClick={handleSaveExpenses}
          className="btn-3d-orange w-full py-2.5 text-xs font-black shadow-md cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          <span>SAVE ALL EXPENSES</span>
        </button>
      </div>

      {/* Saved History Table Card */}
      <div className={`p-5 rounded-2xl border shadow-sm ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h4 className="font-bold text-sm text-[#FF8500]">Saved Expense History</h4>
          <button
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="btn-3d-secondary px-3 py-1.5 text-xs"
            title="Toggle Ascending / Descending sorting"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#FF8500]" />
            <span>{sortOrder === 'desc' ? '↓ New Data On Top' : '↑ Old Data First'}</span>
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs mb-4">
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
            <label className={`block mb-1 ${labelClass}`}>Company</label>
            <input
              type="text"
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              placeholder="Filter company"
              className={`w-full p-1.5 border rounded-lg ${inputClass}`}
            />
          </div>
          <div>
            <label className={`block mb-1 ${labelClass}`}>Category</label>
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className={`w-full p-1.5 border rounded-lg ${inputClass}`}
            >
              <option value="">All Categories</option>
              {categories.map((c, i) => (
                <option key={i} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block mb-1 ${labelClass}`}>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`w-full p-1.5 border rounded-lg ${inputClass}`}
            >
              <option value="">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
            </select>
          </div>
          <div>
            <button
              onClick={() => {
                setFilterFromDate('');
                setFilterToDate('');
                setFilterCompany('');
                setFilterCat('');
                setFilterStatus('');
              }}
              className={`w-full mt-4 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <table className="w-full min-w-[1300px] text-xs text-left">
            <thead className="bg-[#1A365D] text-white font-bold uppercase text-[10px]">
              <tr>
                <th className="py-1.5 px-2 text-center w-10">Sr</th>
                <th className="py-1.5 px-2 w-20">Date</th>
                <th className="py-1.5 px-2 w-36">Company</th>
                <th className="py-1.5 px-2 w-28">Plant</th>
                <th className="py-1.5 px-2 w-28">Category</th>
                <th className="py-1.5 px-2 w-32">Trans Details</th>
                <th className="py-1.5 px-2 text-right w-20">Amount</th>
                <th className="py-1.5 px-2 text-center w-14">GST %</th>
                <th className="py-1.5 px-2 text-right w-16">GST Amt</th>
                <th className="py-1.5 px-2 text-right w-20">Total</th>
                <th className="py-1.5 px-2 text-right w-20">Paid</th>
                <th className="py-1.5 px-2 text-center w-16">Status</th>
                <th className="py-1.5 px-2 w-20">Type</th>
                <th className="py-1.5 px-2 w-24">Payer</th>
                <th className="py-1.5 px-2">Remark</th>
                <th className="py-1.5 px-2 text-center w-14">Action</th>
              </tr>
            </thead>
            <tbody className={isDark ? 'divide-y divide-slate-800 bg-[#0a0f1d]/60 text-slate-100' : 'divide-y divide-slate-200 bg-white text-slate-900'}>
              {sortedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={16} className={`py-6 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    No expense records found.
                  </td>
                </tr>
              ) : (
                sortedExpenses.map((r, idx) => (
                  <tr key={r.id} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-amber-50/50'}>
                    <td className={`py-1 px-2 text-center font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{idx + 1}</td>
                    <td className="py-1 px-2 font-mono">{formatDateCustom(r.date)}</td>
                    <td className={`py-1 px-2 font-medium ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>{r.company}</td>
                    <td className={`py-1 px-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{r.plant}</td>
                    <td className="py-1 px-2 text-sky-500 font-bold">{r.category}</td>
                    <td className={`py-1 px-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{r.transactionDetails || '-'}</td>
                    <td className="py-1 px-2 text-right font-mono font-bold">
                      ₹ {parseFloat(String(r.amount || 0)).toFixed(2)}
                    </td>
                    <td className="py-1 px-2 text-center font-mono text-amber-500 font-bold">{r.gstRate}%</td>
                    <td className={`py-1 px-2 text-right font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      ₹ {parseFloat(String(r.gst || 0)).toFixed(2)}
                    </td>
                    <td className="py-1 px-2 text-right font-mono font-bold text-emerald-500">
                      ₹ {parseFloat(String(r.totalExpense || 0)).toFixed(2)}
                    </td>
                    <td className="py-1 px-2 text-right font-mono font-bold text-sky-500">
                      ₹ {parseFloat(String(r.totalAmountPaid || 0)).toFixed(2)}
                    </td>
                    <td className="py-1 px-2 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          r.paymentStatus === 'Paid'
                            ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                        }`}
                      >
                        {r.paymentStatus}
                      </span>
                    </td>
                    <td className="py-1 px-2">{r.paymentType}</td>
                    <td className="py-1 px-2">{r.payer}</td>
                    <td className={`py-1 px-2 truncate max-w-[120px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{r.remark}</td>
                    <td className="py-1 px-2 text-center space-x-1">
                      <button
                        onClick={() => startEdit(r)}
                        className={`p-1.5 text-amber-500 rounded transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-amber-50'}`}
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteExpense(r.id)}
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

      {/* Add Category Modal */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className={`w-full max-w-sm border rounded-2xl p-5 shadow-2xl text-xs transition-colors ${cardBg}`}>
            <h4 className="font-bold text-sm text-[#FF8500] mb-3">Add New Expense Category</h4>
            <div className="mb-4">
              <label className={`block mb-1 ${labelClass}`}>Category Name *</label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Factory Rent, Fuel"
                className={`w-full p-2 border rounded-lg ${inputClass}`}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddCatModal(false)}
                className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors ${
                  isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                Cancel
              </button>
              <button onClick={addCategory} className="px-4 py-1.5 rounded-lg bg-[#FF8500] hover:bg-[#e07500] text-black font-extrabold cursor-pointer transition-colors">
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
