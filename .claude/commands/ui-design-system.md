# UI 设计规范 — 世界杯竞猜

> 每次新增或修改 UI 组件前必读。目标：所有页面视觉风格统一，高级感、时尚感，中英文/手机/电脑/深浅色全场景一致。

---

## 1. 毛玻璃（Glassmorphism）系统

### 三档玻璃类

| 类名 | 用途 | blur | 亮色 bg | 暗色 bg |
|------|------|------|---------|---------|
| `.glass` | 主卡片、模态框、面板 | `14px` | `rgba(255,255,255,0.82)` | `rgba(28,28,34,0.80)` |
| `.glass-sm` | 次级面板、内嵌卡片 | `10px` | `rgba(255,255,255,0.65)` | `rgba(42,42,50,0.72)` |
| `.glass-nav` | 顶部导航栏 | `18px` | `rgba(248,249,250,0.88)` | `rgba(12,15,23,0.91)` |

```css
/* ✅ 正确用法 */
<div className="glass rounded-2xl p-4">...</div>

/* ❌ 禁止自己写 backdrop-filter，统一用类名 */
<div style={{ backdropFilter: 'blur(20px)' }}>...</div>
```

### 文字可读性保障

毛玻璃背景上文字必须遵守：

```
亮色模式：
  主文字   → text-gray-900   (#111827)  对比度 ≥ 7:1 ✅
  次要文字 → text-gray-500   (#6B7280)  对比度 ≥ 4.5:1 ✅
  弱提示   → text-gray-400   (#9CA3AF)  仅用于辅助信息

暗色模式：
  主文字   → dark:text-gray-100  (#F3F4F6)
  次要文字 → dark:text-gray-400  (#9CA3AF)
  弱提示   → dark:text-gray-500  (#6B7280)
```

**强调色文字**（分数、奖励、标签）用 `text-amber-600 dark:text-amber-400`，禁止直接白字压玻璃背景。

---

## 2. 禁止使用系统 Emoji，必须使用自定义 SVG Icon

### 规则

> ❌ **绝对禁止**：在 JSX 里直接写系统 emoji（⚽ 🏆 ✓ ← → 等）
> ✅ **必须**：用内联 SVG 或已有 Icon 组件替代

系统 emoji 在不同设备/字体上渲染差异极大，破坏高级感。

### 已有可复用 Icon 组件

```tsx
// 地图别针（PredictionCard / HomeContent 已用）
function IconPin() {
  return (
    <svg viewBox="0 0 10 13" fill="none" style={{ width: 9, height: 11, flexShrink: 0 }}>
      <path d="M5 0.5C2.79 0.5 1 2.29 1 4.5C1 7.75 5 12.5 5 12.5C5 12.5 9 7.75 9 4.5C9 2.29 7.21 0.5 5 0.5Z" fill="currentColor" opacity="0.85"/>
      <circle cx="5" cy="4.5" r="1.5" fill="white" opacity="0.88"/>
    </svg>
  )
}

// 三点菜单（HomeContent 已用）
function IconDots() {
  return (
    <svg viewBox="0 0 4 18" width="4" height="18" fill="currentColor">
      <circle cx="2" cy="2" r="1.6"/><circle cx="2" cy="9" r="1.6"/><circle cx="2" cy="16" r="1.6"/>
    </svg>
  )
}

// 右箭头（折叠展开）
function IconChevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 6 10" width="6" height="10" fill="currentColor"
      className={`transition-transform duration-200 shrink-0 ${open ? 'rotate-90' : ''}`}>
      <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  )
}

// 对勾（已提交/已完成）
function IconCheck() {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// 关闭 ✕
function IconClose() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none">
      <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6"
        strokeLinecap="round"/>
    </svg>
  )
}

// 外链 ↗
function IconExternal() {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
      <path d="M7 1h4v4M11 1L5.5 6.5M5 3H2v7h7V7" stroke="currentColor"
        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// 同步/刷新 ↻
function IconRefresh({ spinning }: { spinning?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none"
      className={spinning ? 'animate-spin' : ''}>
      <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5c1.8 0 3.4.87 4.4 2.2" stroke="currentColor"
        strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M12 2v3h-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
```

### 新增 Icon 规范

新场景需要图标时，写法：
- `viewBox` 用 `"0 0 N N"` 正方形
- 用 `stroke="currentColor"` + `fill="none"`（线性风格）或 `fill="currentColor"`（填充风格），禁止硬编码颜色
- 尺寸用 `width`/`height` props 控制，默认 `16×16`，行内用 `12×12` 或 `14×14`
- 加 `strokeLinecap="round" strokeLinejoin="round"` 保持圆润感

---

## 3. 颜色系统

### 主色调

| 角色 | 亮色 | 暗色 | 用途 |
|------|------|------|------|
| **强调/积分/奖励** | `amber-600` | `amber-400` | 分数、金牌、高亮 |
| **主操作按钮** | `blue-600` / `.btn-gold-primary` | `blue-400` | CTA 按钮 |
| **危险/错误** | `red-500` | `red-400` | 删除、错误提示 |
| **成功** | `green-500` | `green-400` | 胜利、提交成功 |
| **背景文字** | `gray-900` | `gray-100` | 正文 |
| **次要文字** | `gray-500` | `gray-400` | 标签、辅助 |

### 禁止使用的颜色

