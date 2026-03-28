# 実装設計書: Test Insight Hub

## 文書情報

| 項目 | 内容 |
|------|------|
| プロジェクト名 | Test Insight Hub |
| バージョン | 2.0.0 |
| 作成日 | 2026-03-22 |
| 対応要件定義書 | docs/requirements.md v2.0.0 |

---

## 1. ディレクトリ構成

```
test-insight-hub/
├── package.json
├── electron.vite.config.ts          # electron-vite 設定
├── tsconfig.json                    # ベース TypeScript 設定
├── tsconfig.node.json               # Main プロセス用
├── tsconfig.web.json                # Renderer プロセス用
│
├── resources/                       # アプリアイコン等の静的リソース
│   ├── icon.png
│   └── icon.ico
│
├── src/
│   ├── main/                        # ── Electron Main プロセス ──
│   │   ├── index.ts                 # エントリポイント（BrowserWindow 生成）
│   │   ├── ipc/                     # IPC ハンドラ登録
│   │   │   ├── index.ts             # 全ハンドラの一括登録
│   │   │   ├── project-handlers.ts  # project:* チャネル
│   │   │   ├── coverage-handlers.ts # coverage:* チャネル
│   │   │   ├── feedback-handlers.ts # feedback:* チャネル
│   │   │   ├── settings-handlers.ts # settings:* チャネル
│   │   │   └── export-handlers.ts   # export:*, cache:* チャネル
│   │   │
│   │   ├── services/                # ビジネスロジック
│   │   │   ├── project-parser/      # F-001: プロジェクト解析
│   │   │   │   ├── index.ts         # 公開 API
│   │   │   │   ├── file-scanner.ts  # ファイル走査・除外パターン適用
│   │   │   │   ├── ast-analyzer.ts  # tree-sitter による AST 解析
│   │   │   │   ├── dependency-resolver.ts  # import/require 解析・依存グラフ
│   │   │   │   ├── module-builder.ts      # ディレクトリ→モジュール構造変換
│   │   │   │   └── complexity-calculator.ts # 循環的複雑度算出
│   │   │   │
│   │   │   ├── coverage-analyzer/   # F-003/F-004: カバレッジ解析
│   │   │   │   ├── index.ts
│   │   │   │   ├── report-detector.ts     # レポート形式の自動判定
│   │   │   │   ├── parsers/               # 各形式のパーサー
│   │   │   │   │   ├── istanbul-parser.ts
│   │   │   │   │   ├── coveragepy-parser.ts
│   │   │   │   │   ├── go-cover-parser.ts
│   │   │   │   │   ├── llvm-cov-parser.ts
│   │   │   │   │   └── lcov-parser.ts
│   │   │   │   ├── normalizer.ts          # 共通フォーマットへの正規化
│   │   │   │   ├── aggregator.ts          # モジュール単位の集約
│   │   │   │   └── test-classifier.ts     # テスト種別の自動分類
│   │   │   │
│   │   │   ├── feedback-generator/  # F-005/F-006/F-007: フィードバック
│   │   │   │   ├── index.ts
│   │   │   │   ├── gap-detector.ts        # カバレッジギャップ検出
│   │   │   │   ├── priority-scorer.ts     # 優先度スコア計算
│   │   │   │   ├── change-frequency.ts    # git log ベースの変更頻度算出
│   │   │   │   ├── recommendation-builder.ts # 推奨テスト生成
│   │   │   │   ├── feedback-deployer.ts   # FB ファイル配置・バックアップ
│   │   │   │   └── cycle-tracker.ts       # フィードバックサイクル比較
│   │   │   │
│   │   │   ├── file-watcher.ts      # chokidar によるファイル監視
│   │   │   ├── cache-manager.ts     # 解析キャッシュの保存・読込・無効化
│   │   │   └── settings-manager.ts  # グローバル/プロジェクト設定の管理
│   │   │
│   │   └── utils/
│   │       ├── git-utils.ts         # git log 取得・変更頻度計算
│   │       ├── file-utils.ts        # パス操作・.gitignore パース
│   │       └── hash-utils.ts        # SHA-256 ハッシュ（projectId 生成）
│   │
│   ├── preload/                     # ── Preload スクリプト ──
│   │   ├── index.ts                 # contextBridge.exposeInMainWorld
│   │   └── api.d.ts                 # window.api の型定義
│   │
│   ├── renderer/                    # ── Renderer プロセス (React) ──
│   │   ├── index.html
│   │   ├── main.tsx                 # React エントリポイント
│   │   ├── App.tsx                  # ルートコンポーネント・ルーティング
│   │   │
│   │   ├── components/              # 共通UIコンポーネント
│   │   │   ├── layout/
│   │   │   │   ├── sidebar.tsx      # サイドバーナビゲーション
│   │   │   │   ├── header.tsx       # ヘッダー
│   │   │   │   └── log-panel.tsx    # ログ・ワーニング表示パネル
│   │   │   ├── common/
│   │   │   │   ├── progress-bar.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── tooltip.tsx
│   │   │   │   └── icon.tsx
│   │   │   └── diagram/
│   │   │       ├── module-node.tsx  # React Flow カスタムノード
│   │   │       ├── dependency-edge.tsx # カスタムエッジ
│   │   │       └── diagram-controls.tsx # ズーム・レイアウト切替
│   │   │
│   │   ├── pages/                   # 画面コンポーネント（S-001〜S-007）
│   │   │   ├── home-page.tsx        # S-001: ホーム画面
│   │   │   ├── diagram-page.tsx     # S-002: ブロック図画面
│   │   │   ├── coverage-page.tsx    # S-003: カバレッジ画面
│   │   │   ├── coverage-detail-panel.tsx # S-004: カバレッジ詳細
│   │   │   ├── feedback-page.tsx    # S-005: フィードバック生成画面
│   │   │   ├── feedback-history-page.tsx # S-006: フィードバック履歴
│   │   │   └── settings-page.tsx    # S-007: 設定画面
│   │   │
│   │   ├── stores/                  # Zustand ストア
│   │   │   ├── project-store.ts     # プロジェクト構造・解析状態
│   │   │   ├── coverage-store.ts    # カバレッジデータ・フィルタ状態
│   │   │   ├── feedback-store.ts    # フィードバック生成結果・履歴
│   │   │   ├── ui-store.ts          # テーマ・言語・ウィンドウ状態
│   │   │   └── settings-store.ts    # 設定値
│   │   │
│   │   ├── hooks/                   # カスタム React Hooks
│   │   │   ├── use-ipc.ts           # IPC 通信の共通ラッパー
│   │   │   ├── use-diagram.ts       # React Flow 操作
│   │   │   └── use-coverage-filter.ts # カバレッジフィルタリング
│   │   │
│   │   ├── i18n/                    # 国際化
│   │   │   ├── index.ts
│   │   │   ├── ja.json
│   │   │   └── en.json
│   │   │
│   │   └── styles/
│   │       ├── global.css
│   │       └── theme.ts             # ダーク/ライトテーマ定義
│   │
│   └── shared/                      # ── Main/Renderer 共有 ──
│       ├── types/                   # 型定義
│       │   ├── project.ts           # ModuleNode, DependencyEdge, ProjectStructure
│       │   ├── coverage.ts          # CoverageData, FileCoverage, ModuleCoverage
│       │   ├── feedback.ts          # FeedbackFile, Gap, Recommendation
│       │   ├── settings.ts          # GlobalSettings, ProjectSettings
│       │   └── ipc.ts               # IPC チャネル名定数・ペイロード型
│       ├── constants.ts             # アプリ定数（デフォルト閾値等）
│       └── schemas/                 # Zod バリデーションスキーマ
│           ├── settings-schema.ts
│           └── feedback-schema.ts
│
└── tests/                           # テスト
    ├── unit/
    │   ├── services/
    │   │   ├── project-parser.test.ts
    │   │   ├── coverage-analyzer.test.ts
    │   │   └── feedback-generator.test.ts
    │   └── renderer/
    │       ├── stores/
    │       └── components/
    ├── integration/
    │   ├── ipc.test.ts
    │   └── coverage-parsers.test.ts
    └── fixtures/                    # テスト用のサンプルプロジェクト・レポート
        ├── sample-project/
        ├── istanbul-report.json
        ├── lcov.info
        └── go-coverprofile.txt
```

