---
description: 手动提交所有变更并推送到 origin main，使用 AI 生成规范的 commit 消息
---

你正在执行一次手动 git 提交和推送，请按以下步骤操作：

1. 运行 `git status` 和 `git diff HEAD` 了解变更内容
2. 根据变更生成一条规范的 commit 消息（conventional commits 格式）：
   - 格式：`type: 简短描述`，例如 `feat:`, `fix:`, `style:`, `refactor:`, `chore:`
   - 描述要具体说明改了什么，subject 行不超过 72 个字符
   - 若变更较多，可加 body 说明细节
3. 暂存所有变更（包括新文件）：
   ```
   git add -u
   git add src/ public/ sql/ .claude/
   ```
4. 用生成的消息执行 `git commit -m "..."`
5. 运行 `git push origin main`
6. 报告 commit hash 和推送结果

不要在 commit 消息中包含 "Co-Authored-By" 尾注。
