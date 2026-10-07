import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw, DollarSign } from 'lucide-react';
import { StorageService } from '../../utils/storage';
import { formatCurrencyINR } from '../../utils/formatters';

interface Props {
  theme: 'dark' | 'light';
}

export const ProfitLossModule: React.FC<Props> = ({ theme }) => {
  const [revenue, setRevenue] = useState(0);
  const [expensesTotal, setExpensesTotal] = useState(0);
  const [wagesTotal, setWagesTotal] = useState(0);
  const [lastUpdated, setLastUpdated] = useState('');

  const calculatePL = () => {
    const invoices = StorageService.getInvoices();
    const expenses = StorageService.getExpenses();
    const attendance = StorageService.getAttendance();

    const rev = invoices.reduce((s, i) => s + (parseFloat(String(i.grandTotal || 0)) || 0), 0);
    const exp = expenses.reduce((s, e) => s + (parseFloat(String(e.totalExpense || 0)) || 0), 0);
    const wages = attendance.reduce(
      (s, a) => s + (parseFloat(String(a.payment || 0)) || 0) + (parseFloat(String(a.extraPayment || 0)) || 0),
      0
    );

    setRevenue(rev);
    setExpensesTotal(exp);
    setWagesTotal(wages);
    setLastUpdated(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    calculatePL();
    window.addEventListener('nexxus_storage_updated', calculatePL);
    return () => window.removeEventListener('nexxus_storage_updated', calculatePL);
  }, []);

  const totalCost = expensesTotal + wagesTotal;
  const netProfit = revenue - totalCost;
  const marginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-[#111928] border-slate-800 text-slate-100 glow-card-dark' : 'bg-white border-slate-200 text-slate-900 glow-card-light';
  const subCardBg = isDark ? 'bg-[#0a0f1d] border-slate-800' : 'bg-slate-50 border-slate-200';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#FF8500] flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          <span>Real-Time Profit & Loss (P&L) Statement</span>
        </h3>
        <button
          onClick={calculatePL}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
            isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
          <span>Refresh P&L ({lastUpdated})</span>
        </button>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Revenue */}
        <div className={`p-5 rounded-2xl border border-emerald-500/40 shadow-sm transition-all ${cardBg}`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Total Revenue (Invoiced)</span>
            <span className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-500">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-500 font-mono">{formatCurrencyINR(revenue)}</div>
          <p className={`text-[11px] mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Aggregated from all generated client GST Tax Invoices</p>
        </div>

        {/* Total Cost */}
        <div className={`p-5 rounded-2xl border border-rose-500/40 shadow-sm transition-all ${cardBg}`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Total Expenses & Wages</span>
            <span className="p-1.5 rounded-full bg-rose-500/20 text-rose-500">
              <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-rose-500 font-mono">{formatCurrencyINR(totalCost)}</div>
          <p className={`text-[11px] mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Operations expenses: {formatCurrencyINR(expensesTotal)} | Labor wages: {formatCurrencyINR(wagesTotal)}
          </p>
        </div>

        {/* Net Profit */}
        <div className={`p-5 rounded-2xl border-2 border-[#FF8500] shadow-md transition-all ${cardBg}`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#FF8500] mb-2">
            <span>Net Operating Margin</span>
            <span className="px-2 py-0.5 rounded-full bg-[#FF8500]/20 text-[#FF8500] font-mono text-xs">
              {marginPercent.toFixed(1)}% Margin
            </span>
          </div>
          <div
            className={`text-3xl font-black font-mono ${
              netProfit >= 0 ? 'text-[#FF8500]' : 'text-rose-500'
            }`}
          >
            {formatCurrencyINR(netProfit)}
          </div>
          <p className={`text-[11px] mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Live computed bottom-line operational cashflow</p>
        </div>
      </div>

      {/* Financial Breakdown Section */}
      <div className={`p-6 rounded-2xl border shadow-sm ${cardBg}`}>
        <h4 className="font-bold text-sm text-[#FF8500] uppercase tracking-wider mb-4">
          Financial Statement Breakdown
        </h4>

        <div className="space-y-3 text-xs">
          <div className={`flex justify-between p-3.5 rounded-xl border ${subCardBg}`}>
            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Gross Client Billing (Taxable Value + GST)</span>
            <span className="font-mono font-bold text-emerald-500 text-sm">{formatCurrencyINR(revenue)}</span>
          </div>
          <div className={`flex justify-between p-3.5 rounded-xl border ${subCardBg}`}>
            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Direct Labor & Shift Wage Outflow</span>
            <span className="font-mono font-bold text-rose-500 text-sm">- {formatCurrencyINR(wagesTotal)}</span>
          </div>
          <div className={`flex justify-between p-3.5 rounded-xl border ${subCardBg}`}>
            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Administrative & Overhead Expenses</span>
            <span className="font-mono font-bold text-rose-500 text-sm">- {formatCurrencyINR(expensesTotal)}</span>
          </div>
          <div className={`flex justify-between p-4 rounded-xl border border-[#FF8500]/40 text-sm font-black ${
            isDark ? 'bg-[#0a0f1d]' : 'bg-amber-50/80'
          }`}>
            <span className="text-[#FF8500]">Net Business Earnings</span>
            <span className={`font-mono text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrencyINR(netProfit)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
