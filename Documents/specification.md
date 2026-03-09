# FurokaNota — 家計簿アプリ 仕様書

> 「流れ × ノート」をコンセプトにした、ブラウザで完結するローカル家計簿 Web アプリ

---

## 概要

| 項目 | 内容 |
|------|------|
| アプリ名 | FurokaNota |
| 種別 | SPA (Single Page Application) |
| データ保存先 | IndexedDB (ブラウザ内、外部サーバー不要) |
| URL (本番) | https://ennead2.github.io/FurokaNota/ |
| 動作環境 | モダンブラウザ (Chrome / Edge / Firefox / Safari) |

---

## 技術スタック

| 用途 | ライブラリ / バージョン |
|------|----------------------|
| フレームワーク | React 19 + TypeScript + Vite 7 |
| スタイリング | Tailwind CSS v4 (`@tailwindcss/vite`) |
| 状態管理 | Zustand v5 |
| DB (ローカル) | Dexie.js v4 (IndexedDB wrapper) |
| グラフ | Recharts v3 |
| CSV | PapaParse v5 |
| OCR (AI) | @anthropic-ai/sdk (Claude Vision API) |
| OCR (ローカル) | Tesseract.js v7 |
| ルーティング | React Router v7 |

---

## 画面構成

| パス | 画面名 | 説明 |
|------|--------|------|
| `/` | ダッシュボード | 月次サマリー・予算状況・グラフ3種 |
| `/transactions` | 収支一覧 | トランザクション管理・CSV 出力/インポート |
| `/budget` | 予算設定 | カテゴリ別月予算の設定・使用状況表示 |
| `/recurring` | 定期支出・収入 | 毎月固定の支出/収入の自動生成設定 |
| `/receipt` | レシート OCR | 画像アップロードで収支を自動入力 |
| `/settings` | 設定 | OCR プロバイダ切り替え・APIキー保存 |

---

## 機能仕様

### 1. 収支管理 (`/transactions`)

- 支出 / 収入のトランザクション追加・編集・削除
- 入力項目: 種別・日付・金額・カテゴリ・メモ
- 月別フィルタ + キーワード検索 (カテゴリ・メモ対象)
- CSV エクスポート: UTF-8 BOM 付き、Excel 対応
- CSV インポート: 日本語列名 (`日付`, `金額` 等) / 英語列名両対応

### 2. ダッシュボード (`/`)

- 表示月セレクタ (デフォルト: 当月)
- サマリーカード: 収入 / 支出 / 収支差
- 予算アラート: 設定月の予算がある場合に使用率バーを表示
- グラフ3種 (下記参照)

#### グラフ仕様

| グラフ | 種別 | 内容 |
|--------|------|------|
| 月次収支 | 棒グラフ (Recharts BarChart) | 直近12ヶ月の収入・支出を並列表示 |
| カテゴリ別支出 | 円グラフ (Recharts PieChart) | 選択月の支出をカテゴリ別に表示。4%以上のスライスに引き出し線付きラベル |
| 収支推移 | 折れ線グラフ (Recharts LineChart) | 直近12ヶ月の収入・支出・収支差を表示 |

> **タイムゾーン対応**: `toISOString()` ではなくローカル時刻メソッド (`getFullYear()` / `getMonth()`) で月文字列を生成し、JST 等の UTC オフセット環境での月ずれを防止。

### 3. 予算管理 (`/budget`)

- カテゴリ・月・上限金額の組み合わせで予算を設定
- 同一カテゴリ+月の設定は upsert (重複なし)
- 使用率プログレスバー: 80%以上で黄色、超過で赤 + 「超過!」バッジ

### 4. 定期支出・収入 (`/recurring`)

- 毎月固定の収支ルールを登録 (例: 家賃、給与)
- 入力項目: 項目名・種別・金額・毎月何日・カテゴリ・メモ
- 有効/無効トグルスイッチで一時停止可能
- アプリ起動時に当月分が未生成の場合、自動でトランザクションを生成 (冪等)
- 月末対応: `dayOfMonth=31` を指定した場合、当月の末日に自動補正
- 削除時: ルールのみ削除し、生成済みトランザクションは残存 (recurringId は null クリア)

### 5. レシート OCR (`/receipt`)

