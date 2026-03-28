# Test Insight Hub

テスト可視化とフィードバック自動化のためのElectronベースのローカルデスクトップツール。

## 概要

Test Insight Hubは、テスト対象プロジェクトのシステム構造をブロック図で可視化し、テストカバレッジの不足箇所を特定し、フィードバックファイルを生成してテスト改善サイクルを支援します。

## 主な機能

- **システムブロック図**: プロジェクト構造をモジュール単位で可視化（React Flow + dagre）
- **カバレッジ可視化**: 5種のカバレッジレポート形式に対応し、ブロック図に色分けオーバーレイ
- **フィードバック生成**: カバレッジ不足箇所を優先度付きで検出し、JSONフィードバックファイルを生成
- **フィードバックサイクル**: 前回との比較で改善率をトラッキング

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
│   │   └── feedback-generator/ # フィードバック生成・配置・比較
│   └── utils/               # ファイル操作・git・ハッシュ
├── preload/                 # contextBridge（型安全IPC）
├── renderer/                # React フロントエンド
│   ├── pages/               # 7画面（Home, Diagram, Coverage, Feedback, Settings...）
│   ├── components/          # UI コンポーネント（React Flow ノード, レイアウト）
│   ├── stores/              # Zustand ストア（5つ）
│   ├── hooks/               # カスタム Hooks
│   └── i18n/                # 国際化（日本語・英語）
└── shared/                  # Main/Renderer 共有型定義・定数・スキーマ
```

## テスト

```
18 test files | 114 tests
├── unit/shared/       (16 tests) — 型定義、定数、Zodスキーマ、エラー型
├── unit/services/     (95 tests) — パーサー、解析、カバレッジ、フィードバック
└── integration/       (3 tests)  — フルパイプライン（解析→カバレッジ→FB生成）
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
| テスト | Vitest |
| レイアウト | dagre |
| バリデーション | Zod |
| 国際化 | i18next |

## ライセンス

MIT
