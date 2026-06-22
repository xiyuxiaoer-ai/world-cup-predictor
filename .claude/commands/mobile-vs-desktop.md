---
description: 手机端和电脑端的行为差异与调试方法
---

# 手机 vs 电脑——行为差异与调试

## 缓存行为差异

| 层级 | 电脑 | 手机（iOS Safari / Android Chrome）|
|------|------|------|
| JS bundle | 通常刷新后重新加载 | **积极缓存**，即使刷新也可能用旧 bundle |
| API 响应 | 遵守 Cache-Control | **更积极**，max-age 期内不发请求 |
| React 状态 | 刷新 = 重置 | App 未关闭时状态可能持续存在 |
| Vercel CDN | 可能命中边缘节点缓存 | **更容易命中**，因为地理位置或节点分配 |

## 手机端显示内容和电脑不同时的判断

```
手机显示旧内容（繁体、旧格式、空白）
    ↓
API 响应有 Cache-Control: public 吗？
    ↓ 是
Vercel 边缘 CDN 缓存旧响应
    ↓
修复：fetch URL 加 &_v=N（N 每次大改后递增）
      + 改 API 为 Cache-Control: no-store
```

## 手机端清除缓存的方法（告知用户）

- **iOS Safari**：设置 → Safari → 清除历史记录与网站数据
- **iOS Safari 单页**：地址栏长按刷新按钮 → "重新加载并忽略缓存"
- **Android Chrome**：设置 → 隐私 → 清除浏览数据
- **通用方法**：完全关闭标签页再重新打开（不是按返回键）

## Modal 组件的状态生命周期

```
打开 Modal → 新组件实例，所有 state 初始化
关闭 Modal（条件渲染 unmount）→ state 销毁
关闭 Modal（display:none 隐藏）→ state 保留

所以：同一球队关闭再打开，如果组件 unmount 了，legendError 会重置
     但如果没有 unmount，旧的 error 状态会一直存在
```

## 手机端 Modal 样式注意事项

```css
/* 手机底部弹出效果 */
.modal {
  position: fixed;
  bottom: 0;              /* 手机端贴底 */
  min-height: 75vh;       /* 手机端最小高度 */
  border-radius: 24px 24px 0 0;
}

/* 桌面居中弹出 */
@media (min-width: 640px) {
  .modal {
    top: auto;
    bottom: auto;
    border-radius: 24px;
    max-height: 88vh;
  }
}
```

## 手机端图片加载注意事项

- `upload.wikimedia.org` CDN 在中国可访问（通过 `/api/img` proxy）
- 手机网络弱时图片加载慢，需要合适的 fallback（⚽ 占位符）
- 图片 `object-position: top` 比 `center` 更适合人脸头像
