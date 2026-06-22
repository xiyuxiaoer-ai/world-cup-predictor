---
description: React 状态管理常见坑：错误状态卡住、数据缓存、重试机制
---

# React 状态常见坑

## 坑1：错误状态永久卡住，不允许重试

```typescript
// ❌ 有问题的写法：一旦出错，永远不重新请求
useEffect(() => {
  if (tab !== 'legend' || legendData !== null || legendError) return
  fetch('/api/...')
    .then(d => setLegendData(d))
    .catch(() => setLegendError(true))  // 设置了 error=true
}, [tab, tla, legendData, legendError])

// legendError=true 后，条件 `|| legendError` 永远成立，effect 永远提前 return
// 即使 API 修好了，用户无法在不刷新页面的情况下重试
```

```typescript
// ✅ 正确写法：给错误状态提供重置方法
// UI 里加重新加载按钮
{legendError && (
  <div>
    <p>暂无数据</p>
    <button onClick={() => setLegendError(false)}>重新加载</button>
  </div>
)}
// 点击后 legendError 变 false → effect 重新触发 → 重新 fetch
```

## 坑2：成功数据缓存在 state，导致内容不更新

```typescript
// legendData 一旦设置就不会再 fetch
// 条件：legendData !== null 时跳过
// 问题：如果 API 内容更新了，用户看到的是旧数据

// 解决方案1：接受这个行为（同一 session 内数据不会变）
// 解决方案2：给 tab 加强制刷新按钮，清除 legendData
// 解决方案3：加 key prop 强制重新挂载组件
<TeamHistoryModal key={`${tla}-${tab}`} ... />
```

## 坑3：组件状态 vs 页面刷新

```
组件 unmount（条件渲染关闭）→ state 销毁 → 重新打开时 state 初始化
组件 keep-alive（display:none）→ state 保留 → 重新打开时 state 不变

本项目 TeamHistoryModal 使用条件渲染，所以：
- 关闭 + 重新打开 = 状态重置，error 清除，data 清除
- 但页面刷新也同样重置
```

## 坑4：useEffect 依赖数组引发无限循环

```typescript
// ❌ 如果 legendError 在 effect 里被设为 false，又被 catch 设回 true
// 可能引发循环
useEffect(() => {
  setLegendError(false)  // 触发重渲染
  fetch(...)
    .catch(() => setLegendError(true))  // 又触发重渲染...
}, [legendError])  // legendError 变化 → effect 重跑
```

## 坑5：API 格式改变后前端显示空白

```
旧 API 返回：{ players: [...], history: "..." }
新 API 返回：{ players: [...], intro: "...", worldCupRecord: "...", goal2026: "..." }

如果前端被 CDN 缓存了旧 API 响应：
- data.intro = undefined → 不渲染
- data.worldCupRecord = undefined → 不渲染
- data.goal2026 = undefined → 不渲染
- 只有 data.players 有值（可能也是旧格式）

结果：传奇历史页只显示百度链接，其余全空

修复：
1. 在 fetch URL 加版本参数（&_v=N）绕过 CDN 缓存
2. 把 API 的 Cache-Control 改为 no-store
```

## 最佳实践模板

```typescript
const [data, setData] = useState<any>(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState(false)

useEffect(() => {
  if (data !== null || loading) return  // 不用 error 判断，允许重试
  setLoading(true)
  setError(false)  // 每次重试前清除旧 error
  fetch(`/api/xxx?id=${id}&_v=3`)
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(d => { setData(d); setLoading(false) })
    .catch(() => { setError(true); setLoading(false) })
}, [id, data, loading])

// 重试：清除 data 或 error 即可触发 effect 重跑
const retry = () => { setData(null); setError(false) }
```
