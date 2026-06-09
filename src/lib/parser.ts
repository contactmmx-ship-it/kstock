import { ParsedEntry } from './types';

// ─── Hindi number words ─────────────────────────────
const HINDI_NUMBERS: Record<string, number> = {
  'ek': 1, 'one': 1,
  'do': 2, 'two': 2,
  'teen': 3, 'three': 3,
  'char': 4, 'chaar': 4, 'four': 4,
  'paanch': 5, 'five': 5,
  'chhah': 6, 'chah': 6, 'six': 6,
  'saat': 7, 'seven': 7,
  'aath': 8, 'eight': 8,
  'nau': 9, 'nine': 9,
  'das': 10, 'ten': 10,
  'gyarah': 11, 'eleven': 11,
  'barah': 12, 'twelve': 12,
  'terah': 13, 'thirteen': 13,
  'chaudah': 14, 'fourteen': 14,
  'pandrah': 15, 'fifteen': 15,
  'solah': 16, 'sixteen': 16,
  'satrah': 17, 'seventeen': 17,
  'atharah': 18, 'eighteen': 18,
  'unnis': 19, 'nineteen': 19,
  'bees': 20, 'twenty': 20,
  'tees': 30, 'thirty': 30,
  'chalis': 40, 'forty': 40,
  'pachas': 50, 'fifty': 50,
  'sath': 60, 'sixty': 60,
  'sattar': 70, 'seventy': 70,
  'assi': 80, 'eighty': 80,
  'nabbe': 90, 'ninety': 90,
  'sau': 100, 'hundred': 100,
};

const HINDI_MULTIPLIERS: Record<string, number> = {
  'hazaar': 1000, 'hazár': 1000, 'hazar': 1000, 'thousand': 1000,
  'lakh': 100000, 'lac': 100000,
  'crore': 10000000, 'karod': 10000000, 'karor': 10000000,
};

function resolveHindiNumber(input: string): number | null {
  const lower = input.toLowerCase().trim();

  // Try patterns like "panch hazaar" or "do lakh" or "bees hazaar pachas"
  let total = 0;
  let found = false;
  const words = lower.split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    const w = words[i];

    if (HINDI_MULTIPLIERS[w]) {
      // Look back for a base number
      const prevNum = (i > 0 && HINDI_NUMBERS[words[i - 1]]) ? HINDI_NUMBERS[words[i - 1]] : 1;
      total += prevNum * HINDI_MULTIPLIERS[w];
      found = true;
    } else if (HINDI_NUMBERS[w]) {
      // Only add if next word is NOT a multiplier (handled above)
      if (i + 1 < words.length && HINDI_MULTIPLIERS[words[i + 1]]) {
        // Skip - will be handled in the multiplier case
      } else {
        total += HINDI_NUMBERS[w];
        found = true;
      }
    }
  }

  return found ? total : null;
}

// ─── Expense relevance check ─────────────────────────
const EXPENSE_RELATED = [
  // English
  'paid', 'spent', 'gave', 'received', 'got', 'bought', 'salary', 'rent', 'food',
  'transport', 'shopping', 'medical', 'education', 'bill', 'fee', 'charge', 'cost',
  'income', 'expense', 'earned', 'profit', 'credit', 'debit', 'refund', 'emi',
  'insurance', 'premium', 'loan', 'interest', 'purchase', 'ordered', 'ordering',
  'cash', 'online', 'upi', 'gpay', 'phonepe', 'paytm', 'card', 'rupees', 'rs',
  'money', 'payment', 'amount', 'due', 'recovery', 'collected', 'sent', 'transfer',
  'recharge', 'subscription', 'repair', 'maintenance', 'gift', 'donation',
  // Hindi/Hinglish
  'diya', 'diye', 'dene', 'lena', 'liya', 'liye', 'kharch', 'kharcha', 'kamaya',
  'aaya', 'aaye', 'gayi', 'gaye', 'paise', 'rupaye', 'rupaya', 'kitna', 'kitne',
  'judaa', 'kaaata', 'kat gaya', 'jama', 'jamá', 'deposit', 'nikla', 'nikle',
  'badha', 'badhe', 'ghata', 'ghate', 'munafa', 'faayda', 'fayda', 'nuksan',
  'bheja', 'bheje', 'mila', 'mile', 'prapt', 'vyay', 'aay', 'vitt',
  'lagan', 'bhugtan', 'dhan', 'kharid', 'bikri', 'vikray',
  'nagad', 'najadj', 'nakad', 'onlaain', 'online',
];

