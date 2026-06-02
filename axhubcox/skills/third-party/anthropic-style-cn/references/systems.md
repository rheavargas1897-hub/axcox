# 系统性规范指南

**版本**：1.0.0  
**涵盖范围**：跨组件的高级设计策略和实现规范  
**最后更新**：2026-03-17

---

## 1. Z-Index 分层管理体系

### 问题根源

自由使用 z-index（如 `z-index: 9999`）导致组件堆叠顺序混乱、难以调试，特别是在弹窗、下拉菜单、提示框共存时产生冲突。

### 完整解决方案

**步骤 1：在 base.css 中定义全局 Z-index Token**

```css
:root {
  --z-hide: -1;
  --z-auto: auto;
  --z-base: 0;
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
}
```

**步骤 2：在组件中严格使用 Token**

```css
/* ✓ 正确 */
.dropdown-menu {
  z-index: var(--z-dropdown);
}

.modal {
  z-index: var(--z-modal);
}

.modal-backdrop {
  z-index: var(--z-modal-backdrop);
}

/* ✗ 禁止 */
.dropdown-menu {
  z-index: 1001; /* 硬编码 */
}
```

**步骤 3：分层逻辑**

| Z-Index | 用途 | 场景 |
|---------|------|------|
| -1 | 隐藏 | 不可见元素 |
| 0 | 基础 | 普通内容流 |
| 1000 | 下拉菜单 | Dropdown、Select 菜单 |
| 1020 | 粘性定位 | Sticky 导航、浮动元素 |
| 1030 | 固定定位 | Fixed 导航栏 |
| 1040 | 模态背景 | Modal/Dialog 的半透明背景 |
| 1050 | 模态内容 | Modal/Dialog 本体 |
| 1060 | 浮层 | Popover、Tooltip（高于 Modal） |
| 1070 | 顶级提示 | Toast 通知、Alert（最高层） |

### 维护建议

在项目根目录维护 `Z-INDEX-MAP.md` 文档，记录所有堆叠场景：

```markdown
# Z-Index 堆叠地图

## 场景 1：页面 + Dropdown
页面内容（z: 0）
└─ Dropdown（z: 1000）

## 场景 2：Modal + Popover
Modal 背景（z: 1040）
└─ Modal 内容（z: 1050）
   └─ Popover（z: 1060）

## 场景 3：固定导航 + Toast
导航栏（z: 1030）
└─ Toast（z: 1070）
```

---

## 2. 响应式断点 & 移动端规范

### 问题根源

不一致的断点定义导致组件在不同屏幕宽度下表现不可控；未考虑 44px 最小触摸区域导致移动端用户体验糟糕。

### Mobile First 设计方法

**步骤 1：定义全局断点**

```css
/* CSS Variables */
:root {
  --breakpoint-xs: 0;       /* 手机 */
  --breakpoint-sm: 640px;   /* 平板竖屏 */
  --breakpoint-md: 768px;   /* 平板横屏 */
  --breakpoint-lg: 1024px;  /* 桌面 */
  --breakpoint-xl: 1280px;  /* 大屏 */
  --breakpoint-2xl: 1536px; /* 超大屏 */
}
```

**步骤 2：Mobile First 代码模式**

```css
/* 移动端优先（不需要媒体查询） */
.hero {
  font-size: var(--text-2xl);
  padding: var(--space-4);
}

/* 然后向上扩展 */
@media (min-width: 640px) {
  .hero {
    padding: var(--space-6);
  }
}

@media (min-width: 768px) {
  .hero {
    font-size: var(--text-4xl);
    padding: var(--space-8);
  }
}

@media (min-width: 1024px) {
  .hero {
    font-size: var(--text-5xl);
    padding: var(--space-12);
  }
}
```

**步骤 3：44px 触摸区域保证**

