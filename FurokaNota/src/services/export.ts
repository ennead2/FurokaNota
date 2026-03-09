import Papa from 'papaparse';
import type { Transaction } from '../types';

export function exportTransactionsToCSV(transactions: Transaction[]): void {
  const data = transactions.map(t => ({
    id: t.id,
    date: t.date,
    type: t.type === 'income' ? '収入' : '支出',
    amount: t.amount,
    category: t.category,
    note: t.note,
  }));

  const csv = Papa.unparse(data, { header: true });
  const bom = '\uFEFF'; // UTF-8 BOM for Excel
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `furokanota_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseTransactionsFromCSV(
  file: File
): Promise<Omit<Transaction, 'id'>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as Record<string, string>[];
          const transactions: Omit<Transaction, 'id'>[] = rows.map(row => ({
            date: row['date'] || row['日付'] || '',
            type: (row['type'] === '収入' || row['type'] === 'income')
              ? 'income'
              : 'expense',
            amount: Number(row['amount'] || row['金額'] || 0),
            category: row['category'] || row['カテゴリ'] || '',
            note: row['note'] || row['メモ'] || '',
            createdAt: Date.now(),
          }));
          resolve(transactions);
        } catch (e) {
          reject(e);
        }
      },
      error: reject,
    });
  });
}
