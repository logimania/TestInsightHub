---
name: release
description: バージョニングとリリースチェックリストに従ったリリース準備
disable-model-invocation: true
argument-hint: [バージョン（例: patch, minor, major, 1.2.0）]
allowed-tools: Read, Bash(npm run test), Bash(npm run lint), Bash(npm run build), Bash(npm version *), Bash(git *)
---

以下のバージョンでリリースを準備してください: $ARGUMENTS

## リリース前チェックリスト
1. すべてのテストが通ることを確認: `npm run test`
2. リントが通ることを確認: `npm run lint`
3. 重大・高深刻度のバグがオープンでないことを確認
4. ドキュメントが最新であることを確認

## バージョンアップルール
- **patch** (x.x.X): バグ修正、API変更なし
- **minor** (x.X.0): 新機能、後方互換あり
- **major** (X.0.0): 破壊的変更

## リリース手順

1. テストとリントを実行
2. バージョンアップ: `npm version $ARGUMENTS`
3. ビルド: `npm run build`
4. ビルド出力を検証
5. リリースサマリーと次のステップ（タグ、プッシュ、デプロイ）を報告

リモートへのプッシュは行わない — ユーザーに任せること。
