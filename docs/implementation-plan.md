# 実装計画書: Test Insight Hub

## 文書情報

| 項目 | 内容 |
|------|------|
| プロジェクト名 | Test Insight Hub |
| バージョン | 2.0.0 |
| 作成日 | 2026-03-22 |
| 対応要件定義書 | docs/requirements.md v2.0.0 |
| 対応実装設計書 | docs/implementation-design.md v2.0.0 |

---

## 1. 実装フェーズ概要

全体を5フェーズに分割する。各フェーズはデモ可能な成果物を含み、フェーズ単位で動作確認を行う。

```
Phase 1: 基盤構築         ── Electron + React + ビルド環境 + IPC 基盤
Phase 2: プロジェクト解析  ── F-001 + F-002（ソース読み込み→ブロック図）
Phase 3: カバレッジ可視化  ── F-003 + F-004（テスト読み込み→カバレッジオーバーレイ）
Phase 4: フィードバック    ── F-005 + F-006 + F-007（FB生成→配置→再検証）
Phase 5: 仕上げ           ── 設定画面・i18n・パフォーマンス最適化・パッケージング
```

### フェーズ依存関係

```
Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5
                │                        │
                └── ブロック図は          └── カバレッジデータが
                    Phase 3/4 で再利用       Phase 4 の前提
```

---

## 2. Phase 1: 基盤構築

### 目標

Electron + React + TypeScript のプロジェクト骨格を構築し、Main↔Renderer 間の IPC 通信が動作する状態にする。

### タスク一覧

| # | タスク | 成果物 | 依存 |
|---|--------|--------|------|
| 1.1 | electron-vite プロジェクト初期化 | `electron.vite.config.ts`, `package.json` 更新 | — |
| 1.2 | TypeScript 設定（Main/Renderer/Shared の3構成） | `tsconfig.node.json`, `tsconfig.web.json` | 1.1 |
| 1.3 | `src/shared/types/` 型定義ファイル作成 | `project.ts`, `coverage.ts`, `feedback.ts`, `settings.ts`, `ipc.ts` | 1.2 |
| 1.4 | `src/shared/constants.ts` アプリ定数定義 | デフォルト閾値、カバレッジ色閾値、キャッシュ上限等 | 1.2 |
| 1.5 | `src/shared/schemas/` Zod スキーマ作成 | `settings-schema.ts`, `feedback-schema.ts` | 1.3 |
| 1.6 | Main プロセスエントリポイント | `src/main/index.ts` (BrowserWindow 生成) | 1.1 |
| 1.7 | Preload スクリプト + 型定義 | `src/preload/index.ts`, `src/preload/api.d.ts` | 1.3 |
| 1.8 | IPC ハンドラの骨格作成 | `src/main/ipc/index.ts` + 各ハンドラのスタブ | 1.7 |
| 1.9 | Renderer エントリポイント + ルーティング | `main.tsx`, `App.tsx`, 空の各ページコンポーネント | 1.7 |
| 1.10 | 共通 UI コンポーネント | `sidebar.tsx`, `header.tsx`, `log-panel.tsx` | 1.9 |
| 1.11 | Zustand ストア骨格 | 全5ストアの初期状態 + 空アクション | 1.9 |
| 1.12 | `use-ipc` Hook 作成 | IPC invoke/on のラッパー + エラーハンドリング | 1.7, 1.11 |
| 1.13 | テーマ（ダーク/ライト）設定 | `styles/theme.ts`, `styles/global.css` | 1.9 |
| 1.14 | i18n 基盤 | `i18n/index.ts`, `ja.json`, `en.json`（空テンプレート） | 1.9 |
| 1.15 | Vitest 設定 + サンプルテスト | `vitest.config.ts`, 各層のサンプルテスト | 1.2 |
| 1.16 | ESLint + Prettier 設定更新 | `eslint.config.js`, `.prettierrc` | 1.1 |

### 完了基準

- [x] `npm run dev` で Electron ウィンドウが起動する
- [x] サイドバー付きの空画面が表示される
- [x] Main→Renderer の IPC 通信（ping/pong）が動作する
- [x] ダーク/ライトテーマの切替が動作する
- [x] `npm run test` でサンプルテストが通る
- [x] `npm run build` でビルドが成功する

