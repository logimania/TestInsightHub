# テンプレート利用ガイド

## GitHub Template Repository として使う方法

### Step 1: テンプレートリポジトリとして設定（1回だけ）

GitHubのリポジトリ設定画面で **"Template repository"** にチェックを入れます。

```
Settings → General → Template repository ✅
```

### Step 2: テンプレートから新しいプロジェクトを作成

#### 前提条件

- **Git**
- **Node.js** 20 以上（手動セットアップの場合のみ）

#### 手順

1. GitHub でこのテンプレートリポジトリを開く
2. **"Use this template"** → **"Create a new repository"** をクリック
3. リポジトリ名と説明（Description）を入力して作成
4. **1分ほど待ってから**クローンして開発開始:

```bash
git clone https://github.com/<your-name>/my-project.git my-project
cd my-project
claude     # 開発開始
```

GitHub Actions がバックグラウンドで自動初期化します。ローカルでの操作は不要です。

#### 手動セットアップ（オフライン環境向け）

GitHub Actions が使えない場合や、プロジェクト名・説明を自由に指定したい場合：

```bash
git clone https://github.com/<your-name>/my-project.git my-project
cd my-project
node setup.js my-project "プロジェクトの説明"
claude     # 開発開始
```

> `node setup.js` は Windows / macOS / Linux すべてで動作します。Node.js が必要です。

### セットアップが行うこと（自動・手動共通）

1. `package.json` のプロジェクト名と説明を更新
2. `CLAUDE.md` の目的欄を更新
3. `README.md` をプロジェクト用に再生成
4. 個人設定ファイル（`.claude/settings.local.json`）を準備
5. `npm install` で依存関係をインストール
6. テンプレートファイル（`setup.js`, `TEMPLATE.md`）を自己削除
7. Git ヒストリーをリセットして初期コミットを作成（手動セットアップの場合のみ）

**セットアップ完了後は `claude` で開発開始できます。**

### Step 3: プロジェクトに合わせてカスタマイズ

| 対象 | やること |
|------|---------|
| `CLAUDE.md` | プロジェクト固有のルール・技術スタックを追記（200行以内） |
| `src/*/CLAUDE.md` | 実際のモジュール構成に合わせて編集 |
| `.claude/settings.json` | ツール許可（`allow`/`deny`）・MCP設定を調整 |
| `.claude/skills/` | 不要なスキル削除、新しいスキル追加（SKILL.md形式） |
| `.claude/settings.local.json` | 個人のトークン・MCP設定を記入 |
| GitHub Secrets | `ANTHROPIC_API_KEY` を設定（Claude Code Action 用、任意） |

### ディレクトリ構造のカスタマイズ例

```bash
# 不要なモジュールを削除
rm -rf src/billing/

# 新しいモジュールを追加
mkdir -p src/notifications/
cat > src/notifications/CLAUDE.md << 'EOF'
# 通知モジュール — ローカルコンテキスト
## 責務
- Email / Push / SMS 通知の送信
## 主要ルール
1. 送信レートリミットを必ず設定する
2. テンプレートエンジンでHTMLインジェクションを防ぐ
EOF
```

### カスタムスキルの追加例

```bash
mkdir -p .claude/skills/api-design
cat > .claude/skills/api-design/SKILL.md << 'EOF'
---
name: api-design
description: RESTfulベストプラクティスに基づくAPI設計レビュー
disable-model-invocation: true
argument-hint: [エンドポイントパス]
allowed-tools: Read, Grep, Glob
---

$ARGUMENTS のAPI設計をレビューしてください：
- [ ] RESTful命名規則に従っている
- [ ] 適切なHTTPステータスコードを返す
- [ ] リクエスト/レスポンスのスキーマが定義されている
- [ ] 認証ミドルウェアが適用されている
EOF
```
