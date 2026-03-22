# Claude Code Structured Project Template

Claude Codeを「プロジェクト専属エンジニア」として最大限活用するためのリポジトリテンプレートです。

> **"Prompting is temporary. Structure is permanent."**
> — プロンプトの質よりも、リポジトリの構造がClaude Codeの出力品質を決める。

---

## 前提条件

- **Node.js** 20 以上
- **Git**

---

## Quick Start

1. GitHub でこのテンプレートリポジトリを開く
2. **"Use this template"** → **"Create a new repository"** をクリック
3. リポジトリ名と説明（Description）を入力して作成
4. **1分ほど待ってから**クローンして開発開始:

```bash
git clone https://github.com/<your-name>/my-project.git my-project
cd my-project
claude
```

> GitHub Actions が自動で初期化します（プロジェクト名の置換・依存インストール・テンプレートファイル削除）。
> 手動で実行する場合やオフライン環境では `node setup.js my-project "説明"` を使ってください（Node.js が必要）。
>
> 詳しいテンプレート利用方法は [TEMPLATE.md](./TEMPLATE.md) を参照してください。

---

## プロジェクト構造

```
.
├── CLAUDE.md                         # Repo Memory（200行以内の北極星）
├── .claude/
│   ├── settings.json                 # Tools & Permissions
│   ├── skills/                       # Expert Modes（SKILL.md形式）
│   │   ├── code-review/SKILL.md
│   │   ├── refactoring/SKILL.md
│   │   ├── debugging/SKILL.md
│   │   └── release/SKILL.md
│   ├── rules/                        # Extended Rules（CLAUDE.mdの分割先）
│   │   ├── context-management.md
│   │   └── security.md
│   └── hooks/
│       ├── check-claude-md-size.sh   # CLAUDE.md行数チェック
│       └── README.md                 # Hook設定ガイド
├── .husky/
│   └── pre-commit                    # Git hooks（lint-staged実行）
├── docs/                             # Progressive Context
│   ├── architecture.md
│   ├── adr/
│   └── runbooks/
├── .claude/
│   └── settings.local.json.example   # 個人設定のテンプレート
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── pull_request_template.md
│   └── workflows/
│       ├── ci.yml                    # CI（テスト・リント自動実行）
│       ├── claude.yml                # Claude Code PR/Issue自動対応
│       └── template-setup.yml        # テンプレート初期化（自動実行）
├── src/
│   ├── auth/CLAUDE.md                # Local Context（セキュリティ重要）
│   ├── billing/CLAUDE.md             # Local Context（ビジネス重要）
│   └── api/CLAUDE.md                 # Local Context（API規約）
├── CLAUDE_PROGRESS.md            # セッション継続（進捗・TODO）
├── CLAUDE_ISSUE.md               # エラー記録（原因・解決策の蓄積）
├── .gitignore
├── package.json
└── tsconfig.json
```

---

## 構成要素

### 1. CLAUDE.md — Repo Memory（リポジトリの記憶）

プロジェクトのルートに置く「北極星」ファイル。Claude Codeは起動時に自動で読み込みます。

**重要：200行以内に収める。** 200行を超えると切り捨てられ、Claudeが重要なルールを見逃します。

**記載すべき内容：**
- プロジェクトの目的（1〜2行）
- ディレクトリ構造の概要
- 技術スタック、コーディング規約
- 絶対に守るべきルール
- よく使うコマンド

**記載すべきでない内容：**
- 詳細なAPIドキュメント（`@docs/` 配下に別ファイルとして配置し参照）
- フレームワークのチュートリアル（自明な知識）
- スプリント目標やTODO（`CLAUDE_PROGRESS.md` に記載）

```markdown
# CLAUDE.md
## Purpose
ユーザー認証・課金管理を行うバックエンドAPI

## Tech Stack
TypeScript / Node.js / Vitest / Prettier / ESLint

## Rules
1. src/auth/ と src/billing/ は承認なしに変更禁止
2. コミット前にテストとリンターを必ず実行

For security rules, see @.claude/rules/security.md
```

