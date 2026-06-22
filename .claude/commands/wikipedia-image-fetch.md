---
description: 【自动触发】实现从维基百科/百度百科抓取图片时——forward-lookup算法、50条批量限制、消歧义处理、Special:FilePath陷阱、缩略图尺寸陷阱、pilicense=any
---

# 维基百科图片批量获取——完整心得

## 为什么用英文维基（不用中文维基）

- `upload.wikimedia.org`（英文维基图片 CDN）在中国**可以访问**
- 中文维基百科本身在中国被封锁，但 CDN 没被封
- 英文维基的图片覆盖率比中文维基更高

---

## 陷阱一：Special:FilePath 不可靠（坑过我们）

```
❌ https://commons.wikimedia.org/wiki/Special:FilePath/SomeImage.jpg?width=1200
```

这是重定向 URL。Wikimedia **不一定预生成**你请求的尺寸，有时返回 HTTP 400，有时超时，有时在中国无法访问（commons.wikimedia.org 的网络路径不同于 upload.wikimedia.org）。

**正确做法**：用 Wikipedia REST API 拿到 `thumbnail.source`，那是已经确认存在的直链：

```typescript
const res = await fetch(
  `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
)
const data = await res.json()
const url = data.thumbnail?.source  // ✅ 直链，格式固定，保证存在
```

得到的 URL 格式（直链，可直接用）：
```
https://upload.wikimedia.org/wikipedia/commons/thumb/{hash1}/{hash12}/{filename}/{N}px-{filename}
```

把这个 URL 直接存入 `stadiums.ts` 或 DB，不要存 Special:FilePath。

---

## 陷阱二：缩略图尺寸陷阱（400px 可能 HTTP 400）

Wikimedia 只预生成特定尺寸的缩略图（通常是 320px、330px 等，不一定有 400px）。

```
❌ ...thumb/.../400px-Xavi.jpg   → HTTP 400
✅ ...thumb/.../330px-Xavi.jpg   → 正常
```

**规则**：
- 优先用 REST API 返回的 `thumbnail.source` 里的尺寸——它保证存在
- 手动硬编码时用 **330px** 而非 400px
- `pageimages` API 的 `pithumbsize=400` 参数不一定成功；实测有时返回 200px 的 URL

---

## 陷阱三：消歧义页（Disambiguation）没有图片

搜索 `Raúl` 命中消歧义页（列出多个同名人物），页面本身没有 thumbnail，`pageimages` 返回空。

**解决方案**：维护 `WIKI_TITLE_OVERRIDES` 映射，在查询前把 nameEn 替换为正确的 Wikipedia 文章标题：

```typescript
const WIKI_TITLE_OVERRIDES: Record<string, string> = {
  'Raúl':               'Raúl (footballer)',
  'Luis Díaz':          'Luis Díaz (footballer, born 1997)',
  'Chris Wood':         'Chris Wood (New Zealand footballer)',
  'Mahmoud Hassan':     'Trezeguet (Egyptian footballer)',   // 真名不同
  'Marcelo Etcheverry': 'Marco Etcheverry',                 // 名字拼写不对
}

