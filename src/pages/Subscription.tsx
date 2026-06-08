import { Crown, Lock, Zap, Shield, BarChart3 } from 'lucide-react';

interface SubscriptionPageProps {
  onSubscribe: () => void;
  trialDaysLeft?: number;
}

export default function SubscriptionPage({ onSubscribe }: SubscriptionPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center animate-slide-up">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-3xl mb-6">
          <Crown className="w-10 h-10 text-amber-500" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Trial Expired</h1>
        <p className="text-slate-400 mb-8 text-sm">
          Your 7-day free trial has ended. Subscribe to continue tracking your expenses.
        </p>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-8 h-8 text-amber-500" />
            <div className="text-left">
              <h2 className="text-white font-bold text-lg">ExpenseFlow Pro</h2>
              <p className="text-slate-400 text-xs">Unlimited access</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {[
              { icon: Zap, text: 'Unlimited AI-powered entries' },
              { icon: BarChart3, text: 'Advanced analytics & reports' },
              { icon: Shield, text: 'Secure cloud backup' },
              { icon: Crown, text: 'Priority support' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-left">
                <f.icon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="text-slate-300 text-sm">{f.text}</span>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <span className="text-3xl font-bold text-white">$9</span>
            <span className="text-slate-400 text-sm">/month</span>
          </div>

          <button
            onClick={onSubscribe}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 text-sm"
          >
            Subscribe Now
          </button>
        </div>

        <p className="text-slate-600 text-xs">
          Demo subscription — no real payment required
        </p>
      </div>
    </div>
  );
}