- 画像アップロード: クリック選択 / ドラッグ＆ドロップ対応
- OCR 実行後、結果 (店名・日付・合計金額・品目) を表示
- OCR 結果をトランザクション追加フォームに自動反映
- 画像プレビューの ObjectURL は useEffect でライフサイクル管理 (メモリリーク防止)

#### OCR プロバイダ

| プロバイダ | 実装 | 特徴 |
|-----------|------|------|
| `tesseract` | Tesseract.js (jpn+eng) | 完全オフライン、APIキー不要 |
| `claude` | Claude Vision API (`claude-opus-4-6`) | 高精度、Anthropic APIキー必要 |

Claude OCR: 送信前に Canvas で最大 2048px にリサイズ + JPEG 品質を段階的に下げて 4.5MB 以内に圧縮 (API の 5MB 制限対応)。

### 6. 設定 (`/settings`)

- OCR プロバイダ切り替え (tesseract / claude)
- Anthropic API キー入力・保存 (localStorage)
- 設定はページリロード後も維持

---

## データモデル

### Transaction

```ts
interface Transaction {
  id?: number;
  date: string;          // YYYY-MM-DD (ローカル時刻)
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
  createdAt: number;     // Unix timestamp (ms)
  recurringId?: number;  // 定期ルールから生成した場合にセット
}
```

### Category

```ts
interface Category {
  id?: number;
  name: string;
  type: 'income' | 'expense';
  color: string;         // hex color
}
```

### Budget

```ts
interface Budget {
  id?: number;
  categoryName: string;
  month: string;         // YYYY-MM
  limit: number;
}
```

### RecurringTransaction

```ts
interface RecurringTransaction {
  id?: number;
  name: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  dayOfMonth: number;    // 1–31
  note: string;
  isActive: boolean;
}
```

---

## DB スキーマ (Dexie.js)

| バージョン | 変更内容 |
|-----------|---------|
| v1 | transactions / categories / budgets テーブル作成 |
| v2 | recurringTransactions テーブル追加、transactions に recurringId インデックス追加 |

---

## デフォルトカテゴリ一覧

### 支出

| カテゴリ名 | カラー |
|-----------|--------|
| 食費 | #ef4444 |
| 交通費 | #f97316 |
| 娯楽 | #a855f7 |
| 日用品 | #3b82f6 |
| 医療 | #06b6d4 |
| 光熱費 | #eab308 |
| 通信費 | #84cc16 |
| 家賃 | #8b5cf6 |
| その他支出 | #6b7280 |

### 収入

| カテゴリ名 | カラー |
|-----------|--------|
| 給与 | #22c55e |
| 副収入 | #10b981 |
| その他収入 | #14b8a6 |

> 既存 DB に不足しているデフォルトカテゴリは、アプリ起動時に自動追加される。カテゴリ表示順は `DEFAULT_CATEGORIES` の定義順に従い、ユーザー追加カテゴリは末尾に表示。

---

## 既知の注意事項

| 項目 | 内容 |
|------|------|
| Claude OCR のセキュリティ | `dangerouslyAllowBrowser: true` を使用。APIキーがブラウザのネットワークトラフィックに露出する。個人利用を前提とした設計。 |
| React StrictMode | 開発環境では useEffect が2回実行される。`seedDefaultCategories` はモジュールレベルの Promise シングルトンで重複シードを防止。 |
| SPA ルーティング | GitHub Pages は SPA のサブルートを直接開くと 404 になるため、`404.html` に `index.html` をコピーして対応。 |

---

## プロジェクト構成

```
FurokaNota/
├── .github/workflows/deploy.yml  # GitHub Pages 自動デプロイ
├── Documents/
│   └── specification.md          # 本仕様書
└── FurokaNota/                   # Vite アプリ本体
    ├── src/
    │   ├── types/index.ts
    │   ├── services/
    │   │   ├── db.ts
    │   │   ├── export.ts
    │   │   └── ocr/
    │   ├── stores/
    │   │   ├── transactionStore.ts
    │   │   ├── budgetStore.ts
    │   │   ├── recurringStore.ts
    │   │   └── settingsStore.ts
    │   └── components/
    │       ├── Layout/
    │       ├── Dashboard/
    │       ├── Transactions/
    │       ├── Charts/
    │       ├── Budget/
    │       ├── Recurring/
    │       ├── Receipt/
    │       └── Settings/
    ├── package.json
    └── vite.config.ts
```
