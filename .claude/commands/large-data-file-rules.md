---
description: 创建大型硬编码数据文件（如 team-legends.ts）的规范，避免 TypeScript 错误和数据混乱
---

# 大型数据文件规范

## 场景

本项目用 `src/lib/team-legends.ts`、`src/lib/stadiums.ts` 等文件存储大量硬编码数据，通过 `@/lib/xxx` 路径在 API route 中 import。

## 文件结构模板

```typescript
// src/lib/team-legends.ts

export interface LegendPlayer {
  name: string    // 简体中文显示名（同时用于百度搜索）
  nameEn: string  // 精确英文维基文章标题（用于抓图）
  era: string     // 活跃年份，如 "1977–1994"
  desc: string    // ~150字中文描述
}

export interface TeamLegend {
  intro: string          // 250-350字球队历史
  worldCupRecord: string // 世界杯成绩（多行，用 \n 分隔）
  goal2026: string       // 2026年目标
  players: LegendPlayer[]
}

// 类型标注在声明上，不要用 satisfies（部分 TS 版本不支持）
export const TEAM_LEGENDS: Record<string, TeamLegend> = {
  ARG: { ... },
  BRA: { ... },
}
```

## 必须避免的错误

### 1. nameEn 字段名拼写错误
```typescript
// ❌ 多打了一个 e → TypeScript 报 excess property 错误
{ name: '梅西', nameEen: 'Lionel Messi', era: '...', desc: '...' }

// ✅ 正确
{ name: '梅西', nameEn: 'Lionel Messi', era: '...', desc: '...' }

// 推送前检查：grep -c "nameEen:" src/lib/team-legends.ts  → 应该是 0
```

### 2. 重复的 key（同一球队出现两次）
```typescript
// ❌ SWE 出现两次，TypeScript 可能警告，JS 取后者（可能是旧数据）
export const TEAM_LEGENDS = {
  SWE: { players: [老数据] },
  ...
  SWE: { players: [新数据] },  // 覆盖了前面的
}

// 推送前检查重复 key：
// grep "^  [A-Z]\{2,4\}: {" src/lib/team-legends.ts | sort | uniq -d
// 应该输出空（无重复）
```

### 3. nameEn 和 name 对应球员不是同一人
```typescript
// ❌ 中文名是埃切维里，但 nameEn 是莫雷诺（两个不同球员）
{ name: '马科·埃切维里', nameEn: 'Marcelo Moreno Martins', ... }

// ✅ 确保 name（中文）和 nameEn（英文维基标题）是同一个人
{ name: '马科斯·埃切维里', nameEn: 'Marcelo Etcheverry', ... }
{ name: '马塞洛·莫雷诺', nameEn: 'Marcelo Moreno Martins', ... }
```

### 4. 录入了错误国籍的球员
```typescript
// ❌ Yannick Carrasco 是比利时人，不应出现在刚果金条目里
COD: { players: [{ nameEn: 'Yannick Carrasco', ... }] }

// ❌ Giannis Antetokounmpo 是篮球运动员，不应出现在希腊足球条目里
GRE: { players: [{ nameEn: 'Giannis Antetokounmpo', ... }] }
```

## 推送前自查清单

```bash
# 1. nameEn 拼写无误（应返回 0）
grep -c "nameEen:" src/lib/team-legends.ts

# 2. 无重复球队 key
grep -E "^  [A-Z]{2,4}: \{" src/lib/team-legends.ts | sort | uniq -d

# 3. 球队总数
grep -c "^  [A-Z]\{2,4\}: {" src/lib/team-legends.ts

# 4. 球员总数
grep -c "nameEn:" src/lib/team-legends.ts
```

## 数据质量标准

| 球队重要程度 | 最少球员数 | 参考球队 |
|------------|---------|---------|
| 顶级（巴西、德国级） | 7-9 人 | ARG(8), BRA(9) |
| 主要参赛国 | 4-5 人 | USA(4), TUR(5) |
| 一般参赛国 | 3-4 人 | NOR(3), GEO(3) |
| 小国/首次参赛 | 2-3 人 | NZL(2), CUW(2) |
