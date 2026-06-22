---
description: 【参考】把外部图片 URL 存入 Supabase、populate admin endpoint、DB-first 查询 + Wikipedia 降级 fallback、NDJSON 流式进度输出
---

# Supabase 图片数据库模式——心得

本项目中球星头像和球场照片都遵循同一个模式：
**一次性 populate → 存 URL 到 DB → 运行时 DB-first 查询 → 代理返回前端**

---

## 总体流程

```
[管理员手动触发]
GET /api/admin/populate-legend-photos
  → 批量查 Wikipedia 图片 URL
  → upsert 到 Supabase legend_photos 表
  → 流式输出进度（NDJSON）

[用户访问传奇页面]
GET /api/team-football-history?tla=ESP
  → 查 Supabase legend_photos (nameEn IN [...])
  → 有结果 → 直接返回（proxyImg 包装）
  → 缺失的 → 降级查 Wikipedia API（实时，慢）
  → 返回合并结果
```

---

## Populate Endpoint 结构

```typescript
export const dynamic = 'force-dynamic'
export const maxDuration = 300  // 球星多，需要延长超时

export async function GET() {
  const admin = createClient(supabaseUrl, serviceRoleKey)

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try { controller.enqueue(encoder.encode(JSON.stringify(data) + '\n')) } catch {}
      }

      send({ type: 'start', total: allPlayers.length })

      // 1. 批量查 Wikipedia
      const wikiImages = await batchWikiImages(nameToWiki)
      // 2. 合并硬编码
      for (const [name, url] of Object.entries(HARDCODED_PHOTOS)) wikiImages[name] = url
      send({ type: 'wiki_done', found: Object.keys(wikiImages).length })

      // 3. Upsert 到 DB
      const rows = Object.entries(wikiImages).map(([name_en, photo_url]) => ({ name_en, photo_url }))
      const { error } = await admin.from('legend_photos').upsert(rows, { onConflict: 'name_en' })
      if (error) send({ type: 'dberror', error: error.message })

      // 4. 报告缺失
      const missing = allNameEns.filter(n => !wikiImages[n])
      send({ type: 'done', upserted: rows.length, missing_names: missing.slice(0, 20) })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',  // 禁止 Nginx/Vercel 缓冲，实时流出
    },
  })
}
```

**为什么用 NDJSON 流**：populate 可能运行几十秒，普通 JSON 响应会超时；流式输出让浏览器实时看到进度。

**为什么用 service role key**：populate 是管理操作，绕过 RLS；普通用户读取不需要（用 anon key 即可）。

---

## DB-First 查询 + Fallback

```typescript
// 1. 先查 DB（快，中国可访问）
let dbPhotoMap: Record<string, string> = {}
try {
  const { data: dbPhotos } = await admin
    .from('legend_photos')
    .select('name_en, photo_url')
    .in('name_en', nameEnList)
  for (const row of dbPhotos ?? []) {
    if (row.photo_url) dbPhotoMap[row.name_en] = proxyImg(row.photo_url)!
  }
} catch {
  // Supabase 不可用时不崩溃，降级到 Wikipedia
}

// 2. 仍缺失的 → 实时查 Wikipedia
const missing = nameEnList.filter(n => !dbPhotoMap[n])
const wikiImages = await fetchWikipediaImages(missing)

// 3. 合并
const imageUrl = dbPhotoMap[p.nameEn] ?? wikiImages[p.nameEn] ?? null
```

**关键**：Supabase 查询必须包在 `try/catch` 里。DB 不可用时降级，而不是崩溃返回 500。

---

## 为什么不用 Supabase Storage（存二进制）

| 方案 | 优势 | 劣势 |
|------|------|------|
| 存 URL + /api/img 代理 | 简单，不需要新 bucket/IAM | 首次加载有代理延迟；依赖外部图片源 |
| Supabase Storage | 加载最快，完全自控 | 需要 bucket、IAM 策略、下载再上传脚本，复杂度高 |

本项目选择存 URL 方案。首次加载慢是因为 Vercel 冷启动 + Wikimedia 延迟，关闭重开后浏览器缓存（max-age=604800）解决问题。

---

## 表结构参考

```sql
-- legend_photos
create table legend_photos (
  name_en   text primary key,
  photo_url text not null,
  updated_at timestamptz default now()
);

-- stadiums
create table stadiums (
  name_zh   text primary key,
  name_en   text,
  capacity  int,
  opened    int,
  slug      text,
  lat       float,
  lon       float,
  photo_url text
);
```

---

## 踩坑：第一次加载图片消失，第二次正常

**原因**：`/api/img` 代理首次请求命中 Vercel 冷启动，同时上游（Wikimedia）有延迟，前端 `onError` 触发显示默认图标。  
第二次：浏览器缓存（max-age=604800，7天）直接读缓存，毫秒级显示。  
**结论**：这是正常行为，不需要修复；但如果要彻底解决，就做 Supabase Storage 迁移。
