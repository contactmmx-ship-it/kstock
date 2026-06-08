import { useAuth, useProfile, useOpeningBalance } from './lib/hooks';
import AuthPage from './pages/Auth';
import Dashboard from './pages/Dashboard';
import SubscriptionPage from './pages/Subscription';
import OpeningBalanceModal from './components/OpeningBalanceModal';

function App() {
  const { user, loading, signUp, signIn, signOut } = useAuth();
  const { trialDaysLeft, isTrialExpired, subscribe } = useProfile(user?.id ?? null);
  const { openingBalance, needsSetup, setOpeningBalance } = useOpeningBalance();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading FK CashFlow AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuth={() => {}} signUp={signUp} signIn={signIn} />;
  }

  if (isTrialExpired) {
    return <SubscriptionPage onSubscribe={subscribe} trialDaysLeft={trialDaysLeft} />;
  }

  // First launch: ask for opening cash balance
  if (needsSetup) {
    return <OpeningBalanceModal onSet={setOpeningBalance} />;
  }

  return (
    <Dashboard
      userId={user.id}
      onSignOut={signOut}
      onSubscribe={subscribe}
      trialDaysLeft={trialDaysLeft}
      isTrialExpired={isTrialExpired}
      openingBalance={openingBalance ?? 0}
    />
  );
}

export default App;
