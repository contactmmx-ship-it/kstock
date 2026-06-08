import { useState } from 'react';
import { X, Download, Calendar } from 'lucide-react';
import { Transaction } from '../lib/types';
import { exportToExcel } from '../lib/export';

interface ExportModalProps {
  transactions: Transaction[];
  onClose: () => void;
}

export default function ExportModal({ transactions, onClose }: ExportModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const firstDay = new Date();
  firstDay.setDate(1);
  const defaultFrom = firstDay.toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(today);
  const [exported, setExported] = useState(false);

  const filtered = transactions.filter(t => t.date >= fromDate && t.date <= toDate);

  const handleExport = () => {
    exportToExcel(transactions, fromDate, toDate);
    setExported(true);
    setTimeout(() => { setExported(false); onClose(); }, 1500);
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Download className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Export Ledger</h3>
              <p className="text-xs text-slate-400">FK_CashFlow_[date].csv</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-all">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1" />From Date
              </label>
              <input
                type="date"
                value={fromDate}
                max={toDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1" />To Date
              </label>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                max={today}
                onChange={e => setToDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          {/* Summary */}
          {filtered.length > 0 ? (
            <div className="bg-slate-50 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-slate-600">{filtered.length} transactions in range</p>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Income</span>
                <span className="text-emerald-600 font-semibold">{fmt(totalIncome)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Expense</span>
                <span className="text-red-600 font-semibold">{fmt(totalExpense)}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-slate-200 pt-2">
                <span className="text-slate-700 font-medium">Net</span>
                <span className={`font-bold ${totalIncome - totalExpense >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {fmt(totalIncome - totalExpense)}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-slate-400 text-sm">No transactions in this range</p>
            </div>
          )}

          {/* Export columns info */}
          <p className="text-xs text-slate-400">
            Columns: Date · Type · Amount · Person · Category · Mode · Location · City · Locality · Notes
          </p>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={filtered.length === 0 || exported}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                exported
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40'
              }`}
            >
              <Download className="w-4 h-4" />
              {exported ? 'Exported!' : 'Download Excel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
