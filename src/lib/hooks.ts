import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';
import { Profile, Transaction, FilterType, DailyCashbook, GPSLocation } from './types';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        trial_start_date: new Date().toISOString(),
        is_subscribed: false,
      });
    }

    return data;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) throw error;

    return data;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };
}

// ─── Profile ──────────────────────────────────────────────────────────────────
export function useProfile(userId: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [isTrialExpired, setIsTrialExpired] = useState(false);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        setProfile(data as Profile);
        setLoading(false);

        if (data) {
          const start = new Date(data.trial_start_date);
          const diff = Math.floor(
            (Date.now() - start.getTime()) / 86400000
          );

          const left = Math.max(0, 7 - diff);

          setTrialDaysLeft(left);
          setIsTrialExpired(
            left <= 0 && !data.is_subscribed
          );
        }
      });
  }, [userId]);

  const subscribe = useCallback(async () => {
    if (!userId) return;

    await supabase
      .from('profiles')
      .update({ is_subscribed: true })
      .eq('id', userId);

    setIsTrialExpired(false);

    setProfile((p) =>
      p ? { ...p, is_subscribed: true } : p
    );
  }, [userId]);

  return {
    profile,
    loading,
    trialDaysLeft,
    isTrialExpired,
    subscribe,
  };
}

// ─── Opening Balance ──────────────────────────────────────────────────────────
const OPENING_BALANCE_KEY = 'fk_opening_balance';
const OPENING_BALANCE_DATE_KEY =
  'fk_opening_balance_date';

export function useOpeningBalance() {
  const today = new Date()
    .toISOString()
    .split('T')[0];

  const [openingBalance, setOpeningBalanceState] =
    useState<number | null>(null);

  const [needsSetup, setNeedsSetup] =
    useState(false);

  useEffect(() => {
    const storedDate = localStorage.getItem(
      OPENING_BALANCE_DATE_KEY
    );

    const storedBalance = localStorage.getItem(
      OPENING_BALANCE_KEY
    );

    if (!storedBalance || storedDate === null) {
      setNeedsSetup(true);
      return;
    }

    setOpeningBalanceState(Number(storedBalance));
  }, [today]);

  const setOpeningBalance = useCallback(
    (amount: number) => {
      localStorage.setItem(
        OPENING_BALANCE_KEY,
        amount.toString()
      );

      localStorage.setItem(
        OPENING_BALANCE_DATE_KEY,
        today
      );

      setOpeningBalanceState(amount);
      setNeedsSetup(false);
    },
    [today]
  );

  const carryForwardClosing = useCallback(
    (closingBalance: number) => {
      localStorage.setItem(
        OPENING_BALANCE_KEY,
        closingBalance.toString()
      );
    },
    []
  );

  return {
    openingBalance,
    needsSetup,
    setOpeningBalance,
    carryForwardClosing,
  };
}

// ─── Transactions ─────────────────────────────────────────────────────────────
export function useTransactions(userId: string | null) {
  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [loading, setLoading] = useState(true);

  const [filter, setFilter] =
    useState<FilterType>('all');

  const fetchTransactions = useCallback(async () => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', {
        ascending: false,
      });

    setTransactions(
      (data as Transaction[]) || []
    );

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = useCallback(
    async (
      tx: Omit<
        Transaction,
        'id' | 'user_id' | 'created_at'
      >,
      gps?: GPSLocation | null
    ) => {
      if (!userId) return;

      let fixedType = tx.type;

      const notes = (
        tx.notes ||
        tx.raw_input ||
        ''
      ).toLowerCase();

      if (
        notes.includes('received') ||
        notes.includes('payment received') ||
        notes.includes('got')
      ) {
        fixedType = 'income';
      }

      if (
        notes.includes('paid') ||
        notes.includes('given') ||
        notes.includes('expense')
      ) {
        fixedType = 'expense';
      }

      const payload = {
        ...tx,
        type: fixedType,
        amount: Number(tx.amount),
        user_id: userId,
        latitude: gps?.latitude ?? null,
        longitude: gps?.longitude ?? null,
        city: gps?.city ?? null,
        locality: gps?.locality ?? null,
      };

      const { data } = await supabase
        .from('transactions')
        .insert(payload)
        .select()
        .single();

      if (data) {
        setTransactions((prev) => [
          data as Transaction,
          ...prev,
        ]);
      }

      return data;
    },
    [userId]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      setTransactions((prev) =>
        prev.filter((t) => t.id !== id)
      );
    },
    []
  );

  const today = new Date()
    .toISOString()
    .split('T')[0];

  const filtered = transactions.filter((t) => {
    switch (filter) {
      case 'today':
        return t.date === today;

      case 'cash':
        return t.payment_mode === 'cash';

      case 'online':
        return t.payment_mode === 'online';

      case 'income':
        return t.type === 'income';

      case 'expense':
        return t.type === 'expense';

      default:
        return true;
    }
  });

  const openingCash = Number(
    localStorage.getItem(
      'fk_opening_balance'
    ) || 0
  );

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce(
      (sum, t) =>
        sum + Number(t.amount),
      0
    );

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce(
      (sum, t) =>
        sum + Number(t.amount),
      0
    );

  const todayIncome = transactions
    .filter(
      (t) =>
        t.date === today &&
        t.type === 'income'
    )
    .reduce(
      (sum, t) =>
        sum + Number(t.amount),
      0
    );

  const todayExpense = transactions
    .filter(
      (t) =>
        t.date === today &&
        t.type === 'expense'
    )
    .reduce(
      (sum, t) =>
        sum + Number(t.amount),
      0
    );

  const cashBalance =
    openingCash +
    transactions
      .filter(
        (t) => t.payment_mode === 'cash'
      )
      .reduce((sum, t) => {
        return t.type === 'income'
          ? sum + Number(t.amount)
          : sum - Number(t.amount);
      }, 0);

  const onlineBalance = transactions
    .filter(
      (t) => t.payment_mode === 'online'
    )
    .reduce((sum, t) => {
      return t.type === 'income'
        ? sum + Number(t.amount)
        : sum - Number(t.amount);
    }, 0);

  return {
    transactions: filtered,
    allTransactions: transactions,
    loading,
    filter,
    setFilter,
    addTransaction,
    deleteTransaction,
    totalIncome,
    totalExpense,
    cashBalance,
    onlineBalance,
    todayIncome,
    todayExpense,
    fetchTransactions,
  };
}

