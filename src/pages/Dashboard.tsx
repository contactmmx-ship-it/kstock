import {
  TrendingUp, Banknote, Wifi, Clock, ArrowUpRight, ArrowDownRight,
  Trash2, Download, Filter, LogOut, Crown, MapPin, MapPinOff, BookOpen
} from 'lucide-react';
import { useTransactions, useDailyCashbook } from '../lib/hooks';
import { useGPS } from '../lib/gps';
import { FilterType } from '../lib/types';
import SmartEntry from '../components/SmartEntry';
import Toast from '../components/Toast';
import ExportModal from '../components/ExportModal';
import { ParsedEntry } from '../lib/types';
import { useState, useCallback, useEffect } from 'react';

interface DashboardProps {
  userId: string;
  onSignOut: () => void;
  onSubscribe: () => void;
  trialDaysLeft: number;
  isTrialExpired: boolean;
  openingBalance: number;
}

export default function Dashboard({
  userId, onSignOut, onSubscribe, trialDaysLeft, isTrialExpired, openingBalance
}: DashboardProps) {
  const {
    transactions, allTransactions, filter, setFilter, addTransaction, deleteTransaction,
    totalIncome, totalExpense, cashBalance, onlineBalance, todayIncome, todayExpense,
  } = useTransactions(userId);

  const { upsertCashbook } = useDailyCashbook(userId);
  const { location: gpsLocation, permissionStatus, requestLocation } = useGPS();

  const [toast, setToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('Transaction Added Successfully');
  const [showFilters, setShowFilters] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // Auto-update daily cashbook whenever transactions change
  useEffect(() => {
    upsertCashbook(openingBalance, todayIncome, todayExpense);
  }, [openingBalance, todayIncome, todayExpense, upsertCashbook]);

  const handleAdd = useCallback(async (entry: ParsedEntry) => {
    await addTransaction({
      amount: entry.amount,
      type: entry.type,
      category: entry.category,
      payment_mode: entry.payment_mode,
      person: entry.person,
      date: entry.date,
      time: entry.time,
      location: entry.location,
      notes: entry.notes,
      raw_input: entry.notes,
    }, gpsLocation);
    setToastMsg('Transaction Added Successfully');
    setToast(true);
  }, [addTransaction, gpsLocation]);

  // ─── Date Header ────────────────────────────────────────────────────────────
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // ─── Daily cashbook calcs ────────────────────────────────────────────────────
  const closingBalance = openingBalance + todayIncome - todayExpense;

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'today', label: 'Today' },
    { key: 'cash', label: 'Cash' },
    { key: 'online', label: 'Online' },
    { key: 'income', label: 'Income' },
    { key: 'expense', label: 'Expense' },
  ];

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const recent = transactions.slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50">
      <Toast message={toastMsg} show={toast} onClose={() => setToast(false)} />
      {showExport && (
        <ExportModal transactions={allTransactions} onClose={() => setShowExport(false)} />
      )}

      {/* ── Header ── PRESERVED STRUCTURE, FK branding added ─────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-lg leading-tight block">FK CashFlow AI</span>
              <span className="text-xs text-slate-400 leading-tight -mt-0.5 block">Powered by FK</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* GPS Status */}
            {permissionStatus === 'granted' && gpsLocation ? (
              <span className="hidden sm:flex items-center gap-1 text-xs text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">
                <MapPin className="w-3 h-3" /> {gpsLocation.city}
              </span>
            ) : permissionStatus !== 'denied' && (
              <button
                onClick={requestLocation}
                className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                title="Enable GPS"
              >
                <MapPin className="w-4 h-4" />
              </button>
            )}
            {trialDaysLeft > 0 && !isTrialExpired && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-medium">
                {trialDaysLeft}d left
              </span>
            )}
            <button
              onClick={onSignOut}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auto Date & Day bar */}
        <div className="max-w-2xl mx-auto px-4 pb-2">
          <p className="text-xs text-slate-500">{dateStr}</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4 pb-20">

        {/* ── Trial Banner ── PRESERVED ──────────────────────────────────────── */}
        {trialDaysLeft > 0 && trialDaysLeft <= 3 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 animate-slide-up">
            <Crown className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">Trial expires in {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''}</p>
              <p className="text-xs text-amber-600">Subscribe to keep your data</p>
            </div>
            <button onClick={onSubscribe} className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-amber-700 transition-all">
              Upgrade
            </button>
          </div>
        )}

        {/* ── Daily Cashbook Summary ─────────────────────────────────────────── */}
        <div className="bg-blue-600 rounded-xl p-4 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-blue-200" />
            <span className="text-xs font-semibold text-blue-200 uppercase tracking-wide">Daily Cashbook</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-xs text-blue-200">Opening</p>
              <p className="text-sm font-bold text-white">{fmt(openingBalance)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-200">Income</p>
              <p className="text-sm font-bold text-emerald-300">+{fmt(todayIncome)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-200">Expense</p>
              <p className="text-sm font-bold text-red-300">-{fmt(todayExpense)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-200">Closing</p>
              <p className={`text-sm font-bold ${closingBalance >= 0 ? 'text-white' : 'text-red-300'}`}>{fmt(closingBalance)}</p>
            </div>
          </div>
        </div>

        {/* ── Stats Cards ── PRESERVED ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 animate-slide-up">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Total Income</span>
            </div>
            <p className="text-lg font-bold text-emerald-600">{fmt(totalIncome)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Total Expenses</span>
            </div>
            <p className="text-lg font-bold text-red-600">{fmt(totalExpense)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <Banknote className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Cash Balance</span>
            </div>
            <p className={`text-lg font-bold ${cashBalance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>{fmt(cashBalance)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wifi className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Online Balance</span>
            </div>
            <p className={`text-lg font-bold ${onlineBalance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>{fmt(onlineBalance)}</p>
          </div>
        </div>

        {/* ── Smart Entry ── PRESERVED ───────────────────────────────────────── */}
        <div className="animate-slide-up">
          <h2 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Smart Entry
            {permissionStatus === 'denied' && (
              <span className="ml-auto flex items-center gap-1 text-xs text-slate-400">
                <MapPinOff className="w-3 h-3" /> GPS off
              </span>
            )}
          </h2>
          <SmartEntry
            onSubmit={handleAdd}
            disabled={isTrialExpired}
            gpsLocation={gpsLocation}
            gpsStatus={permissionStatus}
            onRequestGPS={requestLocation}
          />
        </div>

        {/* ── Recent Transactions ── PRESERVED ──────────────────────────────── */}
        <div className="animate-slide-up">
          <h2 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Recent
          </h2>
          {recent.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <p className="text-slate-400 text-sm">No transactions yet</p>
              <p className="text-slate-400 text-xs mt-1">Add your first entry above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map(t => (
                <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3 shadow-sm">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    {t.type === 'income'
                      ? <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                      : <ArrowDownRight className="w-5 h-5 text-red-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {t.category.charAt(0).toUpperCase() + t.category.slice(1)}{t.person ? ` — ${t.person}` : ''}
                    </p>
                    <p className="text-xs text-slate-400">
                      {t.date} {t.time} {t.payment_mode === 'online' ? '| Online' : '| Cash'}
                      {(t as any).city ? ` | ${(t as any).city}` : ''}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{fmt(Number(t.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── All Transactions + Filters ── PRESERVED ───────────────────────── */}
        <div className="animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              All Transactions
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-all ${showFilters ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                <Filter className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowExport(true)}
                disabled={allTransactions.length === 0}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-all disabled:opacity-30"
                title="Export to Excel"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-2 mb-3 animate-fade-in">
              {filters.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filter === f.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {transactions.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <p className="text-slate-400 text-sm">No transactions found</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Mode</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Person</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Location</th>
                      <th className="py-2.5 px-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(t => (
                      <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-slate-800">{fmt(Number(t.amount))}</td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 capitalize">{t.category}</td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${t.payment_mode === 'online' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                            {t.payment_mode}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{t.person || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-500">{t.date}</td>
                        <td className="py-2.5 px-3 text-slate-500">{t.time}</td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {(t as any).city
                            ? <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-teal-500" />{(t as any).city}</span>
                            : t.location || '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => deleteTransaction(t.id)}
                            className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
