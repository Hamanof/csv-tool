# CLAUDE.md — CSV加工Webアプリ プロジェクト固有ガイド

このファイルは、本プロジェクトで Claude Code に作業させるときの規約・前提を集約します。グローバルの `~/.claude/CLAUDE.md` のルールを引き継ぎつつ、本プロジェクト固有の決定事項を上書きします。

---

## 1. プロジェクト概要

- **目的**：個人利用のCSV加工Webアプリ。CSVをドラッグ＆ドロップで読み込み、列の選択・リネーム・並び順変更・値の変換（trim／正規表現置換）を施して新しいCSVとして出力する。
- **動作環境**：PCのWebブラウザ（最新 Chrome／Edge）
- **配置**：GitHub Pages 等の静的ホスティングへデプロイ。サーバーは持たない。
- **データの取り扱い**：機微情報を含むCSVも想定するため、**完全クライアントサイド処理**。ファイルはサーバーに送らない。
- **スケール**：100万行超／100MB以上のCSVも想定。

詳細仕様は [SPEC.md](./SPEC.md)、実装タスクは [TASKS.md](./TASKS.md) を参照。

---

## 2. 技術スタック早見表

| 用途 | 採用技術 |
|---|---|
| ビルド／開発サーバ | Vite |
| UI | React + TypeScript（strict）|
| スタイル | Tailwind CSS + shadcn/ui（必要分のみコピペ取込）|
| 状態管理 | Zustand |
| CSVパース | PapaParse（chunk ストリーミング）|
| 文字コード | TextDecoder（UTF-8）+ encoding-japanese（SJIS／CP932）|
| ZIP生成（拡張） | fflate |
| IndexedDB | Dexie.js |
| Worker通信 | Comlink |
| ドラッグ&ドロップ | react-dropzone |
| 並び替えUI | @dnd-kit/sortable |
| テスト | Vitest |

---

## 3. ディレクトリ構成と層の役割

```
src/
├── components/   # UIコンポーネント（React／DOM／Tailwind 依存OK）
├── hooks/        # Reactフック
├── store/        # Zustand store
├── core/         # ★ 純粋ロジック（DOM／React／Worker 非依存）
├── workers/      # Web Worker（core を呼ぶだけの薄い層）
├── db/           # Dexie インスタンスとテンプレートCRUD
├── types/        # 共通型定義
├── utils/        # 補助ユーティリティ
└── lib/          # shadcn 等の薄いヘルパー
```

### 層ごとのルール

- **`core/` は最も重要な制約**：DOM API、React、Worker API（`postMessage`、`self` 等）に依存しない。`File` も避け、`Uint8Array` や `string` で受け渡す。これにより、メインスレッドとWorkerの双方から再利用でき、Vitest で容易にテストできる。
- **`workers/` は core を呼ぶだけ**：ビジネスロジックを workers 内に書かない。Worker側で完結したいフロー制御（チャンクループ、進捗通知、キャンセル）のみここに置く。
- **`components/` は副作用を持たない**：データ変換は `core/` か `hooks/` 経由で。
- **`hooks/`**：副作用と状態管理の窓口。`useCsvWorker` は Comlink Proxy を保持し、メイン↔Worker の唯一の通信境界。

---

## 4. メインスレッドとWorkerの責務境界

### メインスレッド
- ファイル受領（D&D／クリック）
- 先頭100行のキャッシュとビフォア／アフタープレビュー
- ルール編集UI（即時アフター再変換）
- テンプレートのCRUD（Dexie）
- Worker 起動／進捗購読／キャンセル発火
- ダウンロード起動（`URL.createObjectURL` ＋ `<a download>`）

### Web Worker
- ファイルバイナリ読込（`File.stream()`）
- エンコーディング判定／デコード（ストリーム）
- CSVパース（PapaParse chunk）
- 変換パイプライン適用
- CSVシリアライズ／エンコード
- 進捗・エラーサマリ通知

### 重要原則
- **プレビューはWorker往復しない**：UI即応のためメインスレッドで完結。
- **フル処理は必ずWorker**：UIブロックを起こさない。
- **進捗通知は100msスロットリング**：再レンダ過多を防ぐ。

---

## 5. コーディング規約

### TypeScript
- `tsconfig.json` の `strict: true` を維持。`any` の濫用は禁止。
- 公開API（`core/` の関数、`workers/` のexpose）は型注釈を明示。
- 型は `src/types/` に集約し、相互参照しやすくする。

