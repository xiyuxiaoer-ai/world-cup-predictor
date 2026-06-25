#!/usr/bin/env bash
# 每次对话开始前，自动拉取远端最新代码，确保 local 始终最新。
git pull --rebase origin main 2>/dev/null || true
exit 0