---

## 3. Phase 2: プロジェクト解析とブロック図（F-001 + F-002）

### 目標

ローカルプロジェクトを読み込み、モジュール構造をブロック図として表示する。

### タスク一覧

| # | タスク | 成果物 | 依存 |
|---|--------|--------|------|
| 2.1 | `file-scanner.ts` 実装 | ファイル走査、.gitignore 対応、除外パターン | Phase 1 |
| 2.2 | `ast-analyzer.ts` 実装 | tree-sitter による AST 解析、関数抽出 | 2.1 |
| 2.3 | `complexity-calculator.ts` 実装 | 循環的複雑度の算出 | 2.2 |
| 2.4 | `dependency-resolver.ts` 実装 | import 解析、依存グラフ構築、循環依存検出 | 2.2 |
| 2.5 | `module-builder.ts` 実装 | ディレクトリ→モジュール変換、統計集約 | 2.4 |
| 2.6 | `cache-manager.ts` 実装 | キャッシュ保存・読込・無効化・LRU 削除 | 2.1 |
| 2.7 | `file-watcher.ts` 実装 | chokidar によるファイル変更監視 | 2.1 |
| 2.8 | `project-handlers.ts` IPC ハンドラ完成 | ディレクトリ選択、解析開始、進捗通知 | 2.5, 2.6 |
| 2.9 | `project-store.ts` 完成 | 解析状態・結果・エラーの管理 | 2.8 |
| 2.10 | `home-page.tsx` 実装 | PJ選択UI、構成選択（同一/別リポ）、最近のPJ一覧 | 2.9 |
| 2.11 | `module-node.tsx` カスタムノード実装 | モジュールブロックの描画 | Phase 1 |
| 2.12 | `dependency-edge.tsx` カスタムエッジ実装 | 依存矢印、循環依存の赤表示 | 2.11 |
| 2.13 | `diagram-controls.tsx` 実装 | ズーム、パン、レイアウト切替（dagre / force） | 2.11 |
| 2.14 | `diagram-page.tsx` 完成 | ブロック図画面の組み立て、ドリルダウン | 2.11, 2.12, 2.13, 2.9 |
| 2.15 | エクスポート機能 | `export-handlers.ts`: PNG/SVG エクスポート | 2.14 |
| 2.16 | `settings-manager.ts` 実装 | グローバル/プロジェクト設定の読み書き | Phase 1 |
| 2.17 | プログレスバー UI | `progress-bar.tsx` + 解析中の進捗表示 | 2.8 |
| 2.18 | Unit テスト: Project Parser | file-scanner, ast-analyzer, dependency-resolver | 2.1〜2.5 |
| 2.19 | Integration テスト: IPC | プロジェクト解析の E2E フロー | 2.8 |
| 2.20 | テストフィクスチャ作成 | `tests/fixtures/sample-project/` | 2.18 |

### 完了基準

- [x] ディレクトリ選択からブロック図表示まで一連の操作が動作する
- [x] 6言語（TS/JS/Python/Go/Rust/C++）のファイルが正しく解析される
- [x] ブロック間の依存矢印が描画される
- [x] ドリルダウンでモジュール内部が展開される
- [x] レイアウト切替（階層/力指向）が動作する
- [x] PNG/SVG エクスポートが動作する
- [x] 2回目以降の読み込みでキャッシュが効き高速化される
- [x] テストカバレッジ 80% 以上（services 層）

---

## 4. Phase 3: カバレッジ可視化（F-003 + F-004）

### 目標

カバレッジレポートを読み込み、ブロック図にカバレッジ色をオーバーレイ表示する。

### タスク一覧

