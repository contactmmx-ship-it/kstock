import { Transaction } from './types';

/**
 * Exports transactions to Excel-compatible XLSX using a data URI approach.
 * Uses the pre-existing XLSX library pattern or falls back to CSV with .xlsx extension.
 */

function escapeCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportToExcel(
  transactions: Transaction[],
  fromDate: string,
  toDate: string
): void {
  const filtered = transactions.filter(t => t.date >= fromDate && t.date <= toDate);

  const headers = ['Date', 'Type', 'Amount', 'Person', 'Category', 'Mode', 'Location', 'City', 'Locality', 'Notes'];

  const rows = filtered.map(t => [
    t.date,
    t.type,
    t.amount,
    t.person || '',
    t.category,
    t.payment_mode,
    t.location || '',
    (t as any).city || '',
    (t as any).locality || '',
    t.notes || '',
  ]);

  const csv = [
    headers.map(escapeCell).join(','),
    ...rows.map(r => r.map(escapeCell).join(',')),
  ].join('\n');

  const BOM = '\uFEFF'; // UTF-8 BOM for Excel to handle Hindi text
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTo = toDate.replace(/-/g, '');
  const safeFrom = fromDate.replace(/-/g, '');
  a.download = `FK_CashFlow_${safeFrom}_${safeTo}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
