---
description: 【自动触发】中国用户看不到图片、新增图片来源、修改/api/img代理时——中国区图片访问架构与ALLOWED_HOSTS维护规则
---

# 中国区图片访问架构

## 哪些域名在中国被封锁

| 域名 | 状态 | 用途 |
|------|------|------|
| `upload.wikimedia.org` | ❌ 封锁 | 维基百科图片 CDN |
| `commons.wikimedia.org` | ❌ 封锁 | 维基共享资源 |
| `en.wikipedia.org` | ❌ 封锁 | 英文维基百科 |
| `zh.wikipedia.org` | ❌ 封锁 | 中文维基百科 |
| `bkimg.cdn.bcebos.com` | ✅ 可访问 | 百度百科图片 CDN（主要）|
| `baidu.com` 子域 | ✅ 可访问 | 百度各类 CDN |
| `vercel.app` / 自定义域名 | ✅ 可访问 | 我们的应用本身 |

## 代理架构

```
中国用户浏览器
    ↓  请求 /api/img?url=https://upload.wikimedia.org/xxx
我们的 Vercel 服务器（在中国境外）
    ↓  服务端 fetch upload.wikimedia.org（Vercel 不在中国，可访问）
图片数据 → 返回给中国用户浏览器
    ✅ 绕过封锁
```

## `/api/img` 代理路由位置与规则

文件：`src/app/api/img/route.ts`

**ALLOWED_HOSTS 白名单**——必须包含所有可能出现的图片源域名：

```typescript
const ALLOWED_HOSTS = [
  // Wikimedia / Wikipedia
  'upload.wikimedia.org',
  'commons.wikimedia.org',
  'en.wikipedia.org',
  'zh.wikipedia.org',
  // Baidu Baike image CDN
  'bkimg.cdn.bcebos.com',   // 百度百科主 CDN
  'bcebos.com',             // 匹配 *.bcebos.com
  'baidu.com',              // 匹配 gss0/gss1/hiphotos/imgsrc.baidu.com 等
  'bdstatic.com',           // 百度静态 CDN
]
```

**匹配逻辑**（endsWith 后缀匹配）：
```typescript
ALLOWED_HOSTS.some(h => parsed.hostname === h || parsed.hostname.endsWith('.' + h))
// 'baidu.com' 会匹配 gss0.baidu.com, hiphotos.baidu.com 等所有子域
```

## 新增图片来源时的检查步骤

每次引入新的图片 API，必须：

1. **确认返回的图片 URL 域名**（console.log 或查文档）
2. **判断该域名在中国是否可访问**
3. **如果可能被封锁 → 必须用 `proxyImg()` 包装**
4. **把新域名加到 ALLOWED_HOSTS**

```typescript
// ✅ 所有外部图片都应通过 proxyImg 包装
function proxyImg(url: string | null | undefined): string | null {
  if (!url) return null
  return `/api/img?url=${encodeURIComponent(url)}`
}

// ❌ 直接使用外部 URL，中国用户加载不了
<img src="https://upload.wikimedia.org/xxx" />

// ✅ 通过代理
<img src="/api/img?url=https%3A%2F%2Fupload.wikimedia.org%2Fxxx" />
```

## 球场图片 vs 球员图片

| 图片类型 | 来源 | 代理 | 说明 |
|---------|------|------|------|
| 球场照片 | 英文维基百科 `pageimages` API | ✅ 通过 `/api/img` | `match-info` 路由 |
| 球员照片（主） | 英文维基百科 `pageimages` API | ✅ 通过 `/api/img` | `team-football-history` 路由 |
| 球员照片（备用） | 百度百科 open API | ✅ 通过 `/api/img` | `fetchBaiduImage()` 回退 |

## 常见故障排查

### 图片显示 403 / Forbidden
→ 新图片源的域名不在 ALLOWED_HOSTS 白名单  
→ 把该域名加入 `src/app/api/img/route.ts` 的 `ALLOWED_HOSTS`

### 图片显示 502 / Upstream error  
→ Vercel 服务端无法访问该图片 URL（被反爬/需要登录/失效）  
→ 检查图片 URL 是否有效，考虑换图片源

### 中国用户看到图片 URL 但图片不加载  
→ 检查 `<img src>` 是否是直接的外部 URL（没经过 proxyImg 包装）  
→ 搜索代码里有没有直接 `src={player.rawImageUrl}` 而不是 `src={player.imageUrl}`

### 百度百科图片不显示  
→ 检查 Baidu Baike API 返回的图片字段：`data?.image ?? data?.pic_href ?? data?.images?.[0]?.url`  
→ `pic_href` 可能是相对路径 `/pic/xxx`，需要拼接 `https://baike.baidu.com`  
→ 确认 `bcebos.com` 和 `baidu.com` 在 ALLOWED_HOSTS 里
