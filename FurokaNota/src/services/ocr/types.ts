export interface OcrItem {
  name: string;
  price: number;
}

export interface OcrResult {
  amount?: number;
  date?: string;
  items: OcrItem[];
  storeName?: string;
}

export interface OcrProvider {
  recognize(imageFile: File): Promise<OcrResult>;
}
