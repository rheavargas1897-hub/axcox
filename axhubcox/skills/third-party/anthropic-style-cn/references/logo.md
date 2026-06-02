# Logo 设计指南

**版本**：1.0.0  
**应用范围**：品牌标志、应用图标、favicon、社交媒体头像  
**最后更新**：2026-03-17

---

## 1. Logo 构成原则

### 几何网格系统

Anthropic Logo 基于 **8×8 网格**构建，确保各部分比例和谐、易于缩放：

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   Grid: 8×8 units                               │
│   Margin: 1 unit on all sides                   │
│   Safe area: 6×6 units                          │
│                                                 │
│   ┌───────────────────────────────────────────┐ │
│   │                                           │ │
│   │        A logo design goes here            │ │
│   │                                           │ │
│   └───────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 黄金比例应用

Logo 主体元素遵循 1:1.618 的黄金比例，营造视觉和谐感：

- **主圆形**：直径 6 单位，中心位于 (4, 4)
- **内部路径**：占主圆形 60%，形成层次感
- **外环**：宽度 0.5 单位，强调边界

### 有机圆角

所有尖锐角被替换为弧线，保持温暖的有机感：

```
/* 禁止锐角 */
M 0 0 L 6 0 L 6 6 L 0 6 Z

/* ✓ 推荐有机圆角 */
M 1 0 Q 6 0 6 1 Q 6 6 1 6 Q 0 6 0 1 Q 0 0 1 0
```

---

## 2. SVG 路径绘制思路

### 路径命令速查表

| 命令 | 用途 | 示例 | 说明 |
|------|------|------|------|
| M | 移动 | `M 10 10` | 将笔移至 (10, 10) |
| L | 直线 | `L 20 20` | 从当前点画直线到 (20, 20) |
| H | 水平线 | `H 30` | 水平线到 x=30 |
| V | 竖直线 | `V 40` | 竖直线到 y=40 |
| C | 三次贝塞尔 | `C 10 20, 30 40, 50 60` | 平滑曲线（最常用） |
| Q | 二次贝塞尔 | `Q 20 20, 40 30` | 简化曲线 |
| A | 圆弧 | `A 10 10 0 1 1 20 30` | 椭圆弧线 |
| Z | 闭合 | `Z` | 回到起点并闭合路径 |

### Bezier 曲线手册

三次贝塞尔曲线 `C x1 y1, x2 y2, x y` 由 4 个点定义：

```
起点（当前笔位置） → [控制点1] → [控制点2] → 终点
      ↑                                          ↓
  自动连接            曲线形状由这两个控制点决定
```

**常用曲线模式**：

```svg
<!-- 上升曲线 -->
<path d="M 0 10 C 5 0, 15 0, 20 10" stroke="black" fill="none"/>

<!-- 下降曲线 -->
<path d="M 0 0 C 5 10, 15 10, 20 0" stroke="black" fill="none"/>

<!-- S 形曲线 -->
<path d="M 0 5 C 5 0, 15 10, 20 5" stroke="black" fill="none"/>
```

### 完整 Logo SVG 示例

```svg
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <!-- Logo 主体：有机圆形 -->
  <g id="logo-main">
    <!-- 外圆 -->
    <circle 
      cx="128" 
      cy="128" 
      r="96" 
      fill="none" 
      stroke="currentColor" 
      stroke-width="4"
    />
    
    <!-- 内部路径：A 字形（Anthropic） -->
    <path 
      d="
        M 128 64
        C 96 64, 72 88, 72 120
        L 88 120
        C 88 100, 104 84, 128 84
        C 152 84, 168 100, 168 120
        L 184 120
        C 184 88, 160 64, 128 64
        Z
        M 128 144
        L 100 144
        L 128 180
        L 156 144
        Z
      " 
      fill="currentColor"
    />
  </g>
  
  <!-- 可选：底部文字 -->
  <text 
    x="128" 
    y="200" 
    text-anchor="middle" 
    font-family="DM Serif Display" 
    font-size="24" 
    fill="currentColor"
  >
    Anthropic
  </text>
</svg>
```

---

## 3. 品牌色用法

### 4 种配色方案

| 方案 | 主色 | 背景 | 用途 | 说明 |
|------|------|------|------|------|
| **彩色** | #d97649 (橙色) | 白色或淡米色 | 标志、网站、营销 | 标准方案，最强辨识度 |
| **反色** | 白色 | #d97649 (橙色) | 深色背景、App Icon | 必需时的反转 |
| **单色** | #1a1813 (深棕) | 白色 | 名片、证件、打印 | 黑白印刷专用 |
| **图标** | #d97649 (橙色) | 透明 | UI 按钮、Social、Favicon | 小尺寸应用 |

### 颜色规范

