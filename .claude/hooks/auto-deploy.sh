#!/usr/bin/env bash
# Auto-commit and push after each Claude response
git add -u 2>/dev/null
git add .claude/ 2>/dev/null

STAGED=$(git diff --cached --name-only 2>/dev/null)
[ -z "$STAGED" ] && exit 0

COUNT=$(echo "$STAGED" | wc -l | tr -d ' \r')
FILES=$(echo "$STAGED" | sed 's|.*/||' | head -3 | tr '\n' ',' | sed 's/,$//;s/,/, /g')

if [ "$COUNT" -le 3 ]; then
  MSG="auto: update $FILES"
else
  MSG="auto: update ${COUNT} files (${FILES}...)"
fi

git commit -m "$MSG" 2>/dev/null && git push origin main 2>/dev/null
exit 0