export function isExpenseRelated(input: string): boolean {
  const lower = input.toLowerCase().trim();
  if (!lower) return false;
  const words = lower.split(/\s+/);
  const matchCount = words.filter(w =>
    EXPENSE_RELATED.some(k => w === k || w.includes(k) || k.includes(w))
  ).length;
  const hasAmount = /\d+/.test(lower) || resolveHindiNumber(lower) !== null;
  return matchCount >= 1 || hasAmount;
}

export function getDayOfWeek(dateStr: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = new Date(dateStr + 'T00:00:00');
  return days[d.getDay()];
}

// ─── Categories ──────────────────────────────────────
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  rent: ['rent', 'kiraya', 'kiraaya', 'kiraye', 'lagaan', 'lagan', 'bhada',
    'rikshaw rent', 'auto rent', 'room rent', 'house rent', 'shop rent', 'office rent', 'flat rent',
    'makan kiraya', 'dukan kiraya', 'office kiraya'],
  food: ['food', 'khana', 'khaana', 'khaane', 'lunch', 'dinner', 'breakfast',
    'tea', 'chai', 'chaye', 'coffee', 'snack', 'nashta', 'meal',
    'restaurant', 'canteen', 'mess', 'dhaba', 'hotel',
    'burger', 'pizza', 'biryani', 'biryani', 'samosa', 'roti', 'dal', 'sabzi',
    'subzi', 'chole', 'bhature', 'paratha', 'dosa', 'idli', 'vada'],
  transport: ['rikshaw', 'rickshaw', 'auto', 'cab', 'taxi', 'uber', 'ola',
    'bus', 'metro', 'train', 'gaadi', 'gadi', 'car', 'bike',
    'flight', 'petrol', 'diesel', 'fuel', 'tel', 'travel', 'safar',
    'ticket', 'flight ticket', 'tareeq', 'sarani', 'yatra'],
  shopping: ['shopping', 'kapde', 'kapda', 'cloth', 'clothes', 'shirt', 'pant',
    'shoes', 'juta', 'jute', 'dress', 'amazon', 'flipkart', 'myntra',
    'buy', 'purchase', 'ordered', 'kharid', 'khareed', 'khareedi'],
  salary: ['salary', 'vetan', 'tankhwah', 'tankhwa', 'wage', 'pay', 'paycheck',
    'stipend', 'mazdoori', 'tankhwa', 'aay', 'income'],
  medical: ['medical', 'dawai', 'davaai', 'medicine', 'doctor', 'aspatal',
    'hospital', 'pharmacy', 'medical store', 'clinic', 'checkup',
    'ilaj', 'dawai', 'medicine bill', 'upchar'],
  education: ['education', 'school', 'college', 'tuition', 'tution', 'coaching',
    'course', 'book', 'kitab', 'fees', 'fee', 'exam fee', 'padhai', 'padhaai',
    'adhyayan', 'shiksha'],
  entertainment: ['movie', 'film', 'game', 'party', 'outing', 'entertainment',
    'netflix', 'spotify', 'subscription', 'manoranjan', 'tamasha'],
  utility: ['electricity', 'bijli', 'water', 'paani', 'gas', 'internet', 'wifi',
    'phone', 'mobile', 'recharge', 'bill', 'bill', 'data plan',
    'bijli bill', 'paani bill', 'phone recharge'],
  business: ['business', 'vyapar', 'dealer', 'client', 'customer', 'grahak',
    'order', 'stock', 'material', 'supplier', 'wholesale', 'product',
    'saamaan', 'mal', 'thok'],
  gift: ['gift', 'tohfa', 'donation', 'daan', 'charity', 'tip', 'baksheesh',
    'chanda', 'dena'],
  insurance: ['insurance', 'beema', 'premium', 'emi', 'loan', 'karja', 'interest',
    'byaaj', 'udhaar'],
  maintenance: ['repair', 'theek', 'fix', 'maintenance', 'service', 'marammat',
    'plumber', 'electrician', 'carpenter', 'painter', 'mistri'],
};

// ─── Income/Expense detection ───────────────────────
// Using weighted scoring with positional bias for better accuracy
const INCOME_KEYWORDS_WEIGHTED: [string, number][] = [
  // Strong income signals
  ['received', 3], ['mila', 3], ['mile', 3], ['liya', 3], ['liye', 3],
  ['aaya', 3], ['aaye', 3], ['prapt', 3], ['jama', 3], ['jamá', 3],
  ['income', 3], ['aay', 3], ['vitt aay', 3],
  // Medium income signals
  ['got', 2], ['earned', 2], ['kamaya', 2], ['salary', 2], ['vetan', 2],
  ['profit', 2], ['munafa', 2], ['faayda', 2], ['fayda', 2],
  ['credit', 2], ['crediterd', 2], ['refund', 2], ['returned', 2],
  ['came', 2], ['collected', 2], ['recovered', 2], ['bikri', 2], ['vikray', 2],
  ['deposited', 2], ['bhugtan mila', 2],
  // Weak income signals
  ['gave me', 1], ['paid to me', 1], ['sent me', 1], ['ne diya', 1],
];

