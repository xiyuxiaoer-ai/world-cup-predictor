---
description: 减少从推送到用户看到变化的延迟时间的方法
---

# 减少部署延迟

## 延迟来源分析

```
git push → GitHub → Vercel 构建（1-3分钟）→ CDN 分发 → 用户浏览器
    0s         0s         60-180s             0-5s       缓存TTL
```

最大的延迟不是 Vercel 构建，而是**缓存 TTL**。

## API 响应缓存策略

### 动态数据（每次都可能变）→ no-store

```typescript
// 适用：legend API、news API、任何会随部署更新内容的 API
return NextResponse.json(data, {
  headers: { 'Cache-Control': 'no-store' }
})
```

### 半静态数据（每天更新一次）→ 短 TTL

```typescript
// 适用：球队阵容、球场信息等
return NextResponse.json(data, {
  headers: { 'Cache-Control': 'public, max-age=3600' }  // 1小时，不加 stale-while-revalidate
})
```

### 绝对不要用 stale-while-revalidate 在 API 上

```typescript
// ❌ 这会让 Vercel CDN 在新部署后继续用旧响应长达 86400 秒
'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'

// ✅ 如果要用 stale-while-revalidate，时间要短
'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
```

## 内部 fetch 缓存（Next.js 数据缓存）

Next.js 14+ 会在服务端缓存 fetch 结果，跨请求复用。

```typescript
// ❌ 默认行为：Next.js 可能缓存旧结果
const res = await fetch('https://en.wikipedia.org/...')

// ✅ 对于内容会变化的外部请求，明确禁止缓存
const res = await fetch('https://en.wikipedia.org/...', {
  cache: 'no-store'
})

// ✅ 或者设置 revalidate 时间（单位：秒）
const res = await fetch('https://en.wikipedia.org/...', {
  next: { revalidate: 3600 }
})
```

## 强制刷新 CDN 缓存的应急方法

当已部署的 API 内容格式大改时，在 fetch URL 加版本参数：

```typescript
// 组件里的 fetch 调用加 &_v=N
fetch(`/api/team-football-history?tla=${tla}&_v=3`)
// API route 会忽略这个参数，但 CDN 把它视为不同 URL → 无缓存命中
// 每次大改后递增版本号
```

## Vercel 构建速度

- Vercel 构建通常 1-3 分钟
- 推送后等 2 分钟再测试，不要立刻测试
- 可以在 GitHub → Actions 或 Vercel Dashboard 查看构建状态
- 如果构建失败，变更不会部署（即使 `ignoreBuildErrors: true` 也有可能因为 JS 语法错误失败）

## 验证新部署是否生效的最快方法

直接在浏览器访问 API 端点（加 no-cache 参数）：
```
https://your-app.vercel.app/api/team-football-history?tla=NOR&_v=3
```
如果返回的 JSON 包含新字段（如 `worldCupRecord`、`goal2026`），说明新代码已部署。