---

## 2. 共有型定義

Main プロセスと Renderer プロセスの両方から参照する型を `src/shared/types/` に定義する。

### 2.1 プロジェクト構造型 (`project.ts`)

```typescript
/** ファイル解析結果 */
export interface ParsedFile {
  readonly path: string;           // プロジェクトルートからの相対パス
  readonly language: Language;
  readonly loc: number;            // 行数
  readonly functions: readonly FunctionInfo[];
  readonly imports: readonly string[]; // import 先の相対パス
}

export interface FunctionInfo {
  readonly name: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly complexity: number;     // 循環的複雑度
}

export type Language = 'typescript' | 'javascript' | 'python' | 'go' | 'rust' | 'c' | 'cpp';

/** モジュール（ブロック図の1ノード） */
export interface ModuleNode {
  readonly id: string;             // モジュールパス（例: "src/api"）
  readonly name: string;           // 表示名（例: "api"）
  readonly path: string;
  readonly files: readonly ParsedFile[];
  readonly fileCount: number;
  readonly functionCount: number;
  readonly totalLoc: number;
  readonly children: readonly ModuleNode[]; // ドリルダウン用の子モジュール
}

/** モジュール間の依存関係（ブロック図のエッジ） */
export interface DependencyEdge {
  readonly source: string;         // ModuleNode.id
  readonly target: string;
  readonly weight: number;         // import 数
  readonly isCyclic: boolean;
}

/** プロジェクト全体の解析結果 */
export interface ProjectStructure {
  readonly rootPath: string;
  readonly modules: readonly ModuleNode[];
  readonly edges: readonly DependencyEdge[];
  readonly totalFiles: number;
  readonly totalLoc: number;
  readonly parsedAt: string;       // ISO 8601
  readonly parseErrors: readonly ParseError[];
}

export interface ParseError {
  readonly filePath: string;
  readonly message: string;
  readonly line?: number;
}
```

