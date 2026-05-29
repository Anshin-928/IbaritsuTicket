# <img src="public/logo.svg" width="40" height="40" align="center" alt="Queuing Ticket System Logo">&nbsp;&nbsp;整理券発券システム

### 学園祭・イベント向けのリアルタイム順番待ち＆整理券発券システム。ブースごとの受付・呼び出し・モニター表示・QR整理券発行をワンストップで提供。

<p align="center">
  <img src="https://github.com/user-attachments/assets/526ec905-93bf-4cf7-b413-917d3e5fc903" width="49%" alt="Dashboard">
  <img src="https://github.com/user-attachments/assets/47b738d6-f56b-4bfd-b821-69fd3ecb6dea" width="49%" alt="Monitor">
  <img src="https://github.com/user-attachments/assets/4a7805d4-d486-42c2-b057-58c2d673d2d9" width="49%" alt="Reception">
  <img src="https://github.com/user-attachments/assets/1de25258-387c-43b7-aa54-a5ca4e7e284e" width="49%" alt="Ticket PDF">
</p>

---

## 概要

イベント会場の各ブースに受付端末（PC / タブレット）を設置し、**受付スタッフが来場者の情報を入力 → 管理画面から呼び出し**を行う順番待ちシステムです。

混雑時にブースごとの整理券を発行し、QR コード付き整理券で来場者が自分のスマホから順番をリアルタイムに確認できます。空いているときはシステムを介さずそのまま案内するため、運用負荷を最小限に抑えられます。

Supabase Realtime を活用し、呼び出し状況やモニター画面がリアルタイムに同期されます。

---

## 実運用実績
本システムは、実際の大型イベントにて情報理工学部オリター団が管轄する全ブースに導入され、計400名以上のお客様にご利用いただきました。
### 導入効果
- **最大3時間待ちの行列を解消:** 特に人気の高かったドローン体験ブース等において、物理的な待機列をなくし、通路の混雑やクレームを未然に防止。
- **来場者のUX向上:** 「列に縛られず、待ち時間に他のブースを楽しめる」という自由なイベント体験を提供。
- **現場オペレーションの最適化:** 複数ブースの待ち状況を一つのシステムで一元管理し、スタッフの案内負荷を大幅に軽減しました。
<p align="left">
  <img src="https://github.com/user-attachments/assets/84865421-e45d-442f-b9d3-47aaa3edde17" width="60%" alt="運営当日のモニター画面"/>
  <br>▲ 運営当日のモニター画面。リアルタイムで待ち組数が更新され、現場の混乱を防ぎました。</em>
</p>

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
IbaritsuTicket/
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
git clone https://github.com/Anshin-928/IbaritsuTicket.git
cd IbaritsuTicket
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
