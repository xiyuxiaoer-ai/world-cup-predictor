---
description: 【自动触发】实现从维基百科/百度百科抓取图片时——forward-lookup算法、50条批量限制、nameEn精确匹配、百度备用方案
---

# 维基百科图片批量获取

## 为什么用英文维基（不用中文维基）

- `upload.wikimedia.org`（英文维基图片 CDN）在中国**可以访问**
- 中文维基百科本身在中国被封锁，但 CDN 没被封
- 英文维基的图片覆盖率比中文维基更高

## 正确的 API 调用（forward-lookup）

```typescript
const url =
  `https://en.wikipedia.org/w/api.php?action=query` +
  `&titles=${encodeURIComponent(names.join('|'))}` +
  `&prop=pageimages&format=json&pithumbsize=400&redirects=1`

const res = await fetch(url, {
  headers: { 'User-Agent': 'WorldCupPredictor/1.0' },
  cache: 'no-store',  // 避免 Next.js 数据缓存返回旧结果
})
const data = await res.json()
```

## 关键：forward-lookup（输入名 → 规范化 → 重定向 → 页面）

```typescript
// ❌ 错误（reverse-lookup）：用页面标题反查输入名，中间有歧义
// 当 Unicode 规范化或重定向改变了标题时会匹配不上

// ✅ 正确（forward-lookup）：沿着链追踪
const pageImages: Record<string, string> = {}
for (const page of Object.values(data?.query?.pages ?? {}) as any[]) {
  if (page.thumbnail?.source) pageImages[page.title] = page.thumbnail.source
}

// normalization: "lionel messi" → "Lionel Messi"
const normMap: Record<string, string> = {}
for (const n of (data?.query?.normalized ?? []) as any[]) normMap[n.from] = n.to

// redirect: "Ronaldo" → "Ronaldo (Brazilian footballer)"
const rdMap: Record<string, string> = {}
for (const r of (data?.query?.redirects ?? []) as any[]) rdMap[r.from] = r.to

// 对每个输入名，沿链追踪到最终页面标题，再找图片
for (const name of chunk) {
  const norm = normMap[name] ?? name
  const rd1  = rdMap[norm] ?? norm
  const rd2  = rdMap[rd1]  ?? rd1   // 双重重定向
  const img  = pageImages[rd2] ?? pageImages[rd1] ?? pageImages[norm] ?? pageImages[name]
  if (img) result[name] = img
}
```

## 批量限制

- 每次请求最多 **50 个标题**（Wikipedia API 限制）
- 超过 50 个时要分批：
```typescript
for (let i = 0; i < names.length; i += 50) {
  const chunk = names.slice(i, i + 50)
  // ... fetch chunk
}
```

## nameEn 必须是精确的英文维基文章标题

```typescript
// ✅ 正确：精确的文章标题
{ nameEn: 'Lionel Messi' }
{ nameEn: 'Ronaldo (Brazilian footballer)' }  // 同名消歧义用括号
{ nameEn: 'Zinedine Zidane' }

// ❌ 错误：搜索关键词（不是标题）
{ nameEn: 'ronaldo brazil' }
{ nameEn: '罗纳尔多' }  // 中文不行
```

## 图片代理（用于绕过 CORS 和确保 CDN 可访问）

```typescript
function proxyImg(url: string | null | undefined): string | null {
  if (!url) return null
  return `/api/img?url=${encodeURIComponent(url)}`
}
// upload.wikimedia.org 的图片通过 /api/img 代理返回给前端
```

## 百度百科作为备用图源

```typescript
async function fetchBaiduImage(name: string): Promise<string | null> {
  const url =
    `https://baike.baidu.com/api/openapi/BaikeLemmaCardApi` +
    `?scope=103&format=json&appid=379020` +
    `&bk_key=${encodeURIComponent(name)}&bk_length=100`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' },
    cache: 'no-store',
  })
  const data = await res.json()
  const imgUrl = data?.image ?? data?.pic_href ?? data?.images?.[0]?.url
  return imgUrl ? proxyImg(imgUrl) : null
}
// name 传中文名（如"梅西"）效果最好
```