### 2.2 カバレッジ型 (`coverage.ts`)

```typescript
/** 正規化済みカバレッジデータ（全パーサー共通の出力形式） */
export interface NormalizedCoverage {
  readonly reportFormat: CoverageReportFormat;
  readonly files: readonly FileCoverage[];
  readonly generatedAt: string;
}

export type CoverageReportFormat =
  | 'istanbul'
  | 'coveragepy'
  | 'go-coverprofile'
  | 'llvm-cov'
  | 'lcov';

export interface FileCoverage {
  readonly filePath: string;       // プロジェクトルートからの相対パス
  readonly lineCoverage: CoverageMetric;
  readonly branchCoverage: CoverageMetric | null; // 形式によっては null
  readonly functionCoverage: CoverageMetric;
  readonly uncoveredLines: readonly LineRange[];
  readonly uncoveredFunctions: readonly string[];
  readonly coveredByTests: readonly TestReference[];
}

export interface CoverageMetric {
  readonly covered: number;
  readonly total: number;
  readonly percentage: number;     // 0〜100
}

export interface LineRange {
  readonly start: number;
  readonly end: number;
  readonly functionName?: string;
}

export interface TestReference {
  readonly testFilePath: string;
  readonly testName: string;
  readonly testType: TestType;
}

export type TestType = 'unit' | 'integration' | 'e2e';

/** モジュール単位の集約カバレッジ */
export interface ModuleCoverage {
  readonly moduleId: string;
  readonly lineCoverage: CoverageMetric;
  readonly branchCoverage: CoverageMetric | null;
  readonly functionCoverage: CoverageMetric;
  readonly files: readonly FileCoverage[];
  readonly colorLevel: CoverageColorLevel;
}

export type CoverageColorLevel = 'green' | 'yellow' | 'red' | 'grey';
export type CoverageMode = 'line' | 'branch' | 'function';
```

### 2.3 フィードバック型 (`feedback.ts`)

```typescript
/** フィードバックファイルのスキーマ（JSON 出力形式と一致） */
export interface FeedbackFile {
  readonly version: string;
  readonly generatedAt: string;
  readonly projectRoot: string;
  readonly coverageThreshold: number;
  readonly summary: FeedbackSummary;
  readonly gaps: readonly CoverageGap[];
  readonly recommendations: readonly TestRecommendation[];
}

export interface FeedbackSummary {
  readonly totalModules: number;
  readonly belowThreshold: number;
  readonly totalUncoveredFunctions: number;
  readonly overallCoverage: number;
}

export interface CoverageGap {
  readonly filePath: string;
  readonly moduleName: string;
  readonly currentCoverage: number;
  readonly targetCoverage: number;
  readonly uncoveredLines: readonly {
    readonly start: number;
    readonly end: number;
    readonly functionName: string;
  }[];
  readonly recommendedTestType: TestType;
  readonly priority: 'high' | 'medium' | 'low';
  readonly priorityScore: number;
  readonly complexity: number;
  readonly changeFrequency: number;
}

export interface TestRecommendation {
  readonly type: TestType;
  readonly targetFile: string;
  readonly suggestedTestFile: string;
  readonly functions: readonly string[];
  readonly description: string;
}

/** フィードバック比較結果（F-007） */
export interface FeedbackComparison {
  readonly previousFeedbackAt: string;
  readonly currentFeedbackAt: string;
  readonly improved: readonly GapChange[];
  readonly unchanged: readonly GapChange[];
  readonly newGaps: readonly CoverageGap[];
  readonly improvementRate: number;  // 0〜100
}

export interface GapChange {
  readonly filePath: string;
  readonly previousCoverage: number;
  readonly currentCoverage: number;
  readonly targetCoverage: number;
}
```

