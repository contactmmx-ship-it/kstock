import { useState } from 'react';
import { Banknote, TrendingUp } from 'lucide-react';

interface OpeningBalanceModalProps {
  onSet: (amount: number) => void;
}

export default function OpeningBalanceModal({ onSet }: OpeningBalanceModalProps) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const val = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(val) || val < 0) {
      setError('Please enter a valid amount (0 or above)');
      return;
    }
    onSet(val);
  };

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-bounce-in">
        {/* Header */}
        <div className="bg-blue-600 rounded-t-2xl p-5 text-center">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-lg font-bold text-white">FK CashFlow AI</h1>
          <p className="text-blue-200 text-xs mt-0.5">Powered by FK</p>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-slate-500 text-xs text-center mb-1">{today}</p>
          <h2 className="text-base font-semibold text-slate-800 text-center mb-1">
            Enter Opening Cash Balance
          </h2>
          <p className="text-slate-400 text-xs text-center mb-4">
            How much cash do you have on hand right now?
          </p>

          <div className="relative mb-3">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Banknote className="w-5 h-5 text-slate-400" />
            </div>
            <span className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-600 font-semibold text-sm">₹</span>
            <input
              type="number"
              value={amount}
              onChange={e => { setAmount(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="0"
              className="w-full border border-slate-200 rounded-xl py-3 pl-14 pr-4 text-slate-800 text-lg font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs mb-3 text-center">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { setAmount('0'); setTimeout(handleSubmit, 10); }}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
            >
              Start with ₹0
            </button>
            <button
              onClick={handleSubmit}
              disabled={!amount}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-40"
            >
              Set Balance
            </button>
          </div>

          <p className="text-slate-400 text-xs text-center mt-3">
            This becomes today's opening balance. Tomorrow it auto-carries forward.
          </p>
        </div>
      </div>
    </div>
  );
}
