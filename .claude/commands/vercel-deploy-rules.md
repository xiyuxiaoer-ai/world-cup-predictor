---
description: 【自动触发】git push 或"推送/部署/上线"前必读——Vercel 部署必要条件、Next.js 16 API 写法、React 19 类型坑、推送前检查清单
---

# Vercel 部署规则（本项目专用）

## 本项目基本情况

- **Next.js 版本**：16.2.6（Turbopack，有 breaking changes）
- **React 版本**：19.2.4，`"jsx": "react-jsx"`
- **TypeScript**：严格模式，但 `next.config.ts` 设置了 `ignoreBuildErrors: true` → **TypeScript 错误不会阻止 Vercel 构建**
- **本地没有 node_modules**，不能运行 `tsc`，无法本地验证类型

## API Route 写法（必须遵守）

```typescript
// ✅ 正确：Next.js 16+ 用标准 Request，不是 NextRequest
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  ...
}

// ❌ 错误：旧写法，在 Next.js 16 会报 type error
export async function GET(request: NextRequest) { ... }
```

## React 19 / @types/react@19 的坑

```typescript
// ❌ @types/react@19 的 CSSProperties 不包含 WebkitBackdropFilter
style={{ WebkitBackdropFilter: 'blur(12px)' }}   // 类型报错

// ✅ 改用 CSS class（globals.css 里定义 .glass, .glass-sm）
className="glass"
```

```typescript
// ❌ React.ReactNode 需要先 import React
function Foo(): React.ReactNode { ... }  // 若没有 import React 会报错

// ✅ 要么 import React，要么改用 JSX.Element
import React from 'react'
```

## TypeScript 常见坑

```typescript
// ❌ Supabase 查询结果如果条件不可能为真，类型会推断成 never
const { data } = await supabase.from('t').select('x').eq('a', 1).eq('a', 2)
// data 是 never[]，后续任何访问都是类型错误

// ❌ 对象字面量的多余属性检查 (excess property check)
const obj: { a: string } = { a: 'x', b: 'y' }  // 报错：b 不在类型里

// ✅ 改用 as，或拆分赋值
const obj = { a: 'x', b: 'y' } as { a: string }
```

## 推送前检查清单

1. API route 函数签名是 `GET(request: Request)` ✓
2. 没有 `WebkitBackdropFilter` 在 style 属性里 ✓
3. 使用了 `React.ReactNode` 的地方已经 `import React` ✓
4. 对象字面量没有多余属性（特别是大型 Record 数据文件）✓
5. 新增文件的路径对应 `@/` alias（`@/` = `src/`）✓
6. 没有重复的 export key（如 `TEAM_LEGENDS` 里重复的球队 TLA）✓
