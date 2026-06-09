import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';
import { Profile, Transaction, FilterType } from './types';

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { session, user, loading, signUp, signIn, signOut };
}

export function useProfile(userId: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [isTrialExpired, setIsTrialExpired] = useState(false);

  useEffect(() => {
    if (!userId) { setProfile(null); setLoading(false); return; }
    supabase.from('profiles').select('*').eq('id', userId).single()
      .then(({ data }) => {
        setProfile(data as Profile);
        setLoading(false);
        if (data) {
          const start = new Date(data.trial_start_date);
          start.setHours(0, 0, 0, 0);
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          // Signup day is Day 1, so 7 days means 7 - diff days remaining (including today)
          const left = Math.max(0, 7 - diff);
          setTrialDaysLeft(left);
          setIsTrialExpired(left <= 0 && !data.is_subscribed);
        }
      });
  }, [userId]);

  const subscribe = useCallback(async () => {
    if (!userId) return;
    await supabase.from('profiles').update({ is_subscribed: true }).eq('id', userId);
    setIsTrialExpired(false);
    setProfile(p => p ? { ...p, is_subscribed: true } : p);
  }, [userId]);

  return { profile, loading, trialDaysLeft, isTrialExpired, subscribe };
}

export function useTransactions(userId: string | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchTransactions = useCallback(async () => {
    if (!userId) { setTransactions([]); setLoading(false); return; }
    let query = supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    const { data } = await query;
    setTransactions((data as Transaction[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    if (!userId) return;
    const { data } = await supabase.from('transactions').insert({ ...tx, user_id: userId }).select().single();
    if (data) setTransactions(prev => [data as Transaction, ...prev]);
    return data;
  }, [userId]);

  const deleteTransaction = useCallback(async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const filtered = transactions.filter(t => {
    switch (filter) {
      case 'today': return t.date === today;
      case 'cash': return t.payment_mode === 'cash';
      case 'online': return t.payment_mode === 'online';
      case 'income': return t.type === 'income';
      case 'expense': return t.type === 'expense';
      default: return true;
    }
  });

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const cashBalance = transactions.filter(t => t.payment_mode === 'cash').reduce((s, t) => s + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);
  const onlineBalance = transactions.filter(t => t.payment_mode === 'online').reduce((s, t) => s + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);

  return { transactions: filtered, allTransactions: transactions, loading, filter, setFilter, addTransaction, deleteTransaction, totalIncome, totalExpense, cashBalance, onlineBalance, fetchTransactions };
}

export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }, []);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 3;
    recognition.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setTranscript(t);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    try { recognition.start(); } catch { setIsListening(false); }
    setIsListening(true);
  }, []);

  const clearTranscript = useCallback(() => setTranscript(''), []);

  return { isListening, transcript, supported, startListening, clearTranscript };
}