```css
/* 所有交互元素最小尺寸 44px × 44px */
button,
a[role="button"],
input[type="checkbox"],
input[type="radio"],
.clickable {
  min-width: var(--touch-target);  /* 44px */
  min-height: var(--touch-target);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 触摸目标间距最小 8px */
.touch-spacing {
  gap: var(--space-2); /* 8px */
}
```

### 响应式栅格系统

```css
/* 流体网格 */
.grid {
  display: grid;
  gap: var(--space-4);
}

.grid-2 {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.grid-3 {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.grid-4 {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

/* 无须手动添加断点，auto-fit 自动处理 */
```

---

## 3. 暗色模式切换完整方案

### 问题根源

简单的 `prefers-color-scheme` 无法满足用户显式切换的需求；未防止 FOUC（Flash Of Unstyled Content），导致页面加载时闪白。

### 完整实现方案

**步骤 1：HTML 属性标记**

```html
<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
  <meta name="color-scheme" content="light dark">
  <style>
    /* 防止 FOUC：在 DOM 解析前立即切换主题 */
    html {
      color-scheme: light;
    }
    html[data-theme="dark"] {
      color-scheme: dark;
    }
  </style>
</head>
<body>
  <button id="theme-toggle">🌙</button>
</body>
</html>
```

**步骤 2：CSS Token 定义**

```css
:root {
  /* 亮色模式（默认） */
  --color-bg-primary: #faf8f3;
  --color-text-primary: #1a1813;
  --color-accent-warm: #d97649;
}

[data-theme="dark"] {
  /* 深色模式 */
  --color-bg-primary: #0f0d0a;
  --color-text-primary: #f5f2eb;
  --color-accent-warm: #e8937d; /* 浅化以适应深色背景 */
}
```

**步骤 3：JavaScript 切换逻辑**

```javascript
// 初始化主题
function initTheme() {
  // 优先级：localStorage > 系统偏好 > 默认亮色
  const saved = localStorage.getItem('theme');
  const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const theme = saved || preferred || 'light';
  
  document.documentElement.setAttribute('data-theme', theme);
}

// 在 DOM 加载前执行，防止 FOUC
initTheme();

// 主题切换按钮
document.getElementById('theme-toggle')?.addEventListener('click', () => {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  
  // 更新 DOM
  html.setAttribute('data-theme', next);
  
  // 持久化
  localStorage.setItem('theme', next);
  
  // 触发自定义事件供其他脚本订阅
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }));
});

// 监听系统主题变化
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  const saved = localStorage.getItem('theme');
  if (!saved) {
    // 仅当用户未手动设置时，跟随系统
    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
  }
});
```

**步骤 4：防 FOUC 脚本（放在 `<head>` 最前面）**

```html
<head>
  <script>
    // 在 CSS 加载前立即执行，避免颜色闪烁
    (function() {
      const saved = localStorage.getItem('theme');
      const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = saved || (preferred ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.style.colorScheme = theme;
    })();
  </script>
</head>
```

---

## 4. CSS 动画性能规范

### 问题根源

使用 `left`、`top`、`width`、`height` 等属性触发布局重排（Layout）和重绘（Paint），导致帧率下降、动画卡顿。

### 性能最佳实践

**只使用 Transform 和 Opacity**

```css
/* ✓ 高性能：仅触发 Composite（合成）层 */
.efficient {
  animation: slideIn 300ms ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px); /* 使用 transform */
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ✗ 低性能：触发 Layout + Paint */
.inefficient {
  animation: oldSlide 300ms ease-out;
}

@keyframes oldSlide {
  from {
    left: -20px;  /* 触发 Layout */
    opacity: 0;
  }
  to {
    left: 0;      /* 触发 Layout */
    opacity: 1;
  }
}
```

**Will-change 使用边界**

```css
/* ✓ 用于即将执行动画的元素 */
.will-animate:hover {
  will-change: transform, opacity;
  transition: transform 300ms ease-out;
}

.will-animate:not(:hover) {
  will-change: auto; /* 动画完成后移除 */
}

/* ✗ 过度使用 will-change 反而降低性能 */
* {
  will-change: all; /* 禁止！ */
}
```

