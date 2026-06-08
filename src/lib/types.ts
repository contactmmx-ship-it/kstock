export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  payment_mode: string;
  person: string;
  date: string;
  time: string;
  location: string;
  notes: string;
  raw_input: string;
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  locality?: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  trial_start_date: string;
  is_subscribed: boolean;
  created_at: string;
}

export interface ParsedEntry {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  payment_mode: string;
  person: string;
  date: string;
  time: string;
  location: string;
  notes: string;
}

export type FilterType = 'all' | 'today' | 'cash' | 'online' | 'income' | 'expense';

export interface DailyCashbook {
  id: string;
  user_id: string;
  date: string;
  opening_balance: number;
  total_income: number;
  total_expense: number;
  closing_balance: number;
  created_at: string;
  updated_at: string;
}

export interface GPSLocation {
  latitude: number;
  longitude: number;
  city: string;
  locality: string;
  accuracy?: number;
}

export interface VoiceConfirmState {
  transcript: string;
  isConfirming: boolean;
  isEditing: boolean;
}
