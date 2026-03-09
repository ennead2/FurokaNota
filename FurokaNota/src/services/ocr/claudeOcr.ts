import Anthropic from '@anthropic-ai/sdk';
import type { OcrProvider, OcrResult } from './types';

const MAX_BYTES = 4.5 * 1024 * 1024; // 4.5 MB (Claude limit is 5 MB base64-decoded)
const MAX_DIMENSION = 2048;

/** Resize and compress an image so it fits within Claude's 5 MB limit. */
async function compressImage(file: File): Promise<{ base64: string; mediaType: 'image/jpeg' }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      // Try decreasing quality until under MAX_BYTES
      let quality = 0.85;
      const tryEncode = () => {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataUrl.split(',')[1];
        if (base64.length * 0.75 <= MAX_BYTES || quality <= 0.3) {
          resolve({ base64, mediaType: 'image/jpeg' });
        } else {
          quality -= 0.1;
          tryEncode();
        }
      };
      tryEncode();
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('画像の読み込みに失敗しました')); };
    img.src = url;
  });
}

export class ClaudeOcrProvider implements OcrProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async recognize(imageFile: File): Promise<OcrResult> {
    const client = new Anthropic({
      apiKey: this.apiKey,
      dangerouslyAllowBrowser: true,
    });

    const { base64, mediaType } = await compressImage(imageFile);
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: `このレシート画像を解析して、以下のJSON形式で情報を抽出してください。
日本語のレシートに対応しています。
必ずJSONのみを返してください（コードブロックなし）。

{
  "storeName": "店名（不明なら null）",
  "date": "YYYY-MM-DD形式の日付（不明なら null）",
  "amount": 合計金額の数値（不明なら null）,
  "items": [
    { "name": "商品名", "price": 価格の数値 }
  ]
}`,
            },
          ],
        },
      ],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      const parsed = JSON.parse(text);
      return {
        storeName: parsed.storeName ?? undefined,
        date: parsed.date ?? undefined,
        amount: parsed.amount ?? undefined,
        items: Array.isArray(parsed.items) ? parsed.items : [],
      };
    } catch {
      return { items: [] };
    }
  }
}
