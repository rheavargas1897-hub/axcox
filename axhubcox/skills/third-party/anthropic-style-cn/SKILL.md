# Anthropic 风格前端设计系统

**版本**：1.0.0  
**最后更新**：2026-03-17  
**维护者**：Monica AI Design System

---

## 0. 设计哲学

Anthropic 设计系统承载着一个核心矛盾：**技术理性与人文温度的共存**。在一个被冷蓝色科技风视觉所主导的 AI 产业中，我们选择了暖米色的设计基调——这不是为了回避科技的复杂性，而是为了在用户与高级计算能力之间建立信任的情感桥梁。

### 设计原则

**1. 有机的克制**

设计中的每一个元素都遵循"存在理由"的规则。米色背景看似单调，却通过微妙的纹理变化营造视觉深度；橙色点缀不是为了吸引眼球，而是为了在关键时刻引导用户的注意力。这种克制体现为：

- 最小化装饰性元素，每个视觉组件都应该服务于信息传达
- 使用衬线字体传递人文感，无衬线字体保持 UI 的清晰度
- 色彩空间被严格限制——主要依赖无色调体系（米色、棕色、中性灰）

**2. 温度即精度**

暖色调被误认为是"柔和"或"不专业"的。事实相反。温度在这里是精度的体现：

- 暖米色减少了长时间使用中的视觉疲劳，让用户能更专注于内容
- 衬线字体在大字号下呈现的细节比例，体现了对排版工艺的尊重
- 动效设计中的缓动曲线采用物理学模型，确保每一帧的可预测性

**3. 上下文即道德**

设计不存在真空中。每个组件的存在都是对用户场景的理解——表单验证的反馈延迟、弹窗的焦点管理、深色模式的色温调整。这些看似微小的决策承载着对用户尊重的态度。

---

## 1. 颜色系统

### 核心色板

Anthropic 色系由两层色彩理论构成：**无色调主体**（米色、棕色、灰色）和**克制点缀**（橙色、蓝色）。

#### 亮色模式 (Light Mode)

| 用途 | 色值 | HEX | RGB | 说明 |
|------|------|-----|-----|------|
| 背景主色 | - | #faf8f3 | 250, 248, 243 | 柔和米色，主应用背景 |
| 背景次色 | - | #f5f2eb | 245, 242, 235 | 卡片、区块分层 |
| 背景三色 | - | #ede8e0 | 237, 232, 224 | 深色组件背景 |
| 背景四色 | - | #e5dfd5 | 229, 223, 213 | 已禁用状态背景 |
| 表面主色 | - | #ffffff | 255, 255, 255 | 纯白表面，提升对比 |
| 表面次色 | - | #fefdfb | 254, 253, 251 | 微妙偏米色 |
| 文本主色 | - | #1a1813 | 26, 24, 19 | 深棕色，最高对比度 |
| 文本次色 | - | #3d3932 | 61, 57, 50 | 次要标题、强调 |
| 文本三色 | - | #6b6459 | 107, 100, 89 | 正文辅助文本 |
| 文本四色 | - | #9a9087 | 154, 144, 135 | 弱化文本、提示 |
| 边框主色 | - | #e5dfd5 | 229, 223, 213 | 轻微分割线 |
| 边框次色 | - | #d9d2c7 | 217, 210, 199 | 强调边框 |
| 橙色（点缀）| - | #d97649 | 217, 118, 73 | CTA 按钮、重点提示 |
| 橙色浅 | - | #e8937d | 232, 147, 125 | Hover 状态 |
| 橙色深 | - | #b85a35 | 184, 90, 53 | Active 状态、禁用 |
| 蓝色（科技）| - | #4b9dd9 | 75, 157, 217 | Info、链接、次要操作 |
| 蓝色浅 | - | #7ab3e5 | 122, 179, 229 | 蓝色 Hover |
| 蓝色深 | - | #2a6fb3 | 42, 111, 179 | 蓝色 Active |
| 成功 | - | #5a9a3a | 90, 154, 58 | 正面确认、完成 |
| 警告 | - | #d9a648 | 217, 166, 72 | 谨慎操作、需要注意 |
| 错误 | - | #c23f3f | 194, 63, 63 | 错误状态、销毁操作 |
| 信息 | - | #4b9dd9 | 75, 157, 217 | 通用信息、帮助 |