**缓动函数选择**

```css
/* 推荐缓动：Material Design Standard Easing */
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);

/* 禁止高损耗缓动 */
/* ✗ ease-in-out：显得不自然 */
/* ✗ steps()：除非需要逐帧效果 */
```

---

## 5. 焦点陷阱 Focus Trap

### 问题根源

Modal、Drawer、CommandPalette 等弹窗组件中，用户按 Tab 键可能 Tab 到弹窗外的内容，破坏无障碍体验。

### 无依赖实现

**步骤 1：识别可焦点元素**

```javascript
function getFocusableElements(container) {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');
  
  return Array.from(container.querySelectorAll(selector));
}
```

**步骤 2：在 Modal 打开时启用 Focus Trap**

```javascript
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  const focusableElements = getFocusableElements(modal);
  
  if (focusableElements.length === 0) {
    console.warn('Modal has no focusable elements');
    return;
  }
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  // 聚焦第一个元素
  firstElement.focus();
  
  // 捕获 Tab 键
  const handleTabKey = (e) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      // Shift + Tab：向上循环
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      // Tab：向下循环
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };
  
  modal.addEventListener('keydown', handleTabKey);
  modal._focusTrapHandler = handleTabKey; // 保存引用以便清理
  
  // 禁止背景滚动
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  
  // 移除事件监听
  if (modal._focusTrapHandler) {
    modal.removeEventListener('keydown', modal._focusTrapHandler);
    delete modal._focusTrapHandler;
  }
  
  // 恢复滚动
  document.body.style.overflow = '';
  
  // 返回焦点到触发按钮
  const triggerButton = document.activeElement; // 保存之前的焦点
  modal.hidden = true;
  triggerButton?.focus();
}
```

**步骤 3：ESC 键关闭**

```javascript
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const openModal = document.querySelector('[role="dialog"]:not([hidden])');
    if (openModal) {
      closeModal(openModal.id);
    }
  }
});
```

---

## 6. SVG 图标系统

### 问题根源

SVG 图标颜色硬编码（如 `fill="#d97649"`）导致换肤困难；未规范 unicode-range 导致字体混乱。

### 完整规范

**步骤 1：使用 currentColor 继承**

```html
<!-- ✓ 推荐 -->
<svg width="24" height="24" viewBox="0 0 24 24">
  <path d="M12 2L22 8V16C22 20.5 12 22 12 22S2 20.5 2 16V8Z" fill="currentColor"/>
</svg>

<!-- ✗ 硬编码 -->
<svg width="24" height="24" viewBox="0 0 24 24">
  <path d="M12 2L22 8V16C22 20.5 12 22 12 22S2 20.5 2 16V8Z" fill="#d97649"/>
</svg>
```

**步骤 2：CSS 控制颜色**

```css
.icon {
  color: var(--color-text-primary);
}

.icon-accent {
  color: var(--color-accent-warm);
}

button:hover .icon {
  color: var(--color-accent-warm);
  transition: color var(--transition-fast);
}
```

**步骤 3：ARIA 和可访问性**

```html
<!-- 装饰性图标：隐藏 -->
<button>
  <svg aria-hidden="true" focusable="false">...</svg>
  Edit
</button>

<!-- 独立图标按钮：提供标签 -->
<button aria-label="Edit document">
  <svg aria-hidden="true" focusable="false">...</svg>
</button>

<!-- 复杂图标：使用 <title> -->
<svg role="img" aria-label="CPU">
  <title>Processor Core</title>
  <circle cx="12" cy="12" r="10"/>
</svg>
```

**步骤 4：字体 @font-face 中的 unicode-range**

