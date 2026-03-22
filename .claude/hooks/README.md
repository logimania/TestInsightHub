# Hooks — 自動ガードレール

Hooks は Claude Code のワークフローの特定のタイミングで自動的にチェックを実行する仕組みです。
`.claude/settings.json` の `hooks` キーで設定します。

## フックポイント（よく使うもの）

| フックポイント | 実行タイミング | 用途 |
|---------------|---------------|------|
| SessionStart | セッション開始時 | リマインダー設定、コンテキスト読み込み |
| PreToolUse | ツール実行前 | 保護ディレクトリへの書き込みブロック |
| PostToolUse | ツール実行成功後 | フォーマッター・リンター実行 |
| PostToolUseFailure | ツール実行失敗後 | エラーログ記録、代替案の提示 |
| Stop | Claude の応答完了後 | テスト実行、出力検証 |
| PreCompact | コンテキスト圧縮前 | 重要な情報の保持指示 |

## フックの種類

| 種類 | 説明 | 判定制御 |
|------|------|---------|
| `command` | シェルコマンド実行 | 終了コード 0 = 許可、2 = ブロック |
| `prompt` | LLMによる単一ターン評価 | JSON `{"ok": true/false}` |
| `agent` | サブエージェントによる複数ターン検証 | タイムアウト設定可 |
| `http` | エンドポイントへPOST送信 | HTTPレスポンスボディ |

## 設定フォーマット

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write $(jq -r '.tool_input.file_path')"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "./.claude/hooks/validate-command.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "agent",
            "prompt": "全テストが通ることを確認",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

## マッチャー構文

正規表現パターンでフックの発火条件をフィルタリング:

```
"Edit|Write"           — Edit または Write ツールにマッチ
"Bash"                 — すべての Bash 呼び出しにマッチ
"mcp__github__.*"      — GitHub MCP ツールにマッチ
"startup"              — SessionStart の理由にマッチ
```

## 保護ディレクトリ

セキュリティ・ビジネス上重要なディレクトリを意図しない変更から保護:

- `src/auth/` — 認証ロジック
- `src/billing/` — 決済処理
- `migrations/` — データベースマイグレーション

ガードスクリプトの例:

```bash
#!/bin/bash
# .claude/hooks/guard-protected-dirs.sh
PROTECTED_DIRS=("src/auth" "src/billing" "migrations")
for dir in "${PROTECTED_DIRS[@]}"; do
  if echo "$CLAUDE_TOOL_INPUT" | grep -q "$dir"; then
    echo "ブロック: $dir の変更には明示的な承認が必要です"
    exit 2
  fi
done
```