#### 深色模式 (Dark Mode)

深色模式保持相同的设计逻辑，但通过反向对比确保可读性：

| 用途 | HEX | RGB | 说明 |
|------|-----|-----|------|
| 背景主色 | #0f0d0a | 15, 13, 10 | 几乎纯黑，减少长时间使用的蓝光 |
| 背景次色 | #1a1815 | 26, 24, 21 | 卡片背景 |
| 背景三色 | #2a271f | 42, 39, 31 | 表面元素 |
| 背景四色 | #3a3730 | 58, 55, 48 | 禁用背景 |
| 文本主色 | #f5f2eb | 245, 242, 235 | 亮米色文本 |
| 文本次色 | #ddd8d1 | 221, 216, 209 | 次要文本 |
| 文本三色 | #a89f93 | 168, 159, 147 | 弱化文本 |
| 文本四色 | #6b6459 | 107, 100, 89 | 极弱化文本 |
| 边框主色 | #3a3730 | 58, 55, 48 | 轻微分割 |
| 边框次色 | #4a4640 | 74, 70, 64 | 强化边框 |

### CSS 色彩 Token

所有颜色必须通过 CSS 变量使用，禁止硬编码十六进制值：

```css
:root {
  /* Light Mode (Default) */
  --color-bg-primary: #faf8f3;
  --color-bg-secondary: #f5f2eb;
  --color-text-primary: #1a1813;
  --color-accent-warm: #d97649;
  --color-accent-blue: #4b9dd9;
  --color-success: #5a9a3a;
  --color-warning: #d9a648;
  --color-error: #c23f3f;
  --color-info: #4b9dd9;

  /* Shadow System */
  --shadow-xs: 0 1px 2px rgba(26, 24, 19, 0.05);
  --shadow-base: 0 4px 8px rgba(26, 24, 19, 0.12);
  --shadow-lg: 0 12px 24px rgba(26, 24, 19, 0.18);
}

[data-theme="dark"] {
  --color-bg-primary: #0f0d0a;
  --color-text-primary: #f5f2eb;
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-base: 0 4px 8px rgba(0, 0, 0, 0.5);
}
```

### 使用规则表

| 场景 | 使用色彩 | 禁止使用 | 说明 |
|------|----------|---------|------|
| 主按钮 CTA | --color-accent-warm | 蓝色（科技风） | 强调品牌温度 |
| 次要按钮 | --color-accent-blue | 灰色（显得被动） | 提供清晰的视觉层级 |
| 输入框边框 | --color-border-primary | 灰色系（过冷）| 维持暖调一致性 |
| 错误提示 | --color-error | 橙色（歧义） | 确保明确的语义 |
| 成功反馈 | --color-success | 浅绿（缺乏饱和度） | 提升可读性 |
| 禁用元素 | --color-bg-quaternary + --color-text-quaternary | 减透明度（导致闪烁） | 减少认知负荷 |
| 链接颜色 | --color-accent-blue | 紫色（易与已访问混淆） | 使用蓝色作为网络标准 |
| 背景纹理 | 主色叠加微妙纹理 (grain 0-2%) | 单一纯色（显得廉价） | 增加视觉深度 |

---

## 2. 字体排版

### 2.1 英文方案 A - 三层字体栈

Anthropic 采用**分层字体策略**，不同用途使用不同字体：

#### 第一层：显示级（Display）- DM Serif Display

**用于**：主标题 (H1-H3)、大型数字、品牌语境  
**特性**：400 字重、正体和斜体、高对比度衬线  
**字号范围**：2.25rem (36px) - 4.5rem (72px)

```css
h1, h2, h3 {
  font-family: 'DM Serif Display', serif;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: -0.02em; /* 显示级适度字间距收紧 */
}
```

