# CLAUDE.md - リポジトリの記憶（北極星）

> **このファイルは200行以内に収めること。** 詳細ルールは `.claude/rules/` を参照。

## 目的

clade_code_project — Claude Code で構築されたプロジェクト

## リポジトリ構造

```
.
├── CLAUDE.md                     # このファイル（200行以内）
├── .claude/
│   ├── settings.json             # ツール権限、hooks、MCPサーバー
│   ├── skills/                   # 再利用可能なワークフロー（SKILL.md形式）
│   │   ├── code-review/SKILL.md
│   │   ├── refactoring/SKILL.md
│   │   ├── debugging/SKILL.md
│   │   └── release/SKILL.md
│   └── rules/                    # 拡張ルール（CLAUDE.mdからの分割先）
│       ├── context-management.md
│       └── security.md
├── docs/                         # 段階的コンテキスト（参照用、インライン不可）
│   ├── architecture.md           # @docs/architecture.md
│   ├── adr/                      # アーキテクチャ決定記録
│   └── runbooks/                 # 運用手順書
├── .github/
│   ├── ISSUE_TEMPLATE/           # バグ報告・機能要望テンプレート
│   └── pull_request_template.md
├── src/
│   ├── auth/CLAUDE.md            # セキュリティ重要（承認必須）
│   ├── billing/CLAUDE.md         # ビジネス重要（承認必須）
│   └── api/CLAUDE.md             # APIレイヤー規約
├── CLAUDE_PROGRESS.md            # セッション継続（進捗・TODO）
├── CLAUDE_ISSUE.md               # エラー記録（原因・解決策）
├── package.json
└── tsconfig.json
```

## セッション開始時

1. **まず `CLAUDE_PROGRESS.md` を読むこと** — 前回の状態とTODOを確認してから作業開始
2. 現在のタスクに関連する既知の問題がないか `CLAUDE_ISSUE.md` を確認

## 運用ルール

1. **`src/auth/` と `src/billing/` は** ユーザーの明示的な承認なしに変更禁止
2. **コード変更後は必ず** `npm run test` を実行
3. **コミット前は必ず** `npm run format` を実行
4. **シークレット、APIキー、認証情報を** コミットしない
5. **各モジュールの** 既存のコードスタイルと命名規則に従う
6. **新機能には必ず** テストを書く
7. **関数は小さく** 1つの責務に集中させる（50行以内）
8. **テストカバレッジは** ビジネスロジックで80%以上を維持（`npm run test:coverage`）
9. **途中で止めない** — タスクを完了するか、`CLAUDE_PROGRESS.md` に残りのTODOを記録してから停止
10. **大きなタスクは** 小さなステップに分割し、ステップごとに `CLAUDE_PROGRESS.md` を更新
11. **依存関係のバージョンを固定** する（例: `"express": "4.18.2"`、`"^4.18.2"` は不可）

セキュリティルールの詳細は @.claude/rules/security.md を参照

## 技術スタック

- 言語: TypeScript（strictモード）
- ランタイム: Node.js
- テスト: Vitest
- フォーマッター: Prettier
- リンター: ESLint

## 命名規則

- `camelCase` — 変数・関数
- `PascalCase` — クラス・インターフェース
- `kebab-case` — ファイル名
- `async/await` を優先（生のPromiseより）
- 名前付きエクスポートを優先（default exportより）

## よく使うコマンド

```bash
npm run setup        # テンプレートからプロジェクト初期化（クローン後に1回実行）
npm run dev          # 開発サーバー起動
npm run build        # 本番ビルド
npm run test         # テスト実行
npm run test:coverage # カバレッジ付きテスト実行
npm run lint         # リントチェック
npm run format       # コードフォーマット
npm run format:check # フォーマットチェック
```

## コンテキスト管理

- このファイルは毎セッション読み込まれる — 簡潔に保つこと
- 詳細ドキュメントはインラインではなく `@docs/filename.md` で参照
- コンテキスト使用量が多いときは `/compact` で圧縮
- 圧縮時は必ず保持: 変更ファイル一覧、現在のタスク、重要な判断
- コンテキスト管理の詳細は @.claude/rules/context-management.md を参照
