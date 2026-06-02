# Anthropic 风格前端设计系统

**版本**: 1.0.0  
**维护者**: Monica AI  
**最后更新**: 2026-03-17

完整的企业级前端设计系统，结合 Anthropic 的暖米色美学、衬线体人文气息与现代 UI 清晰度。

## 快速开始

### 1. 文件结构

```
anthropic-style-cn/
├── SKILL.md                          ← 完整设计规范主文档（11 章节）
├── assets/fonts/                     ← 离线字体文件
│   ├── fonts.css                     ← @font-face 声明
│   ├── dm-serif-display-400.woff2    ← 标题衬线字体
│   ├── dm-serif-text-400.woff2       ← 正文衬线字体
│   ├── dm-sans-*.woff2               ← UI 无衬线字体（4 个字重）
│   └── jetbrains-mono-400.woff2      ← 代码等宽字体
└── references/                       ← 详细规范文档
    ├── base.css                      ← CSS Token + Reset + 工具类
    ├── components.md                 ← 35 个完整组件库
    ├── systems.md                    ← 10 条系统性规范
    ├── logo.md                       ← Logo 绘制指南
    └── typography-cn.md              ← 中文排版规范
```

### 2. 集成到项目

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <!-- 导入字体 -->
  <link rel="stylesheet" href="assets/fonts/fonts.css">
  
  <!-- 导入基础样式 -->
  <link rel="stylesheet" href="references/base.css">
</head>
<body>
  <h1>Hello Anthropic</h1>
  <p>开始使用设计系统</p>
</body>
</html>
```

## 核心特性

### 色彩系统
- **亮色模式**: 柔和米色背景 (#faf8f3) + 深棕色文本
- **深色模式**: 几乎纯黑背景 (#0f0d0a) + 亮米色文本
- **点缀色**: 克制橙色 (#d97649) + 科技蓝 (#4b9dd9)
- **完整 Token**: CSS 变量管理，支持主题切换

### 排版体系
- **英文**: DM Serif Display（标题）+ DM Serif Text（正文）+ DM Sans（UI）
- **中文**: 霞鹜文楷（标题，CDN）+ 思源黑体（UI，CDN）
- **代码**: JetBrains Mono 等宽字体
- **混排**: unicode-range 自动分流，英文字体优先

### 组件库
- **35 个生产就绪组件**: 基础、导航、表单、内容展示、补充
- **完整无障碍支持**: ARIA 属性、焦点管理、键盘导航
- **响应式设计**: Mobile First，44px 最小触摸区
- **动画规范**: 仅 transform/opacity，性能优先

### 系统规范
- **Z-Index 管理**: 全局分层体系，无硬编码
- **深色模式**: data-theme + localStorage，防 FOUC
- **焦点陷阱**: Modal/Drawer 无依赖实现
- **性能优化**: 字体加载策略、虚拟滚动、图片优化

## 文档导读

| 文档 | 内容 | 适合人群 |
|------|------|---------|
| **SKILL.md** | 完整设计哲学 + 11 章规范 | 所有人（必读） |
| **base.css** | CSS Token + Reset | 开发者 |
| **components.md** | 35 个组件完整代码 | 前端开发者 |
| **systems.md** | 10 条系统性规范 | 架构师、技术负责人 |
| **logo.md** | Logo 绘制 + favicon | 设计师 |
| **typography-cn.md** | 中文排版规范 | 内容编辑、设计师 |

## 快速参考

### 色彩 Token
```css
--color-bg-primary: #faf8f3;      /* 主背景 */
--color-text-primary: #1a1813;    /* 主文本 */
--color-accent-warm: #d97649;     /* 橙色 CTA */
--color-accent-blue: #4b9dd9;     /* 蓝色次操作 */
```

### 字体栈
```css
h1, h2, h3 { 
  font-family: 'DM Serif Display', 'LXGW WenKai', serif; 
}
body { 
  font-family: 'DM Sans', 'Source Han Sans SC', sans-serif; 
}
```

### 间距网格
```css
/* 4px 基础网格 */
--space-1: 4px
--space-2: 8px
--space-4: 16px  /* 基础单位 */
--space-6: 24px
--space-8: 32px
```

### 常用组件
```html
<!-- 英雄区块 -->
<section class="hero">...</section>

<!-- 特性卡片 -->
<div class="feature-card">...</div>

<!-- 按钮 -->
<button class="btn btn-primary">Action</button>

<!-- 模态框 -->
<div class="modal" role="dialog">...</div>

<!-- 表单 -->
<form class="form" novalidate>...</form>
```

## 深色模式支持

所有组件自动支持深色模式。用户可通过以下方式切换：

```javascript
// 设置深色模式
document.documentElement.setAttribute('data-theme', 'dark');
localStorage.setItem('theme', 'dark');

// 恢复上次选择
const saved = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', saved);
```

## 可访问性

所有组件遵循 WCAG 2.1 AA 标准：
- ✓ 对比度 7:1（AAA 级）
- ✓ 焦点指示器
- ✓ ARIA 标签
- ✓ 键盘导航
- ✓ 屏幕阅读器支持

## 浏览器支持

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Android Chrome 90+

## 许可证

Creative Commons Attribution 4.0 International (CC BY 4.0)

**您可以**：
- 自由使用和修改
- 商业和非商业用途

**条件**：
- 署名
- 提供许可证链接
- 标注修改

## 贡献

本设计系统仍在持续完善。欢迎反馈和建议。

## 技术栈

- CSS 3 + 变量 (Custom Properties)
- 原生 JavaScript（无依赖）
- HTML 5 Semantic + ARIA
- SVG（响应式）
- Markdown（文档）

## 常见问题

**Q: 如何使用中文字体？**  
A: 中文字体通过 CDN 加载（霞鹜文楷和思源黑体）。如需离线，参考 `typography-cn.md` 的字体子集化方案。

**Q: 如何自定义颜色？**  
A: 修改 `base.css` 中的 CSS 变量。所有颜色基于 Token，无硬编码。

**Q: 组件可以直接使用吗？**  
A: 完全可以。每个组件都包含完整的 HTML + CSS + JS，可直接复制到项目中。

**Q: 支持什么打包工具？**  
A: 支持任何现代打包工具（Webpack、Vite、Parcel 等）。字体使用标准 @font-face 声明。

---

**最后更新**: 2026-03-17  
**维护者**: Monica AI  
**状态**: 生产就绪 (v1.0.0)

**获取帮助**: 参考 SKILL.md 目录或各分类文档。
