import { useState, useRef, useCallback, useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { ClaudeOcrProvider } from '../../services/ocr/claudeOcr';
import { TesseractOcrProvider } from '../../services/ocr/tesseractOcr';
import type { OcrResult } from '../../services/ocr/types';
import { TransactionForm } from '../Transactions/TransactionForm';
import { useTransactionStore } from '../../stores/transactionStore';

export function ReceiptUploader() {
  const { ocrProvider, claudeApiKey } = useSettingsStore();
  const { addTransaction } = useTransactionStore();

  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [showForm, setShowForm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke object URL when preview changes or component unmounts (prevents memory leaks)
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  function handleFile(f: File) {
    setFile(f);
    setOcrResult(null);
    setError(null);
    setShowForm(false);
    setPreview(URL.createObjectURL(f));
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) handleFile(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRecognize() {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const provider =
        ocrProvider === 'claude'
          ? new ClaudeOcrProvider(claudeApiKey)
          : new TesseractOcrProvider();

      const result = await provider.recognize(file);
      setOcrResult(result);
      setShowForm(true);
    } catch (e) {
      setError((e as Error).message || 'OCR処理に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  const initialFormData = ocrResult
    ? {
        date: ocrResult.date || new Date().toISOString().slice(0, 10),
        amount: ocrResult.amount,
        note: ocrResult.storeName || '',
        type: 'expense' as const,
      }
    : undefined;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-xl">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-emerald-400 bg-emerald-50'
            : 'border-slate-300 hover:border-emerald-300 hover:bg-slate-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <p className="text-4xl mb-3">📷</p>
        <p className="text-sm font-medium text-slate-700">レシート画像をドロップ</p>
        <p className="text-xs text-slate-400 mt-1">またはクリックして選択</p>
        <p className="text-xs text-slate-300 mt-3">
          現在のOCR: {ocrProvider === 'claude' ? 'Claude Vision API' : 'Tesseract.js'}
        </p>
      </div>

      {/* Preview */}
      {preview && (
        <div className="space-y-4">
          <img
            src={preview}
            alt="レシートプレビュー"
            className="max-h-64 rounded-xl border border-slate-200 mx-auto"
          />
          <button
            onClick={handleRecognize}
            disabled={loading}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '認識中...' : '🔍 OCR実行'}
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* OCR result */}
      {ocrResult && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
          <h4 className="text-sm font-semibold text-slate-700">OCR結果</h4>
          {ocrResult.storeName && <p className="text-sm text-slate-600">店名: {ocrResult.storeName}</p>}
          {ocrResult.date && <p className="text-sm text-slate-600">日付: {ocrResult.date}</p>}
          {ocrResult.amount && (
            <p className="text-sm text-slate-600">合計: ¥{ocrResult.amount.toLocaleString()}</p>
          )}
          {ocrResult.items.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1">品目:</p>
              <ul className="text-xs text-slate-500 space-y-0.5">
                {ocrResult.items.map((item, i) => (
                  <li key={i}>{item.name} — ¥{item.price.toLocaleString()}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Transaction form pre-filled */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">収支に追加</h4>
          <TransactionForm
            initial={initialFormData}
            onSubmit={async (t) => {
              await addTransaction(t);
              setShowForm(false);
              setFile(null);
              setPreview(null); // triggers useEffect cleanup → revokeObjectURL
              setOcrResult(null);
              alert('収支を追加しました');
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}
    </div>
  );
}