### 2.4 IPC 型定義 (`ipc.ts`)

```typescript
/** IPC チャネル名を定数として一元管理 */
export const IPC_CHANNELS = {
  PROJECT_SELECT_DIRECTORY: 'project:select-directory',
  PROJECT_PARSE: 'project:parse',
  PROJECT_PARSE_PROGRESS: 'project:parse-progress',
  PROJECT_PARSE_RESULT: 'project:parse-result',
  PROJECT_PARSE_ERROR: 'project:parse-error',
  COVERAGE_LOAD: 'coverage:load',
  COVERAGE_LOAD_RESULT: 'coverage:load-result',
  COVERAGE_LOAD_ERROR: 'coverage:load-error',
  FEEDBACK_GENERATE: 'feedback:generate',
  FEEDBACK_GENERATE_RESULT: 'feedback:generate-result',
  FEEDBACK_DEPLOY: 'feedback:deploy',
  FEEDBACK_DEPLOY_RESULT: 'feedback:deploy-result',
  FEEDBACK_HISTORY: 'feedback:history',
  TEST_RUN: 'test:run',
  TEST_RUN_OUTPUT: 'test:run-output',
  TEST_RUN_RESULT: 'test:run-result',
  TEST_QUALITY_ANALYZE: 'test:quality-analyze',
  SETTINGS_LOAD: 'settings:load',
  SETTINGS_SAVE: 'settings:save',
  FILE_WATCH_CHANGE: 'file:watch-change',
  EXPORT_DIAGRAM: 'export:diagram',
  CACHE_CLEAR: 'cache:clear',
} as const;

/** IPC ペイロード型マッピング */
export interface IpcPayloads {
  [IPC_CHANNELS.PROJECT_PARSE]: {
    request: { rootPath: string; testRootPath?: string };
    response: ProjectStructure;
  };
  [IPC_CHANNELS.PROJECT_PARSE_PROGRESS]: {
    event: { current: number; total: number; currentFile: string };
  };
  [IPC_CHANNELS.COVERAGE_LOAD]: {
    request: { reportPath?: string; autoDetect: boolean };
    response: NormalizedCoverage;
  };
  [IPC_CHANNELS.FEEDBACK_GENERATE]: {
    request: { threshold: number; weights?: PriorityWeights };
    response: FeedbackFile;
  };
  [IPC_CHANNELS.FEEDBACK_DEPLOY]: {
    request: { feedbackFile: FeedbackFile; deployPath: string };
    response: { success: boolean; backupPath?: string };
  };
  // 他チャネルも同構造で定義
}

export interface PriorityWeights {
  readonly coverageGapWeight: number;
  readonly complexityWeight: number;
  readonly changeFreqWeight: number;
}
```

---

## 3. Mainプロセス詳細設計

### 3.1 エントリポイント (`main/index.ts`)

```
起動シーケンス:
  1. app.whenReady()
  2. グローバル設定を読み込む (settings-manager)
  3. BrowserWindow を生成（preload スクリプト指定）
       - contextIsolation: true
       - nodeIntegration: false
       - sandbox: true
  4. IPC ハンドラを一括登録 (ipc/index.ts)
  5. Renderer の index.html をロード
  6. ウィンドウ状態を復元 (window-state.json)
```

### 3.2 Project Parser サービス

```
file-scanner.ts
  入力: rootPath, excludePatterns
  処理:
    1. .gitignore をパースして除外パターンを構築
    2. 再帰的にファイルを走査（fs.readdir + ignore ライブラリ）
    3. 拡張子フィルタで対応言語のファイルを抽出
    4. シンボリックリンクの循環検出（visitedPaths の Set で管理）
    5. ファイルパス一覧を返却
  出力: string[]（相対パス）
  進捗通知: 100ファイルごとに IPC で進捗を送信

ast-analyzer.ts
  入力: filePath, language
  処理:
    1. tree-sitter の言語別パーサーを取得（キャッシュ済み）
    2. ファイル内容を読み込み、AST を生成
    3. AST から関数定義・import 文を抽出
    4. 各関数の循環的複雑度を算出（complexity-calculator 委譲）
  出力: ParsedFile
  エラー: パースエラーは ParseError として収集、処理は続行

dependency-resolver.ts
  入力: ParsedFile[]
  処理:
    1. 各ファイルの imports を解決（相対パス → 絶対パス → 相対パス正規化）
    2. ファイル単位の依存グラフを構築
    3. モジュール単位（ディレクトリ）に集約
    4. 循環依存を検出（Tarjan のアルゴリズム）
  出力: DependencyEdge[]

module-builder.ts
  入力: string[]（ファイルパス）, ParsedFile[]
  処理:
    1. ファイルパスからディレクトリ階層を構築
    2. 設定可能な深度でモジュール分割（デフォルト: 2階層）
    3. 各モジュールの統計情報（ファイル数、関数数、LOC）を集約
    4. 子モジュール（ドリルダウン用）を再帰的に構築
  出力: ModuleNode[]
```