// 用法：查询前做替换
const nameToWiki: Record<string, string> = {}
for (const name of nameEnList) {
  nameToWiki[name] = WIKI_TITLE_OVERRIDES[name] ?? name
}
```

---

## 陷阱四：pilicense 过滤（非自由图片被隐藏）

pageimages API 默认只返回自由版权图片。有些球星的维基页面用非自由（媒体版权）图片，默认查询拿不到。

```
❌ &prop=pageimages&pithumbsize=400&redirects=1
✅ &prop=pageimages&pithumbsize=400&redirects=1&pilicense=any
```

---

## 陷阱五：有的球星 API 永远不返回图片

即使 `pilicense=any` 也没有。可能因为：
- 图片以模板方式嵌入，不直接关联文章
- 极少数情况下 API 有 bug

**解决方案**：维护 `HARDCODED_PHOTOS`，从 Commons 网页手动复制直链：

```typescript
const HARDCODED_PHOTOS: Record<string, string> = {
  'Zico':       'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Zico_2012_3.jpg/500px-Zico_2012_3.jpg',
  'Xavi':       'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Xavi%2C_Persepolis_vs._Al_Sadd%2C_20190520_02_%28cropped%29.jpg/330px-Xavi%2C_Persepolis_vs._Al_Sadd%2C_20190520_02_%28cropped%29.jpg',
  'Sadio Mané': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Esteghlal_F.C._v_Al_Nassr_FC%2C_3_March_2025%2C_Sadio_Man%C3%A9_%28cropped%29.jpg/330px-Esteghlal_F.C._v_Al_Nassr_FC%2C_3_March_2025%2C_Sadio_Man%C3%A9_%28cropped%29.jpg',
}
// wiki 批量查询完成后合并（hardcoded 覆盖 wiki 结果）
for (const [name, url] of Object.entries(HARDCODED_PHOTOS)) {
  wikiImages[name] = url
}
```

---

## 陷阱六：key 必须含重音符号，与数据文件完全一致

`team-legends.ts` 里是 `'Luis Díaz'`（含 í），WIKI_TITLE_OVERRIDES 和 HARDCODED_PHOTOS 的 key 必须完全一样，否则合并后找不到。

```typescript
// ❌ 'Luis Diaz'  （缺 í，永远匹配不上）
// ✅ 'Luis Díaz'  （与 team-legends.ts 完全一致）
```

---

## 正确的批量查询实现（forward-lookup + 所有修复）

```typescript
async function batchWikiImages(
  nameToWiki: Record<string, string>  // nameEn → wiki title to query
): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  // 反向映射：wiki title → 原始 nameEn（用于结果归属）
  const wikiToName: Record<string, string> = {}
  for (const [name, wiki] of Object.entries(nameToWiki)) wikiToName[wiki] = name

  const wikiTitles = Object.values(nameToWiki)

  for (let i = 0; i < wikiTitles.length; i += 50) {  // 批量上限 50
    const chunk = wikiTitles.slice(i, i + 50)
    try {
      const url =
        `https://en.wikipedia.org/w/api.php?action=query` +
        `&titles=${encodeURIComponent(chunk.join('|'))}` +
        `&prop=pageimages&format=json&pithumbsize=400&redirects=1&pilicense=any`
      const res = await fetch(url, { headers: { 'User-Agent': 'MyApp/1.0' }, cache: 'no-store' })
      if (!res.ok) continue
      const data = await res.json()

      const pageImages: Record<string, string> = {}
      for (const page of Object.values(data?.query?.pages ?? {}) as any[]) {
        if (page.thumbnail?.source) pageImages[page.title] = page.thumbnail.source
      }
      const normMap: Record<string, string> = {}
      for (const n of (data?.query?.normalized ?? []) as any[]) normMap[n.from] = n.to
      const rdMap: Record<string, string> = {}
      for (const r of (data?.query?.redirects ?? []) as any[]) rdMap[r.from] = r.to

      for (const wikiTitle of chunk) {
        const norm = normMap[wikiTitle] ?? wikiTitle
        const rd1  = rdMap[norm] ?? norm
        const rd2  = rdMap[rd1]  ?? rd1
        const img  = pageImages[rd2] ?? pageImages[rd1] ?? pageImages[norm] ?? pageImages[wikiTitle]
        if (img) result[wikiToName[wikiTitle] ?? wikiTitle] = img
      }
    } catch { /* skip chunk on network error */ }
  }
  return result
}
```

---

## 图片代理（存 URL，读时代理）

```typescript
function proxyImg(url: string | null | undefined): string | null {
  if (!url) return null
  return `/api/img?url=${encodeURIComponent(url)}`
}
// 存入 DB 时存原始 upload.wikimedia.org URL
// 从 DB 读出后返回前端前，用 proxyImg() 包一下
```

---

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
  return imgUrl ?? null
}
// name 传中文名（如"梅西"）效果最好
```