| # | タスク | 成果物 | 依存 |
|---|--------|--------|------|
| 3.1 | `report-detector.ts` 実装 | レポート形式の自動判定 | Phase 2 |
| 3.2 | `istanbul-parser.ts` 実装 | Istanbul JSON パーサー | 3.1 |
| 3.3 | `lcov-parser.ts` 実装 | lcov.info パーサー | 3.1 |
| 3.4 | `coveragepy-parser.ts` 実装 | coverage.py JSON パーサー | 3.1 |
| 3.5 | `go-cover-parser.ts` 実装 | Go coverprofile パーサー | 3.1 |
| 3.6 | `llvm-cov-parser.ts` 実装 | cargo-llvm-cov JSON パーサー | 3.1 |
| 3.7 | `normalizer.ts` 実装 | パスの正規化、pathMappings 適用、ソース突合 | 3.2〜3.6 |
| 3.8 | `aggregator.ts` 実装 | モジュール単位の集約、色レベル判定 | 3.7 |
| 3.9 | `test-classifier.ts` 実装 | テスト種別の自動分類 | 3.7 |
| 3.10 | `coverage-handlers.ts` IPC ハンドラ完成 | カバレッジ読み込み、エラー返却 | 3.8, 3.9 |
| 3.11 | `coverage-store.ts` 完成 | カバレッジデータ・フィルタ状態管理 | 3.10 |
| 3.12 | `module-node.tsx` カバレッジ対応拡張 | カバレッジバー・色分け表示 | 3.11 |
| 3.13 | `coverage-page.tsx` 実装 | カバレッジモード切替、テスト種別フィルタ、サマリーダッシュボード | 3.12 |
| 3.14 | `coverage-detail-panel.tsx` 実装 | ファイル別カバレッジ、未カバー関数・行、テストケース一覧 | 3.13 |
| 3.15 | カバレッジレポート自動検出 | 同一リポジトリ構成時の自動検出パスロジック | 3.10 |
| 3.16 | Unit テスト: Coverage Parsers | 5形式×正常系/異常系 | 3.2〜3.6 |
| 3.17 | Unit テスト: Aggregator + Classifier | モジュール集約、テスト分類 | 3.8, 3.9 |
| 3.18 | テストフィクスチャ追加 | 各形式のサンプルレポート | 3.16 |

### 完了基準

- [x] 5種類のカバレッジレポートを正しく読み込める
- [x] ブロック図が緑/黄/赤/グレーで色分けされる
- [x] Line/Branch/Function モード切替が動作する
- [x] テスト種別（Unit/Integration/E2E）フィルタリングが動作する
- [x] 詳細パネルでファイル別カバレッジが表示される
- [x] 同一リポ構成でカバレッジレポートが自動検出される
- [x] テストカバレッジ 80% 以上（parsers + aggregator）

---

## 5. Phase 4: フィードバック（F-005 + F-006 + F-007）

### 目標

カバレッジ不足箇所を検出しフィードバックファイルを生成・配置し、再検証サイクルを回せるようにする。

### タスク一覧

| # | タスク | 成果物 | 依存 |
|---|--------|--------|------|
| 4.1 | `gap-detector.ts` 実装 | 閾値未満モジュール検出、未カバー関数特定 | Phase 3 |
| 4.2 | `change-frequency.ts` 実装 | git log ベースの変更頻度算出 + フォールバック | 4.1 |
| 4.3 | `priority-scorer.ts` 実装 | 3因子の正規化・重み付け合算 | 4.1, 4.2 |
| 4.4 | `recommendation-builder.ts` 実装 | 推奨テストファイルパス・関数名の生成 | 4.3 |
| 4.5 | `feedback-generator/index.ts` 統合 | gap検出→スコア計算→推奨生成→FeedbackFile 組立 | 4.4 |
| 4.6 | `feedback-deployer.ts` 実装 | FB ファイル配置、バックアップ、.gitignore 提案 | 4.5 |
| 4.7 | `cycle-tracker.ts` 実装 | 前回 FB との比較、改善率算出 | 4.5 |
| 4.8 | `feedback-handlers.ts` IPC ハンドラ完成 | FB生成、配置、履歴取得 | 4.5, 4.6, 4.7 |
| 4.9 | `feedback-store.ts` 完成 | FB結果、比較結果、履歴の状態管理 | 4.8 |
| 4.10 | `feedback-page.tsx` 実装 | 閾値設定、重み設定（詳細）、プレビュー、配置ボタン | 4.9 |
| 4.11 | `feedback-history-page.tsx` 実装 | FB 履歴一覧、改善推移表示、比較ビュー | 4.9 |
| 4.12 | `git-utils.ts` 実装 | git log 取得ユーティリティ | 4.2 |
| 4.13 | Unit テスト: Feedback Generator | gap検出、スコア計算、推奨生成 | 4.1〜4.4 |
| 4.14 | Unit テスト: Deployer + CycleTracker | 配置、バックアップ、比較 | 4.6, 4.7 |
| 4.15 | Integration テスト: FB サイクル | 生成→配置→再読み込み→比較の一連フロー | 4.8 |

