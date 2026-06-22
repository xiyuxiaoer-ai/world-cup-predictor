---
description: 推送后页面没有反映变化时的系统排查流程
---

# 推送后没有变化——排查流程

## 第一步：确认代码已推送

```bash
git log --oneline -5          # 确认 commit 存在
git diff origin/main HEAD     # 应该为空（本地=远程）
```

如果 diff 非空，说明没推上去：`git push origin main`

## 第二步：区分"部署失败"还是"缓存问题"

| 现象 | 原因 |
|------|------|
| 电脑和手机都没变化 | Vercel 构建失败，或代码根本没变到 UI |
| 电脑有变化，手机没有 | **CDN/浏览器缓存**命中旧响应 |
| 同一设备部分球队有，部分没有 | React 状态里缓存了旧的 error/data |
| 内容是繁体中文或旧格式 | Vercel 边缘 CDN 缓存了旧 API 响应 |

## 第三步：CDN 缓存问题的修复

**症状**：手机显示旧内容（繁体字、旧字段、空白）

**根本原因**：API 响应带了 `Cache-Control: public, max-age=3600`，Vercel 边缘节点把旧响应缓存了，新部署不会自动刷新已缓存的内容。

**立即修复**：在 fetch URL 加版本号参数
```typescript
// 在 Modal/Component 的 fetch 调用里：
fetch(`/api/team-football-history?tla=${tla}&_v=3`)
// 每次 API 格式大改时递增版本号（_v=3 → _v=4）
```

**长期预防**：动态数据 API 改用 no-store
```typescript
// route.ts 的 return：
return NextResponse.json(data, {
  headers: { 'Cache-Control': 'no-store' }
})
```

## 第四步：React 状态缓存问题的修复

**症状**：刷新后同一设备某些球队还是显示错误状态

**根本原因**：`legendError = true` 的 useEffect 条件会阻止重新 fetch：
```typescript
if (tab !== 'legend' || legendData !== null || legendError) return
// legendError=true 时永远不会重新请求
```

**修复**：给错误状态加"重新加载"按钮，清除 error 状态触发重新 fetch：
```tsx
{legendError && (
  <div>
    <p>暂无数据</p>
    <button onClick={() => setLegendError(false)}>重新加载</button>
  </div>
)}
```

## 第五步：强制验证部署是否生效

在 UI 某处加一个绝对看得见的临时标识（纯静态文字，不依赖 API）：
```tsx
<div style={{position:'fixed',top:0,left:0,background:'red',color:'white',zIndex:9999}}>
  BUILD v{Date.now()}
</div>
```
如果用户看到了，说明新代码已部署；如果没看到，说明 JS bundle 被缓存了。