### 3.3 Coverage Analyzer サービス

```
report-detector.ts
  入力: ファイルパスまたはファイル内容の先頭 1KB
  処理:
    1. ファイル名パターンで判定（coverage-final.json → istanbul 等）
    2. ファイル内容のマジックバイト/構造で判定
       - JSON で "fnMap" キー → istanbul
       - "mode: set" or "mode: count" → go coverprofile
       - "SF:" で始まる行 → lcov
    3. 判定不能なら null を返却
  出力: CoverageReportFormat | null

normalizer.ts
  入力: 各パーサーの生出力
  処理:
    1. ファイルパスの正規化（OS差異、相対パス変換）
    2. pathMappings の適用（別リポジトリ構成時）
    3. 共通の FileCoverage 形式に変換
    4. ソースファイルとの突合チェック（一致/不一致の分類）
  出力: NormalizedCoverage

aggregator.ts
  入力: NormalizedCoverage, ModuleNode[]
  処理:
    1. FileCoverage を所属モジュールにグルーピング
    2. モジュール単位で covered/total を合算
    3. colorLevel を判定（閾値は ProjectSettings から取得）
  出力: ModuleCoverage[]

test-classifier.ts
  入力: テストファイルパス
  処理: 以下の優先順で分類
    1. ディレクトリ名: unit/ → unit, integration/ → integration, e2e/ → e2e
    2. ファイル名: *.unit.*, *.int.*, *.e2e.*
    3. テスト内のアノテーション/タグ（言語固有）
    4. フォールバック: "unit"
  出力: TestType
```

### 3.4 Feedback Generator サービス

```
gap-detector.ts
  入力: ModuleCoverage[], threshold
  処理:
    1. 各 ModuleCoverage を閾値と比較
    2. 閾値未満のモジュール内で、未カバー関数を特定
    3. ファイル×関数 単位の CoverageGap リストを構築
  出力: CoverageGap[]（priorityScore 未計算）

priority-scorer.ts
  入力: CoverageGap[], PriorityWeights
  処理:
    1. coverageGap = (target - current) / target * 100
    2. complexity = ParsedFile から取得済みの循環的複雑度
    3. changeFrequency = change-frequency.ts から取得
    4. 各因子を 0〜100 に正規化
    5. 重み付き合算 → priorityScore
    6. priorityScore から priority ラベルを判定
  出力: CoverageGap[]（priorityScore 計算済み）

change-frequency.ts
  入力: filePath, rootPath
  処理:
    1. git log --follow --since="90 days ago" --format="%H" -- <file>
    2. コミット数をカウント
    3. 最大値で正規化（プロジェクト内最大コミット数 = 100）
  フォールバック:
    - git が存在しない: ファイル mtime が 30 日以内 → 50, それ以外 → 0
  出力: number（0〜100）

feedback-deployer.ts
  入力: FeedbackFile, deployPath
  処理:
    1. 配置先ディレクトリの存在確認・作成
    2. 既存ファイルがあれば <filename>.<timestamp>.bak にリネーム
    3. FeedbackFile を JSON.stringify で書き出し
    4. .gitignore の存在確認、.test-insight/ の有無チェック
    5. 未追記なら追記提案を IPC で通知
  出力: { success: boolean; backupPath?: string }

cycle-tracker.ts
  入力: 現在の FeedbackFile, 前回の FeedbackFile
  処理:
    1. 前回 gaps と今回 gaps を filePath でマッチング
    2. 改善（currentCoverage 上昇）、未改善、新規の3グループに分類
    3. improvementRate を算出
    4. 結果を feedback-history/ に保存
  出力: FeedbackComparison
```

### 3.5 Cache Manager