**示例用法**：
- H1：页面主标题 `<h1>Unlocking Human Potential</h1>`
- H2：主要章节 `<h2>How It Works</h2>`
- 大数字：统计数据 `<div class="stat-large">28M+</div>`

#### 第二层：正文级（Body）- DM Serif Text

**用于**：段落文本、长篇内容、阅读场景  
**特性**：400 字重、正体和斜体、易读衬线  
**字号范围**：1rem (16px) - 1.25rem (20px)  
**行高**：1.5-1.625 (阅读友好)

```css
p, article, .prose {
  font-family: 'DM Serif Text', serif;
  font-size: 1rem;
  line-height: 1.625;
  letter-spacing: 0;
}
```

**示例用法**：
- 文章段落
- 功能描述
- 长表单标签

#### 第三层：界面级（Interface）- DM Sans

**用于**：按钮、表单、导航、UI 交互  
**特性**：多字重 (300, 400, 500, 700)、仅正体、几何无衬线  
**字号范围**：0.75rem (12px) - 1.125rem (18px)  
**行高**：1.4 (紧凑)

```css
button, input, label, nav, .ui-text {
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.4;
  letter-spacing: 0.02em; /* UI 字间距略宽，提升清晰度 */
}
```

**字重使用表**：

| 字重 | 用途 | 示例 |
|------|------|------|
| 300 Light | 弱化提示、辅助文本 | `<p class="text-light">Optional field</p>` |
| 400 Normal | 常规 UI 文本 | 按钮标签、表单值 |
| 500 Medium | 强调标签、小标题 | `<label>Email Address</label>` |
| 700 Bold | 强调重点、导航激活态 | `<span class="font-bold">Active</span>` |

#### 第四层：代码级（Mono）- JetBrains Mono

**用于**：代码块、命令行、技术示例  
**特性**：400 字重、机械字体、等宽  
**字号**：0.875rem (14px) - 1rem (16px)  
**行高**：1.5

```css
code, pre, .code-block {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-weight: 400;
  font-size: 0.875rem;
  line-height: 1.5;
}
```

---

### 2.2 中文方案 B - 双字体混排

详见 [typography-cn.md](references/typography-cn.md)

**简述**：
- **标题字体**：霞鹜文楷 (LXGW WenKai) - 人文温度，与 DM Serif Display 配对
- **UI 字体**：思源黑体 (Source Han Sans SC) - 清晰无衬线，与 DM Sans 配对
- **中文行高**：1.5-1.7（比英文宽，适应汉字宽度）
- **混排原则**：英文字体优先，通过 `unicode-range` 自动分流

```css
body {
  font-family: 'DM Sans', 'DM Serif Text', 'Source Han Sans SC', 'PingFang SC', sans-serif;
}

h1, h2, h3 {
  font-family: 'DM Serif Display', 'LXGW WenKai', serif;
}
```

---

## 3. 间距与布局

### 3.1 4px 网格系统

所有间距遵循 4px 的基础网格。这个选择源于现代屏幕的像素密度和触摸交互的人体工学：

```
4px × 1 = 4px    (--space-1)
4px × 2 = 8px    (--space-2)
4px × 3 = 12px   (--space-3)
4px × 4 = 16px   (--space-4)   ← 基础间距单位
4px × 6 = 24px   (--space-6)
4px × 8 = 32px   (--space-8)
4px × 10 = 40px  (--space-10)
4px × 12 = 48px  (--space-12)
```

### 3.2 黄金比例分栏

页面布局采用**黄金比例 (1:1.618)** 的栏宽规划，在大屏幕上呈现阅读舒适度：

```css
/* 12 分栏响应式网格 */
.grid-12 {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-4);
}

/* 黄金比例分栏 */
.col-golden-1 { grid-column: span 7; }  /* 约 1.4:1 宽度比 */
.col-golden-2 { grid-column: span 5; }

/* 内容宽度限制 */
.prose-max {
  max-width: 65ch;  /* 约 65 个字符，最优阅读行长 */
  margin: 0 auto;
}
```

### 3.3 触摸目标最小尺寸

所有可交互元素的最小触摸区域为 **44px × 44px** (2.75rem)，确保移动端友好性：

