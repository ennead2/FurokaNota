import { createWorker } from 'tesseract.js';
import type { OcrProvider, OcrResult } from './types';

export class TesseractOcrProvider implements OcrProvider {
  async recognize(imageFile: File): Promise<OcrResult> {
    const worker = await createWorker('jpn+eng');

    try {
      const imageUrl = URL.createObjectURL(imageFile);
      const { data } = await worker.recognize(imageUrl);
      URL.revokeObjectURL(imageUrl);

      const text = data.text;
      return parseReceiptText(text);
    } finally {
      await worker.terminate();
    }
  }
}

function parseReceiptText(text: string): OcrResult {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Extract total amount — look for lines with 合計/total/TOTAL pattern
  let amount: number | undefined;
  const amountPatterns = [
    /合計[^\d]*([0-9,，]+)/,
    /小計[^\d]*([0-9,，]+)/,
    /TOTAL[^\d]*([0-9,，]+)/i,
    /お支払[^\d]*([0-9,，]+)/,
  ];

  for (const line of lines) {
    for (const pattern of amountPatterns) {
      const match = line.match(pattern);
      if (match) {
        amount = parseInt(match[1].replace(/[,，]/g, ''), 10);
        break;
      }
    }
    if (amount !== undefined) break;
  }

  // Extract date
  let date: string | undefined;
  const datePattern =
    /(\d{4})[年/\-](\d{1,2})[月/\-](\d{1,2})/;
  for (const line of lines) {
    const match = line.match(datePattern);
    if (match) {
      const y = match[1];
      const m = match[2].padStart(2, '0');
      const d = match[3].padStart(2, '0');
      date = `${y}-${m}-${d}`;
      break;
    }
  }

  // Extract store name — typically the first non-empty line
  const storeName = lines[0] || undefined;

  // Extract items — lines with a price-like pattern
  const itemPattern = /^(.+?)\s+([0-9,，]+)円?$/;
  const items = lines
    .map(line => {
      const match = line.match(itemPattern);
      if (match) {
        const price = parseInt(match[2].replace(/[,，]/g, ''), 10);
        if (!isNaN(price) && price > 0 && price < 1_000_000) {
          return { name: match[1].trim(), price };
        }
      }
      return null;
    })
    .filter((item): item is { name: string; price: number } => item !== null);

  return { amount, date, storeName, items };
}
