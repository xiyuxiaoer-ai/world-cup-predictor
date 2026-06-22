# 语言要求

无论用户使用何种语言提问，你都必须**始终用简体中文**回复。代码、命令、文件路径等技术内容保持原样，只对自然语言说明部分使用中文。

@AGENTS.md

# 自动技能触发规则

以下场景下，**在执行任何操作之前必须先调用对应的 skill**，无需用户手动输入 `/`：

## 推送 / 部署相关
- 准备执行 `git push`、`git commit` + push、或用户说"推送"、"部署"、"上线" → 先调用 `/vercel-deploy-rules` 检查，确认代码符合 Vercel 部署要求
- 用户说"没有变化"、"没有反映"、"看不到更新"、"还是旧的"、"没效果" → 立刻调用 `/debug-no-changes` 启动排查流程

## 数据文件相关
- 准备修改或新增 `src/lib/team-legends.ts`、`src/lib/stadiums.ts` 等大型硬编码数据文件 → 先调用 `/large-data-file-rules`，完成后用其中的检查清单自查
- 准备实现从维基百科/百度百科抓取图片的功能 → 先调用 `/wikipedia-image-fetch`

## 缓存 / 性能相关
- 用户提到手机端和电脑端显示不一致、手机看不到更新 → 调用 `/mobile-vs-desktop`
- 设计新 API 的缓存策略、讨论 Cache-Control 如何设置 → 调用 `/reduce-deploy-delay`
- 中国用户看不到图片、新增图片来源（维基/百度/其他CDN）、修改 `/api/img` → 先调用 `/china-image-proxy`

## React 状态相关
- 遇到"点击没反应"、"数据不刷新"、"error 状态卡住"、"useEffect 不触发" 等问题 → 调用 `/react-state-pitfalls`