### 完了基準

- [x] カバレッジ閾値以下のモジュールがフィードバックに含まれる
- [x] 優先度スコアが3因子から計算されている
- [x] フィードバック JSON が仕様通りのフォーマットで生成される
- [x] FB ファイルがプロジェクト内に配置される（バックアップ付き）
- [x] 前回 FB との比較で改善/未改善が区別される
- [x] FB 履歴が一覧表示される
- [x] テストカバレッジ 80% 以上（feedback-generator 層）

---

## 6. Phase 5: 仕上げ

### 目標

設定画面・国際化・パフォーマンス最適化を完了し、パッケージングまで行う。

### タスク一覧

| # | タスク | 成果物 | 依存 |
|---|--------|--------|------|
| 5.1 | `settings-page.tsx` 実装 | テーマ、言語、パス設定、閾値、キャッシュ管理 | Phase 4 |
| 5.2 | `settings-handlers.ts` IPC ハンドラ完成 | 設定の読み書き、キャッシュクリア | 5.1 |
| 5.3 | i18n テキスト埋め込み | 全画面・コンポーネントのテキストを i18n キーに置換 | Phase 4 |
| 5.4 | `ja.json` / `en.json` 翻訳テキスト追加 | 全 UI テキストの日英翻訳 | 5.3 |
| 5.5 | Worker Thread 化 | ast-analyzer の Worker Pool 化（4並列） | Phase 2 |
| 5.6 | React Flow 仮想化 | viewport 外ノードの描画スキップ | Phase 3 |
| 5.7 | パフォーマンスベンチマーク | 10,000 ファイルプロジェクトでの計測 | 5.5, 5.6 |
| 5.8 | オンボーディングウィザード | 初回起動時のガイド画面 | 5.1 |
| 5.9 | キーボードショートカット | 主要操作のショートカット定義 | Phase 4 |
| 5.10 | electron-builder 設定 | Windows (NSIS), macOS (DMG), Linux (AppImage) | Phase 4 |
| 5.11 | アプリアイコン作成 | `resources/icon.png`, `resources/icon.ico` | — |
| 5.12 | パッケージビルド・動作確認 | 3 OS でのインストーラー生成・起動確認 | 5.10, 5.11 |
| 5.13 | 全体 Integration テスト | 全フロー通しテスト | 5.12 |
| 5.14 | ドキュメント更新 | README.md, docs/architecture.md 更新 | 5.12 |

### 完了基準

- [x] 設定画面で全設定項目が変更・保存できる
- [x] 日本語/英語の UI 切替が全画面で動作する
- [x] 10,000 ファイルプロジェクトで初回解析が 60 秒以内に完了する
- [x] メモリ使用量が 500MB 以下である
- [x] Windows/macOS/Linux でインストーラーからの起動が成功する
- [x] 全画面の操作にキーボードショートカットが設定されている

---

## 7. タスク依存関係図

```
Phase 1 (基盤)
  1.1 → 1.2 → 1.3 → 1.4
                  └→ 1.5
  1.1 → 1.6 → 1.7 → 1.8
                  └→ 1.9 → 1.10
                       └→ 1.11 → 1.12
                       └→ 1.13
                       └→ 1.14
  1.2 → 1.15
  1.1 → 1.16

Phase 2 (プロジェクト解析)
  2.1 → 2.2 → 2.3
           └→ 2.4 → 2.5 → 2.8 → 2.9 → 2.10
  2.1 → 2.6 → 2.8                    └→ 2.14
  2.1 → 2.7
  2.11 → 2.12 → 2.14
  2.11 → 2.13 → 2.14
  2.14 → 2.15

Phase 3 (カバレッジ)
  3.1 → 3.2 ─┐
  3.1 → 3.3 ─┤
  3.1 → 3.4 ─┼→ 3.7 → 3.8 → 3.10 → 3.11 → 3.12 → 3.13 → 3.14
  3.1 → 3.5 ─┤       └→ 3.9 → 3.10
  3.1 → 3.6 ─┘

Phase 4 (フィードバック)
  4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6 → 4.8 → 4.9 → 4.10
                                    └→ 4.7 → 4.8         └→ 4.11

Phase 5 (仕上げ)
  5.1 → 5.2
  5.3 → 5.4
  5.5 + 5.6 → 5.7
  5.10 + 5.11 → 5.12 → 5.13 → 5.14
```

