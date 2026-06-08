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
