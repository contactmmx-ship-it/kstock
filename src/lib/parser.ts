import { ParsedEntry } from './types';

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  rent: ['rent', 'rikshaw rent', 'auto rent', 'room rent', 'house rent', 'shop rent', 'office rent', 'flat rent'],
  food: ['food', 'lunch', 'dinner', 'breakfast', 'tea', 'coffee', 'snack', 'chai', 'meal', 'restaurant', 'canteen', 'mess', 'burger', 'pizza', 'biryani', 'samosa'],
  transport: ['rikshaw', 'auto', 'cab', 'taxi', 'uber', 'ola', 'bus', 'metro', 'train', 'flight', 'petrol', 'diesel', 'fuel', 'travel', 'ticket', 'flight ticket'],
  shopping: ['shopping', 'clothes', 'shirt', 'pant', 'shoes', 'dress', 'amazon', 'flipkart', 'myntra', 'buy', 'purchase', 'ordered'],
  salary: ['salary', 'wage', 'pay', 'paycheck', 'stipend'],
  medical: ['medical', 'medicine', 'doctor', 'hospital', 'pharmacy', 'medical store', 'clinic', 'checkup', 'medicine bill'],
  education: ['education', 'school', 'college', 'tuition', 'course', 'book', 'fees', 'exam fee', 'tution'],
  entertainment: ['movie', 'game', 'party', 'outing', 'entertainment', 'netflix', 'spotify', 'subscription'],
  utility: ['electricity', 'water', 'gas', 'internet', 'wifi', 'phone', 'mobile recharge', 'bill', 'recharge', 'data plan'],
  business: ['business', 'dealer', 'client', 'customer', 'order', 'stock', 'material', 'supplier', 'wholesale', 'product'],
  gift: ['gift', 'donation', 'charity', 'tip', 'baksheesh'],
  insurance: ['insurance', 'premium', 'emi', 'loan', 'interest'],
  maintenance: ['repair', 'fix', 'maintenance', 'service', 'plumber', 'electrician', 'carpenter', 'painter'],
};

const INCOME_KEYWORDS = ['received', 'got', 'income', 'earned', 'salary', 'profit', 'credit', 'refund', 'returned', 'came', 'collected', 'recovered', 'paid to me', 'gave me', 'sent me', 'deposited'];
const EXPENSE_KEYWORDS = ['given', 'paid', 'spent', 'expense', 'bought', 'purchase', 'cost', 'gave', 'sent', 'transfer', 'bill', 'fee', 'charge', 'bought', 'ordering', 'ordered'];

const CASH_KEYWORDS = ['cash', 'hard cash', 'physical', 'in hand', 'by cash', 'in cash', 'cash payment'];
const ONLINE_KEYWORDS = ['online', 'upi', 'gpay', 'google pay', 'phonepe', 'phone pe', 'paytm', 'neft', 'rtgs', 'imps', 'bank transfer', 'net banking', 'card', 'credit card', 'debit card', 'swipe', 'qr', 'qr code', 'wire', 'online payment', 'upi id'];

const TIME_PATTERN = /(?:at\s+)?(\d{1,2})[:.](\d{2})\s*(am|pm)?/i;
const DATE_PATTERN = /(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)/i;
const DATE_PATTERN2 = /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/;
const TODAY_KEYWORDS = ['today', 'aj', 'aaj'];
const YESTERDAY_KEYWORDS = ['yesterday', 'kal'];



const PERSON_PATTERN = /(?:mr|ms|mrs|miss|sir|madam|shri|smt)\.?\s+([a-z]+)/i;
const PERSON_FROM = /(?:from|to|by|given\s+to|received\s+from|paid\s+to|sent\s+to)\s+(?:mr|ms|mrs|miss|sir|madam|shri|smt)\.?\s*([a-z]+)/i;
const PERSON_PLAIN = /(?:from|to|by|given\s+to|received\s+from|paid\s+to|sent\s+to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/;

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

function resolveType(input: string): 'income' | 'expense' {
  const lower = input.toLowerCase();
  const incomeScore = INCOME_KEYWORDS.reduce((s, k) => s + (lower.includes(k) ? 1 : 0), 0);
  const expenseScore = EXPENSE_KEYWORDS.reduce((s, k) => s + (lower.includes(k) ? 1 : 0), 0);
  if (incomeScore > expenseScore) return 'income';
  if (expenseScore > incomeScore) return 'expense';
  return 'expense';
}

function resolvePaymentMode(input: string): string {
  const lower = input.toLowerCase();
  if (ONLINE_KEYWORDS.some(k => lower.includes(k))) return 'online';
  if (CASH_KEYWORDS.some(k => lower.includes(k))) return 'cash';
  return 'cash';
}

function resolveCategory(input: string): string {
  const lower = input.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return category;
  }
  return 'other';
}

function resolvePerson(input: string): string {
  const m1 = input.match(PERSON_FROM);
  if (m1) return m1[1].charAt(0).toUpperCase() + m1[1].slice(1);
  const m2 = input.match(PERSON_PATTERN);
  if (m2) return m2[1].charAt(0).toUpperCase() + m2[1].slice(1);
  const m3 = input.match(PERSON_PLAIN);
  if (m3) return m3[1];
  return '';
}

function resolveLocation(input: string): string {
  const lower = input.toLowerCase();
  const locationWords = ['office', 'home', 'shop', 'market', 'mall', 'station', 'hospital', 'school', 'college', 'park', 'restaurant', 'hotel', 'bank', 'godown', 'warehouse', 'factory', 'site'];
  const found = locationWords.find(w => lower.includes(w));
  if (found) return found.charAt(0).toUpperCase() + found.slice(1);

  const atPattern = /(?:at|in)\s+([A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)*)\s*(?:on|for|at|in|by)/;
  const m = input.match(atPattern);
  if (m) return m[1];
  return '';
}

function resolveAmount(input: string): number {
  const patterns = [
    /(?:rs\.?|inr\.?|₹)\s*(\d+[\d,]*\.?\d*)/i,
    /(\d+[\d,]*\.?\d*)\s*(?:rs\.?|inr\.?|₹|rupees?)/i,
    /(?:add|received|got|paid|spent|gave|sent|cost|worth|for)\s+(\d+[\d,]*\.?\d*)/i,
    /(\d+[\d,]*\.?\d*)/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return parseFloat(m[1].replace(/,/g, ''));
  }
  return 0;
}

export function parseEntry(input: string): ParsedEntry {
  const amount = resolveAmount(input);
  const type = resolveType(input);
  const category = resolveCategory(input);
  const payment_mode = resolvePaymentMode(input);
  const person = resolvePerson(input);
  const date = resolveDate(input);
  const time = resolveTime(input);
  const location = resolveLocation(input);
  const notes = input.trim();

  return { amount, type, category, payment_mode, person, date, time, location, notes };
}
