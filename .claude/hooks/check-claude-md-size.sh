#!/bin/bash
# Hook: Check that CLAUDE.md stays under 200 lines
# Use with PreToolUse (matcher: "Edit|Write") in settings.json

FILE=$(echo "$CLAUDE_TOOL_INPUT" | grep -o 'CLAUDE\.md' || true)

if [ -z "$FILE" ]; then
  exit 0
fi

# Find the CLAUDE.md being edited
CLAUDE_MD="CLAUDE.md"
if [ -f "$CLAUDE_MD" ]; then
  LINES=$(wc -l < "$CLAUDE_MD")
  if [ "$LINES" -gt 200 ]; then
    echo "WARNING: CLAUDE.md is ${LINES} lines (limit: 200)."
    echo "Consider moving detailed rules to .claude/rules/ and using @references."
    # Warning only, not blocking (exit 0). Change to exit 2 to block.
    exit 0
  fi
fi

exit 0