```css
@font-face {
  font-family: 'CustomIcon';
  src: url('icons.woff2') format('woff2');
  unicode-range: U+E001-E999; /* 只覆盖自定义范围，避免污染正文字体 */
}

.icon-custom {
  font-family: 'CustomIcon';
}
```

---

## 7. 字体加载策略

### 问题根源

字体阻塞渲染导致白屏时间过长；未使用 font-display 导致 FOIT（Flash Of Invisible Text）；无预加载导致字体加载延迟。

### 完整方案

**步骤 1：预加载关键字体**

```html
<head>
  <!-- 预加载英文显示字体 -->
  <link rel="preload" 
        href="/fonts/dm-serif-display-400.woff2" 
        as="font" 
        type="font/woff2" 
        crossorigin>
  
  <!-- 预加载英文 UI 字体 -->
  <link rel="preload" 
        href="/fonts/dm-sans-400.woff2" 
        as="font" 
        type="font/woff2" 
        crossorigin>
</head>
```

**步骤 2：font-display 策略**

```css
@font-face {
  font-family: 'DM Serif Display';
  src: url('dm-serif-display-400.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  
  /* 显示字体：swap（等待最多 3s，超时则使用备用） */
  font-display: swap;
}

@font-face {
  font-family: 'DM Sans';
  src: url('dm-sans-400.woff2') format('woff2');
  font-weight: 400;
  
  /* UI 字体：auto（浏览器默认） */
  font-display: auto;
}

@font-face {
  font-family: 'Source Han Sans SC';
  src: url('https://cdn.jsdelivr.net/gh/source-foundry/source-han-sans@latest/SubsetOTF/SC/SourceHanSansSC-Regular.otf') format('opentype');
  
  /* 中文字体体积大：block（等待最多 3s，超时则隐藏） */
  font-display: block;
}
```

**font-display 策略对比**：

| 属性 | 未加载时 | 加载中 | 加载完成 | 用途 |
|------|---------|--------|---------|------|
| auto | 浏览器默认 | 隐藏 | 显示 | 普通场景 |
| block | 隐藏 | 隐藏 | 显示 | 中文字体（体积大） |
| swap | 备用字体 | 备用字体 | 自定义字体 | 快速加载，关键字体 |
| fallback | 备用字体 | 备用字体 | 自定义字体（短缓存） | 非关键字体 |
| optional | 备用字体 | 备用字体 | 自定义字体（完全可选） | 可有可无的字体 |

---

## 8. 滚动行为规范

### 问题根源

打开弹窗时背景滚动导致布局抖动；未处理 overscroll-behavior 导致系统手势冲突；超大列表性能低下。

### 完整解决方案

**步骤 1：背景锁定无跳动**

```css
/* 防止滚动条宽度变化导致的抖动 */
html {
  scrollbar-gutter: stable;
}

/* 打开弹窗时 */
body.modal-open {
  overflow: hidden;
  padding-right: var(--scrollbar-width, 0);
}
```

```javascript
function lockScroll() {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.paddingRight = `${scrollbarWidth}px`;
  document.body.classList.add('modal-open');
}

function unlockScroll() {
  document.body.style.paddingRight = '';
  document.body.classList.remove('modal-open');
}
```

**步骤 2：overscroll-behavior 规范**

```css
/* 容器滚动到底时，不传播滚动事件到父元素 */
.modal-content {
  overflow-y: auto;
  overscroll-behavior: contain;
}

/* 下拉刷新场景：允许系统行为 */
.pull-refresh {
  overscroll-behavior-y: auto;
}
```

**步骤 3：虚拟滚动（大列表优化）**

