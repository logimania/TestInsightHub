# プロジェクト進捗ログ

## 現在の状態
- 状態: 作業中
- 最終更新: 2026-03-26
- 概要: Phase 1〜5 全完了。feedback.json v1.1.0（prerequisites対応）実装済み。424テスト全パス。カバレッジ50.6%。

## TODO
- [x] Phase 1: 基盤構築（electron-vite + React + IPC基盤）
- [x] Phase 2: プロジェクト解析とブロック図（F-001 + F-002）
- [x] Phase 3: カバレッジ可視化（F-003 + F-004）
- [x] Phase 4: フィードバック（F-005 + F-006 + F-007）
- [x] Phase 5: 仕上げ（設定完成・i18n・オンボーディング・ショートカット・統合テスト・README）
- [x] テスト追加: backend stores/IPC handlers/utils（114→399テスト）
- [x] feedback.json v1.1.0: prerequisites フィールド追加（テスト環境の前提条件検出）
- [ ] renderer（React）側のテスト追加（現在0%、全体の約60%を占める）
- [ ] backend残り3ファイルのカバレッジ80%達成（file-scanner 73%, module-builder 71%, feedback-deployer 70%）
- [ ] ESLint設定修正（TypeScriptパーサー未設定で全ファイルparse error）

## カバレッジ状況（2026-03-26）
- 全体: 50.6%（目標80%）
- main/services: 80%+（ほぼ達成）
- renderer/stores: feedback-store 87%, coverage-store 98%（テスト済み）
- renderer/pages,components,hooks: 0%（最大のボトルネック）
- preload: 0%

## 変更履歴
### 2026-03-26
- テスト追加（7ファイル新規）: feedback-store, coverage-store, diagram-export, coverage-handlers, export-handlers, feedback-handlers, project-handlers, test-handlers
- feedback.json v1.1.0 実装:
  - 新規: `src/shared/utils/prerequisite-detector.ts` — 純粋関数で前提条件検出
  - 新規: `src/main/services/feedback-generator/env-collector.ts` — 環境情報収集
  - 変更: feedback.ts, feedback-display.ts に TestPrerequisites 型追加
  - 変更: constants.ts に PREREQUISITE_RULES 定義
  - 変更: feedback-generator/index.ts, feedback-store.ts に projectTestEnv オプション追加
- code-review指摘修正: testType "any"化、non-null assertion除去、console.log削除、パス正規化追加

### 2026-03-22
- 作成: `docs/requirements.md` — 要件定義書 v1.2.0
- 作成: `docs/implementation-design.md` — 実装設計書 v1.0.0
- 作成: `docs/implementation-plan.md` — 実装計画書 v1.0.0
- Phase 1: 43ファイル作成（設定、型定義、IPC、React基盤、ストア、i18n、テーマ）
- Phase 2: services/project-parser 6モジュール + utils 3モジュール + React Flow ブロック図UI + テスト6ファイル

## 設計判断ログ
- (2026-03-26) feedback.json v1.1.0: prerequisites フィールドを optional で追加し後方互換性を維持。検出ロジックは shared/utils に純粋関数として配置し、main/renderer両方から利用可能に
- (2026-03-26) PREREQUISITE_RULES の React(.tsx)ルールは testType:"any" に設定: inferTestType が renderer下の.tsxを"e2e"と分類するが、将来unit testとして書く場合にも対応するため
- (2026-03-26) renderer側カバレッジ0%の根本原因: @testing-library/react は導入済みだがテストが未作成。feedback.jsonのprerequisitesで「環境は整っている(satisfied:true)」と正しく検出される
- (2026-03-22) Phase 2 初期は正規表現ベースの軽量パーサーで実装: tree-sitterのElectronネイティブビルド問題を回避。将来 web-tree-sitter (WASM) に置換予定
- (2026-03-22) 依存関係パス解決でNode.jsの path.resolve を避け手動解決: Windowsの絶対パス展開問題を回避するため
