# Test Insight Hub

テスト可視化とフィードバック自動化のためのElectronベースのローカルデスクトップツール。

## 概要

Test Insight Hubは、テスト対象プロジェクトのシステム構造をブロック図で可視化し、テストカバレッジの不足箇所を特定し、フィードバックファイルを生成してテスト改善サイクルを支援します。

## 主な機能

- **システムブロック図**: プロジェクト構造をモジュール単位で可視化（React Flow + dagre）
- **カバレッジ可視化**: 5種のカバレッジレポート形式に対応し、ブロック図に色分けオーバーレイ
- **フィードバック生成**: カバレッジ不足箇所を優先度付きで検出し、JSONフィードバックファイルを生成
- **Quality Gate**: 全モジュールが閾値を超えるまで不合格判定（部分的な改善では完了とみなさない）
- **フィードバックサイクル**: 前回との比較で改善率をトラッキング

## フィードバック利用手順書

### 目的

feedback.jsonを使ってテストカバレッジを改善するための手順です。AIエージェント・人間どちらでも利用できます。

### 手順

#### 1. フィードバック生成

1. Test Insight Hubを起動（`npm run dev`）
2. ホーム画面でプロジェクトディレクトリを選択
3. カバレッジ画面でテストを実行してカバレッジを取得
4. フィードバック画面で「フィードバック生成」→「プロジェクトに配置」
5. `.test-insight/feedback.json` が生成される

#### 2. Quality Gate の確認

feedback.jsonの `qualityGate` を最初に確認してください。

```json
{
  "qualityGate": {
    "passed": false,
    "verdict": "不合格: 2/4モジュールが閾値80%未満。未達モジュール: src/renderer/pages, src/preload。全モジュールが閾値を超えるまでテストを追加してください。",
    "failedModules": ["src/renderer/pages", "src/preload"]
  }
}
```

**重要: `passed: false` の場合、`failedModules` のすべてが閾値を超えるまで作業を続けてください。** 一部のモジュールだけカバレッジを上げて完了とみなしてはいけません。品質は全領域で基準を満たすことが前提です。

#### 3. テストの追加

`gaps` 配列の各エントリに従ってテストを追加します。

```json
{
  "filePath": "src/renderer/pages/home-page.tsx",
  "currentCoverage": 0,
  "targetCoverage": 80,
  "recommendedTestType": "e2e",
  "priority": "medium",
  "priorityScore": 43
}
```

- `recommendedTestType` に従ったテストを書く（unit / integration / e2e）
- `priorityScore` が高いファイルから着手する
- **ただし、Quality Gateの `failedModules` に含まれるモジュールを最優先とする**

#### 4. 再計測とフィードバックサイクル

テスト追加後：

1. `npm run test:coverage` でカバレッジを再計測
2. Test Insight Hubでフィードバックを再生成
3. `qualityGate.passed` を確認
4. `passed: true` になるまで手順3-4を繰り返す

### feedback.json の構造（v1.2.0）

| フィールド | 説明 |
|---|---|
| `qualityGate` | 合格/不合格判定。`passed: false`なら全モジュールが閾値を超えるまで続ける |
| `qualityGate.failedModules` | 閾値未満のモジュール一覧。ここが空になるまで完了ではない |
| `qualityGate.moduleResults` | モジュールごとのカバレッジと合否 |
| `summary` | 全体統計（モジュール数、全体カバレッジ等） |
| `gaps` | ファイル単位のカバレッジギャップ（src/配下のみ） |
| `recommendations` | テスト追加の推奨事項 |

### 注意事項

- **フィードバック対象は `src/` 配下のソースコードのみ**。`tests/`, `coverage/`, `node_modules/` 等は含まれません
- **型定義のみのファイル**（`src/shared/types/*.ts`）や **re-exportのみのファイル**（`src/main/ipc/index.ts`）はカバレッジ計測から除外されています
- **全モジュールが閾値を超えることが目標**です。全体カバレッジの数字だけを追わないでください

### よくある問題と対策

