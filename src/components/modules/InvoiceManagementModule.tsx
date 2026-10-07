import React, { useState, useEffect } from 'react';
import {
  Wallet,
  MoreVertical,
  Eye,
  Edit2,
  PlusCircle,
  History,
  X,
  Trash2,
  ArrowUpDown,
} from 'lucide-react';
import { TaxInvoice, InvoicePayment } from '../../types';
import { StorageService } from '../../utils/storage';
import { safeEvalMath, formatCurrencyINR, formatDateCustom } from '../../utils/formatters';

interface Props {
  theme: 'dark' | 'light';
}

export const InvoiceManagementModule: React.FC<Props> = ({ theme }) => {
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [payments, setPayments] = useState<InvoicePayment[]>([]);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Filters
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('All');
  const [filterCustomer, setFilterCustomer] = useState('All');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Custom TDS override map: invoiceNo -> custom TDS amount
  const [customTdsMap, setCustomTdsMap] = useState<Record<string, number>>({});

  // Modals state
  const [activeDropdownInv, setActiveDropdownInv] = useState<string | null>(null);
  const [viewInvoice, setViewInvoice] = useState<TaxInvoice | null>(null);
  const [editTdsInv, setEditTdsInv] = useState<TaxInvoice | null>(null);
  const [editTdsValue, setEditTdsValue] = useState<number>(0);

  const [paymentModalInv, setPaymentModalInv] = useState<string | null>(null);
  const [paymentModalPending, setPaymentModalPending] = useState<number>(0);
  const [existingPaymentId, setExistingPaymentId] = useState<string | null>(null);
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMode, setPayMode] = useState('Bank Transfer');
  const [payUtr, setPayUtr] = useState('');
  const [payRemark, setPayRemark] = useState('');

  const [historyModalInv, setHistoryModalInv] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      setInvoices(StorageService.getInvoices());
      setPayments(StorageService.getPayments());
    };
    load();
    window.addEventListener('nexxus_storage_updated', load);
    return () => window.removeEventListener('nexxus_storage_updated', load);
  }, []);

  // Compute merged rows
  const mergedRows = invoices.map((inv) => {
    const invNo = String(inv.invoiceNo).trim();
    const relatedPayments = payments.filter((p) => String(p.invoiceNo).trim() === invNo);
    const totalReceived = relatedPayments.reduce((sum, p) => sum + (parseFloat(String(p.receivedAmount)) || 0), 0);

    const paymentDates = relatedPayments
      .map((p) => formatDateCustom(p.paymentDate))
      .filter(Boolean)
      .join(', ');

    const grandTotal = parseFloat(String(inv.grandTotal || 0));
    const subTotal = parseFloat(String(inv.subTotal || 0));

    let serviceChargeTot = 0;
    (inv.items || []).forEach((item) => {
      const itName = String(item.name || '').toLowerCase();
      if (itName.includes('service') || itName.includes('charge')) {
        serviceChargeTot += parseFloat(String(item.total || 0));
      }
    });

    const defaultTds = Math.round(subTotal * 0.01 * 100) / 100;
    const tdsAmt = customTdsMap[invNo] !== undefined ? customTdsMap[invNo] : defaultTds;

    const receivableAmt = grandTotal - tdsAmt;
    const pendingAmt = receivableAmt - totalReceived;

    let status = 'Pending';
    if (totalReceived > 0 && totalReceived < receivableAmt) status = 'Partially Paid';
    if (totalReceived >= receivableAmt && receivableAmt > 0) status = 'Paid';
    if (totalReceived > receivableAmt) status = 'Overpaid';

    return {
      invoiceNo: invNo,
      date: inv.date,
      supplier: inv.fromCompany || '-',
      customer: inv.toCompany || '-',
      subTotal,
      totalGst: parseFloat(String(inv.totalGst || 0)),
      grandTotal,
      serviceCharge: serviceChargeTot,
      tds: tdsAmt,
      receivable: receivableAmt,
      received: totalReceived,
      pending: pendingAmt,
      paymentDates: paymentDates || '-',
      status,
      paymentsArr: relatedPayments,
      originalInv: inv,
    };
  });

  // Filter options
  const uniqueSuppliers = Array.from(new Set(mergedRows.map((r) => r.supplier).filter((s) => s !== '-')));
  const uniqueCustomers = Array.from(new Set(mergedRows.map((r) => r.customer).filter((c) => c !== '-')));

  const filteredRows = mergedRows.filter((row) => {
    if (filterFrom && row.date < filterFrom) return false;
    if (filterTo && row.date > filterTo) return false;
    if (filterSupplier !== 'All' && row.supplier !== filterSupplier) return false;
    if (filterCustomer !== 'All' && row.customer !== filterCustomer) return false;
    if (filterStatus !== 'All' && row.status !== filterStatus) return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase().trim();
      const matchNo = row.invoiceNo.toLowerCase().includes(q);
      const matchSup = row.supplier.toLowerCase().includes(q);
      const matchCust = row.customer.toLowerCase().includes(q);
      if (!matchNo && !matchSup && !matchCust) return false;
    }
    return true;
  });

  // Totals
  const totAmount = filteredRows.reduce((sum, r) => sum + r.subTotal, 0);
  const totGst = filteredRows.reduce((sum, r) => sum + r.totalGst, 0);
  const totInvoice = filteredRows.reduce((sum, r) => sum + r.grandTotal, 0);
  const totServiceCharge = filteredRows.reduce((sum, r) => sum + r.serviceCharge, 0);
  const totTds = filteredRows.reduce((sum, r) => sum + r.tds, 0);
  const totReceived = filteredRows.reduce((sum, r) => sum + r.received, 0);
  const totPending = filteredRows.reduce((sum, r) => sum + r.pending, 0);

  const handleSaveTds = () => {
    if (!editTdsInv) return;
    setCustomTdsMap((prev) => ({
      ...prev,
      [editTdsInv.invoiceNo]: editTdsValue,
    }));
    setEditTdsInv(null);
  };

  const openAddPayment = (invNo: string, pending: number, payId: string | null = null) => {
    setPaymentModalInv(invNo);
    setPaymentModalPending(pending);
    setExistingPaymentId(payId);
    if (payId) {
      const p = payments.find((x) => x.paymentId === payId);
      if (p) {
        setPayDate(p.paymentDate);
        setPayAmount(String(p.receivedAmount));
        setPayMode(p.paymentMode);
        setPayUtr(p.utr);
        setPayRemark(p.remark);
      }
    } else {
      setPayDate(new Date().toISOString().split('T')[0]);
      setPayAmount(pending > 0 ? String(pending) : '');
      setPayMode('Bank Transfer');
      setPayUtr('');
      setPayRemark('');
    }
  };

  const handleSavePayment = () => {
    if (!paymentModalInv) return;
    const amt = safeEvalMath(payAmount);
    if (amt <= 0) {
      alert('Please enter a valid received amount!');
      return;
    }

    if (existingPaymentId) {
      const updated = payments.map((p) => {
        if (p.paymentId === existingPaymentId) {
          return {
            ...p,
            paymentDate: payDate,
            receivedAmount: amt,
            paymentMode: payMode,
            utr: payUtr,
            remark: payRemark,
          };
        }
        return p;
      });
      StorageService.savePayments(updated);
      setPayments(StorageService.getPayments());
    } else {
      const newPay: InvoicePayment = {
        paymentId: 'PAY-' + Date.now(),
        invoiceNo: paymentModalInv,
        paymentDate: payDate,
        receivedAmount: amt,
        paymentMode: payMode,
        utr: payUtr,
        remark: payRemark,
      };
      StorageService.addPayment(newPay);
      setPayments(StorageService.getPayments());
    }
    setPaymentModalInv(null);
  };

  const handleDeletePayment = (paymentId: string) => {
    if (confirm('Are you sure you want to delete this payment record?')) {
      StorageService.deletePayment(paymentId);
      setPayments(StorageService.getPayments());
    }
  };

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-[#111928] border-slate-800 text-slate-100 glow-card-dark' : 'bg-white border-slate-200 text-slate-900 glow-card-light';
  const inputClass = isDark
    ? 'bg-[#0a0f1d] border-slate-700 text-white focus:border-[#FF8500]'
    : 'bg-white border-slate-300 text-slate-900 focus:border-[#FF8500]';
  const labelClass = isDark ? 'text-slate-300 font-semibold' : 'text-slate-700 font-bold';

  const sortedRows = [...filteredRows].sort((a, b) => {
    const dComp = (b.date || '').localeCompare(a.date || '');
    if (dComp !== 0) return sortOrder === 'desc' ? dComp : -dComp;
    return sortOrder === 'desc' ? b.invoiceNo.localeCompare(a.invoiceNo) : a.invoiceNo.localeCompare(b.invoiceNo);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-[#FF8500] flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          <span>Accounts & Invoice Management Ledger</span>
        </h3>
        <button
          onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
          className="btn-3d-secondary px-3 py-1.5 text-xs"
          title="Toggle Ascending / Descending sorting"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-[#FF8500]" />
          <span>{sortOrder === 'desc' ? '↓ Newest Invoices First' : '↑ Oldest Invoices First'}</span>
        </button>
      </div>

      {/* Summary KPI Cards - Uniform Sizing & Typography */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-2.5 text-xs">
        <div className={`p-3.5 rounded-xl border flex flex-col justify-between h-20 border-blue-500/30 transition-all ${cardBg}`}>
          <span className="text-slate-400 block font-semibold text-xs truncate uppercase tracking-wider">Total Amount</span>
          <span className={`text-sm font-bold font-mono tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrencyINR(totAmount)}</span>
        </div>
        <div className={`p-3.5 rounded-xl border flex flex-col justify-between h-20 border-rose-500/30 transition-all ${cardBg}`}>
          <span className="text-slate-400 block font-semibold text-xs truncate uppercase tracking-wider">Total GST</span>
          <span className="text-sm font-bold text-rose-500 font-mono tracking-tight truncate">{formatCurrencyINR(totGst)}</span>
        </div>
        <div className={`p-3.5 rounded-xl border flex flex-col justify-between h-20 border-amber-500/30 transition-all ${cardBg}`}>
          <span className="text-slate-400 block font-semibold text-xs truncate uppercase tracking-wider">Total Invoice</span>
          <span className="text-sm font-bold text-amber-500 font-mono tracking-tight truncate">{formatCurrencyINR(totInvoice)}</span>
        </div>
        <div className={`p-3.5 rounded-xl border flex flex-col justify-between h-20 border-sky-500/30 transition-all ${cardBg}`}>
          <span className="text-slate-400 block font-semibold text-xs truncate uppercase tracking-wider">Service Charge</span>
          <span className="text-sm font-bold text-sky-500 font-mono tracking-tight truncate">{formatCurrencyINR(totServiceCharge)}</span>
        </div>
        <div className={`p-3.5 rounded-xl border flex flex-col justify-between h-20 border-indigo-500/30 transition-all ${cardBg}`}>
          <span className="text-slate-400 block font-semibold text-xs truncate uppercase tracking-wider">Total TDS (1%)</span>
          <span className="text-sm font-bold text-indigo-500 font-mono tracking-tight truncate">{formatCurrencyINR(totTds)}</span>
        </div>
        <div className={`p-3.5 rounded-xl border flex flex-col justify-between h-20 border-emerald-500/40 transition-all ${cardBg}`}>
          <span className="text-slate-400 block font-semibold text-xs truncate uppercase tracking-wider">Total Received</span>
          <span className="text-sm font-bold text-emerald-500 font-mono tracking-tight truncate">{formatCurrencyINR(totReceived)}</span>
        </div>
        <div className={`p-3.5 rounded-xl border flex flex-col justify-between h-20 border-[#FF8500]/40 transition-all ${cardBg}`}>
          <span className="text-slate-400 block font-semibold text-xs truncate uppercase tracking-wider">Total Pending</span>
          <span className="text-sm font-bold text-[#FF8500] font-mono tracking-tight truncate">{formatCurrencyINR(totPending)}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={`p-4 rounded-2xl border shadow-sm ${cardBg}`}>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5 text-xs">
          <div>
            <label className={`block mb-1 ${labelClass}`}>From Date</label>
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className={`w-full p-2 border rounded-lg ${inputClass}`}
            />
          </div>
          <div>
            <label className={`block mb-1 ${labelClass}`}>To Date</label>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className={`w-full p-2 border rounded-lg ${inputClass}`}
            />
          </div>
          <div>
            <label className={`block mb-1 ${labelClass}`}>Supplier (From)</label>
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className={`w-full p-2 border rounded-lg ${inputClass}`}
            >
              <option value="All">All Suppliers</option>
              {uniqueSuppliers.map((s, idx) => (
                <option key={idx} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block mb-1 ${labelClass}`}>Customer (To)</label>
            <select
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              className={`w-full p-2 border rounded-lg ${inputClass}`}
            >
              <option value="All">All Customers</option>
              {uniqueCustomers.map((c, idx) => (
                <option key={idx} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block mb-1 ${labelClass}`}>Search (Inv / Name)</label>
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="e.g. NEX/26-27"
              className={`w-full p-2 border rounded-lg ${inputClass}`}
            />
          </div>
          <div>
            <label className={`block mb-1 ${labelClass}`}>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`w-full p-2 border rounded-lg ${inputClass}`}
            >
              <option value="All">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overpaid">Overpaid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className={`overflow-x-auto rounded-2xl border shadow-sm ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <table className="w-full min-w-[1300px] text-xs text-left">
          <thead className="bg-[#1A365D] text-white font-bold uppercase text-[11px]">
            <tr>
              <th className="p-3 text-center w-12">Sr</th>
              <th className="p-3 w-24">Date</th>
              <th className="p-3 w-32">Invoice No</th>
              <th className="p-3 w-44">Supplier</th>
              <th className="p-3 w-44">Customer</th>
              <th className="p-3 text-right w-28">Amount</th>
              <th className="p-3 text-right w-24">GST</th>
              <th className="p-3 text-right w-28">Grand Total</th>
              <th className="p-3 text-right w-24">TDS (1%)</th>
              <th className="p-3 text-right w-28 text-amber-300">Receivable</th>
              <th className="p-3 w-32">Rcvd Dates</th>
              <th className="p-3 text-right w-28 text-emerald-300">Received</th>
              <th className="p-3 text-right w-28 text-[#FF8500]">Pending</th>
              <th className="p-3 text-center w-28">Status</th>
              <th className="p-3 text-center w-16">Action</th>
            </tr>
          </thead>
          <tbody className={isDark ? 'divide-y divide-slate-800 bg-[#0a0f1d]/60 text-slate-100' : 'divide-y divide-slate-200 bg-white text-slate-900'}>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={15} className={`py-10 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  No invoices found matching criteria.
                </td>
              </tr>
            ) : (
              filteredRows.map((r, idx) => (
                <tr key={idx} className={isDark ? 'hover:bg-slate-800/40 transition-colors' : 'hover:bg-amber-50/50 transition-colors'}>
                  <td className={`p-2.5 text-center font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{idx + 1}</td>
                  <td className="p-2.5 tabular-nums">{r.date}</td>
                  <td className="p-2.5 font-bold text-[#FF8500]">{r.invoiceNo}</td>
                  <td className={`p-2.5 font-medium truncate max-w-[150px] ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>{r.supplier}</td>
                  <td className={`p-2.5 font-medium truncate max-w-[150px] ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{r.customer}</td>
                  <td className="p-2.5 text-right tabular-nums">{formatCurrencyINR(r.subTotal)}</td>
                  <td className="p-2.5 text-right tabular-nums">{formatCurrencyINR(r.totalGst)}</td>
                  <td className={`p-2.5 text-right font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrencyINR(r.grandTotal)}</td>
                  <td className="p-2.5 text-right tabular-nums text-indigo-500 font-medium">{formatCurrencyINR(r.tds)}</td>
                  <td className="p-2.5 text-right tabular-nums font-bold text-amber-500">
                    {formatCurrencyINR(r.receivable)}
                  </td>
                  <td className={`p-2.5 text-[11px] truncate max-w-[120px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`} title={r.paymentDates}>
                    {r.paymentDates}
                  </td>
                  <td className="p-2.5 text-right tabular-nums font-bold text-emerald-500">
                    {formatCurrencyINR(r.received)}
                  </td>
                  <td
                    className={`p-2.5 text-right tabular-nums font-bold ${
                      r.pending <= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {formatCurrencyINR(r.pending)}
                  </td>
                  <td className="p-2.5 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'Paid'
                          ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                          : r.status === 'Partially Paid'
                          ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-2.5 text-center relative">
                    <button
                      onClick={() =>
                        setActiveDropdownInv(activeDropdownInv === r.invoiceNo ? null : r.invoiceNo)
                      }
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Action Dropdown Menu */}
                    {activeDropdownInv === r.invoiceNo && (
                      <div
                        className={`absolute right-2 top-9 w-44 rounded-xl border shadow-2xl z-50 p-1 text-left ${
                          isDark ? 'bg-[#111928] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                        }`}
                      >
                        <button
                          onClick={() => {
                            setViewInvoice(r.originalInv);
                            setActiveDropdownInv(null);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg cursor-pointer ${
                            isDark ? 'text-sky-400 hover:bg-slate-800' : 'text-sky-600 hover:bg-slate-100'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                        <button
                          onClick={() => {
                            setEditTdsInv(r.originalInv);
                            setEditTdsValue(r.tds);
                            setActiveDropdownInv(null);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg cursor-pointer ${
                            isDark ? 'text-indigo-400 hover:bg-slate-800' : 'text-indigo-600 hover:bg-slate-100'
                          }`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit TDS</span>
                        </button>
                        <button
                          onClick={() => {
                            openAddPayment(r.invoiceNo, r.pending);
                            setActiveDropdownInv(null);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg cursor-pointer ${
                            isDark ? 'text-emerald-400 hover:bg-slate-800' : 'text-emerald-600 hover:bg-slate-100'
                          }`}
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Add Payment</span>
                        </button>
                        <button
                          onClick={() => {
                            setHistoryModalInv(r.invoiceNo);
                            setActiveDropdownInv(null);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg cursor-pointer ${
                            isDark ? 'text-amber-400 hover:bg-slate-800' : 'text-amber-600 hover:bg-slate-100'
                          }`}
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Payment History</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Details Modal */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className={`w-full max-w-3xl border rounded-2xl p-6 shadow-2xl transition-all ${cardBg}`}>
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <h4 className="font-bold text-base text-[#FF8500]">Invoice Details: {viewInvoice.invoiceNo}</h4>
              <button
                onClick={() => setViewInvoice(null)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs mb-4">
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0a0f1d] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h5 className="font-bold text-sky-500 mb-1">Supplier</h5>
                <p className="font-bold">{viewInvoice.fromCompany}</p>
                <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>{viewInvoice.fromAddress}</p>
                <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>GST: {viewInvoice.fromGst}</p>
              </div>
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0a0f1d] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h5 className="font-bold text-amber-500 mb-1">Customer</h5>
                <p className="font-bold">{viewInvoice.toCompany}</p>
                <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>{viewInvoice.toAddress}</p>
                <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>GST: {viewInvoice.toGst}</p>
              </div>
            </div>

            <div className={`overflow-x-auto rounded-xl border mb-4 text-xs ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <table className="w-full text-left">
                <thead className="bg-[#1A365D] text-white">
                  <tr>
                    <th className="p-2.5 text-center w-10">Sr</th>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5 text-center">HSN</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Rate</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className={isDark ? 'divide-y divide-slate-800 bg-[#0a0f1d]/60 text-slate-100' : 'divide-y divide-slate-200 bg-white text-slate-900'}>
                  {(viewInvoice.items || []).map((it, i) => (
                    <tr key={i}>
                      <td className={`p-2.5 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{i + 1}</td>
                      <td className="p-2.5 font-medium">{it.name}</td>
                      <td className="p-2.5 text-center">{it.hsn}</td>
                      <td className="p-2.5 text-center">{it.qtyVal}</td>
                      <td className="p-2.5 text-right tabular-nums">{formatCurrencyINR(it.rate)}</td>
                      <td className="p-2.5 text-right tabular-nums font-bold">{formatCurrencyINR(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={`flex justify-end gap-4 text-xs font-bold pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Subtotal: {formatCurrencyINR(viewInvoice.subTotal)}</span>
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Total GST: {formatCurrencyINR(viewInvoice.totalGst)}</span>
              <span className="text-[#FF8500] font-black">Grand Total: {formatCurrencyINR(viewInvoice.grandTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Edit TDS Modal */}
      {editTdsInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className={`w-full max-w-sm border rounded-2xl p-5 shadow-2xl transition-all ${cardBg}`}>
            <h4 className="font-bold text-sm text-[#FF8500] mb-2">Edit TDS Amount: {editTdsInv.invoiceNo}</h4>
            <div className="mb-4 text-xs">
              <label className={`block mb-1 ${labelClass}`}>TDS Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                value={editTdsValue}
                onChange={(e) => setEditTdsValue(parseFloat(e.target.value) || 0)}
                className={`w-full p-2 border rounded-lg ${inputClass}`}
              />
            </div>
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setEditTdsInv(null)}
                className={`px-3 py-1.5 rounded-lg font-semibold ${
                  isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTds}
                className="px-4 py-1.5 rounded-lg bg-[#FF8500] hover:bg-[#e07500] text-black font-bold cursor-pointer"
              >
                Update TDS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Payment Modal */}
      {paymentModalInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className={`w-full max-w-md border rounded-2xl p-6 shadow-2xl text-xs transition-all ${cardBg}`}>
            <h4 className="font-bold text-sm text-[#FF8500] mb-3">
              {existingPaymentId ? 'Edit Payment' : 'Record Received Payment'} for {paymentModalInv}
            </h4>

            <div className="space-y-3 mb-4">
              <div>
                <label className={`block mb-1 ${labelClass}`}>Payment Date *</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Received Amount (₹) *</label>
                <input
                  type="text"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="e.g. 50000 or 25000+25000"
                  className={`w-full p-2 border rounded-lg font-bold text-emerald-500 ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Payment Mode</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>UTR / Reference No.</label>
                <input
                  type="text"
                  value={payUtr}
                  onChange={(e) => setPayUtr(e.target.value)}
                  placeholder="Transaction UTR"
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Remark</label>
                <input
                  type="text"
                  value={payRemark}
                  onChange={(e) => setPayRemark(e.target.value)}
                  placeholder="Optional remark"
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPaymentModalInv(null)}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePayment}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
              >
                Save Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {historyModalInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className={`w-full max-w-2xl border rounded-2xl p-6 shadow-2xl text-xs transition-all ${cardBg}`}>
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <h4 className="font-bold text-sm text-[#FF8500]">Payment History for {historyModalInv}</h4>
              <button
                onClick={() => setHistoryModalInv(null)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`overflow-x-auto rounded-xl border mb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <table className="w-full text-left">
                <thead className="bg-[#1A365D] text-white">
                  <tr>
                    <th className="p-2.5 text-center">Date</th>
                    <th className="p-2.5 text-right">Amount</th>
                    <th className="p-2.5 text-center">Mode</th>
                    <th className="p-2.5">Ref / UTR</th>
                    <th className="p-2.5 text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className={isDark ? 'divide-y divide-slate-800 bg-[#0a0f1d]/60 text-slate-100' : 'divide-y divide-slate-200 bg-white text-slate-900'}>
                  {payments.filter((p) => p.invoiceNo === historyModalInv).length === 0 ? (
                    <tr>
                      <td colSpan={5} className={`p-6 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        No payments recorded yet for this invoice.
                      </td>
                    </tr>
                  ) : (
                    payments
                      .filter((p) => p.invoiceNo === historyModalInv)
                      .map((p, i) => (
                        <tr key={i} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                          <td className="p-2.5 text-center tabular-nums">{formatDateCustom(p.paymentDate)}</td>
                          <td className="p-2.5 text-right font-bold text-emerald-500 tabular-nums">
                            {formatCurrencyINR(p.receivedAmount)}
                          </td>
                          <td className="p-2.5 text-center font-medium">{p.paymentMode}</td>
                          <td className={`p-2.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{p.utr || '-'}</td>
                          <td className="p-2.5 text-center space-x-1">
                            <button
                              onClick={() => {
                                setHistoryModalInv(null);
                                openAddPayment(p.invoiceNo, 0, p.paymentId);
                              }}
                              className={`p-1 rounded transition-colors ${isDark ? 'text-amber-400 hover:bg-slate-800' : 'text-amber-600 hover:bg-slate-100'}`}
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePayment(p.paymentId)}
                              className={`p-1 rounded transition-colors ${isDark ? 'text-rose-400 hover:bg-slate-800' : 'text-rose-600 hover:bg-slate-100'}`}
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

            <div className="flex justify-end">
              <button
                onClick={() => setHistoryModalInv(null)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isDark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