---

### 2. .claude/rules/ — Extended Rules（拡張ルール）

CLAUDE.md が大きくなりすぎた場合の分割先です。トピック別にファイルを作成します。

```
.claude/rules/
├── context-management.md    # コンテキストウィンドウ管理ルール
└── security.md              # セキュリティルール
```

CLAUDE.md から `@.claude/rules/security.md` のように参照できます。

---

### 3. .claude/skills/ — Expert Modes（エキスパートモード）

再利用可能なワークフローテンプレート。**SKILL.md 形式**（ディレクトリ + フロントマター）で作成します。

```
.claude/skills/
├── code-review/SKILL.md     # /code-review で呼び出し
├── refactoring/SKILL.md     # /refactoring で呼び出し
├── debugging/SKILL.md       # /debugging で呼び出し
└── release/SKILL.md         # /release で呼び出し
```

**SKILL.md のフォーマット：**

```yaml
---
name: code-review
description: Perform a structured code review
disable-model-invocation: true    # 手動呼び出しのみ
argument-hint: [file-or-directory]
allowed-tools: Read, Grep, Glob
---

$ARGUMENTS をレビューしてください。
以下のチェックリストに従って...
```

**フロントマターの主要フィールド：**

| フィールド | 説明 |
|-----------|------|
| `name` | スラッシュコマンド名（必須） |
| `description` | 説明（Claudeの自動呼び出し判定に使用） |
| `disable-model-invocation` | `true` = 手動のみ、`false` = Claude自動判定 |
| `argument-hint` | 引数のヒント（オートコンプリート用） |
| `allowed-tools` | 許可するツール |
| `model` | 使用モデル（`sonnet`, `haiku` 等） |
| `context` | `fork` でサブエージェント実行 |

**使い方：**

```bash
/code-review src/api/      # コードレビュー
/debugging ログインできない  # バグ調査
/refactoring src/api/routes.ts  # リファクタリング
/release patch              # リリース準備
```

---

### 4. .claude/hooks/ — Guardrails（自動ガードレール）

Claude Codeの操作に対して自動チェックを走らせる仕組み。`.claude/settings.json` で設定します。

**主なフックポイント：**

| フックポイント | タイミング | 用途例 |
|---------------|----------|-------|
| `SessionStart` | セッション開始時 | リマインダー注入 |
| `PreToolUse` | ツール実行前 | 保護ディレクトリへの書き込みブロック |
| `PostToolUse` | ツール実行後 | フォーマッター・リンター実行 |
| `Stop` | Claude応答完了後 | テスト自動実行 |
| `PreCompact` | コンテキスト圧縮前 | 重要情報の保持指示 |

**フックの種類：**

| Type | 説明 |
|------|------|
| `command` | シェルコマンド実行（終了コード 0=許可, 2=ブロック）|
| `prompt` | LLMによる単一ターン評価 |
| `agent` | サブエージェントによる検証 |
| `http` | HTTPエンドポイントへPOST |

**正しい設定フォーマット：**

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npm run format:check"
          }
        ]
      }
    ]
  }
}
```

> 詳しい設定方法は [.claude/hooks/README.md](./.claude/hooks/README.md) を参照。

---

### 5. .claude/settings.json — Tools & Permissions（ツールと権限）

Claude Codeのツール許可・拒否、フック、MCP連携を一元管理します。

```json
{
  "permissions": {
    "allow": [
      "Read", "Glob", "Grep",
      "Bash(npm run test)",
      "Bash(npm run lint)",
      "Bash(npm run format)",
      "Bash(npm run build)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force)",
      "Bash(git reset --hard)",
      "Read(.env)"
    ]
  }
}
```

**キー名に注意：** `allow` / `deny`（~~allowedTools~~ / ~~deniedTools~~ ではない）

**設定ファイルの優先順位（高→低）：**

1. Managed settings（企業ポリシー、上書き不可）
2. `.claude/settings.local.json`（個人設定、`.gitignore` に入れる）
3. `.claude/settings.json`（チーム共有設定）
4. `~/.claude/settings.json`（ユーザー全体設定）

#### MCP Servers（外部ツール連携）

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "your-token" }
    }
  }
}
```

