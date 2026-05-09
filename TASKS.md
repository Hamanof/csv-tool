# TASKS.md — CSV加工Webアプリ 実装計画

仕様の詳細は [SPEC.md](./SPEC.md)、設計判断・コーディング規約は [CLAUDE.md](./CLAUDE.md) を参照。

---

## 全体スケジュール（目安）

| フェーズ | 内容 | 工数目安 |
|---|---|---|
| MVP（M1〜M6） | 単一ファイル処理／基本機能一式／デプロイ | 約8〜13人日 |
| 拡張（E1〜E4） | 複数ファイル一括／インポート・エクスポート／自動検出／チューニング | 約4〜7人日 |
| **合計** |  | **約12〜20人日** |

個人プロジェクトのため厳密な期日は設けず、フェーズ単位で達成すれば良い。

---

## MVP フェーズ

### M1: プロジェクト基盤（0.5〜1日）

#### 完了条件
- `npm run dev` で空のReactアプリが起動する
- `npm run build` がエラーなく完了する
- `npm run test` で初期テスト（hello world 程度）が通る
- ESLint／Prettier／TypeScript strict が機能する

#### タスク
- [ ] M1-1: `npm create vite@latest csv-tool -- --template react-ts` でプロジェクト初期化
- [ ] M1-2: TypeScript `strict: true`、`noUncheckedIndexedAccess: true` を `tsconfig.json` に追加
- [ ] M1-3: ESLint + Prettier 設定（`@typescript-eslint`／`eslint-plugin-react-hooks`）
- [ ] M1-4: Tailwind CSS 導入（`tailwindcss`、`postcss`、`autoprefixer`）。`tailwind.config.ts` で `content` を設定
- [ ] M1-5: shadcn/ui のセットアップと最低限のコンポーネント取込（`button`、`dialog`、`progress`、`toast`、`tabs`、`input`、`select`）
- [ ] M1-6: Vitest 導入。`vitest.config.ts`、サンプルテストを1本書いて通すこと
- [ ] M1-7: 推奨ディレクトリ構成を空ディレクトリ＋README で作成
- [ ] M1-8: `vite.config.ts` で Worker のバンドル動作確認（`?worker` 構文の sample）
- [ ] M1-9: `package.json` の scripts 整備（`dev`／`build`／`preview`／`test`／`test:run`／`typecheck`／`lint`）

#### 依存関係
なし（最初のフェーズ）

---

### M2: CSV基本処理ロジック（2〜3日）

#### 完了条件
- `core/` 配下のピュア関数がすべて実装され、ユニットテストが通る
- UTF-8 / Shift_JIS の小さなCSVを読込→変換→出力できる（コンソールレベルで確認）

#### タスク
- [ ] M2-1: `src/types/` に共通型を定義
  - `Rule`、`Pipeline`、`Template`、`OutputColumn`、`EncodingType`、`ProgressEvent`、`ErrorRow`
- [ ] M2-2: `src/core/encoding/bom.ts`：BOM判定とBOM除去・付与
- [ ] M2-3: `src/core/encoding/detect.ts`：UTF-8/Shift_JIS 自動判定（encoding-japanese 利用）
- [ ] M2-4: `src/core/encoding/decode.ts`：ストリーミングデコーダ（UTF-8 stream＋SJIS バイト境界処理）
- [ ] M2-5: `src/core/encoding/encode.ts`：エンコーダ（出力時）
- [ ] M2-6: `src/core/csv/parse.ts`：PapaParse の薄いラッパー（chunk モード対応）
- [ ] M2-7: `src/core/csv/serialize.ts`：行配列→CSV文字列（クォート処理含む）
- [ ] M2-8: `src/core/csv/header.ts`：1行ヘッダの抽出（拡張で複数行対応の余地を残す）
- [ ] M2-9: `src/core/columns/select.ts`：列の選択・除外
- [ ] M2-10: `src/core/columns/rename.ts`：列のリネーム
- [ ] M2-11: `src/core/columns/reorder.ts`：列の並び順変更
- [ ] M2-12: `src/core/pipeline/transformers/trim.ts`：trim 変換
- [ ] M2-13: `src/core/pipeline/transformers/regexReplace.ts`：正規表現置換変換
- [ ] M2-14: `src/core/pipeline/compile.ts`：ルール配列→関数チェーン
- [ ] M2-15: `src/core/pipeline/apply.ts`：行ごとに適用
- [ ] M2-16: 各ファイルに対応するユニットテスト
  - 正常系・空文字・特殊文字・グループ参照（regex）
  - BOM有無、Shift_JIS 境界バイト
  - 列数不一致のCSV