---

## 8. 並列実行可能なタスク

各フェーズ内で並列に着手可能なタスクを明示する。

### Phase 1

```
並列グループ A: 1.3, 1.4, 1.5  （型定義・定数・スキーマ）
並列グループ B: 1.9, 1.13, 1.14 （Renderer 基盤系）
並列グループ C: 1.15, 1.16      （テスト・リント設定）
```

### Phase 2

```
並列グループ A: 2.1（file-scanner）と 2.11（module-node UI）
並列グループ B: 2.6（cache-manager）と 2.7（file-watcher）
並列グループ C: 2.18（unit テスト）と 2.15（エクスポート）← 2.14 完了後
```

### Phase 3

```
並列グループ A: 3.2, 3.3, 3.4, 3.5, 3.6  （5種のパーサーは全て並列開発可）
並列グループ B: 3.9（test-classifier）と 3.8（aggregator）← 3.7 完了後
並列グループ C: 3.16, 3.17, 3.18（テスト群）← 実装完了後
```

### Phase 4

```
並列グループ A: 4.2（change-frequency）と 4.12（git-utils）
並列グループ B: 4.10（FB 画面）と 4.11（FB 履歴画面）← 4.9 完了後
並列グループ C: 4.13, 4.14（テスト群）← 実装完了後
```

### Phase 5

```
並列グループ A: 5.1（設定画面）と 5.3（i18n テキスト）と 5.5（Worker）と 5.10（builder 設定）
並列グループ B: 5.8（オンボーディング）と 5.9（ショートカット）と 5.11（アイコン）
```

---

## 9. リスクと対策

| # | リスク | 影響 | 発生可能性 | 対策 |
|---|--------|------|-----------|------|
| R-01 | tree-sitter の Node.js バインディングが Electron のネイティブモジュールビルドで問題を起こす | Phase 2 で停止 | 中 | Phase 1 の段階で tree-sitter のインストール・動作確認を行う。問題発生時は `web-tree-sitter`（WASM 版）にフォールバック |
| R-02 | 大規模プロジェクト（10,000+ファイル）で解析が 60 秒を超える | NF-002 未達 | 中 | Worker Thread の並列数を調整（4→8）、キャッシュの積極利用、プロファイリングで最も遅い処理を特定 |
| R-03 | React Flow が 500+ ノードで描画性能が劣化する | F-002 のUX 低下 | 高 | モジュール折りたたみ（トップレベルのみ表示）を Phase 2 で実装。viewport 外の仮想化を Phase 5 で対応 |
| R-04 | カバレッジレポート形式のバリエーション（バージョン差異等）に対応しきれない | F-003 の品質低下 | 中 | 各パーサーで寛容なパース（unknown フィールドを無視）を実装。テストフィクスチャに複数バージョンのサンプルを用意 |
| R-05 | git log の実行がプロジェクトによっては遅い（巨大リポジトリ） | F-005 のパフォーマンス低下 | 低 | `git log --follow --since="90 days ago"` でスコープを制限。タイムアウト（10秒）を設定し、超過時はフォールバック値を使用 |
| R-06 | Electron のセキュリティアップデートによる破壊的変更 | 全体に影響 | 低 | Electron のメジャーバージョンを固定（34.x）。セキュリティパッチのみ追随 |

---

## 10. テスト戦略

### 10.1 テスト種別と対象

| テスト種別 | 対象 | フレームワーク | カバレッジ目標 |
|-----------|------|--------------|-------------|
| Unit テスト | services 層の各モジュール | Vitest | 80% 以上 |
| Unit テスト | Renderer の stores, hooks | Vitest + React Testing Library | 80% 以上 |
| Integration テスト | IPC 通信フロー | Vitest（Electron test mode） | 主要フロー全網羅 |
| Integration テスト | カバレッジパーサー × 実データ | Vitest | 5形式 × 正常/異常 |
| Component テスト | 各ページ・パネルの描画 | Vitest + React Testing Library | 主要コンポーネント |
| E2E テスト | 全画面通しフロー | Playwright + Electron | クリティカルパス 3本 |