```css
/* 彩色版本 */
.logo-color {
  color: var(--color-accent-warm); /* #d97649 */
  background-color: var(--color-surface-primary); /* #ffffff */
}

/* 反色版本 */
.logo-inverse {
  color: var(--color-surface-primary); /* #ffffff */
  background-color: var(--color-accent-warm); /* #d97649 */
}

/* 单色版本（深色） */
.logo-mono-dark {
  color: var(--color-text-primary); /* #1a1813 */
  background-color: transparent;
}

/* 单色版本（浅色） */
.logo-mono-light {
  color: var(--color-surface-primary); /* #ffffff */
  background-color: transparent;
}
```

---

## 4. 必备变体

### 变体 1：完整 Logo（带文字）

```svg
<svg width="400" height="128" viewBox="0 0 400 128">
  <!-- Logo 图标 -->
  <g transform="translate(0, 0)">
    <circle cx="64" cy="64" r="56" fill="none" stroke="#d97649" stroke-width="3"/>
    <!-- 内容路径 -->
  </g>
  
  <!-- 品牌文字 -->
  <text 
    x="120" 
    y="80" 
    font-family="DM Serif Display" 
    font-size="48" 
    fill="#1a1813"
  >
    Anthropic
  </text>
</svg>
```

**用途**：网站顶部、营销材料、品牌展示

### 变体 2：图标版（仅符号）

```svg
<svg width="256" height="256" viewBox="0 0 256 256">
  <!-- 紧凑的 Logo 符号，无文字 -->
  <circle cx="128" cy="128" r="96" fill="none" stroke="#d97649" stroke-width="4"/>
  <!-- 路径内容 -->
</svg>
```

**用途**：favicon、App Icon、社交头像、按钮

### 变体 3：单色版（深）

```svg
<svg width="256" height="256" viewBox="0 0 256 256">
  <circle cx="128" cy="128" r="96" fill="none" stroke="#1a1813" stroke-width="4"/>
  <!-- 路径 -->
</svg>
```

**用途**：黑白印刷、复印件、传真

### 变体 4：反色版（浅）

```svg
<svg width="256" height="256" viewBox="0 0 256 256">
  <rect width="256" height="256" fill="#d97649"/>
  <circle cx="128" cy="128" r="96" fill="none" stroke="#ffffff" stroke-width="4"/>
  <!-- 路径 -->
</svg>
```

**用途**：深色背景（如导航栏）、App 启动屏

---

## 5. 最小尺寸与安全间距规则

### 最小尺寸

| 应用场景 | 最小尺寸 | 说明 |
|---------|---------|------|
| Favicon | 32×32 px | 浏览器标签栏 |
| App Icon | 192×192 px | Android 标准 |
| Social Avatar | 400×400 px | LinkedIn、Twitter |
| 网站 Logo | 512×512 px | 高清显示 |
| 打印物料 | 2×2 cm | 对应 ~236 px |

### 安全间距（Clear Space）

Logo 周围必须保持最小空白，确保可读性：

```
┌─────────────────────────────────────────┐
│  ▢ Logo           Logo Width            │
│  ▢ Margin = 0.5 × Logo Width            │
│                                         │
│    Minimum Clear Space                  │
│    (Any content should be this far away)│
│                                         │
└─────────────────────────────────────────┘
```

```css
.logo-container {
  padding: calc(var(--logo-width) * 0.5); /* 安全间距 */
}

/* Logo 宽度示例 */
.logo-sm { width: 64px; }   /* 标签栏，margin: 32px */
.logo-md { width: 128px; }  /* 网页，margin: 64px */
.logo-lg { width: 256px; }  /* 大屏，margin: 128px */
```

---

## 6. Favicon 多尺寸方案

### 必备尺寸

| 尺寸 | 格式 | 用途 | 优先级 |
|------|------|------|--------|
| 16×16 | .ico | 浏览器标签 | 高 |
| 32×32 | .ico/.png | 收藏夹 | 高 |
| 64×64 | .png | 高 DPI 标签 | 中 |
| 180×180 | .png | iOS Home | 中 |
| 192×192 | .png | Android | 中 |
| 512×512 | .png | PWA | 低 |

### HTML 声明

```html
<!DOCTYPE html>
<html>
<head>
  <!-- 标准 Favicon -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  
  <!-- 更新的标准方式 -->
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  
  <!-- Apple Touch Icon -->
  <link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png">
  
  <!-- Android Chrome -->
  <link rel="manifest" href="/site.webmanifest">
  
  <!-- PWA Icon -->
  <meta name="theme-color" content="#d97649">
</head>
</html>
```

### site.webmanifest 配置

```json
{
  "name": "Anthropic",
  "short_name": "Anthropic",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#d97649",
  "background_color": "#faf8f3",
  "display": "standalone"
}
```

### SVG Favicon 暗色模式自适应

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg">

