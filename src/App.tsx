import { useAuth, useProfile } from './lib/hooks';
import AuthPage from './pages/Auth';
import Dashboard from './pages/Dashboard';
import SubscriptionPage from './pages/Subscription';

function App() {
  const { user, loading, signUp, signIn, signOut } = useAuth();
  const { trialDaysLeft, isTrialExpired, subscribe } = useProfile(user?.id ?? null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading...</p>
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

  return (
    <Dashboard
      userId={user.id}
      onSignOut={signOut}
      onSubscribe={subscribe}
      trialDaysLeft={trialDaysLeft}
      isTrialExpired={isTrialExpired}
    />
  );
}

export default App;