```css
button,
a[role="button"],
input[type="checkbox"],
input[type="radio"] {
  min-width: var(--touch-target);    /* 44px */
  min-height: var(--touch-target);   /* 44px */
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

---

## 4. 核心组件规范

完整的 35 个组件库详见 [components.md](references/components.md)。以下为规范概览：

### 组件分类

| 分类 | 组件数 | 用途 | 说明 |
|------|--------|------|------|
| 基础组件 | 10 | Hero、Feature Grid、Stats、Blockquote、Pricing、CTA、Footer、Code、Toast、Skeleton | 页面结构级、内容展示 |
| 导航与结构 | 5 | Sidebar、Tabs、Breadcrumb、Pagination、Dropdown | 信息架构、页面导航 |
| 表单与交互 | 5 | Form、Toggle/Switch、Tooltip、Modal、Accordion | 用户输入、交互反馈 |
| 内容展示 | 5 | Table、Timeline、Empty State、Banner/Alert、Step Indicator | 数据呈现、流程表达 |
| 高频补充 | 10 | Avatar、Progress Bar、Search、Command Palette、Drawer、Chip/Tag、Popover、Carousel、Context Menu、FAB | 增强功能、微交互 |

### 组件设计约束

**颜色**：所有组件必须使用 CSS Token（`var(--color-*)`），禁止硬编码十六进制值。

**可访问性**：
- 所有交互组件必须包含 ARIA 属性（`role`、`aria-label`、`aria-describedby`）
- 弹窗类组件（Modal、Drawer、Command Palette）必须实现 Focus Trap
- 按钮必须包含 `:focus-visible` 焦点环
- 最小对比度 4.5:1 (AAA 级别)

**动画**：
- 所有动画仅使用 `transform` 和 `opacity`（性能优先）
- 动画时长不超过 500ms
- 提供 `prefers-reduced-motion: reduce` 媒体查询支持

---

## 5. 动效与交互

### 5.1 过渡规范 (Easing & Duration)

```css
/* 三档动画速度 */
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);     /* 快速反馈 */
--transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);     /* 标准过渡 */
--transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);     /* 柔和动画 */
```

**应用规则**：

| 交互类型 | 使用速度 | 示例 |
|---------|---------|------|
| 鼠标 Hover 状态变化 | Fast (150ms) | 按钮颜色变化、链接下划线 |
| 页面转场、弹窗弹出 | Base (250ms) | Modal 入场、页面淡入 |
| 连续滚动动画、Stagger | Slow (350ms) | 组件依次进入、Parallax |

**缓动曲线解析**：
- `cubic-bezier(0.4, 0, 0.2, 1)` 称为 Material Design 的标准缓动
- 0-50% 快速加速，50-100% 缓慢减速，呈现"自然"的物理运动感
- **禁止使用** `ease-in-out`（显得不自然）、`linear`（机械感）

### 5.2 Stagger Reveal 模式

当多个元素顺序出现时，使用阶梯型延迟营造节奏感：

```css
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stagger-item {
  animation: fadeUp var(--animation-duration-base) ease-out forwards;
}

.stagger-item:nth-child(1) { animation-delay: 0ms; }
.stagger-item:nth-child(2) { animation-delay: 100ms; }
.stagger-item:nth-child(3) { animation-delay: 200ms; }
/* 后续每个延迟 100ms */
```

### 5.3 微交互设计

**按钮按下反馈**：
```css
button {
  transition: transform var(--transition-fast),
              box-shadow var(--transition-fast);
}

button:active {
  transform: scale(0.98);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}