```javascript
class VirtualScroller {
  constructor(container, itemHeight, totalItems, renderItem) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.totalItems = totalItems;
    this.renderItem = renderItem;
    this.visibleStart = 0;
    
    this.container.addEventListener('scroll', () => this.onScroll());
    this.render();
  }
  
  onScroll() {
    const scrollTop = this.container.scrollTop;
    const visibleStart = Math.floor(scrollTop / this.itemHeight);
    
    if (visibleStart !== this.visibleStart) {
      this.visibleStart = visibleStart;
      this.render();
    }
  }
  
  render() {
    const visibleCount = Math.ceil(this.container.clientHeight / this.itemHeight) + 1;
    const visibleEnd = this.visibleStart + visibleCount;
    
    const html = Array.from({ length: visibleCount }, (_, i) => {
      const itemIndex = this.visibleStart + i;
      if (itemIndex < this.totalItems) {
        return this.renderItem(itemIndex);
      }
      return '';
    }).join('');
    
    this.container.innerHTML = html;
    this.container.style.transform = `translateY(${this.visibleStart * this.itemHeight}px)`;
  }
}

// 使用
new VirtualScroller(
  document.getElementById('list'),
  50, // 每项高度
  10000, // 总项数
  (index) => `<div class="item">Item ${index}</div>`
);
```

---

## 9. 表单验证完整模式

### 问题根源

验证时机不当导致过度提示；未聚焦首个错误导致用户体验差；未清空旧错误导致验证逻辑混乱。

### 完整实现

**步骤 1：Blur 触发验证**

```javascript
const form = document.getElementById('myForm');

form.querySelectorAll('input, textarea, select').forEach(field => {
  field.addEventListener('blur', () => {
    validateField(field);
  });
});

function validateField(field) {
  const error = document.getElementById(`${field.id}-error`);
  
  // 清空旧错误
  if (error) error.textContent = '';
  
  let message = '';
  
  if (field.type === 'email' && field.value && !isValidEmail(field.value)) {
    message = 'Invalid email format';
  } else if (field.required && !field.value.trim()) {
    message = `${field.name || field.id} is required`;
  }
  
  if (message) {
    field.classList.add('error');
    field.setAttribute('aria-invalid', 'true');
    if (error) error.textContent = message;
  } else {
    field.classList.remove('error');
    field.setAttribute('aria-invalid', 'false');
  }
}
```

**步骤 2：Input 事件清除错误**

```javascript
form.querySelectorAll('input, textarea').forEach(field => {
  field.addEventListener('input', () => {
    // 用户开始输入，移除错误状态
    field.classList.remove('error');
    field.setAttribute('aria-invalid', 'false');
    const error = document.getElementById(`${field.id}-error`);
    if (error) error.textContent = '';
  });
});
```

**步骤 3：Submit 全量验证**

```javascript
form.addEventListener('submit', (e) => {
  e.preventDefault();
  
  let isValid = true;
  let firstErrorField = null;
  
  // 清空所有旧错误
  form.querySelectorAll('.form-error').forEach(el => el.textContent = '');
  
  // 验证所有字段
  form.querySelectorAll('[required], [type="email"]').forEach(field => {
    validateField(field);
    
    if (field.getAttribute('aria-invalid') === 'true') {
      isValid = false;
      if (!firstErrorField) firstErrorField = field;
    }
  });
  
  if (!isValid) {
    // 聚焦第一个错误字段
    firstErrorField?.focus();
    showToast({ 
      title: 'Validation Error', 
      message: 'Please fix the errors above',
      type: 'error' 
    });
    return;
  }
  
  // 提交表单
  submitForm(new FormData(form));
});

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

**步骤 4：CSS 样式**

```css
input.error,
textarea.error {
  border-color: var(--color-error);
  background-color: rgba(194, 63, 63, 0.02);
}

input.error:focus {
  box-shadow: 0 0 0 3px rgba(194, 63, 63, 0.1);
}

