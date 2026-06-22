---
description: 【参考】不同数据源使用不同球队 TLA（三字码）时的别名映射模式——坑在哪、怎么修、哪些 API route 需要加
---

# TLA 别名模式——多数据源球队代码不一致

## 问题背景

本项目从多个数据源获取球队数据：
- `football-data.org`（赛程、比赛数据）
- `football2026tips.com`（名单、阵容）
- 内部 `TEAM_LEGENDS`（传奇球星）
- `TLA_TO_SLUG`（URL 路由映射）

**不同来源对同一支球队使用不同的三字码**，导致路由匹配失败、数据为空。

**典型案例：乌拉圭**
- `football-data.org` 传来的是 `URY`
- 内部 `TEAM_LEGENDS` 的 key 是 `URU`
- `TLA_TO_SLUG` 映射的也是 `URU`
- 结果：`TEAM_LEGENDS['URY']` → `undefined` → 返回 404 → 前端显示"暂无数据"

---

## 解决方案：TLA_ALIASES 映射

在每个需要用 TLA 查数据的 route 文件顶部加：

```typescript
const TLA_ALIASES: Record<string, string> = {
  URY: 'URU',  // football-data.org 使用 URY；内部数据使用 URU
}

export async function GET(request: Request) {
  const rawTla = searchParams.get('tla')?.toUpperCase() ?? ''
  const tla = TLA_ALIASES[rawTla] ?? rawTla  // 规范化
  // 后续所有逻辑用 tla，不用 rawTla
}
```

---

## 需要加 TLA_ALIASES 的文件

凡是接收 `?tla=` 参数并查内部数据的 API route 都要加：

- [team-football-history/route.ts](src/app/api/team-football-history/route.ts) — 查 `TEAM_LEGENDS[tla]`
- [team-squad/route.ts](src/app/api/team-squad/route.ts) — 查 `TLA_TO_SLUG[tla]`
- 未来如果新增接收 tla 的 route，也要同步加

---

## 如何发现 TLA 不一致

**症状**：某一支球队的传奇、名单、历史全部显示"暂无数据"，其他球队正常。  
**排查步骤**：
1. 检查前端传给 API 的 `tla` 参数值（Network tab → request URL）
2. 搜索 `TEAM_LEGENDS` 和 `TLA_TO_SLUG`，看这支球队用的是哪个 key
3. 如果不一致，加到 `TLA_ALIASES`

---

## 已知别名

| rawTla (外部) | 内部 canonical | 来源 |
|--------------|---------------|------|
| URY          | URU           | football-data.org 用 URY，FIFA 标准是 URU |

如发现新的不一致，直接在 `TLA_ALIASES` 里添加即可，不需要改其他地方。

---

## 注意：不是所有 TLA 都要别名

只有**外部 API 返回的 TLA 与内部 key 不同**时才需要。同时存在于两侧的 `KOR`、`BRA` 等不需要处理。

```typescript
// ❌ 不要这样（冗余，没意义）
const TLA_ALIASES = { KOR: 'KOR', BRA: 'BRA', URY: 'URU' }

// ✅ 只加真正有偏差的
const TLA_ALIASES = { URY: 'URU' }
```