const EXPENSE_KEYWORDS_WEIGHTED: [string, number][] = [
  // Strong expense signals
  ['paid', 3], ['diya', 3], ['diye', 3], ['dene', 3], ['bhugtan', 3],
  ['spent', 3], ['kharch', 3], ['kharcha', 3], ['vyay', 3],
  ['given', 3], ['gaye', 3], ['gayi', 3],
  // Medium expense signals
  ['bought', 2], ['kharid', 2], ['khareed', 2],
  ['purchase', 2], ['cost', 2], ['gave', 2], ['sent', 2], ['bheja', 2],
  ['expense', 2], ['bill', 2], ['fee', 2], ['charge', 2],
  ['nikaal', 2], ['nikla', 2], ['kaaata', 2], ['kat gaya', 2],
  ['ghata', 2], ['nuksan', 2], ['udhaar', 2],
  // Weak expense signals
  ['ordered', 1], ['ordering', 1], ['transfer', 1],
];

function resolveType(input: string): 'income' | 'expense' {
  const lower = input.toLowerCase();

  let incomeScore = 0;
  let expenseScore = 0;

  for (const [keyword, weight] of INCOME_KEYWORDS_WEIGHTED) {
    if (lower.includes(keyword)) incomeScore += weight;
  }

  for (const [keyword, weight] of EXPENSE_KEYWORDS_WEIGHTED) {
    if (lower.includes(keyword)) expenseScore += weight;
  }

  if (incomeScore > expenseScore) return 'income';
  if (expenseScore > incomeScore) return 'expense';
  return 'expense'; // Default to expense when ambiguous
}

// ─── Payment modes ──────────────────────────────────
const CASH_KEYWORDS = [
  'cash', 'hard cash', 'physical', 'in hand', 'by cash', 'in cash', 'cash payment',
  'nagad', 'najadj', 'nakad', 'naqd',
];
const ONLINE_KEYWORDS = [
  'online', 'upi', 'gpay', 'google pay', 'phonepe', 'phone pe', 'paytm',
  'neft', 'rtgs', 'imps', 'bank transfer', 'net banking',
  'card', 'credit card', 'debit card', 'swipe', 'qr', 'qr code',
  'wire', 'online payment', 'upi id',
  'onlaain', 'onlain',
];

function resolvePaymentMode(input: string): { mode: string; explicit: boolean } {
  const lower = input.toLowerCase();
  if (ONLINE_KEYWORDS.some(k => lower.includes(k))) return { mode: 'online', explicit: true };
  if (CASH_KEYWORDS.some(k => lower.includes(k))) return { mode: 'cash', explicit: true };
  return { mode: '', explicit: false };
}

