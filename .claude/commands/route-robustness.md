---
description: 【参考】Next.js App Router API route 健壮性模式——force-dynamic、try/catch 分层、fallback 链、外部 API 超时
---

# API Route 健壮性模式

## 必须加 `export const dynamic = 'force-dynamic'`

所有依赖运行时参数（searchParams、cookies、DB 查询）的 route 都要加：

```typescript
export const dynamic = 'force-dynamic'
```

不加的后果：Next.js 在 build 时把 route 静态化，缓存旧结果，`?tla=` 等参数变化但响应不变。

**哪些文件要加**：
- 有 `searchParams` 的 GET route
- 查 Supabase 的 route（数据随时变）
- 调用外部 API 的 route

---

## try/catch 分层结构

```typescript
export async function GET(request: Request) {
  // 顶层 catch：防止任何未预期错误崩溃整个 route
  try {

    // 层一：参数解析（不会失败，但习惯性放里面）
    const { searchParams } = new URL(request.url)
    const tla = searchParams.get('tla')?.toUpperCase() ?? ''

    // 层二：DB 查询（Supabase 不可用时不崩溃）
    let dbResult: Record<string, string> = {}
    try {
      const { data } = await admin.from('table').select('*').eq('key', tla)
      for (const row of data ?? []) { /* ... */ }
    } catch {
      // Supabase 不可用 → 降级，不抛出
    }

    // 层三：外部 API（网络失败时返回空而不是 500）
    let externalResult = {}
    try {
      externalResult = await fetchExternalApi(tla)
    } catch {
      // 外部 API 超时/失败 → 降级
    }

    // 合并结果
    return NextResponse.json({ ...dbResult, ...externalResult })

  } catch (err) {
    console.error('[route-name] unexpected error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

**原则**：
- DB 查询失败 → 不返回 500，降级到外部 API
- 外部 API 失败 → 不返回 500，返回空数组或已有的 DB 数据
- 只有完全无法处理时才返回 500（由顶层 catch 兜底）

---

## fallback 链顺序

本项目的标准 fallback 链（由快到慢，由可靠到不可靠）：

```
Supabase DB（毫秒级，中国可访问）
  ↓ 失败或数据不足
Wikipedia API（秒级，中国一般可访问）
  ↓ 失败
返回 null（前端显示默认图标）
```

代码：
```typescript
const imageUrl = dbPhotoMap[nameEn] ?? wikiImages[nameEn] ?? null
```

---

## 外部 API 超时设置

外部 HTTP 请求必须加超时，否则一个慢请求会卡住整个 Vercel serverless function（默认超时 10s）：

```typescript
const res = await fetch(url, {
  signal: AbortSignal.timeout(8000),  // 8秒超时
  headers: { 'User-Agent': 'MyApp/1.0' },
  cache: 'no-store',
})
if (!res.ok) return fallback
```

---

## 空数组 vs 404

- 数据本身为空（比如某队没有名单）→ 返回 `[]`（空数组），HTTP 200
- 参数错误（tla 不存在于映射表）→ 返回 `[]`，HTTP 200（前端好处理）
- 服务器内部错误 → 返回 `{ error: '...' }`，HTTP 500

前端处理：
```typescript
if (!Array.isArray(data) || data.length === 0) {
  // 显示"暂无数据"
}
```

---

## 踩坑记录

**坑**：Uruguay 传奇和名单均显示"暂无数据"  
**根因**：`TEAM_LEGENDS['URY']` 返回 `undefined`，route 返回 404，前端走 error 分支  
**症状识别**：某一支球队的所有 tab 都挂，其他球队正常  
**修复**：加 `TLA_ALIASES` 规范化 tla 参数（详见 tla-alias-pattern skill）

**坑**：Supabase 连接偶发失败导致整个页面报错  
**根因**：DB 查询没有 try/catch，抛出的异常没被捕获，整个 route 返回 500  
**修复**：把每个 Supabase 查询单独包在 try/catch 里，失败时继续执行 fallback
