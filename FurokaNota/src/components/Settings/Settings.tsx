import { useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';

export function Settings() {
  const { ocrProvider, claudeApiKey, setOcrProvider, setClaudeApiKey } = useSettingsStore();
  const [apiKeyInput, setApiKeyInput] = useState(claudeApiKey);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setClaudeApiKey(apiKeyInput);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-6 space-y-6 max-w-lg">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700">OCRプロバイダ</h3>

        <div className="flex gap-3">
          {(['tesseract', 'claude'] as const).map(p => (
            <button
              key={p}
              onClick={() => setOcrProvider(p)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-colors ${
                ocrProvider === p
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {p === 'tesseract' ? '🔒 Tesseract (ローカル)' : '✨ Claude Vision (API)'}
            </button>
          ))}
        </div>

        {ocrProvider === 'tesseract' && (
          <p className="text-xs text-slate-500">
            Tesseract.jsを使ったオフラインOCR。APIキー不要ですが認識精度はClaudeより低い場合があります。
          </p>
        )}
        {ocrProvider === 'claude' && (
          <p className="text-xs text-slate-500">
            Anthropic Claude Vision APIを使った高精度OCR。APIキーが必要です。
          </p>
        )}
      </div>

      {ocrProvider === 'claude' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Anthropic APIキー</h3>
          <input
            type="password"
            value={apiKeyInput}
            onChange={e => setApiKeyInput(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <p className="text-xs text-slate-400">
            APIキーはlocalStorageにのみ保存されます。外部送信はOCR実行時のみです。
          </p>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
          >
            {saved ? '✓ 保存しました' : '保存'}
          </button>
        </div>
      )}

      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
        <p className="text-xs text-slate-500">
          <strong>FurokaNota</strong> — 家計簿アプリ<br />
          データはブラウザのIndexedDBに保存されます。外部サーバーへの送信は行いません（Claude OCR使用時を除く）。
        </p>
      </div>
    </div>
  );
}