| 問題 | 原因 | 対策 |
|---|---|---|
| Reactコンポーネントのテストでエラー | vitest.configにReact pluginがない | `@vitejs/plugin-react` をplugins配列に追加 |
| `React is not defined` エラー | JSXトランスパイル未設定 | 上記と同じ |
| tests/やcoverage/がgapに含まれる | フィードバック生成のフィルタ漏れ | feedback.json v1.2.0で修正済み |
| 型定義ファイルが0%と表示される | v8カバレッジはinterfaceを計測しない | vitest.configのcoverage.excludeに追加 |
| カバレッジは上がったがQuality Gate不合格 | 特定モジュールが放置されている | `failedModules` を確認し、そのモジュールのテストを書く |

## 対応言語

TypeScript / JavaScript / Python / Go / Rust / C / C++

## 対応カバレッジ形式

| 形式 | ツール |
|------|--------|
| Istanbul JSON | Vitest, Jest |
| lcov | 汎用 |
| coverage.py JSON | pytest |
| Go coverprofile | go test |
| llvm-cov JSON | cargo-llvm-cov |

## セットアップ

```bash
npm install
```

## 開発

```bash
# 開発サーバー起動（Electron + HMR）
npm run dev

# テスト実行
npm run test

# カバレッジ付きテスト
npm run test:coverage

# リント
npm run lint

# フォーマット
npm run format

# 型チェック
npm run typecheck

# プロダクションビルド
npm run build
```

## プロジェクト構造

```
src/
├── main/                    # Electron Main プロセス
│   ├── index.ts             # エントリポイント
│   ├── ipc/                 # IPC ハンドラ
│   ├── services/
│   │   ├── project-parser/  # ソースコード解析・モジュール構築
│   │   ├── coverage-analyzer/ # カバレッジ解析・5種パーサー
│   │   └── feedback-generator/ # フィードバック生成・配置・比較・環境検出
│   └── utils/               # ファイル操作・git・ハッシュ
├── preload/                 # contextBridge（型安全IPC）
├── renderer/                # React フロントエンド
│   ├── pages/               # 7画面（Home, Diagram, Coverage, Feedback, Settings...）
│   ├── components/          # UI コンポーネント（React Flow ノード, レイアウト）
│   ├── stores/              # Zustand ストア（5つ）
│   ├── hooks/               # カスタム Hooks
│   └── i18n/                # 国際化（日本語・英語）
└── shared/                  # Main/Renderer 共有
    ├── types/               # 型定義
    ├── constants.ts         # 定数・prerequisiteルール
    ├── schemas/             # Zodバリデーション
    └── utils/               # quality-gate, prerequisite-detector
```

## テスト

```
74 test files | 645 tests | 86% coverage
├── unit/shared/          — 型定義、定数、Zodスキーマ、エラー型、quality-gate、prerequisite-detector
├── unit/services/        — パーサー、解析、カバレッジ、フィードバック、env-collector
├── unit/main/ipc/        — IPC ハンドラ（coverage, export, feedback, project, settings, test）
├── unit/preload/         — preload contextBridge
├── unit/renderer/stores/ — Zustand ストア（5つ）
├── unit/renderer/pages/  — React ページコンポーネント（7画面）
├── unit/renderer/components/ — UIコンポーネント（diagram, layout, toast, onboarding等）
├── unit/renderer/hooks/  — カスタムHooks（useIpc, useDiagram, useKeyboardShortcuts）
├── unit/renderer/i18n/   — 国際化設定
└── integration/          — フルパイプライン（解析→カバレッジ→FB生成）
```

## キーボードショートカット

| ショートカット | 動作 |
|-------------|------|
| Ctrl+1 | ホーム |
| Ctrl+2 | ブロック図 |
| Ctrl+3 | カバレッジ |
| Ctrl+4 | フィードバック |
| Ctrl+, | 設定 |
| Ctrl+L | ログパネル切替 |
| Ctrl+Shift+D | テーマ切替 |

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Electron 34 |
| フロントエンド | React 19, React Flow 12 |
| 状態管理 | Zustand 5 |
| 言語 | TypeScript 5.8 (strict) |
| ビルド | electron-vite, Vite |
| テスト | Vitest, @testing-library/react |
| レイアウト | dagre |
| バリデーション | Zod |
| 国際化 | i18next |

## ライセンス

MIT