### React
- 関数コンポーネント＋フックのみ。クラスコンポーネントは使わない。
- 副作用を持つフックは命名で意図を明示（`useCsvWorker` など）。
- `useEffect` 依存配列は ESLint ルールに従う。

### スタイル
- 原則 Tailwind ユーティリティクラスを使う。
- shadcn/ui のコンポーネントは `src/components/ui/` にコピーして取り込む（バンドル肥大を避けるため必要なものだけ）。
- カスタムCSSは `src/index.css` の `@layer` のみ。

### 命名
- ファイル：`kebab-case.ts`（コンポーネントのみ `PascalCase.tsx`）
- 関数：`camelCase`、コンポーネント：`PascalCase`、型：`PascalCase`
- ストアは `xxxStore`、フックは `useXxx`、Worker関数は動詞始まり

### コメント・ドキュメント（重要）
- **すべてのドキュメント・コメントは日本語**で記述する（グローバル CLAUDE.md 準拠）。
- ただし「何をしているか」の説明はコードと識別子で表現し、過剰なコメントは付けない。
- 書くべきコメントは「なぜ」（非自明な理由、特殊な制約、回避策の根拠）に限定する。

### エラーハンドリング
- ユーザー入力境界（CSVパース、正規表現コンパイル、エンコーディング変換）では明示的にエラー捕捉して UI に通知。
- 内部関数間では Result 型を作るより throw → 上位で捕捉のシンプル方針。
- エラー行（列数不一致）は throw せず、サマリに集計して処理を継続。

### キャンセル
- 処理関数は `AbortSignal` を受け取り、ループ内で `signal.aborted` を確認する設計を徹底。
- リソースは `try/finally` で確実に解放（ストリーム reader、Blob URL、Worker など）。

---

## 6. テスト方針

- **`core/` 配下のピュア関数は必ずユニットテスト**を書く。変換ロジックのバグはデータ破損につながるため。
  - 変換（trim／regexReplace）：正常系、空文字、特殊文字、グループ参照
  - 列操作（select／rename／reorder）：基本、空配列、重複列名
  - エンコーディング（detect／decode／encode／bom）：UTF-8 BOM有無、Shift_JIS、境界バイト
  - CSV（parse／serialize／header）：クォート、改行、空セル、列数不一致
- **統合テスト**：fixture CSV（UTF-8／SJIS）でラウンドトリップ。
- **コンポーネント単位のテスト**：個人ツールのため省略可。
- **E2E**：拡張フェーズで `Playwright` を検討（任意）。

`tests/fixtures/` に小さな実物CSVを置き、テストコードとデータを分離する。

---

## 7. 開発フロー

```bash
# 開発
npm install
npm run dev          # Vite dev server

# テスト
npm run test         # Vitest watch
npm run test:run     # CI向け一発実行

# 型・Lint
npm run typecheck
npm run lint

# ビルド
npm run build
npm run preview      # ローカルでビルド成果物を確認

# デプロイ
# GitHub Actions が自動で GitHub Pages に公開
```

---

## 8. デプロイの注意点

- `vite.config.ts` の `base` 設定が必須（プロジェクトリポジトリの場合 `/csv-tool/` のようなサブパスを設定）。
- 環境変数（`VITE_BASE_URL` など）でローカルとPagesを切り替える。
- ビルド後に `npm run preview` で必ず動作確認してからデプロイする。
- Worker のパス解決は Vite の `?worker` 構文に任せる。手書きの `new Worker('/foo.js')` は禁止。

---

## 9. 「やらないこと」一覧（スコープ管理）

これらは MVP／拡張のいずれでも実装しない（ユーザーが明示的に依頼するまで）：

- 行のフィルタリング・並び替え・重複除去
- 列の分割・結合
- trim 以外のプリセット変換（全角↔半角、大文字↔小文字、日付フォーマットなど）
- JS 式や任意関数の評価
- カンマ以外の区切り文字（タブ・セミコロン）
- サーバーサイド処理・ファイルのアップロード
- 認証・複数ユーザー対応

これらが必要になったら、まずユーザーと合意の上で SPEC.md と TASKS.md を更新してから実装に入ること。

---

## 10. 既存コードを変更するときの確認事項

新規プロジェクトのため初期は該当しないが、コードが育ってきた段階で：

- `core/` の純粋性は維持されているか（DOM/React/Worker依存を持ち込んでいないか）
- 進捗通知のスロットリングを破っていないか
- キャンセル時のリソース解放（try/finally）を抜かしていないか
- 大容量で処理が止まらないか（行オブジェクトの保持時間が長くないか）
- `tsconfig` の strict を緩めていないか