<!-- favicon.svg 内容 -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <style>
    @media (prefers-color-scheme: dark) {
      .icon-bg { fill: #0f0d0a; }
      .icon-stroke { stroke: #f5f2eb; }
    }
    
    @media (prefers-color-scheme: light) {
      .icon-bg { fill: #faf8f3; }
      .icon-stroke { stroke: #d97649; }
    }
  </style>
  
  <rect class="icon-bg" width="100" height="100"/>
  <circle class="icon-stroke" cx="50" cy="50" r="40" fill="none" stroke-width="3"/>
</svg>
```

### 生成流程

```bash
# 使用 ImageMagick 或在线工具生成所需尺寸
convert logo.svg -resize 32x32 -transparent white favicon-32x32.png
convert logo.svg -resize 192x192 -transparent white favicon-192x192.png
convert logo.svg -resize 512x512 -transparent white favicon-512x512.png

# 将 PNG 转换为 ICO（用于旧浏览器）
convert favicon-32x32.png favicon-16x16.png favicon.ico
```

---

## 7. 使用禁区

### 不推荐的修改

| 禁止操作 | 原因 | 正确做法 |
|---------|------|---------|
| 改变纵横比 | 破坏黄金比例和谐性 | 保持 1:1 或指定的宽高比 |
| 添加阴影或渐变 | 过于复杂，缩小时难以辨识 | 保持平面设计 |
| 改变颜色（非规范） | 破坏品牌识别 | 只用 4 种规范色 |
| 倾斜或旋转 | 显得不专业 | 保持水平 |
| 添加边框或框架 | 显得捆绑、廉价 | 使用指定的安全间距 |
| 将文字与图标粘合 | 缩小时文字消失 | 分离图标和文字 |

### 负空间保护

Logo 周围 50% 宽度的负空间内禁止放置任何内容，确保清晰度。

---

## 8. 品牌保护指南

### Logo 版权标注

```html
<!-- 页脚或关于页面 -->
<p>&copy; 2026 Anthropic PBC. "Anthropic" and the Anthropic logo are trademarks of Anthropic PBC.</p>

<!-- SVG 内添加注释 -->
<svg>
  <!-- Anthropic Logo - ® Anthropic PBC 2026 -->
  ...
</svg>
```

### 许可证声明

```
License: These assets are provided under the Creative Commons Attribution 4.0 International (CC BY 4.0) license.

You are free to:
✓ Share and adapt the logo
✓ Use commercially
✓ Modify and build upon

Provided you:
✓ Give appropriate credit
✓ Provide a link to the license
✓ Indicate if changes were made
✓ Do not apply additional legal terms
```

---

## 9. Logo 导出清单

在交付前检查以下项目：

```
Logo 导出检查表：

□ 所有 4 个变体已生成（彩色、反色、单色、图标）
□ 尺寸范围从 32px 到 512px
□ SVG 格式已优化（无不必要的样式、路径简化）
□ PNG 使用 sRGB 色彩空间（网络标准）
□ 所有文件以 CMYK 模式检查过（打印用）
□ Safe area 标记已创建（设计文档）
□ Favicon 生成完整（16、32、64、180、192、512）
□ 颜色值硬编码已替换为 CSS Token
□ ARIA 标签已添加（如适用）
□ 文件名规范化（logo-color.svg, logo-mono.svg 等）
□ 版权声明已添加
```

---

## 10. 快速参考

### SVG 模板

```svg
<svg 
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 256 256"
  width="256"
  height="256"
>
  <!-- 定义样式，支持 CSS 变量和深色模式 -->
  <defs>
    <style>
      :root { --color: #d97649; }
      @media (prefers-color-scheme: dark) {
        :root { --color: #e8937d; }
      }
    </style>
  </defs>
  
  <!-- Logo 内容 -->
  <circle 
    cx="128" 
    cy="128" 
    r="96" 
    fill="none" 
    stroke="currentColor" 
    stroke-width="4"
  />
</svg>
```

### CSS 应用

```css
/* 在网页中使用 Logo */
.site-logo {
  width: 64px;
  height: 64px;
  background-image: url('/logo-color.svg');
  background-size: contain;
  background-repeat: no-repeat;
}

/* 响应式 Logo */
@media (min-width: 768px) {
  .site-logo {
    width: 128px;
    height: 128px;
  }
}

/* 深色模式自动切换 */
[data-theme="dark"] .site-logo {
  background-image: url('/logo-inverse.svg');
}
```

---

**版本**：1.0.0 | **最后更新**：2026-03-17 | **设计师**：Monica AI

**建议工具**：
- SVG 编辑：Figma、Illustrator、Inkscape
- 尺寸转换：ImageMagick、GIMP
- 在线优化：SVGO、TinyPNG
- Favicon 生成：favicon-generator.org