| MCP Server | できること |
|-----------|----------|
| filesystem | プロジェクト外のファイルアクセス |
| github | Issue/PR操作、リポジトリ管理 |
| postgres | データベースクエリ実行 |
| slack | Slackメッセージ送受信 |

---

### 6. docs/ — Progressive Context（段階的コンテキスト）

ドキュメントをプロンプトに詰め込まず、参照可能な場所に配置します。Claude Codeは必要に応じて `@docs/architecture.md` で参照します。

```
docs/
├── architecture.md              # システムアーキテクチャ図
├── adr/
│   └── 001-modular-architecture.md  # なぜこの設計にしたか
└── runbooks/
    └── incident-response.md     # インシデント対応フロー
```

---

### 7. Local CLAUDE.md — モジュール固有のコンテキスト

重要モジュールのディレクトリに配置する専用の指示書。Claudeがそのディレクトリを操作する際に自動参照されます。

```
src/
├── auth/CLAUDE.md      # 「パスワードは必ずbcryptで12ラウンド以上」
├── billing/CLAUDE.md   # 「金額計算にfloatを使わない、冪等性キー必須」
└── api/CLAUDE.md       # 「エラーレスポンス形式を統一」
```

---

### 8. .github/ — CI & Issue/PR テンプレート

#### CI パイプライン（`.github/workflows/ci.yml`）

push・PR時にテスト・リント・型チェック・ビルドを自動実行します。

#### Claude Code Action（`.github/workflows/claude.yml`）

Issue や PR コメントで `@claude` とメンションすると、Claude Code が自動で対応します。

```markdown
<!-- Issue に書く例 -->
@claude このバグを調査して修正PRを作成してください
```

利用には GitHub Secrets に `ANTHROPIC_API_KEY` の設定が必要です。

#### Issue/PR テンプレート

```
.github/
├── ISSUE_TEMPLATE/
│   ├── bug_report.md           # バグ報告テンプレート
│   └── feature_request.md     # 機能要望テンプレート
└── pull_request_template.md    # PRテンプレート
```

---

### 9. CLAUDE_PROGRESS.md — セッション継続性

セッションをまたぐ作業の継続性を保証するファイルです。

**Claude Code は毎セッション開始時にこのファイルを最初に読みます**（CLAUDE.md の Session Start ルールで指示済み）。

記録する内容：
- **現在の状態**（作業中 / 完了 / 中断）
- **TODOリスト**（未完了タスク）
- **変更履歴**（どのファイルを作成・変更・削除したか）
- **設計判断ログ**（なぜそうしたか）

運用ルール：
- 大きなタスクは小さなステップに分割し、ステップ完了ごとに更新
- 中断時は必ず残りの TODO を記録してから停止
- `/compact` でコンテキストが圧縮されても、このファイルから状態を復元できる

---

### 10. CLAUDE_ISSUE.md — エラー学習サイクル

バグの原因と解決策を蓄積し、同じ間違いを繰り返さないためのファイルです。

記録する内容：
- **Symptom** — 何が起きたか（エラーメッセージ、不具合の挙動）
- **Root Cause** — なぜ起きたか
- **Solution** — どう直したか
- **Prevention** — 今後どう防ぐか

`/debugging` スキルの Step 6 で自動的にこのファイルへ追記されます。デバッグ開始前にもこのファイルを参照し、既知の問題に該当しないか確認します。

---

### 11. Git Hooks — Claude 非依存のガードレール

`husky` + `lint-staged` で、Claude Code を使わない開発者にもコミット時チェックを適用します。

