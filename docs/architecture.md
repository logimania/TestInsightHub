# システムアーキテクチャ

## 概要

Test Insight HubはElectronアプリケーションで、Main/Preload/Rendererの3プロセス構成を採用しています。

```
┌────────────────────────────────────────────────────────────┐
│                      Electron App                          │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Renderer Process (React 19)             │  │
│  │                                                      │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────┐  │  │
│  │  │ BlockDiagram│ │ Coverage   │ │ Feedback       │  │  │
│  │  │ (ReactFlow) │ │ View       │ │ View           │  │  │
│  │  └────────────┘ └────────────┘ └────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │         Zustand Store (5 stores)             │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │ IPC (contextBridge, 18 channels) │
│  ┌──────────────────────┴──────────────────────────────┐  │
│  │              Main Process (Node.js)                  │  │
│  │                                                      │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │ Project Parser (6 modules)                    │   │  │
│  │  │  file-scanner → ast-analyzer → dependency     │   │  │
│  │  │  → complexity → module-builder → index        │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │ Coverage Analyzer (10 modules)                │   │  │
│  │  │  5 parsers → detector → normalizer            │   │  │
│  │  │  → aggregator → test-classifier → index       │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │ Feedback Generator (5 modules)                │   │  │
│  │  │  gap-detector → priority-scorer               │   │  │
│  │  │  → deployer → cycle-tracker → index           │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │  │
│  │  │ Settings │ │ Cache    │ │ Utilities        │   │  │
│  │  │ Manager  │ │ Manager  │ │ file/git/hash    │   │  │
│  │  └──────────┘ └──────────┘ └──────────────────┘   │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

## データフロー

```
[1] ユーザー → プロジェクトディレクトリ選択
[2] file-scanner → ファイル走査（.gitignore対応）
[3] ast-analyzer → 関数抽出・import解析（6言語対応）
[4] dependency-resolver → モジュール間依存グラフ（循環検出付き）
[5] module-builder → ModuleNode ツリー構築
[6] React Flow → ブロック図描画（dagre階層レイアウト）
[7] coverage-analyzer → 5形式のレポート読込・正規化
[8] aggregator → モジュール単位集約・色レベル判定
[9] ブロック図にカバレッジオーバーレイ
[10] feedback-generator → ギャップ検出・優先度スコア計算
[11] deployer → FBファイル配置（バックアップ付き）
[12] cycle-tracker → 前回FBとの比較・改善率算出
```

## セキュリティ

- `contextIsolation: true` / `nodeIntegration: false` / `sandbox: true`
- IPC入力はZodスキーマでバリデーション
- ファイルアクセスはユーザー選択ディレクトリのみ
- 外部サーバーへのデータ送信なし

## 主要な設計判断

アーキテクチャ決定記録は `docs/adr/` を参照。