.form-error {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--text-xs);
  color: var(--color-error);
  min-height: 18px; /* 防止文本抖动 */
}
```

---

## 10. 图片优化规范

### 问题根源

JPEG/PNG 文件过大导致加载缓慢；未使用 srcset 导致高分屏显示模糊；LCP 元素使用 lazy loading 导致首屏延迟；缺失 alt 属性影响无障碍和 SEO。

### 完整方案

**步骤 1：WebP 优先 + 备用方案**

```html
<!-- ✓ WebP 优先，兼容 JPG 备用 -->
<picture>
  <source 
    srcset="
      /images/hero-480w.webp 480w,
      /images/hero-1024w.webp 1024w,
      /images/hero-2048w.webp 2048w
    " 
    type="image/webp"
  >
  <source 
    srcset="
      /images/hero-480w.jpg 480w,
      /images/hero-1024w.jpg 1024w,
      /images/hero-2048w.jpg 2048w
    " 
    type="image/jpeg"
  >
  <img 
    src="/images/hero-1024w.jpg"
    alt="Hero banner showing AI collaboration"
    width="1024"
    height="680"
    loading="eager"
  >
</picture>

<!-- ✗ 禁止单一格式 -->
<img src="/images/hero.png" alt="">
```

**步骤 2：Srcset + Sizes 响应式**

```html
<img
  srcset="
    /images/avatar-100.jpg 100w,
    /images/avatar-200.jpg 200w,
    /images/avatar-400.jpg 400w
  "
  sizes="
    (max-width: 480px) 100px,
    (max-width: 1024px) 150px,
    200px
  "
  src="/images/avatar-200.jpg"
  alt="User avatar"
  width="200"
  height="200"
>
```

**步骤 3：LCP 禁用 Lazy Loading**

```html
<!-- LCP 元素（首屏文章图片）：禁用 lazy -->
<img
  src="/images/article-hero.jpg"
  alt="Article header"
  loading="eager"
  fetchpriority="high"
  width="1200"
  height="600"
>

<!-- 非 LCP 元素：启用 lazy -->
<img
  src="/images/article-content-1.jpg"
  alt="Content illustration"
  loading="lazy"
  width="800"
  height="400"
>
```

**步骤 4：Alt 属性规范**

```html
<!-- ✓ 描述性 alt -->
<img 
  src="dashboard.png" 
  alt="Analytics dashboard showing Q3 revenue metrics with bar chart and trend analysis"
  width="1200"
  height="800"
>

<!-- ✗ 禁止无意义 alt -->
<img src="dashboard.png" alt="dashboard">
<img src="image.png" alt="image">

<!-- 装饰性图片 -->
<img src="decoration.svg" alt="" aria-hidden="true">

<!-- 链接中的图片 -->
<a href="/products">
  <img src="product.jpg" alt="Premium Subscription Plan - Click to learn more">
</a>
```

**步骤 5：性能检查清单**

```html
<!-- 添加 width/height 防止布局抖动 -->
<img 
  src="image.jpg" 
  alt="..."
  width="800"
  height="600"
  style="aspect-ratio: 800/600"
>

<!-- 使用 CSS 限制尺寸 -->
<style>
  img {
    display: block;
    max-width: 100%;
    height: auto;
    object-fit: cover;
  }
</style>
```

---

## 系统规范应用检查表

使用以下检查表确保所有规范被正确应用：

| 规范 | 检查点 | ✓ |
|------|--------|---|
| Z-Index | 所有 z-index 使用 Token | [ ] |
| 响应式 | Mobile First，44px 触摸区 | [ ] |
| 暗色模式 | 支持切换，防 FOUC | [ ] |
| 动画 | 仅 transform/opacity，<500ms | [ ] |
| 焦点陷阱 | Modal/Drawer 实现 Focus Trap | [ ] |
| SVG | 使用 currentColor，有 aria-label | [ ] |
| 字体 | 预加载关键字体，font-display: swap | [ ] |
| 滚动 | scrollbar-gutter: stable | [ ] |
| 表单 | Blur 验证，Submit 全量检查 | [ ] |
| 图片 | WebP 优先，srcset，alt 规范 | [ ] |

---

**版本**：1.0.0 | **最后更新**：2026-03-17