```bash
# セットアップ（npm install 時に自動実行）
npm install husky lint-staged --save-dev
npx husky init
```

**動作：** `git commit` 実行時に、ステージされたファイルに対して Prettier と ESLint を自動実行。

`package.json` に設定済み：

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["prettier --write", "eslint --fix"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

---

### 12. settings.local.json — 個人設定

`.claude/settings.local.json.example` をコピーして個人設定を作成します。

```bash
cp .claude/settings.local.json.example .claude/settings.local.json
# .gitignore に入っているのでコミットされません
```

個人設定の用途：
- 個人の GitHub トークンや MCP サーバー接続
- 追加のツール許可（`git commit` 等）
- サブエージェントのモデル指定（コスト管理）

---

## コンテキストウィンドウ管理

Claude Codeを効果的に使うための重要な運用テクニックです。

### コンテキストが肥大化する原因

| 原因 | 対策 |
|------|------|
| CLAUDE.md が長すぎる | 200行以内に収める。超えたら `.claude/rules/` に分割 |
| ドキュメントを直接貼り付け | `@docs/filename.md` で参照に切り替え |
| 大量のファイル探索 | Explore サブエージェントに委任 |
| 長い会話の蓄積 | `/compact` でコンテキスト圧縮、`/clear` でリセット |
| 不要な MCP サーバー接続 | 使わないサーバーは設定から除外 |

### 圧縮時の保持指示

CLAUDE.md に以下を記載しておくと、`/compact` 実行時に重要情報が保持されます：

```markdown
## Context Management
When compacting, always preserve: modified file list, current task, and key decisions
```

### サブエージェント活用

大量のファイル読み込みが必要な場面では、サブエージェントに委任するとメインのコンテキストを節約できます：

| 場面 | サブエージェント | 理由 |
|------|----------------|------|
| コードベース探索 | Explore | 探索結果がメインを消費しない |
| コードレビュー | fork (skills) | `context: fork` で結果のみ返す |
| 長時間テスト実行 | バックグラウンド | 詳細出力を隔離 |
| 並列調査 | 複数サブエージェント | 独立タスクの同時実行 |

このテンプレートに組み込み済みの対策：

| 対策 | 場所 | 説明 |
|------|------|------|
| CLAUDE.md 行数チェック | `.claude/hooks/check-claude-md-size.sh` | 200行超えで警告 |
| Explore を安いモデルで実行 | `.claude/settings.json` の `subagentConfiguration` | Haiku でコスト節約 |
| code-review を fork 実行 | `.claude/skills/code-review/SKILL.md` | `context: fork` でメインを消費しない |
| ルール分割先 | `.claude/rules/` | CLAUDE.md が肥大化したら移動 |

---

## 実践ガイド

### このテンプレートを自分のプロジェクトに適用する

1. **CLAUDE.md を書く**（最優先）
   - 目的・構造・ルールの3点を簡潔に（200行以内）
   - 長くなったら `.claude/rules/` に分割

2. **保護ディレクトリを特定する**
   - 認証、決済、DB マイグレーションなど
   - hooks と `deny` で防御設定

3. **繰り返す作業をスキル化する**
   - 毎回同じ指示を出しているなら `.claude/skills/` に SKILL.md を追加

4. **設計判断を ADR に残す**
   - 「なぜこうしたか」を `docs/adr/` に記録

5. **モジュールが複雑になったら Local CLAUDE.md を追加**
   - 1ファイルで済むうちは不要。複雑さに応じて段階的に

6. **Issue/PR テンプレートを整備する**
   - `.github/ISSUE_TEMPLATE/` でバグ報告・機能要望を標準化

7. **テストカバレッジを維持する**
   - `npm run test:coverage` でカバレッジレポートを生成
   - ビジネスロジックは 80% 以上を目標
   - CI でカバレッジチェックを有効にすることも可能

---

## License

MIT