```
cache-manager.ts
  キャッシュキー: SHA-256(filePath + fileSize + mtime)
  保存形式: MessagePack（JSON より 30〜50% 小さい）
  保存先: <userData>/projects/{projectId}/cache/

  操作:
    get(filePath): ParsedFile | null
      1. ファイルの現在の stat を取得
      2. キャッシュキーを計算
      3. キャッシュファイルが存在し、キーが一致すれば返却
      4. 不一致または不在なら null

    set(filePath, parsedFile): void
      1. キャッシュキーを計算
      2. MessagePack でシリアライズ
      3. キャッシュファイルに書き込み
      4. サイズ制限チェック（超過時は LRU で削除）

    invalidate(projectId): void
      1. プロジェクトのキャッシュディレクトリを削除

    getStats(): { totalSize: number; fileCount: number }
```

---

## 4. Preloadスクリプト設計

```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

const api = {
  // Renderer → Main（invoke/handle パターン）
  project: {
    selectDirectory: () => ipcRenderer.invoke(CHANNELS.PROJECT_SELECT_DIRECTORY),
    parse: (params) => ipcRenderer.invoke(CHANNELS.PROJECT_PARSE, params),
  },
  coverage: {
    load: (params) => ipcRenderer.invoke(CHANNELS.COVERAGE_LOAD, params),
  },
  feedback: {
    generate: (params) => ipcRenderer.invoke(CHANNELS.FEEDBACK_GENERATE, params),
    deploy: (params) => ipcRenderer.invoke(CHANNELS.FEEDBACK_DEPLOY, params),
    getHistory: (projectId) => ipcRenderer.invoke(CHANNELS.FEEDBACK_HISTORY, projectId),
  },
  settings: {
    load: (scope) => ipcRenderer.invoke(CHANNELS.SETTINGS_LOAD, scope),
    save: (settings) => ipcRenderer.invoke(CHANNELS.SETTINGS_SAVE, settings),
  },
  exportDiagram: (params) => ipcRenderer.invoke(CHANNELS.EXPORT_DIAGRAM, params),
  clearCache: (projectId) => ipcRenderer.invoke(CHANNELS.CACHE_CLEAR, projectId),

  // Main → Renderer（on/send パターン）
  onParseProgress: (callback) => ipcRenderer.on(CHANNELS.PROJECT_PARSE_PROGRESS, callback),
  onFileChange: (callback) => ipcRenderer.on(CHANNELS.FILE_WATCH_CHANGE, callback),

  // リスナー解除
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
};

contextBridge.exposeInMainWorld('api', api);
```

---

## 5. Rendererプロセス詳細設計

### 5.1 画面遷移

```
┌──────────┐
│  S-001   │  ホーム画面
│  Home    │  ・プロジェクト選択
│          │  ・最近のプロジェクト一覧
└────┬─────┘
     │ プロジェクト選択 or 最近のPJ選択
     ↓
┌──────────┐   タブ切替   ┌──────────┐   タブ切替   ┌──────────┐
│  S-002   │ ←─────────→ │  S-003   │ ←─────────→ │  S-005   │
│ ブロック図│              │カバレッジ │              │ FB生成   │
│          │              │          │              │          │
└──────────┘              └────┬─────┘              └────┬─────┘
                               │ ブロック                 │ 履歴ボタン
                               │ クリック                 ↓
                          ┌────┴─────┐              ┌──────────┐
                          │  S-004   │              │  S-006   │
                          │詳細パネル │              │ FB履歴   │
                          │(スライド) │              │          │
                          └──────────┘              └──────────┘

  サイドバー常駐: [ホーム] [プロジェクト] [設定(S-007)]
  S-002/S-003/S-005 はタブで切替（同一画面内）
  S-004 は S-003 の右側スライドパネル
```

### 5.2 Zustand ストア設計

```typescript
// project-store.ts
interface ProjectState {
  readonly structure: ProjectStructure | null;
  readonly isLoading: boolean;
  readonly parseProgress: { current: number; total: number } | null;
  readonly parseErrors: readonly ParseError[];

  // Actions（新しい state オブジェクトを返す、ミューテーションなし）
  readonly loadProject: (rootPath: string, testRootPath?: string) => Promise<void>;
  readonly reset: () => void;
}

// coverage-store.ts
interface CoverageState {
  readonly normalizedCoverage: NormalizedCoverage | null;
  readonly moduleCoverages: readonly ModuleCoverage[];
  readonly coverageMode: CoverageMode;
  readonly testTypeFilter: TestType | 'all';
  readonly isLoading: boolean;

  readonly loadCoverage: (reportPath?: string) => Promise<void>;
  readonly setCoverageMode: (mode: CoverageMode) => void;
  readonly setTestTypeFilter: (filter: TestType | 'all') => void;
}

// feedback-store.ts
interface FeedbackState {
  readonly currentFeedback: FeedbackFile | null;
  readonly comparison: FeedbackComparison | null;
  readonly history: readonly FeedbackFile[];
  readonly isGenerating: boolean;

  readonly generate: (threshold: number, weights?: PriorityWeights) => Promise<void>;
  readonly deploy: (deployPath: string) => Promise<void>;
  readonly loadHistory: () => Promise<void>;
}
```