- ❌ 纯白 `white` 直接作为文字色（玻璃背景上不可读）
- ❌ `amber-500` 作按钮背景（全局 CSS 已重定向为 blue）
- ❌ `black` 背景色（用深色 glass 替代）

---

## 4. 响应式设计

### 断点规则

本项目**只用 `sm:` 和 `md:`**，不引入 `lg:` 以上。

```
默认（<640px）= 手机竖屏
sm:（≥640px）  = 平板/大屏手机/桌面
md:（≥768px）  = 桌面宽屏
```

### 布局模式

```tsx
// 手机单列，桌面双列
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

// 手机堆叠，桌面同行
<div className="flex flex-col sm:flex-row gap-3">

// 手机全宽，桌面居中限宽
<div className="w-full max-w-2xl mx-auto px-4">

// Modal：手机底部 sheet，桌面居中弹窗
className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-6"
// 内容：
className="rounded-t-3xl sm:rounded-3xl w-full sm:max-w-xl min-h-[75vh] sm:min-h-0"
```

### 触摸友好

- 所有可点击元素最小触摸目标 `44×44px`（用 `p-2` 以上保证）
- 按钮/链接必须有 `.tap-scale` 类（提供触摸反馈）
- `touch-action: manipulation` 已全局设置，无需单独加

---

## 5. 深浅色模式

### 强制双模式

每个颜色类必须同时写亮色和暗色：

```tsx
// ✅ 正确
className="text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-black/40 border-gray-200 dark:border-white/10"

// ❌ 只写了亮色
className="text-gray-700 bg-white"
```

### 常用配对速查

| 元素 | 亮色 | 暗色 |
|------|------|------|
| 主文字 | `text-gray-900` | `dark:text-gray-100` |
| 次要文字 | `text-gray-500` | `dark:text-gray-400` |
| 边框 | `border-black/[0.06]` | `dark:border-white/10` |
| 分割线 | `divide-black/[0.04]` | `dark:divide-white/[0.04]` |
| hover 背景 | `hover:bg-white/40` | `dark:hover:bg-white/[0.06]` |
| 输入框 | `bg-gray-100` | `dark:bg-gray-700` |
| 标签背景 | `bg-amber-50` | `dark:bg-amber-900/20` |

### 玻璃模态框遮罩

```tsx
// 统一遮罩写法
<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md">
```

---

## 6. 动效系统

### 可用动画类（按场景选择）

| 场景 | 类名 | 时长 |
|------|------|------|
| 页面/大区块进入 | `.animate-page-enter` | 0.44s |
| Modal / 抽屉弹出 | `.animate-sheet-in` | 0.36s（手机），0.52s（桌面） |
| 积分榜、卡片组 | `.animate-spring-in` | 0.42s |
| 列表逐项出现 | `.animate-stagger-in` + `animationDelay` | 0.34s/项 |
| Badge / chip 出现 | `.animate-pop-in` | 0.32s |
| 骨架屏扫光 | `.animate-shimmer` | 1.6s ∞ |

### 交错动画写法

```tsx
// delay 上限 180ms，超出后用户感知不到差异
{items.map((item, i) => (
  <div key={item.id}
    className="glass rounded-xl animate-stagger-in"
    style={{ animationDelay: `${Math.min(i * 40, 180)}ms` }}
  >
    ...
  </div>
))}
```

### 交互反馈

```tsx
// 普通按钮：点击缩放
<button className="tap-scale">...</button>

// 卡片：桌面 hover 上浮（手机不触发）
<div className="glass hover-lift rounded-xl">...</div>

// 主 CTA 按钮
<button className="btn-gold-primary tap-scale w-full py-3 rounded-xl font-bold text-sm">
  提交
</button>
```

---

## 7. 卡片 & 面板规范

### 标准卡片

```tsx
<div className="glass rounded-2xl p-4 space-y-3">
  {/* 内容 */}
</div>
```

### 列表卡片（多行）

```tsx
<div className="glass rounded-xl overflow-hidden">
  <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
    {items.map(item => (
      <div key={item.id} className="flex items-center gap-3 px-4 py-3
        hover:bg-white/40 dark:hover:bg-white/[0.05] transition-colors cursor-pointer">
        ...
      </div>
    ))}
  </div>
</div>
```

### 分区标题

```tsx
<div className="flex items-center gap-2 mb-3">
  <span className="block w-[3px] h-4 rounded-full bg-amber-400" />
  <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wide">
    标题
  </h2>
</div>
```

### 标签 / Badge

```tsx
// 成功态
<span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full font-medium">
  已提交
</span>

// 警告态
<span className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
  即将锁定
</span>
```

---

## 8. 禁止事项速查

| 禁止 | 应改为 |
|------|--------|
| 系统 emoji（⚽ 🏆 ✓ → ←） | 自定义 SVG Icon |
| `backdropFilter` 内联样式 | `.glass` / `.glass-sm` 类 |
| `box-shadow` 写在 transition 里 | 只 transition `transform`（GPU 合成） |
| `hover:` 悬浮效果不加 `@media(hover:hover)` 限制 | 用 `.hover-lift` 类（已内置媒体查询） |
| 硬编码 `#ffffff` / `#000000` | Tailwind 色彩 token |
| 只写亮色不写暗色 | 每个颜色类都加 `dark:` 配对 |
| `lg:` `xl:` 断点 | 最大用到 `md:`，超出无需适配 |
| `type="number"` 输入框（iOS 会显示加减号） | `type="text" inputMode="numeric" pattern="[0-9]*"` |
