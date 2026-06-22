---
description: 撤销最近一次自动提交（auto: 开头的 commit），并推送到 origin main
---

你正在撤销最近一次自动提交，请按以下步骤操作：

1. 运行 `git log --oneline -5` 查看最近提交，确认最新的是 `auto:` 开头的自动提交
2. 如果最新提交是 `auto:` 开头，运行：
   ```
   git revert HEAD --no-edit
   git push origin main
   ```
3. 如果最新提交不是 `auto:` 开头（是手动提交），提示用户确认是否继续，因为这将撤销一次手动提交
4. 报告 revert commit 的 hash 和推送结果

注意：`git revert` 是安全操作，它创建新提交来撤销而不是删除历史。