### 5.3 React Flow ブロック図設計

```
ModuleNode コンポーネント（カスタムノード）:
  ┌─────────────────────────┐
  │  module-name/            │ ← ヘッダー（背景色 = カバレッジ色）
  ├─────────────────────────┤
  │  Files: 5  Functions: 12│ ← 統計情報
  │  LOC: 340                │
  │  Coverage: 67%  ████░░░ │ ← カバレッジバー（カバレッジビュー時のみ）
  │  [▶ 展開]               │ ← ドリルダウンボタン
  └─────────────────────────┘

  Props:
    - module: ModuleNode
    - coverage?: ModuleCoverage
    - isExpanded: boolean
    - onExpand: () => void

DependencyEdge コンポーネント（カスタムエッジ）:
    - 通常: 灰色矢印、weight をラベル表示
    - 循環依存: 赤色双方向矢印、ツールチップで循環パスを表示

レイアウト切替:
    - 階層レイアウト: dagre ライブラリ（direction: TB）
    - 力指向レイアウト: React Flow のデフォルト force-directed
```

---

## 6. カバレッジパーサー設計

各パーサーは共通インターフェースを実装する。

```typescript
interface CoverageParser {
  readonly format: CoverageReportFormat;
  canParse(content: string): boolean;
  parse(content: string, rootPath: string): FileCoverage[];
}
```

| パーサー | 入力形式 | 主要フィールド | 分岐カバレッジ |
|---------|---------|--------------|-------------|
| istanbul-parser | JSON (`coverage-final.json`) | `statementMap`, `fnMap`, `branchMap`, `s`, `f`, `b` | あり |
| coveragepy-parser | JSON (`coverage.json`) | `files[].executed_lines`, `files[].missing_lines` | あり（`files[].executed_branches`） |
| go-cover-parser | テキスト (`coverprofile`) | `file:startLine.startCol,endLine.endCol count` | なし |
| llvm-cov-parser | JSON (`export形式`) | `data[].files[].segments` | あり |
| lcov-parser | テキスト (`lcov.info`) | `SF:`, `DA:`, `BRDA:`, `FN:`, `FNDA:` | あり |

---

## 7. エラーハンドリング設計

### 7.1 エラー型の統一

```typescript
/** アプリ内の全エラーの基底型 */
export interface AppError {
  readonly code: ErrorCode;
  readonly message: string;        // ユーザー向けメッセージ
  readonly detail?: string;        // 開発者向け詳細
  readonly recoverable: boolean;   // ユーザーが操作で回復可能か
}

export type ErrorCode =
  | 'PERMISSION_DENIED'
  | 'NO_SOURCE_FILES'
  | 'CYCLIC_SYMLINK'
  | 'PARSE_ERROR'
  | 'LARGE_PROJECT_WARNING'
  | 'COVERAGE_FORMAT_INVALID'
  | 'COVERAGE_MISMATCH'
  | 'COVERAGE_FORMAT_UNKNOWN'
  | 'COVERAGE_NOT_LOADED'
  | 'BRANCH_COVERAGE_UNAVAILABLE'
  | 'FEEDBACK_NO_DATA'
  | 'FEEDBACK_ALL_PASSING'
  | 'FEEDBACK_SOURCE_CHANGED'
  | 'DEPLOY_PERMISSION_DENIED'
  | 'DEPLOY_DISK_FULL'
  | 'FEEDBACK_NO_PREVIOUS'
  | 'FEEDBACK_STRUCTURE_MISMATCH';
```

### 7.2 エラー伝搬フロー

```
Main プロセス (Service)
  │  AppError を throw
  ↓
IPC ハンドラ (ipc/*.ts)
  │  try-catch で AppError をキャプチャ
  │  シリアライズして Renderer へ返却
  ↓
Renderer (use-ipc.ts)
  │  レスポンスの error フィールドを検査
  │  error.recoverable に応じて:
  │    true  → トースト通知 + ガイドメッセージ
  │    false → エラーダイアログ + 操作ブロック
  ↓
ログパネル (log-panel.tsx)
  │  全エラー・ワーニングを時系列で表示
```

