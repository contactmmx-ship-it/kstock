-- ═══════════════════════════════════════════════════════════════════
-- FK CashFlow AI — Full Database Schema
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. PROFILES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  trial_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_subscribed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_delete" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- ── 2. TRANSACTIONS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL DEFAULT 'other',
  payment_mode TEXT NOT NULL DEFAULT 'cash',
  person TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  time TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  raw_input TEXT NOT NULL DEFAULT '',
  -- GPS fields
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  city TEXT,
  locality TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select" ON transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert" ON transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update" ON transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_delete" ON transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- ── 3. DAILY CASHBOOK ────────────────────────────────────────────────
-- Yesterday's closing → today's opening (carry-forward system)
CREATE TABLE IF NOT EXISTS daily_cashbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  total_income NUMERIC NOT NULL DEFAULT 0,
  total_expense NUMERIC NOT NULL DEFAULT 0,
  closing_balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE daily_cashbook ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cashbook_select" ON daily_cashbook FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "cashbook_insert" ON daily_cashbook FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cashbook_update" ON daily_cashbook FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cashbook_delete" ON daily_cashbook FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_cashbook_user_date ON daily_cashbook(user_id, date);

-- ── 4. GPS LOGS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gps_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  city TEXT,
  locality TEXT,
  accuracy DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE gps_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gps_logs_select" ON gps_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "gps_logs_insert" ON gps_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gps_logs_delete" ON gps_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── 5. VOICE LOGS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS voice_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transcript TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('confirm', 'edit', 'repeat', 'submit')),
  parsed_amount NUMERIC,
  parsed_type TEXT,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE voice_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "voice_logs_select" ON voice_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "voice_logs_insert" ON voice_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "voice_logs_delete" ON voice_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── 6. EXPORTS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_date TEXT NOT NULL,
  to_date TEXT NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0,
  file_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exports_select" ON exports FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "exports_insert" ON exports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "exports_delete" ON exports FOR DELETE TO authenticated USING (auth.uid() = user_id);