// ─── Time/Date ──────────────────────────────────────
const TIME_PATTERN = /(?:at\s+)?(\d{1,2})[:.](\d{2})\s*(am|pm)?/i;
// Hindi time patterns: "2 baje", "2:30 baje", "sham 5 baje", "subah 8 baje"
const HINDI_TIME_PATTERN = /(?:sham|shaam|subah|dopahar|dopahar|raat)?\s*(\d{1,2})(?::(\d{2}))?\s*(baje|bajke|baje|am|pm)?/i;
const DATE_PATTERN = /(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)/i;
const DATE_PATTERN2 = /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/;
const TODAY_KEYWORDS = ['today', 'aj', 'aaj', 'aaji', 'ajj'];
const YESTERDAY_KEYWORDS = ['yesterday', 'kal'];

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function resolveDate(input: string): string {
  const lower = input.toLowerCase();
  if (TODAY_KEYWORDS.some(k => lower.includes(k))) return getTodayDate();
  if (YESTERDAY_KEYWORDS.some(k => lower.includes(k))) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  const months: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

  const m1 = input.match(DATE_PATTERN);
  if (m1) {
    const day = parseInt(m1[1]);
    const month = months[m1[2].substring(0, 3).toLowerCase()] || 1;
    const year = new Date().getFullYear();
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const m2 = input.match(DATE_PATTERN2);
  if (m2) {
    let year = parseInt(m2[3]);
    if (year < 100) year += 2000;
    const month = parseInt(m2[2]);
    const day = parseInt(m2[1]);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return getTodayDate();
}

function resolveTime(input: string): string {
  // Try Hindi time first
  const hm = input.match(HINDI_TIME_PATTERN);
  if (hm) {
    let hour = parseInt(hm[1]);
    const min = hm[2] ? parseInt(hm[2]) : 0;
    const lower = input.toLowerCase();
    // "sham" or "raat" implies PM, "subah" implies AM
    if (lower.includes('sham') || lower.includes('shaam') || lower.includes('raat')) {
      if (hour < 12) hour += 12;
    } else if (lower.includes('subah') || lower.includes('dopahar')) {
      if (hour === 12) hour = 0;
    }
    return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  const m = input.match(TIME_PATTERN);
  if (m) {
    let hour = parseInt(m[1]);
    const min = parseInt(m[2]);
    const ampm = m[3]?.toLowerCase();
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// ─── Category ───────────────────────────────────────
function resolveCategory(input: string): string {
  const lower = input.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return category;
  }
  return 'other';
}

// ─── Person ─────────────────────────────────────────
const PERSON_PATTERN = /(?:mr|ms|mrs|miss|sir|madam|shri|smt)\.?\s+([a-z]+)/i;
const PERSON_FROM = /(?:from|to|by|se|given\s+to|received\s+from|paid\s+to|sent\s+to|ke\s+liye|ko|ne)\s+(?:mr|ms|mrs|miss|sir|madam|shri|smt)\.?\s*([a-z]+)/i;
const PERSON_PLAIN = /(?:from|to|by|se|ko|ne|ke\s+liye|given\s+to|received\s+from|paid\s+to|sent\s+to)\s+([A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)?)/;

function resolvePerson(input: string): string {
  const m1 = input.match(PERSON_FROM);
  if (m1) return m1[1].charAt(0).toUpperCase() + m1[1].slice(1);
  const m2 = input.match(PERSON_PATTERN);
  if (m2) return m2[1].charAt(0).toUpperCase() + m2[1].slice(1);
  const m3 = input.match(PERSON_PLAIN);
  if (m3) return m3[1];
  return '';
}

// ─── Location ───────────────────────────────────────
function resolveLocation(input: string): string {
  const lower = input.toLowerCase();
  const locationWords = [
    'office', 'home', 'shop', 'market', 'mall', 'station', 'hospital',
    'school', 'college', 'park', 'restaurant', 'hotel', 'bank',
    'godown', 'warehouse', 'factory', 'site',
    'daftar', 'ghar', 'dukan', 'bazaar', 'mandi', 'aspatal', 'vidyalaya',
  ];
  const found = locationWords.find(w => lower.includes(w));
  if (found) return found.charAt(0).toUpperCase() + found.slice(1);

  const atPattern = /(?:at|in|me|par|pe)\s+([A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)*)\s*(?:on|for|at|in|by|ke|me|par|pe)/;
  const m = input.match(atPattern);
  if (m) return m[1];
  return '';
}

// ─── Amount ─────────────────────────────────────────
function resolveAmount(input: string): number {
  // Try Hindi number words first
  const hindiNum = resolveHindiNumber(input);
  if (hindiNum !== null && hindiNum > 0) return hindiNum;

  const patterns = [
    /(?:rs\.?|inr\.?|₹|rupaye|rupaya|rupee|rupiya)\s*(\d+[\d,]*\.?\d*)/i,
    /(\d+[\d,]*\.?\d*)\s*(?:rs\.?|inr\.?|₹|rupees?|rupaye|rupaya|rupiya)/i,
    /(?:add|received|got|paid|spent|gave|sent|cost|worth|for|diya|diye|liya|liye|mila|mile|di)\s+(\d+[\d,]*\.?\d*)/i,
    /(\d+[\d,]*\.?\d*)\s*(?:hazaar|hazar|lakh|lac|crore|karod|thousand)/i,
    /(\d+[\d,]*\.?\d*)/,
  ];

  for (const p of patterns) {
    const m = input.match(p);
    if (m) {
      let num = parseFloat(m[1].replace(/,/g, ''));
      const lower = input.toLowerCase();
      // Apply multiplier after the number
      const afterMatch = lower.substring(lower.indexOf(m[1]) + m[1].length).trim();
      const multWord = afterMatch.split(/\s+/)[0];
      if (HINDI_MULTIPLIERS[multWord]) {
        num *= HINDI_MULTIPLIERS[multWord];
      }
      return num;
    }
  }
  return 0;
}

// ─── Main parser ────────────────────────────────────
export function parseEntry(input: string): ParsedEntry {
  const amount = resolveAmount(input);
  const type = resolveType(input);
  const category = resolveCategory(input);
  const { mode: payment_mode, explicit: payment_mode_explicit } = resolvePaymentMode(input);
  const person = resolvePerson(input);
  const date = resolveDate(input);
  const day = getDayOfWeek(date);
  const time = resolveTime(input);
  const location = resolveLocation(input);
  const notes = input.trim();

  return { amount, type, category, payment_mode, payment_mode_explicit, person, date, day, time, location, notes };
}