- [ ] M2-17: `tests/fixtures/` に小さな実物CSV（UTF-8、Shift_JIS、ヘッダのみ、1行のみ等）を準備

#### 依存関係
M1 完了後

---

### M3: Worker 統合（1〜2日）

#### 完了条件
- Worker が起動し、メインスレッドから Comlink Proxy 経由で `process(file, ...)` が呼べる
- 進捗イベントがメインへ流れる
- キャンセルが機能する

#### タスク
- [ ] M3-1: Comlink を導入（`comlink`）
- [ ] M3-2: `src/workers/csv.worker.api.ts` で公開API型を定義
- [ ] M3-3: `src/workers/csv.worker.ts` 雛形（`Comlink.expose`）
- [ ] M3-4: Worker側のフル処理パイプライン実装（core/ を呼ぶだけの薄い層）
- [ ] M3-5: 進捗イベント発火（処理済みバイト／全体バイト、100msスロットリング）
- [ ] M3-6: AbortController によるキャンセル機構
  - `signal.aborted` をチャンクループ毎に確認
  - `parser.abort()`、`reader.cancel()`、Blob URL の `revokeObjectURL`
  - try/finally で確実なリソース解放
- [ ] M3-7: エラー行（列数不一致）の集計
- [ ] M3-8: `src/hooks/useCsvWorker.ts`：Comlink Proxy 管理フック
- [ ] M3-9: 統合テスト：fixture CSV を入れて Worker 経由で処理→出力一致を確認

#### 依存関係
M2 完了後

---

### M4: UI 実装（2〜3日）

#### 完了条件
- 1画面レイアウトでファイル投入から出力ダウンロードまで一連の操作ができる
- ビフォア／アフタープレビューが先頭100行表示され、ルール変更で即時更新される
- 進捗ダイアログとキャンセルボタンが動作する

#### タスク
- [ ] M4-1: `App.tsx` のルートレイアウト（ヘッダ／左サイド／右プレビュー）
- [ ] M4-2: `components/upload/DropZone.tsx`：react-dropzone 利用
- [ ] M4-3: `components/csv-config/EncodingSelector.tsx`：自動判定結果表示＋手動切替
- [ ] M4-4: `components/csv-config/HeaderConfig.tsx`：MVP は固定（先頭1行ヘッダ）。UI上は読み取り専用表示でOK
- [ ] M4-5: `components/csv-config/ColumnMapping.tsx`：列選択・リネーム・並び順
  - チェックボックス（選択／除外）
  - インライン編集（リネーム）
  - DnD（@dnd-kit/sortable で並び順）
- [ ] M4-6: `components/rules/RuleEditor.tsx`：列ごとの変換パイプライン編集
  - ルール追加（trim／regex）
  - ルール削除
  - ルール順序入れ替え（DnD）
- [ ] M4-7: `components/rules/TrimRuleItem.tsx`、`RegexRuleItem.tsx`
  - regex は `pattern`／`replacement`／`flags`（g、i のチェックボックス）
  - 不正な正規表現はリアルタイムバリデーション
- [ ] M4-8: `components/preview/PreviewTable.tsx`：ビフォア／アフター並列、先頭100行
- [ ] M4-9: `usePreview` フック：先頭100行のキャッシュ管理＋ルール変更で即時再変換
- [ ] M4-10: `components/progress/ProgressDialog.tsx`：進捗バー＋キャンセルボタン
- [ ] M4-11: `components/summary/ErrorSummary.tsx`：エラー行サマリ表示
- [ ] M4-12: ダウンロード起動（`utils/download.ts`：Blob → `<a download>` クリック）
- [ ] M4-13: `utils/filename.ts`：`<base>_processed.csv` 自動命名
- [ ] M4-14: Zustand store 設計
  - `configStore`：列マッピング・ルール
  - `fileStore`：投入ファイル・先頭100行キャッシュ
  - `uiStore`：進捗・ダイアログ状態・エラーサマリ
- [ ] M4-15: 主要画面のキーボード操作確認

#### 依存関係
M3 完了後

---

### M5: テンプレート機能（1〜2日）