---

## 8. パフォーマンス設計

### 8.1 大規模プロジェクト対策

| 対策 | 適用箇所 | 詳細 |
|------|---------|------|
| Worker Thread | ast-analyzer | ファイル解析を Worker Pool（4並列）で実行 |
| ストリーム読み込み | file-scanner | `fs.readdir` の再帰を breadth-first で逐次実行、メモリに全パスを保持しない |
| 差分キャッシュ | cache-manager | ファイルの mtime + size でキャッシュヒットを判定、変更ファイルのみ再解析 |
| 遅延レンダリング | React Flow | `nodesDraggable={false}` + viewport 外ノードの仮想化 |
| モジュール折りたたみ | module-builder | 500 モジュール超でトップレベルのみ表示 |
| 進捗通知 | IPC | 100 ファイルごとに進捗率を通知しUIをブロックしない |

### 8.2 メモリ管理

- AST オブジェクトは ParsedFile への変換後に即座に解放する（参照を保持しない）
- tree-sitter のパーサーインスタンスは言語ごとに1つだけ保持する（シングルトン）
- キャッシュの合計サイズを定期チェック（5分間隔）し、上限超過時に LRU 削除

---

## 9. テスト自動実行サービス設計（F-003 v2）

### 9.1 Test Runner サービス

```
framework-detector.ts
  入力: rootPath
  処理:
    1. package.json → vitest or jest を検出
    2. pyproject.toml / pytest.ini → pytest を検出
    3. go.mod → go test を検出
    4. Cargo.toml → cargo test を検出
    5. 各フレームワークのテストコマンドとカバレッジコマンドを生成
  出力: DetectedFramework { framework, testCommand, coverageCommand, reportPath, confidence }

index.ts (test-runner)
  入力: rootPath, customCommand?, timeoutMs?
  処理:
    1. framework-detector でフレームワーク検出
    2. child_process.exec でカバレッジコマンドを実行
    3. stdout/stderr をリアルタイムで IPC 送信（onOutput コールバック）
    4. 実行完了後、生成されたレポートファイルを coverage-analyzer で読み込み
    5. レポートが見つからなければ autoDetect でフォールバック
  出力: TestRunResult { framework, exitCode, stdout, stderr, durationMs, coverageResult }
  タイムアウト: デフォルト 300秒（設定可能）
  環境変数: FORCE_COLOR=0, CI=true（出力のANSIエスケープ抑制）
```

### 9.2 テスト品質分析サービス（F-008）

```
assertion-patterns.ts
  言語別のアサーションパターン定義:
    - TypeScript/JavaScript: expect().toBe, toHaveProperty, toThrow 等
    - Python: assert, assertEqual, assertRaises, pytest.raises 等
    - Go: assert.Equal, assert.Error, t.Run 等
  カテゴリ別スコア:
    status(+1), body(+2), property(+2), type_format(+3), error_case(+3), boundary(+3)
  MAX_POSSIBLE_SCORE = 14

index.ts (test-quality-analyzer)
  入力: テストファイルパス一覧, rootPath
  処理:
    1. 各テストファイルを読み込み
    2. テストブロック（test/it/def test_/func Test）を抽出
    3. 各ブロック内のアサーションパターンをマッチ
    4. カテゴリ別にスコア計算、重複カテゴリは1回のみカウント
    5. HIGH(>=70%) / MEDIUM(>=40%) / LOW(<40%) を判定
    6. 不足カテゴリに基づくサジェスト生成
  出力: ProjectQuality { files[], overallScore, level, highCount, mediumCount, lowCount }
```

---

## 10. セキュリティ設計

| 項目 | 実装方法 |
|------|---------|
| contextIsolation | `BrowserWindow` で `contextIsolation: true` を設定 |
| nodeIntegration | `nodeIntegration: false` を設定 |
| sandbox | `sandbox: true` を設定 |
| IPC バリデーション | 全 IPC ハンドラの入力を Zod スキーマでバリデーション |
| パストラバーサル防止 | ファイルアクセスは `app.getPath('userData')` とユーザー選択ディレクトリ内のみ許可。`path.resolve` 後に許可範囲内か検証 |
| CSP | `Content-Security-Policy: default-src 'self'; script-src 'self'` |

---

## 改訂履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|---------|
| 1.0.0 | 2026-03-22 | 初版作成 |
| 2.0.0 | 2026-03-22 | AI駆動開発対応: テスト自動実行サービス(9.1)、テスト品質分析サービス(9.2)追加、IPCチャネル追加(test:run, test:quality-analyze) |
