# FK CashFlow AI — Upgrade Guide
> Upgrading ExpenseFlow AI → FK CashFlow AI

---

## Files Changed / Added

### Modified (drop-in replacements)
| File | Change |
|------|--------|
| `index.html` | Title → FK CashFlow AI |
| `src/App.tsx` | Opening balance flow added |
| `src/lib/types.ts` | GPS fields, DailyCashbook, VoiceConfirmState types |
| `src/lib/hooks.ts` | `useOpeningBalance`, `useDailyCashbook`, GPS in addTransaction, Hindi voice |
| `src/lib/parser.ts` | Fixed income/expense logic + full Hindi/Hinglish NLP |
| `src/pages/Auth.tsx` | FK CashFlow AI branding |
| `src/pages/Dashboard.tsx` | Date header, daily cashbook bar, GPS, export modal |
| `src/components/SmartEntry.tsx` | Voice confirm/edit/repeat flow, GPS indicator |

### New Files
| File | Purpose |
|------|---------|
| `src/lib/gps.ts` | GPS hook with reverse geocoding (OpenStreetMap) |
| `src/lib/export.ts` | Excel/CSV export with UTF-8 BOM for Hindi support |
| `src/components/OpeningBalanceModal.tsx` | First-launch opening balance dialog |
| `src/components/ExportModal.tsx` | Date-range picker + export UI |
| `supabase/migrations/20260608_fk_cashflow_full_schema.sql` | Full schema with all 6 tables |

---

## Supabase Setup

### Step 1 — Run the new migration
In your Supabase dashboard → SQL Editor → paste and run:
```
supabase/migrations/20260608_fk_cashflow_full_schema.sql
```

Or if you have the Supabase CLI:
```bash
supabase db push
```

### Step 2 — Add GPS columns to existing transactions table
If you already have data in `transactions`, run this ALTER:
```sql
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS locality TEXT;
```

---

## How to Deploy to Bolt.new

1. Open your project at https://bolt.new/~/sb1-9thxt2dp
2. In the file tree, replace each file with the contents from this upgrade
3. Run `npm install` (no new packages needed — all upgrades use existing deps)
4. Set your `.env`:
   ```
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```

---

## What Each Feature Does

### ✅ 1. Corrected Transaction Logic
- "Paid 500 to Amit" → **Expense** (money leaves you)
- "Received 2000 from Rajesh" → **Income** (money comes to you)
- Hindi: "500 amit ko diye" → **Expense**
- Hindi: "2000 receive hua" → **Income**

### ✅ 2. Opening Cash Balance
- First app launch shows a modal: "Enter today's opening cash balance"
- Stored in localStorage with date
- Next day: yesterday's closing auto-becomes today's opening

### ✅ 3. Daily Carry-Forward System
- Blue summary bar on dashboard: Opening | Income | Expense | Closing
- Synced to `daily_cashbook` table in Supabase

### ✅ 4. Auto Date & Day
- Header shows: "Monday, 8 June 2026" — updates from device time automatically

### ✅ 5. Voice Input Correction Flow
After speech recognition, 3 buttons appear:
- **Confirm** → saves the transaction
- **Edit** → mutes assistant, activates editable input, AI voice says "Please alter the message as you want"
- **Repeat** → re-triggers voice recording

### ✅ 6. GPS Location
- Requests permission on first use
- Attaches latitude, longitude, city, locality to every transaction
- Shows city name in header and transaction rows
- Uses OpenStreetMap Nominatim for reverse geocoding (free, no API key)

### ✅ 7. Branding
- App name: **FK CashFlow AI**
- Subtitle: **Powered by FK**
- Applied to header, auth page, loading screen, opening balance modal

### ✅ 8. Excel Export
- Click Download icon → ExportModal opens
- Pick From Date and To Date with calendar pickers
- Shows preview: row count, total income/expense, net
- Downloads as `FK_CashFlow_YYYYMMDD_YYYYMMDD.csv`
- UTF-8 BOM included so Excel shows Hindi text correctly
- Columns: Date · Type · Amount · Person · Category · Mode · Location · City · Locality · Notes

### ✅ 9. Hindi + Hinglish NLP
Full support for:
- "500 amit ko diye" → Expense ₹500, person: Amit
- "2000 receive hua" → Income ₹2000
- "rajesh se 500 mila" → Income ₹500, person: Rajesh
- "chai ke liye 50 cash diya" → Expense ₹50, category: food
- "salary aaya 25000" → Income ₹25000, category: salary
- "bijli bill 800 online" → Expense ₹800, category: utility, mode: online

### ✅ 10. Supabase Backend
6 tables: `profiles` · `transactions` · `daily_cashbook` · `gps_logs` · `voice_logs` · `exports`
All with Row Level Security policies.

### ✅ 11. Mobile Responsive
- max-w-2xl container, responsive grid, overflow-x-auto on table
- Existing Tailwind responsive classes preserved

### ✅ 12. Error Handling
- Voice errors shown inline
- GPS permission denied handled gracefully
- All async operations wrapped in try/catch
- Amount validation in opening balance modal

### ✅ 13. UI Preserved
- All existing animations: `animate-slide-up`, `animate-fade-in`, `animate-bounce-in`
- Existing color scheme: blue-600, emerald, red, amber
- Existing component structure: header → stats cards → smart entry → recent → table
- Existing filter buttons
- Only additions: FK branding text, daily cashbook bar, date header, GPS chip, export modal