#### 完了条件
- テンプレートを保存・読込・削除でき、ブラウザ再起動後も保持される
- テンプレート読込時に列名照合が行われ、未マッチ列は警告表示される

#### タスク
- [ ] M5-1: Dexie 導入（`dexie`）と `src/db/dexie.ts` でインスタンス作成
- [ ] M5-2: `db.version(1).stores('templates')` のスキーマ定義
- [ ] M5-3: `src/db/templates.ts`：CRUD 関数（list、get、save、delete）
- [ ] M5-4: `src/hooks/useTemplates.ts`：CRUD 操作のラッパー
- [ ] M5-5: `components/templates/TemplateList.tsx`：テンプレート一覧
- [ ] M5-6: `components/templates/SaveTemplateDialog.tsx`：名前入力＋同名警告
- [ ] M5-7: テンプレート読込時の列名厳密一致照合ロジック（`core/columns/match.ts`）
- [ ] M5-8: 未マッチ列の警告UI（toast または専用ダイアログ）
- [ ] M5-9: テンプレートの ID 採番（`crypto.randomUUID()`）
- [ ] M5-10: ユニットテスト：列名照合ロジック

#### 依存関係
M4 完了後

---

### M6: 仕上げ・デプロイ（0.5〜1日）

#### 完了条件
- GitHub Pages にデプロイされ、URL からアクセスして全機能が動く
- README に基本的な使い方とローカル起動方法が記載されている

#### タスク
- [ ] M6-1: `vite.config.ts` で `base` を環境変数化（`VITE_BASE_URL`）
- [ ] M6-2: `.github/workflows/deploy.yml`：ビルド→`gh-pages` ブランチ or `peaceiris/actions-gh-pages` でデプロイ
- [ ] M6-3: `npm run preview` で本番ビルドの動作確認
- [ ] M6-4: README 整備（日本語）
  - プロジェクト概要
  - 主要機能
  - ローカル起動・ビルド・デプロイ手順
  - スクリーンショット（任意）
- [ ] M6-5: Chrome／Edge で動作確認（小さいCSVと中規模CSVで）
- [ ] M6-6: GitHub リポジトリの初期コミット＋プッシュ＋Pages 設定
- [ ] M6-7: デプロイ URL からの最終疎通確認

#### 依存関係
M5 完了後

---

## 拡張フェーズ

MVP を運用しつつ、優先度の高いものから着手する。各タスクは独立性が高いため順序は自由。

---

### E1: 複数ファイル一括処理（1〜2日）

#### 完了条件
- 複数CSVを同時投入できる
- 同一テンプレートを全ファイルに適用し、ZIPで一括ダウンロードできる
- ファイル単位の進捗と全体進捗が見える

#### タスク
- [ ] E1-1: DropZone を multiple 対応
- [ ] E1-2: ファイルリストUI（投入済みファイル一覧、削除可能）
- [ ] E1-3: テンプレート適用ループ（ファイルごとに Worker 呼び出し or Worker 内部でループ）
- [ ] E1-4: fflate を導入し、`utils/zip.ts` でストリーミングZIP生成
- [ ] E1-5: 出力ファイル名生成ロジックを再利用
- [ ] E1-6: ファイル単位＋全体の進捗表示
- [ ] E1-7: 列名スキーマ不一致時のスキップ／警告

---

### E2: テンプレート Import/Export（0.5日）

#### 完了条件
- テンプレートをJSONファイルとしてダウンロード／アップロードできる
- スキーマバージョンの差異があっても安全にハンドリングする

#### タスク
- [ ] E2-1: `db/templates.ts` に export／import 関数を追加
- [ ] E2-2: JSON のスキーマバージョンを `1` から発行（既存テンプレートはマイグレーション不要）
- [ ] E2-3: インポート時のバージョン互換チェック＋エラーハンドリング
- [ ] E2-4: 同名テンプレート存在時の上書き／別名保存ダイアログ
- [ ] E2-5: `components/templates/ImportExportButtons.tsx`

---

### E3: 自動ヘッダ検出の高度化（1日）

#### 完了条件
- 先頭注釈行を自動でスキップ提案できる
- 複数行ヘッダを `/` 区切りで結合できる
- 提案を UI で確認・修正できる