### 10.2 テストフィクスチャ

```
tests/fixtures/
├── sample-project/           # 3言語混合（TS, Python, Go）の小規模PJ
│   ├── src/
│   │   ├── api/              # 2ファイル
│   │   ├── service/          # 3ファイル
│   │   └── repo/             # 2ファイル
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   └── .gitignore
├── istanbul-report.json      # Vitest/Jest 出力のサンプル
├── coverage-final.json       # Istanbul 標準形式
├── lcov.info                 # lcov 形式
├── coverage-py.json          # coverage.py 出力
├── go-coverprofile.txt       # Go coverprofile 出力
├── llvm-cov-export.json      # cargo-llvm-cov 出力
├── istanbul-broken.json      # 破損レポート（異常系テスト用）
└── lcov-partial.info         # ソース不一致レポート（異常系テスト用）
```

### 10.3 E2E テストシナリオ

| # | シナリオ | 操作フロー |
|---|---------|-----------|
| E2E-01 | 基本フロー | ホーム→PJ選択→ブロック図表示→カバレッジ読込→色表示→FB生成→配置 |
| E2E-02 | 設定変更 | 設定画面→閾値変更→カバレッジ再表示→色が変化 |
| E2E-03 | FB サイクル | FB生成→配置→カバレッジ再読込→再検証→改善率表示 |

---

## 11. 品質ゲート

各フェーズの完了前に以下を確認する。

| チェック項目 | 基準 |
|------------|------|
| テストカバレッジ | services 層で 80% 以上 |
| ビルド | `npm run build` がエラーなしで完了 |
| リント | `npm run lint` がエラー 0 件 |
| フォーマット | `npm run format:check` がパス |
| TypeScript | `tsc --noEmit` がエラー 0 件 |
| パフォーマンス | 各指標が NF-002 の目標値以内（Phase 5 で計測） |
| セキュリティ | nodeIntegration 無効、contextIsolation 有効を目視確認 |

---

## 12. Phase 6: AI駆動開発対応（F-003 v2 + F-008）

### 目標

テスト自動実行とテスト品質分析を追加し、ユーザーの事前準備を不要にする。

### タスク一覧

| # | タスク | 成果物 | 状態 |
|---|--------|--------|------|
| 6.1 | `framework-detector.ts` | テストフレームワーク自動検出（Vitest/Jest/pytest/Go/Cargo） | 完了 |
| 6.2 | `test-runner/index.ts` | テスト実行・カバレッジ取得・stdout/stderrリアルタイム通知 | 完了 |
| 6.3 | `assertion-patterns.ts` | 言語別アサーションパターン定義（TS/JS/Python/Go） | 完了 |
| 6.4 | `test-quality-analyzer/index.ts` | テスト品質分析・スコア計算・サジェスト生成 | 完了 |
| 6.5 | `test-handlers.ts` | IPC ハンドラ（test:run, test:quality-analyze） | 完了 |
| 6.6 | IPC型定義更新 | TestRunRequest, TestQualityRequest 追加 | 完了 |
| 6.7 | Preload更新 | test.run, test.analyzeQuality, onTestOutput 追加 | 完了 |
| 6.8 | テスト: framework-detector | 3テスト | 完了 |
| 6.9 | テスト: test-quality-analyzer | 9テスト | 完了 |

### 完了基準

- [x] Vitest/Jest/pytest/Go/Cargo のフレームワーク自動検出が動作する
- [x] ツール内からテスト実行してカバレッジを取得できる
- [x] テスト品質分析でアサーション深さがスコア化される
- [x] HIGH/MEDIUM/LOW の品質レベルが正しく判定される
- [x] 126テスト全パス

---

## 改訂履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|---------|
| 1.0.0 | 2026-03-22 | 初版作成 |
| 2.0.0 | 2026-03-22 | AI駆動開発対応: Phase 6 追加（テスト自動実行 + テスト品質分析） |