```

**输入框焦点**：
```css
input:focus {
  border-color: var(--color-accent-warm);
  box-shadow: 0 0 0 3px rgba(217, 118, 73, 0.1);
  transition: border-color var(--transition-fast),
              box-shadow var(--transition-fast);
}
```

---

## 6. 背景与视觉深度

### 6.1 米色纹理策略

纯色背景过于单调。Anthropic 采用微妙纹理营造深度：

```css
.bg-textured {
  background-color: var(--color-bg-primary);
  background-image: 
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 35px,
      rgba(26, 24, 19, 0.02) 35px,
      rgba(26, 24, 19, 0.02) 70px
    );
}
```

**纹理应用位置**：
- 页面全局背景：grain 密度 0.5-2%
- 卡片背景：grain 密度 0-1%（极其微妙）
- 禁用元素：grain 密度 2-3%（标记失效状态）

### 6.2 径向渐变（Radial Gradient）

用于渐进的视觉焦点引导，适用于英雄区块：

```css
.hero-gradient {
  background: 
    radial-gradient(
      circle at 30% 50%,
      rgba(217, 118, 73, 0.08) 0%,
      transparent 60%
    ),
    linear-gradient(
      135deg,
      var(--color-bg-primary) 0%,
      var(--color-bg-secondary) 100%
    );
}
```

**禁止用法**：
- ❌ 彩虹渐变、高饱和度渐变（违背克制原则）
- ❌ 多重叠加渐变（导致视觉混乱）

### 6.3 深浅区块节奏

页面通过色深的有序变化创建视觉节奏：

```
主区块   → 色值 --color-bg-primary (#faf8f3)
┌────────┐
│内容卡片 │ → 色值 --color-surface-primary (#ffffff)
├────────┤
│背景区块 │ → 色值 --color-bg-secondary (#f5f2eb)
└────────┘
强调区块 → 色值 --color-accent-warm (#d97649)
```

**节奏规则**：任何三个相邻区块的色值应形成"冷-暖-冷"或"浅-深-浅"的对比。

---

## 7. 可访问性规范

### 7.1 对比度标准

遵循 WCAG 2.1 AAA 级别，所有文本与背景的对比度至少 **7:1**：

```
文本             背景              对比度    级别
#1a1813 (文本主) #faf8f3 (背景主) 14.2:1   AAA ✓
#6b6459 (文本三) #faf8f3 (背景主)  4.8:1   AA
#9a9087 (文本四) #faf8f3 (背景主)  2.1:1   ✗ 禁止用于正文
```

### 7.2 焦点环规范

所有可交互元素必须提供清晰的焦点指示器：

```css
:focus-visible {
  outline: 2px solid var(--color-accent-warm);
  outline-offset: 2px;
}

/* 特例：Modal 内焦点环应闭合 */
.modal:focus-visible {
  outline-offset: -2px;
}
```

### 7.3 减少动画媒体查询

尊重用户的系统偏好：

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 8. 反模式清单

设计系统中的 **10 条禁止行为** 及其原因：

| # | 反模式 | 禁止原因 | 替代方案 |
|---|--------|---------|---------|
| 1 | 使用硬编码 HEX 颜色值 | 违背 Token 设计，导致维护困难 | 使用 `var(--color-*)` |
| 2 | 灰色背景 | 偏冷蓝，破坏暖调一致性 | 使用米色系 `#f5f2eb` |
| 3 | 彩虹或高饱和度渐变 | 显得廉价、分散注意力 | 使用单色或微妙径向渐变 |
| 4 | 动画时长超过 500ms | 显得卡顿，降低响应感 | 控制在 150-350ms |
| 5 | 仅使用 `opacity` 的动画 | 不流畅、不满足性能要求 | 组合 `transform` 与 `opacity` |
| 6 | 省略 ARIA 属性 | 无障碍失效，影响屏幕阅读器 | 为所有交互组件添加 `role` 和 `aria-*` |
| 7 | 弹窗无焦点陷阱 | 用户可能 Tab 到弹窗外 | 实现 Focus Trap 机制 |
| 8 | 按钮无 44px 最小尺寸 | 触摸交互不友好 | 使用 `min-height: var(--touch-target)` |
| 9 | 蓝色作为主操作按钮 | 冷色调削弱品牌温度 | 使用橙色 `#d97649` 作为 CTA |
| 10 | 中文与英文行高相同 | 汉字显得拥挤 | 中文行高 1.5-1.7，英文 1.4-1.6 |

---

## 9. 系统性规范索引

10 条系统性规范涵盖跨组件的高级设计策略，详见 [systems.md](references/systems.md)：

1. **Z-index 分层管理体系** - 全局堆叠顺序定义，禁止硬编码
2. **响应式断点 & 移动端规范** - Mobile First 设计、44px 触摸区域
3. **暗色模式切换完整方案** - `data-theme` 属性、localStorage 持久化
4. **CSS 动画性能规范** - 仅 transform/opacity、will-change 使用边界
5. **焦点陷阱 Focus Trap** - Modal/Drawer/CommandPalette 无依赖实现
6. **SVG 图标系统** - currentColor 继承、unicode-range 规范
7. **字体加载策略** - preload、font-display: swap、防闪白
8. **滚动行为规范** - 背景锁定无跳动、overscroll-behavior、虚拟滚动
9. **表单验证完整模式** - blur 触发、input 清除、submit 全量验证
10. **图片优化规范** - WebP 优先、srcset、LCP 禁用 lazy、alt 规范

---

## 10. Logo 绘制索引

完整 Logo 设计指南详见 [logo.md](references/logo.md)，涵盖：

- **构成原则** - 网格、黄金比例、有机圆角
- **SVG 路径绘制** - 路径命令速查、Bezier 曲线手册
- **品牌色用法** - 4 种配色方案（彩色、反色、单色、图标）
- **4 个必备变体** - 完整 Logo、图标、单色、反色
- **最小尺寸** - 512px 及以上，安全间距规则
- **Favicon 多尺寸方案** - 16px、32px、64px、180px、192px，含 SVG 暗色模式

---

## 11. 简体中文排版索引

详见 [typography-cn.md](references/typography-cn.md)

中文排版与英文存在根本差异，涵盖内容包括：

- **字体选型理由** - 霞鹜文楷（人文温度）+ 思源黑体（UI 清晰）
- **三种引入方式** - CDN / 子集化离线 / 纯系统字体
- **CSS Token 覆盖** - `--font-*-cn` 变量、中文行高 `--leading-cn-*`
- **混排字体栈写法** - 英文字体优先，利用 `unicode-range` 自动分流
- **中文排版细节** - 标点压缩、换行规则、字重搭配、字号与行高表
- **各平台系统字体兜底链** - Android、iOS、Windows、macOS

---

## 文件结构说明

```
anthropic-style-cn/
├── SKILL.md                          ← 本文档（主规范）
├── assets/fonts/
│   ├── fonts.css                     ← @font-face 声明
│   ├── dm-serif-display-400.woff2
│   ├── dm-serif-display-400-italic.woff2
│   ├── dm-serif-text-400.woff2
│   ├── dm-serif-text-400-italic.woff2
│   ├── dm-sans-300.woff2
│   ├── dm-sans-400.woff2
│   ├── dm-sans-500.woff2
│   ├── dm-sans-700.woff2
│   └── jetbrains-mono-400.woff2
└── references/
    ├── base.css                      ← CSS Token + Reset
    ├── components.md                 ← 35 个组件 HTML+CSS+JS
    ├── systems.md                    ← 10 条系统性规范
    ├── logo.md                       ← Logo 绘制指南
    └── typography-cn.md              ← 中文排版规范
```

---

## 快速开始

### 1. 导入字体和基础样式

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <link rel="stylesheet" href="assets/fonts/fonts.css">
  <link rel="stylesheet" href="references/base.css">
</head>
<body>
  <h1>Anthropic Design System</h1>
</body>
</html>
```

### 2. 深色模式切换

```html
<html data-theme="light">
  <!-- 切换为深色模式 -->
  <script>
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  </script>
</html>
```

### 3. 使用组件

从 [components.md](references/components.md) 复制所需组件的完整 HTML + CSS。每个组件都是独立的，可直接集成。

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2026-03-17 | 初始版本发布，包含 35 个组件、10 条系统规范、完整文档 |

---

## 许可证

本设计系统遵循 Creative Commons Attribution 4.0 International (CC BY 4.0)。

---

**维护团队**：Monica AI Design System  
**最后更新**：2026-03-17  
**联系方式**：design@anthropic.style