// ─── Daily Cashbook ───────────────────────────────────────────────────────────
export function useDailyCashbook(
  userId: string | null
) {
  const [cashbook, setCashbook] =
    useState<DailyCashbook | null>(null);

  const today = new Date()
    .toISOString()
    .split('T')[0];

  const upsertCashbook = useCallback(
    async (
      opening: number,
      income: number,
      expense: number
    ) => {
      if (!userId) return;

      const closing =
        Number(opening) +
        Number(income) -
        Number(expense);

      const existing = cashbook;

      if (existing) {
        const { data } = await supabase
          .from('daily_cashbook')
          .update({
            total_income: income,
            total_expense: expense,
            closing_balance: closing,
            updated_at:
              new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (data) {
          setCashbook(
            data as DailyCashbook
          );
        }
      } else {
        const { data } = await supabase
          .from('daily_cashbook')
          .upsert(
            {
              user_id: userId,
              date: today,
              opening_balance: opening,
              total_income: income,
              total_expense: expense,
              closing_balance: closing,
            },
            {
              onConflict:
                'user_id,date',
            }
          )
          .select()
          .single();

        if (data) {
          setCashbook(
            data as DailyCashbook
          );
        }
      }
    },
    [userId, today, cashbook]
  );

  const fetchCashbook = useCallback(async () => {
    if (!userId) return;

    const { data } = await supabase
      .from('daily_cashbook')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    setCashbook(
      data as DailyCashbook | null
    );
  }, [userId, today]);

  useEffect(() => {
    fetchCashbook();
  }, [fetchCashbook]);

  return {
    cashbook,
    upsertCashbook,
    fetchCashbook,
  };
}

// ─── Voice Input ──────────────────────────────────────────────────────────────
export function useVoiceInput() {
  const [isListening, setIsListening] =
    useState(false);

  const [transcript, setTranscript] =
    useState('');

  const [supported, setSupported] =
    useState(false);

  const [error, setError] = useState('');

  useEffect(() => {
    setSupported(
      'SpeechRecognition' in window ||
        'webkitSpeechRecognition' in
          window
    );
  }, []);

  const startListening = useCallback(() => {
    const SR =
      (window as any)
        .SpeechRecognition ||
      (window as any)
        .webkitSpeechRecognition;

    if (!SR) return;

    setError('');

    const recognition = new SR();

    recognition.lang = 'hi-IN';

    recognition.interimResults = false;

    recognition.maxAlternatives = 1;

    recognition.onresult = (e: any) => {
      const t =
        e.results[0][0].transcript;

      setTranscript(t);
      setIsListening(false);
    };

    recognition.onerror = (e: any) => {
      setError(
        e.error || 'Voice error'
      );

      setIsListening(false);
    };

    recognition.onend = () =>
      setIsListening(false);

    recognition.start();

    setIsListening(true);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    supported,
    startListening,
    clearTranscript,
    error,
  };
}