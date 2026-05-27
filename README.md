# <img src="public/logo.svg" width="40" height="40" align="center" alt="Queuing Ticket System Logo">&nbsp;&nbsp;Queuing Ticket System

### 学園祭・イベント向けの汎用リアルタイム順番待ち＆整理券発券システム。ブースごとの受付・呼び出し・モニター表示・QR整理券発行をワンストップで提供。

<p align="center">
  <!-- スクリーンショットを追加する場合はここに配置 -->
  <!-- <img src="https://github.com/user-attachments/assets/xxx" width="49%" alt="Dashboard"> -->
  <!-- <img src="https://github.com/user-attachments/assets/xxx" width="49%" alt="Monitor"> -->
  <!-- <img src="https://github.com/user-attachments/assets/xxx" width="49%" alt="Reception"> -->
  <!-- <img src="https://github.com/user-attachments/assets/xxx" width="49%" alt="Ticket PDF"> -->
</p>

---

## 概要

イベント会場の各ブースに受付端末（PC / タブレット）を設置し、**受付スタッフが来場者の情報を入力 → 管理画面から呼び出し**を行う順番待ちシステムです。

混雑時にブースごとの整理券を発行し、QR コード付き整理券で来場者が自分のスマホから順番をリアルタイムに確認できます。空いているときはシステムを介さずそのまま案内するため、運用負荷を最小限に抑えられます。

Supabase Realtime を活用し、呼び出し状況やモニター画面がリアルタイムに同期されます。

---

## 主な機能

### 受付画面（スタッフ操作）
- ブースごとの受付端末でスタッフが来場者の人数を入力・発券
- 人数選択（1〜10名）と受付ボタンのシンプルな UI

### 管理画面（スタッフ向け）
- ブース一覧：全ブースの状態をひと目で把握
- ダッシュボード：待ち・呼び出し中・保留チケットの管理、「次の方を呼ぶ」操作
- モニター画面：現在の呼び出し番号・待ち人数を大画面表示（Realtime 同期）
- 音声呼び出し：チケット呼び出し時の音声アナウンス対応

### 整理券 PDF 生成
- `@react-pdf/renderer` による A4 面付け印刷（4×4 = 16 枚 / ページ）
- QR コード付き：来場者がスマホで読み取り、順番をリアルタイム確認
- UUID ベースの URL で推測不可能なセキュアリンク

### 来場者向けチケット確認画面
- QR コードからアクセスし、自分の整理券のステータスをリアルタイム表示
- 「あと何組」の待ち状況を自動更新

### 来客統計
- 時間帯別の来場者数を棒グラフで可視化（Recharts）
- 日別切り替え対応

### 認証・セキュリティ
- Supabase Auth によるスタッフログイン
- Next.js Middleware で `/admin/*` を認証保護

---

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 16 (App Router), React 19, TypeScript |
| UI ライブラリ | Material UI (MUI) v7, Emotion |
| リアルタイム通信 | Supabase Realtime (Postgres Changes) |
| グラフ | Recharts |
| PDF 生成 | @react-pdf/renderer |
| QR コード | qrcode.react |
| バックエンド / DB | Supabase (PostgreSQL) |
| 認証 | Supabase Auth |
| デプロイ | Vercel |

---

## ディレクトリ構成

```
queuing-ticket-system/
├── app/
│   ├── admin/
│   │   ├── (home)/              # 管理トップ・ブース一覧
│   │   └── [booth_id]/
│   │       ├── dashboard/       # ブース管理ダッシュボード
│   │       ├── monitor/         # 呼び出しモニター画面
│   │       ├── tickets/         # 整理券 PDF 生成
│   │       ├── stats/           # 来客統計
│   │       ├── checkin/         # チェックイン
│   │       └── settings/        # ブース設定
│   ├── reception/[booth_id]/    # スタッフ操作の受付画面
│   ├── ticket/[ticket_id]/      # QR チケット確認画面
│   ├── login/                   # ログイン画面
│   └── layout.tsx               # ルートレイアウト
├── src/
│   ├── components/              # 共通 UI コンポーネント
│   ├── config/                  # メニュー設定等
│   ├── context/                 # React Context
│   ├── lib/                     # Supabase クライアント・ユーティリティ
│   └── types/                   # TypeScript 型定義
├── public/                      # 静的アセット（ロゴ・音声等）
└── middleware.ts                # 認証ミドルウェア
```

---

## セットアップ

### 前提条件
- Node.js 18 以上
- npm
- Supabase プロジェクト

### 1. リポジトリのクローン

```bash
git clone https://github.com/Anshin-928/queuing-ticket-system.git
cd queuing-ticket-system
```

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下を設定します。

```env
NEXT_PUBLIC_SUPABASE_URL      = your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY = your_supabase_anon_key
```

| 変数名 | 取得場所 |
|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト設定 > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase プロジェクト設定 > API |

### 4. データベースのセットアップ

Supabase の SQL エディタで `booths` テーブルと `tickets` テーブルを作成してください。スキーマの詳細は [CLAUDE.md](./CLAUDE.md) の「データベース設計」セクションを参照してください。

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開くと確認できます。

---

## スクリプト

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバーを起動（ホットリロード対応） |
| `npm run build` | 本番用ビルドを生成 |
| `npm run start` | 本番ビルドをローカルで起動 |
| `npm run lint` | ESLint によるコード検査 |

---

## 運用イメージ

```
┌───────────────────────────────────────────────────┐
│  イベント会場                                       │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ ブースA   │  │ ブースB   │  │ ブースC   │ ...     │
│  │ 受付端末  │  │ 受付端末  │  │ 受付端末  │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
│       │             │             │               │
│       └─────────────┼─────────────┘               │
│                     │                             │
│              ┌──────▼──────┐                      │
│              │  Supabase   │ ← リアルタイム同期      │
│              └──────┬──────┘                      │
│                     │                             │
│       ┌─────────────┼─────────────┐               │
│       │             │             │               │
│  ┌────▼─────┐  ┌────▼─────┐  ┌───▼──────┐         │
│  │ 管理画面  │  │ モニター   │  │ QRチケット│         │
│  │(スタッフ) │  │ (大画面)   │  │ (来場者) │         │
│  └──────────┘  └──────────┘  └──────────┘         │
└───────────────────────────────────────────────────┘
```

---

## デプロイ

Vercel に接続した GitHub リポジトリへのプッシュで自動デプロイされます。
環境変数は Vercel の Project Settings > Environment Variables に設定してください。