#### タスク
- [ ] E3-1: `core/csv/header.ts` に複数行ヘッダ対応を追加
- [ ] E3-2: 自動検出ヒューリスティック（列数の安定性、先頭の `#`／空白多数行）
- [ ] E3-3: `HeaderConfig.tsx` に「スキップ行数」「ヘッダ行数」の入力UI
- [ ] E3-4: 自動提案を UI で表示し、修正可能にする
- [ ] E3-5: テンプレートのスキーマを v2 に拡張（`header.mode: 'multi' | 'single'`、`skipRows`、`headerRows`）
- [ ] E3-6: v1 → v2 マイグレーション関数
- [ ] E3-7: テスト：複数行ヘッダ・スキップ行のCSVで動作確認

---

### E4: パフォーマンスチューニング（1〜2日）

#### 完了条件
- 100万行／100MBのCSVが現実的な時間（目安1〜3分以内）で処理できる
- メモリ使用量がブラウザを圧迫しない

#### タスク
- [ ] E4-1: 計測スクリプト（10万行・100万行のフィクスチャ生成）
- [ ] E4-2: Performance API でベースライン計測
- [ ] E4-3: PapaParse の chunk サイズチューニング
- [ ] E4-4: 行オブジェクトのキー文字列を共通化（行ごとの新規生成を抑制）
- [ ] E4-5: Transferable Objects で Worker→メインへバイナリを転送
- [ ] E4-6: 正規表現コンパイルキャッシュ
- [ ] E4-7: 進捗イベントのスロットリング間隔の見直し
- [ ] E4-8: 計測結果と対策のメモを README または別ドキュメントに残す

---

## 各タスクの作業手順テンプレート

各タスクに着手する際の標準フロー：

1. 該当する仕様（[SPEC.md](./SPEC.md)）と規約（[CLAUDE.md](./CLAUDE.md)）を再確認
2. 関連する既存コードを読み（`core/` のピュア関数や型定義）
3. ユニットテストから書く（特に `core/` 配下）
4. 実装
5. ローカルで動作確認（`npm run test`、`npm run dev`）
6. 必要なら `tests/fixtures/` に新しいフィクスチャを追加
7. コミット（コミットメッセージは日本語可）

---

## リスクと対応

| リスク | 内容 | 対策 |
|---|---|---|
| SJIS境界文字化け | 可変長バイトのチャンク境界で誤デコード | 末尾バイト保留方式＋TextDecoder stream優先。M2-4 で重点的にテスト |
| メモリ過多 | 100MB級でJSオブジェクト膨張 | 行オブジェクト即時破棄、Blob配列で結合。E4 で計測・改善 |
| UI応答性 | 進捗イベント過多で再レンダ過多 | 100msスロットリング。M3-5 で実装、E4 で見直し |
| GitHub Pages base | サブパス配信での404 | `vite.config.ts` で base 環境変数。M6-1 で必ず確認 |
| テンプレート列名照合の頻発する未マッチ | 厳密一致でユーザーが困惑 | 警告UIを丁寧に設計。M5-8。E3 以降で「近い列名」差分表示の検討 |
| ReDoS | ユーザー正規表現の暴走 | Worker 内実行のためメインは生存。最悪 Worker.terminate で復旧。MVP では過剰防衛なし |
| Safari ITP の IndexedDB クリア | テンプレートが消える | エクスポート機能（E2）で外部にバックアップ可能にする |

---

## マイルストーン定義

- **M1〜M6 完了 = MVPリリース**：個人ツールとして実用可能。GitHub Pages に公開済み
- **E1 完了 = 業務効率化版**：複数ファイル一括処理が可能になり、繰り返し作業がさらに楽に
- **E2 完了 = ポータビリティ版**：テンプレートを外部ファイルで持ち運べる
- **E3 完了 = 業務CSV対応版**：Excelエクスポートの注釈行や複数行ヘッダにも対応
- **E4 完了 = 大容量対応版**：100万行級のチューニングが完了

---

## 着手前のチェックリスト

- [ ] [SPEC.md](./SPEC.md) を読み、対象機能の仕様を理解した
- [ ] [CLAUDE.md](./CLAUDE.md) を読み、コーディング規約を理解した
- [ ] 関連する既存コード（`core/`、`types/` など）を確認した
- [ ] 必要なライブラリの公式ドキュメントを把握した（PapaParse、Comlink、Dexie、fflate 等）
- [ ] テスト戦略を決めた（ユニット／統合／手動の使い分け）
