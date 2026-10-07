import React, { useState, useEffect } from 'react';
import {
  FileText,
  Eye,
  Plus,
  Trash2,
  Printer,
  Calendar,
  Building,
  Percent,
} from 'lucide-react';
import { CompanyRecord, TaxInvoice, InvoiceItem } from '../../types';
import { StorageService } from '../../utils/storage';
import { safeEvalMath, formatDateCustom } from '../../utils/formatters';
import { generateInvoicePDF, printBulkInvoices } from '../../utils/pdfGenerators';

interface TaxInvoiceModuleProps {
  companies: CompanyRecord[];
  theme: 'dark' | 'light';
}

export const TaxInvoiceModule: React.FC<TaxInvoiceModuleProps> = ({ companies, theme }) => {
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [searchInvNo, setSearchInvNo] = useState('');

  // Form State
  const [selectedFromComp, setSelectedFromComp] = useState('');
  const [selectedToComp, setSelectedToComp] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('NEX/26-27/001');
  const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0]);
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [gstPercent, setGstPercent] = useState<number>(18);
  const [applyTds, setApplyTds] = useState(false);
  const [globalUnit, setGlobalUnit] = useState('Qty');
  const [customUnit, setCustomUnit] = useState('');

  // Supplier Details
  const [fromName, setFromName] = useState('');
  const [fromAddress, setFromAddress] = useState('');
  const [fromGst, setFromGst] = useState('');
  const [fromPan, setFromPan] = useState('');
  const [fromEmail, setFromEmail] = useState('');

  // Customer Details
  const [toName, setToName] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [toGst, setToGst] = useState('');
  const [toPan, setToPan] = useState('');
  const [toEmail, setToEmail] = useState('');

  // Product Items
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      sr: 1,
      name: 'Manpower Supply & Facility Management Services',
      hsn: '9985',
      qtyVal: 1,
      rate: 150000,
      total: 150000,
    },
  ]);

  // Bulk Print State
  const [bulkFromNo, setBulkFromNo] = useState('');
  const [bulkToNo, setBulkToNo] = useState('');
  const [bulkCompany, setBulkCompany] = useState('');

  useEffect(() => {
    setInvoices(StorageService.getInvoices());
    const handler = () => setInvoices(StorageService.getInvoices());
    window.addEventListener('nexxus_storage_updated', handler);
    return () => window.removeEventListener('nexxus_storage_updated', handler);
  }, []);

  // Compute next invoice number automatically
  useEffect(() => {
    const d = invDate ? new Date(invDate) : new Date();
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const startYear = (month >= 4 ? year : year - 1).toString().slice(-2);
    const endYear = (month >= 4 ? year + 1 : year).toString().slice(-2);
    const fyPattern = `${startYear}-${endYear}`;

    let prefix = 'NEX';
    const cleanSup = selectedFromComp.toUpperCase();
    if (cleanSup.includes('BIK')) prefix = 'BIK';
    else if (cleanSup.includes('ZEP')) prefix = 'ZEP';
    else if (cleanSup.includes('SUP')) prefix = 'SUP';

    // Find highest sequence number for this prefix & FY
    let maxSeq = 0;
    invoices.forEach((inv) => {
      const invStr = String(inv.invoiceNo || '').toUpperCase();
      if (invStr.startsWith(prefix) && invStr.includes(fyPattern)) {
        const parts = invStr.split('/');
        if (parts.length > 0) {
          const num = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(num) && num > maxSeq) maxSeq = num;
        }
      }
    });

    const nextSeq = String(maxSeq + 1).padStart(3, '0');
    setInvoiceNo(`${prefix}/${fyPattern}/${nextSeq}`);
  }, [invDate, selectedFromComp, invoices]);

  // Set default supplier to NEXXUS FACILITY if available
  useEffect(() => {
    if (!selectedFromComp && companies.length > 0) {
      const nex = companies.find((c) => c.companyName.toUpperCase().includes('NEXXUS')) || companies[0];
      handleFromChange(nex.companyName);
    }
  }, [companies]);

  const handleFromChange = (compName: string) => {
    setSelectedFromComp(compName);
    const match = companies.find((c) => c.companyName.toLowerCase() === compName.toLowerCase());
    if (match) {
      setFromName(match.companyName);
      setFromAddress(match.address);
      setFromGst(match.gst);
      setFromPan(match.pan);
      setFromEmail(match.email);
    } else {
      setFromName(compName);
    }
  };

  const handleToChange = (compName: string) => {
    setSelectedToComp(compName);
    const match = companies.find((c) => c.companyName.toLowerCase() === compName.toLowerCase());
    if (match) {
      setToName(match.companyName);
      setToAddress(match.address);
      setToGst(match.gst);
      setToPan(match.pan);
      setToEmail(match.email);
    } else {
      setToName(compName);
    }
  };

  const updateItem = (idx: number, field: keyof InvoiceItem, val: any) => {
    const updated = [...items];
    (updated[idx] as any)[field] = val;

    if (field === 'qtyVal' || field === 'rate') {
      const qty = safeEvalMath(updated[idx].qtyVal);
      const rate = safeEvalMath(updated[idx].rate);
      updated[idx].total = qty * rate;
    }
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        sr: items.length + 1,
        name: '',
        hsn: '9985',
        qtyVal: 1,
        rate: 0,
        total: 0,
      },
    ]);
  };

  const removeItemRow = (idx: number) => {
    if (items.length === 1) return;
    setItems(
      items
        .filter((_, i) => i !== idx)
        .map((it, i) => ({
          ...it,
          sr: i + 1,
        }))
    );
  };

  // Tax calculations
  const subTotal = items.reduce((sum, item) => sum + (safeEvalMath(item.total) || 0), 0);
  const halfGst = gstPercent > 0 ? gstPercent / 2 : 0;
  const centralTax = gstPercent > 0 ? (subTotal * halfGst) / 100 : 0;
  const stateTax = gstPercent > 0 ? (subTotal * halfGst) / 100 : 0;
  const totalGst = Math.round(centralTax + stateTax);
  const tdsVal = applyTds ? (subTotal * 0.85) / 100 : 0;
  const grandTotal = Math.round(subTotal + totalGst - tdsVal);

  const activeUnitText = globalUnit === 'custom' ? customUnit || 'Qty' : globalUnit;

  const handleGenerateInvoice = () => {
    if (!fromName) {
      alert('Supplier name is required!');
      return;
    }
    if (!toName) {
      alert('Customer name is required!');
      return;
    }
    if (!periodFrom || !periodTo) {
      alert('Billing period (From & To date) is required!');
      return;
    }

    const billingPeriod = `${formatDateCustom(periodFrom)} To ${formatDateCustom(periodTo)}`;
    const invoiceObj: TaxInvoice = {
      invoiceNo,
      date: formatDateCustom(invDate),
      invoicePeriod: billingPeriod,
      fromCompany: fromName,
      fromAddress,
      fromGst,
      fromPan,
      fromEmail,
      toCompany: toName,
      toAddress,
      toGst,
      toPan,
      toEmail,
      subTotal,
      centralTax,
      stateTax,
      totalGst,
      tdsAmount: tdsVal,
      grandTotal,
      items,
    };

    StorageService.addInvoice(invoiceObj);
    setInvoices(StorageService.getInvoices());
    StorageService.addNotification(
      'Tax Invoice Created',
      `Invoice ${invoiceNo} generated for ${toName} with amount ₹ ${grandTotal.toLocaleString('en-IN')}`,
      'success'
    );

    generateInvoicePDF(invoiceObj, items, activeUnitText, false);
    alert('Tax Invoice Generated, Saved & Downloaded!');
  };

  const handlePreviewSearched = () => {
    if (!searchInvNo) {
      alert('Please enter Invoice Number to preview (e.g. NEX/26-27/001)');
      return;
    }
    const cleanSearch = searchInvNo.trim().toUpperCase();
    const found = invoices.find((inv) => inv.invoiceNo.toUpperCase() === cleanSearch);
    if (found) {
      generateInvoicePDF(found, found.items || [], 'Qty', true);
    } else {
      alert('Invoice not found with number: ' + searchInvNo);
    }
  };

  const handleBulkPrint = () => {
    if (!bulkFromNo && !bulkCompany) {
      alert('Please enter From Invoice No or select Customer Company!');
      return;
    }
    const filtered = invoices.filter((inv) => {
      if (bulkCompany && !inv.toCompany.toLowerCase().includes(bulkCompany.toLowerCase())) {
        return false;
      }
      if (bulkFromNo && inv.invoiceNo.toUpperCase() < bulkFromNo.toUpperCase()) {
        return false;
      }
      if (bulkToNo && inv.invoiceNo.toUpperCase() > bulkToNo.toUpperCase()) {
        return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      alert('No invoices match the specified criteria.');
      return;
    }

    printBulkInvoices(filtered);
  };

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-[#111928] border-slate-800 text-slate-100 glow-card-dark' : 'bg-white border-slate-200 text-slate-900 glow-card-light';
  const subCardBg = isDark ? 'bg-[#0a0f1d] border-slate-800' : 'bg-slate-50/90 border-slate-200';
  const inputClass = isDark
    ? 'bg-[#0a0f1d] border-slate-700 text-white focus:border-[#FF8500]'
    : 'bg-white border-slate-300 text-slate-900 focus:border-[#FF8500]';
  const labelClass = isDark ? 'text-slate-300 font-semibold' : 'text-slate-700 font-bold';

  return (
    <div className="space-y-5">
      {/* Top Bar with Preview Search */}
      <div className={`p-5 rounded-2xl border shadow-sm ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h3 className="text-lg font-bold text-[#FF8500] flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <span>Generate GST Tax Invoice</span>
          </h3>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchInvNo}
              onChange={(e) => setSearchInvNo(e.target.value)}
              placeholder="e.g. NEX/26-27/001"
              className={`px-3 py-1.5 border rounded-lg text-xs uppercase ${inputClass}`}
            />
            <button
              onClick={handlePreviewSearched}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF8500] hover:bg-[#e07500] text-black font-extrabold text-xs transition-colors cursor-pointer shadow-md"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview PDF</span>
            </button>
          </div>
        </div>

        {/* Master Selector Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 text-xs">
          <div>
            <label className={`block mb-1 ${labelClass}`}>From (Supplier)</label>
            <select
              value={selectedFromComp}
              onChange={(e) => handleFromChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${inputClass}`}
            >
              <option value="">-- Select Supplier --</option>
              {companies.map((c, i) => (
                <option key={i} value={c.companyName}>
                  {c.companyName} {c.plant ? `(${c.plant})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block mb-1 ${labelClass}`}>To (Customer)</label>
            <select
              value={selectedToComp}
              onChange={(e) => handleToChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${inputClass}`}
            >
              <option value="">-- Select Customer --</option>
              {companies.map((c, i) => (
                <option key={i} value={c.companyName}>
                  {c.companyName} {c.plant ? `(${c.plant})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block mb-1 ${labelClass}`}>Invoice Number (Auto)</label>
            <input
              type="text"
              readOnly
              value={invoiceNo}
              className={`w-full px-3 py-2 border rounded-lg font-bold text-center ${
                isDark ? 'bg-black/40 border-slate-800 text-[#FF8500]' : 'bg-slate-100 border-slate-200 text-[#FF8500]'
              }`}
            />
          </div>
          <div>
            <label className={`block mb-1 ${labelClass}`}>Invoice Date</label>
            <input
              type="date"
              value={invDate}
              onChange={(e) => setInvDate(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${inputClass}`}
            />
          </div>
        </div>

        {/* Supplier & Customer Details Split Card */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl mb-4 border text-xs ${subCardBg}`}>
          {/* Supplier Info */}
          <div className={`space-y-2 border-b md:border-b-0 md:border-r pb-3 md:pb-0 md:pr-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <h4 className="font-bold text-[#FF8500] uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" /> Supplier Information
            </h4>
            <div>
              <span className={`block mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Company Name:</span>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                className={`w-full p-1.5 border rounded font-bold uppercase ${inputClass}`}
              />
            </div>
            <div>
              <span className={`block mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Address:</span>
              <textarea
                rows={2}
                value={fromAddress}
                onChange={(e) => setFromAddress(e.target.value)}
                className={`w-full p-1.5 border rounded ${inputClass}`}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className={`block mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>GSTIN:</span>
                <input
                  type="text"
                  value={fromGst}
                  onChange={(e) => setFromGst(e.target.value)}
                  className={`w-full p-1.5 border rounded uppercase ${inputClass}`}
                />
              </div>
              <div>
                <span className={`block mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>PAN:</span>
                <input
                  type="text"
                  value={fromPan}
                  onChange={(e) => setFromPan(e.target.value)}
                  className={`w-full p-1.5 border rounded uppercase ${inputClass}`}
                />
              </div>
            </div>
            <div>
              <span className={`block mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Email:</span>
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                className={`w-full p-1.5 border rounded ${inputClass}`}
              />
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-2 md:pl-2">
            <h4 className="font-bold text-sky-500 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" /> Bill To Customer Details
            </h4>
            <div>
              <span className={`block mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Company Name:</span>
              <input
                type="text"
                value={toName}
                onChange={(e) => setToName(e.target.value)}
                className={`w-full p-1.5 border rounded font-bold uppercase ${inputClass}`}
              />
            </div>
            <div>
              <span className={`block mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Address:</span>
              <textarea
                rows={2}
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                className={`w-full p-1.5 border rounded ${inputClass}`}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className={`block mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>GSTIN:</span>
                <input
                  type="text"
                  value={toGst}
                  onChange={(e) => setToGst(e.target.value)}
                  className={`w-full p-1.5 border rounded uppercase ${inputClass}`}
                />
              </div>
              <div>
                <span className={`block mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>PAN:</span>
                <input
                  type="text"
                  value={toPan}
                  onChange={(e) => setToPan(e.target.value)}
                  className={`w-full p-1.5 border rounded uppercase ${inputClass}`}
                />
              </div>
            </div>
            <div>
              <span className={`block mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Email:</span>
              <input
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                className={`w-full p-1.5 border rounded ${inputClass}`}
              />
            </div>
          </div>
        </div>

        {/* Period and GST Settings Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-xs">
          <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${subCardBg}`}>
            <span className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              <Calendar className="w-4 h-4 text-[#FF8500]" /> Billing Period *
            </span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={periodFrom}
                onChange={(e) => setPeriodFrom(e.target.value)}
                className={`p-1.5 border rounded text-center ${inputClass}`}
              />
              <span className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>To</span>
              <input
                type="date"
                value={periodTo}
                onChange={(e) => setPeriodTo(e.target.value)}
                className={`p-1.5 border rounded text-center ${inputClass}`}
              />
            </div>
          </div>

          <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${subCardBg}`}>
            <span className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              <Percent className="w-4 h-4 text-[#FF8500]" /> Select GST %
            </span>
            <select
              value={gstPercent}
              onChange={(e) => setGstPercent(parseFloat(e.target.value))}
              className={`p-1.5 border rounded font-bold text-[#FF8500] ${inputClass}`}
            >
              <option value="18">18% (CGST 9% + SGST 9%)</option>
              <option value="12">12% (CGST 6% + SGST 6%)</option>
              <option value="5">5% (CGST 2.5% + SGST 2.5%)</option>
              <option value="28">28% (CGST 14% + SGST 14%)</option>
              <option value="0">0% (Tax Free / Exempt)</option>
            </select>
          </div>
        </div>

        {/* Products / Services Details Grid */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-sm text-[#FF8500]">Products / Services Details</h4>
            <div className="flex items-center gap-2 text-xs">
              <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Quantity Unit:</span>
              <select
                value={globalUnit}
                onChange={(e) => setGlobalUnit(e.target.value)}
                className={`px-2 py-1 border rounded ${inputClass}`}
              >
                <option value="Qty">Qty</option>
                <option value="Ton">Ton</option>
                <option value="Nos">Nos</option>
                <option value="Pcs">Pcs</option>
                <option value="Kg">Kg</option>
                <option value="custom">Other</option>
              </select>
              {globalUnit === 'custom' && (
                <input
                  type="text"
                  placeholder="Unit"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className={`w-16 px-2 py-1 border rounded text-center ${inputClass}`}
                />
              )}
            </div>
          </div>

          <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <table className="w-full text-xs text-left min-w-[700px]">
              <thead className="bg-[#1A365D] text-white font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-2.5 text-center w-12">Sr</th>
                  <th className="p-2.5">Name of Product / Service</th>
                  <th className="p-2.5 text-center w-28">HSN / SAC</th>
                  <th className="p-2.5 text-center w-28">Qty ({activeUnitText})</th>
                  <th className="p-2.5 text-right w-32">Rate (₹)</th>
                  <th className="p-2.5 text-right w-36">Total (₹)</th>
                  <th className="p-2.5 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className={isDark ? 'divide-y divide-slate-800 bg-[#0a0f1d]/60 text-slate-100' : 'divide-y divide-slate-200 bg-white text-slate-900'}>
                {items.map((it, idx) => (
                  <tr key={idx} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-amber-50/50'}>
                    <td className={`p-2 text-center font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{idx + 1}</td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={it.name}
                        onChange={(e) => updateItem(idx, 'name', e.target.value)}
                        placeholder="e.g. Manpower Services"
                        className={`w-full p-1.5 border rounded ${inputClass}`}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={it.hsn}
                        onChange={(e) => updateItem(idx, 'hsn', e.target.value)}
                        placeholder="9985"
                        className={`w-full p-1.5 border rounded text-center ${inputClass}`}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={it.qtyVal}
                        onChange={(e) => updateItem(idx, 'qtyVal', e.target.value)}
                        onBlur={() => {
                          const evaluated = safeEvalMath(it.qtyVal);
                          if (!isNaN(evaluated)) updateItem(idx, 'qtyVal', evaluated);
                        }}
                        className={`w-full p-1.5 border rounded text-center font-bold ${inputClass}`}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={it.rate}
                        onChange={(e) => updateItem(idx, 'rate', e.target.value)}
                        onBlur={() => {
                          const evaluated = safeEvalMath(it.rate);
                          if (!isNaN(evaluated)) updateItem(idx, 'rate', evaluated);
                        }}
                        placeholder="0.00"
                        className={`w-full p-1.5 border rounded text-right ${inputClass}`}
                      />
                    </td>
                    <td className={`p-2 text-right font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {parseFloat(String(it.total || 0)).toFixed(2)}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => removeItemRow(idx)}
                        className="p-1 rounded text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-2">
            <button
              onClick={addItemRow}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border font-bold text-xs transition-colors cursor-pointer ${
                isDark ? 'border-slate-700 bg-slate-800 text-white hover:bg-slate-700' : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-[#FF8500]" />
              <span>+ Add Item Row</span>
            </button>
          </div>
        </div>

        {/* Invoice Totals Card & Action */}
        <div className={`flex flex-col md:flex-row items-start justify-between gap-6 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="space-y-3">
            <label className={`flex items-center gap-2 cursor-pointer text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
              <input
                type="checkbox"
                checked={applyTds}
                onChange={(e) => setApplyTds(e.target.checked)}
                className="w-4 h-4 accent-[#FF8500] rounded"
              />
              <span>Apply TDS Deduction (0.85% of Taxable Subtotal)</span>
            </label>

            <button
              onClick={handleGenerateInvoice}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF8500] hover:bg-[#e07500] text-black font-extrabold text-sm transition-all shadow-xl cursor-pointer hover:scale-[1.01]"
            >
              <Printer className="w-5 h-5" />
              <span>GENERATE TAX INVOICE & DOWNLOAD PDF</span>
            </button>
          </div>

          {/* Detailed Summary Box */}
          <div
            className={`w-full md:w-80 p-4 rounded-xl border text-xs space-y-2 ${
              isDark ? 'bg-[#0a0f1d] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className={`flex justify-between ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <span>Sub Total (Taxable):</span>
              <span className={`font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>₹ {subTotal.toFixed(2)}</span>
            </div>
            <div className={`flex justify-between ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <span>Central Tax ({halfGst}%):</span>
              <span className={`tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>₹ {centralTax.toFixed(2)}</span>
            </div>
            <div className={`flex justify-between ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <span>State Tax ({halfGst}%):</span>
              <span className={`tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>₹ {stateTax.toFixed(2)}</span>
            </div>
            <div className={`flex justify-between pt-1 border-t text-[#FF8500] font-bold ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span>Total GST:</span>
              <span className="tabular-nums">₹ {totalGst.toFixed(2)}</span>
            </div>
            {applyTds && (
              <div className="flex justify-between text-rose-500 font-semibold">
                <span>Less: TDS @ 0.85%:</span>
                <span className="tabular-nums">- ₹ {tdsVal.toFixed(2)}</span>
              </div>
            )}
            <div className={`flex justify-between pt-2 border-t text-sm font-black ${isDark ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-900'}`}>
              <span>Grand Total:</span>
              <span className="text-[#FF8500] tabular-nums">₹ {grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- BULK INVOICES PRINT & DOWNLOAD ---------------- */}
      <div className={`p-5 rounded-2xl border shadow-sm ${cardBg}`}>
        <h4 className="font-bold text-base text-[#FF8500] flex items-center gap-2 mb-3">
          <Printer className="w-5 h-5" />
          <span>Bulk Invoices Print & Download</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs items-end">
          <div>
            <label className={`block mb-1 ${labelClass}`}>From Invoice No</label>
            <input
              type="text"
              value={bulkFromNo}
              onChange={(e) => setBulkFromNo(e.target.value)}
              placeholder="e.g. NEX/26-27/001"
              className={`w-full p-2 border rounded uppercase ${inputClass}`}
            />
          </div>
          <div>
            <label className={`block mb-1 ${labelClass}`}>To Invoice No (Optional)</label>
            <input
              type="text"
              value={bulkToNo}
              onChange={(e) => setBulkToNo(e.target.value)}
              placeholder="e.g. NEX/26-27/010"
              className={`w-full p-2 border rounded uppercase ${inputClass}`}
            />
          </div>
          <div>
            <label className={`block mb-1 ${labelClass}`}>Customer / Company</label>
            <input
              type="text"
              value={bulkCompany}
              onChange={(e) => setBulkCompany(e.target.value)}
              placeholder="Search customer"
              className={`w-full p-2 border rounded ${inputClass}`}
            />
          </div>
          <div>
            <button
              onClick={handleBulkPrint}
              className="w-full py-2.5 bg-[#FF8500] hover:bg-[#e07500] text-black font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-[1.01]"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoices</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
