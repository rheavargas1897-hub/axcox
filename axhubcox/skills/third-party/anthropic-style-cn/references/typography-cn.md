# 简体中文排版规范

**版本**：1.0.0  
**应用范围**：所有简体中文内容（标题、正文、UI 标签）  
**最后更新**：2026-03-17

---

## 1. 问题根源

### Latin 字体回退系统字体的割裂

将英文字体作为整个网页的主字体会导致严重问题：

**问题示例**：

```
错误做法：
body { font-family: 'DM Sans', sans-serif; }

渲染结果：
"Hello World" → 用 DM Sans 清晰显示
"你好世界" → 回退到宋体，割裂感强

正确做法：
body { font-family: 'DM Sans', 'Source Han Sans SC', sans-serif; }

渲染结果：
"Hello World" → DM Sans
"你好世界" → Source Han Sans SC（专为中文优化）
```

### 为什么不能用英文字体显示中文

- **字间距**：中文字符宽度均等，英文字体的字间距设置会显得拥挤
- **笔画粗细**：英文字体的笔画优化针对拉丁字母，无法适应汉字复杂笔画
- **行高**：英文行高 1.4-1.5 对中文显得拥挤，需要 1.5-1.7
- **对齐**：英文字体的基线对中文无效，导致对齐混乱

---

## 2. 字体选型

### 推荐方案：霞鹜文楷 + 思源黑体

#### 2.1 显示字体：霞鹜文楷 (LXGW WenKai)

**特性**：
- 开源免费，完全覆盖 GB2312 + 常用字
- 人文气息强，笔画流畅，具有书法感
- 400 字重，支持 Regular 和 Bold
- 与 DM Serif Display 风格高度匹配

**用途**：
- 页面标题 (H1-H3)
- 品牌口号
- 强调文本

**CDN 来源**：
```
https://cdn.jsdelivr.net/npm/lxgw-wenkai@1.6.2/style.css
https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.6.2/style.css
```

#### 2.2 UI 字体：思源黑体 (Source Han Sans SC)

**特性**：
- Adobe × Google 联合发布，专为中文优化
- 9 种字重 (Thin ~ Black)，满足全部 UI 需求
- 几何无衬线，清晰高效，屏幕显示最优
- 与 DM Sans 风格完全匹配

**推荐字重**：
- 300 Light：弱化文本
- 400 Normal：常规 UI 元素
- 500 Medium：标签、小标题
- 700 Bold：强调、激活态

**CDN 来源**：
```
https://cdn.jsdelivr.net/npm/source-han-sans-sc@4.008R/index.css
https://fonts.google.com/?query=source+han+sans (官方)
```

### 备选方案对比

| 字体 | 笔画 | 屏幕显示 | 打印效果 | 文件大小 | 推荐场景 |
|------|------|---------|---------|---------|----------|
| 霞鹜文楷 | 流畅书法 | ★★★★☆ | ★★★★★ | 2-3MB | 标题、品牌 |
| 思源黑体 | 几何清晰 | ★★★★★ | ★★★☆☆ | 5-8MB | UI、正文 |
| 方正仓耳 | 现代艺术 | ★★★☆☆ | ★★★☆☆ | 3-4MB | 艺术表达 |
| 得意黑 | 几何粗粗 | ★★★★☆ | ★★★☆☆ | 1-2MB | 标题突强 |
| 系统字体 | 平台默认 | ★★★☆☆ | ★★☆☆☆ | 0MB | 性能优先 |

---

## 3. 三种引入方式

### 方案 A：CDN 引入（推荐）

**优点**：无需本地文件，自动更新，浏览器缓存  
**缺点**：依赖网络，首次加载稍慢

```html
<!DOCTYPE html>
<html>
<head>
  <!-- 引入英文字体 -->
  <link rel="preload" href="/fonts/dm-sans-400.woff2" as="font" type="font/woff2" crossorigin>
  
  <!-- 引入中文字体 -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lxgw-wenkai@1.6.2/style.css">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Han+Sans+SC:wght@300;400;500;700&display=swap">
</head>
<body>
  <h1>你好，Anthropic</h1>
</body>
</html>
```

### 方案 B：子集化离线

**优点**：完全离线，加载速度快，可控制文件大小  
**缺点**：需要预处理，维护成本高

```bash
# 使用 fonttools 子集化
pip install fonttools brotli

# 提取常用中文字符（GB2312 范围）
pyftsubset SourceHanSansSC-Regular.otf \
  --output-file="SourceHanSansSC-Subset.woff2" \
  --format="woff2" \
  --unicodes-file="chinese-charset.txt"
```

```css
@font-face {
  font-family: 'Source Han Sans SC Subset';
  src: url('/fonts/SourceHanSansSC-Subset.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
  unicode-range: U+4E00-9FFF; /* 仅 CJK 统一表意文字 */
}

body {
  font-family: 'DM Sans', 'Source Han Sans SC Subset', sans-serif;
}
```

### 方案 C：纯系统字体（最快）

**优点**：零加载时间，完全本地，最佳性能  
**缺点**：不同平台显示差异大，难以统一品牌形象

```css
body {
  font-family: 'DM Sans', 
              -apple-system, 
              BlinkMacSystemFont, 
              'Segoe UI',
              'PingFang SC',      /* iOS */
              'Hiragino Sans GB', /* macOS */
              'Microsoft YaHei',  /* Windows */
              sans-serif;
}
```

---

## 4. CSS Token 覆盖

### 完整 Token 定义

```css
:root {
  /* 英文字体 */
  --font-display: 'DM Serif Display', serif;
  --font-body: 'DM Serif Text', serif;
  --font-ui: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Courier New', monospace;

  /* 中文字体 */
  --font-display-cn: 'LXGW WenKai', 'SimSun', serif;
  --font-body-cn: 'LXGW WenKai', 'SimSun', serif;
  --font-ui-cn: 'Source Han Sans SC', 'SimHei', sans-serif;

  /* 英文行高（更紧凑） */
  --leading-tight: 1.2;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 1.75;

  /* 中文行高（需宽松） */
  --leading-cn-tight: 1.3;
  --leading-cn-normal: 1.5;
  --leading-cn-relaxed: 1.7;
}
```

### 在组件中使用

```css
/* 英文标题 */
h1 {
  font-family: var(--font-display);
  line-height: var(--leading-tight);
}

/* 中文段落 */
.article-cn {
  font-family: var(--font-body-cn);
  line-height: var(--leading-cn-relaxed);
  letter-spacing: 0.05em; /* 中文字间距略宽 */
}

/* UI 标签（中文） */
.label-cn {
  font-family: var(--font-ui-cn);
  line-height: var(--leading-cn-normal);
  font-weight: 500;
}
```

---

## 5. 混排字体栈写法

### 核心原则

**英文字体在前，中文字体在后**，利用 `unicode-range` 自动分流：

```css
/* ✓ 推荐：英文优先 */
body {
  font-family: 
    'DM Sans',              /* 1. 优先用英文字体 */
    'Source Han Sans SC',   /* 2. 中文回退到中文字体 */
    -apple-system,          /* 3. 系统备用 */
    sans-serif;             /* 4. 通用 sans-serif */
}

/* ✗ 错误：中文在前 */
body {
  font-family: 'Source Han Sans SC', 'DM Sans'; /* 所有字符都用中文字体 */
}

/* ✗ 错误：中英混合 */
body {
  font-family: 'DM Sans', 'SimHei'; /* SimHei 质量低 */
}
```

### Unicode-Range 优化版本

```css
@font-face {
  font-family: 'HybridFont';
  src: url('/fonts/dm-sans-400.woff2') format('woff2');
  unicode-range: U+0020-007F;  /* 仅 ASCII 和基础拉丁 */
}

@font-face {
  font-family: 'HybridFont';
  src: url('/fonts/SourceHanSans-Regular.woff2') format('woff2');
  unicode-range: U+4E00-9FFF;  /* CJK 统一表意文字 */
}

body {
  font-family: 'HybridFont', sans-serif;
}
```

### 混排实际效果

```
输入：
"Hello 世界，Claude is 强大的 AI"

渲染过程：
H, e, l, l, o → DM Sans（ASCII）
（空格）→ DM Sans
世, 界 → Source Han Sans SC（CJK）
，→ Source Han Sans SC（中文标点）
C, l, a, u, d, e → DM Sans
（空格）→ DM Sans
i, s → DM Sans
（空格）→ DM Sans
强, 大, 的 → Source Han Sans SC
A, I → DM Sans
```

---

## 6. 中文排版细节

### 标点压缩

中文标点占用全角宽度，但笔画稀疏。需要压缩标点与文字的间距：

```css
/* 标点符号前后间距压缩 */
.punctuation-compress {
  font-kerning: auto;
  text-rendering: optimizeLegibility;
}

/* 使用 CSS 属性规范 */
.cn-text {
  text-spacing: ideograph-parenthesis;
  font-feature-settings: "palt" 1; /* OpenType 标点配置 */
}
```

**标点对照表**：

| 类型 | 符号 | 前间距 | 后间距 | 说明 |
|------|------|--------|--------|------|
| 句号 | 。 | 0 | 0 | 句尾无间距 |
| 逗号 | ， | 0 | 0.5em | 后继续读 |
| 左括号 | （ | 0.5em | 0 | 左边有空隙 |
| 右括号 | ） | 0 | 0.5em | 右边有空隙 |
| 冒号 | ： | 0 | 0.5em | 列表前 |
| 叹号 | ！ | 0 | 0 | 强调 |
| 问号 | ？ | 0 | 0 | 疑问 |

### 换行规则

中文不应在某些字符处换行：

```css
/* 禁止在标点处换行 */
.cn-text {
  word-break: break-word;
  overflow-wrap: break-word;
}

/* 保护关键词不分割 */
.no-break-phrase {
  white-space: nowrap;
}

/* HTML 标记法 */
<p>
  Claude 是一个
  <span class="no-break-phrase">AI 助手</span>
  ，由 Anthropic 开发。
</p>
```

### 字重搭配表

中文字体不同字重的使用场景：

| 字重 | 磅值 | 用途 | 示例 |
|------|------|------|------|
| Thin | 100 | 极细说明 | `<p class="text-thin">可选提示文本</p>` |
| Light | 300 | 弱化文本 | 副标题、时间戳 |
| Normal | 400 | 常规 UI | 按钮、标签、正文 |
| Medium | 500 | 小标题 | 表格表头、强调标签 |
| Bold | 700 | 强调 | 激活导航、重要提示 |
| Black | 900 | 极粗强调 | 标题突强 |

### 字号与行高搭配表

中文排版的标准尺寸搭配：

| 用途 | 字号 | 推荐行高 | 字间距 | 示例 |
|------|------|---------|--------|------|
| 大标题 (H1) | 2.5rem (40px) | 1.3 | 0 | 页面主题 |
| 中标题 (H2) | 2rem (32px) | 1.35 | 0 | 章节标题 |
| 小标题 (H3) | 1.5rem (24px) | 1.4 | 0 | 小节标题 |
| 正文 | 1rem (16px) | 1.6 | 0.05em | 文章段落 |
| 副本 | 0.875rem (14px) | 1.5 | 0.05em | 说明文字 |
| 标签 | 0.75rem (12px) | 1.4 | 0.1em | UI 元素 |
| 注脚 | 0.625rem (10px) | 1.5 | 0 | 页脚信息 |

### 中英混排示例

```html
<article>
  <h1>了解 Claude：Anthropic 的 AI 助手</h1>
  
  <p>
    <span lang="zh-Hans">Claude 是一款由</span>
    <span lang="en">Anthropic</span>
    <span lang="zh-Hans">公司开发的先进 AI 模型。</span>
  </p>
  
  <blockquote>
    "我们致力于创造有益、安全、诚实的 AI。"
    <footer>— Anthropic CEO</footer>
  </blockquote>
</article>

<style>
article {
  font-family: 'DM Serif Text', 'LXGW WenKai', serif;
}

h1 {
  font-family: 'DM Serif Display', 'LXGW WenKai', serif;
  font-size: var(--text-5xl);
  line-height: 1.3;
}

p {
  font-size: 1rem;
  line-height: 1.6;
  letter-spacing: 0.02em;
}

[lang="en"] {
  font-family: 'DM Serif Text';
  letter-spacing: 0;
}

blockquote {
  font-style: italic;
  border-left: 4px solid var(--color-accent-warm);
  padding-left: var(--space-4);
  margin: var(--space-6) 0;
}
</style>
```

---

## 7. 各平台系统字体兜底链

当 CDN 字体加载失败时的回退顺序：

### 完整兜底栈

```css
/* 标题字体栈 */
h1, h2, h3 {
  font-family: 
    'DM Serif Display',        /* 1. 加载的英文字体 */
    'LXGW WenKai',             /* 2. 加载的中文字体 */
    Georgia,                   /* 3. Web 安全衬线 */
    '思源宋体 CN',             /* 4. 本地中文字体（macOS） */
    'Noto Serif SC',           /* 5. 备用衬线字体 */
    STZhongsong,               /* 6. 华文中宋（macOS） */
    serif;                     /* 7. 通用衬线 */
}

/* UI 字体栈 */
body {
  font-family: 
    'DM Sans',                 /* 1. 加载的英文字体 */
    'Source Han Sans SC',      /* 2. 加载的中文字体 */
    -apple-system,             /* 3. iOS/macOS 系统字体 */
    BlinkMacSystemFont,        /* 4. 旧 macOS */
    'Segoe UI',                /* 5. Windows */
    'Helvetica Neue',          /* 6. macOS 备用 */
    'PingFang SC',             /* 7. iOS 中文字体 */
    'Hiragino Sans GB',        /* 8. macOS 旧版中文 */
    'Microsoft YaHei',         /* 9. Windows 中文字体 */
    'SimHei',                  /* 10. 黑体备用 */
    sans-serif;                /* 11. 通用无衬线 */
}
```

### 平台特定字体

| 平台 | 衬线中文 | 无衬线中文 | 等宽中文 |
|------|----------|-----------|----------|
| **macOS** | STZhongsong（华文中宋） | PingFang SC（苹方） | N/A |
| **iOS** | STZhongsong | PingFang SC | N/A |
| **Windows** | SimSun（宋体） | Microsoft YaHei（微软雅黑） | Courier New |
| **Android** | Noto Serif SC | Noto Sans SC | Roboto Mono |
| **Linux** | Noto Serif SC | Noto Sans SC | DejaVu Sans Mono |

---

## 8. 快速参考

### CSS 快速配置

```css
/* 在 SKILL.md 中提供的 base.css 已包含，复制即用 */

/* 中文标题 */
.title-cn {
  font-family: var(--font-display-cn);
  font-size: 2.5rem;
  line-height: var(--leading-cn-tight);
  font-weight: 400;
}

/* 中文正文 */
.body-cn {
  font-family: var(--font-body-cn);
  font-size: 1rem;
  line-height: var(--leading-cn-relaxed);
}

/* 中文 UI */
.ui-cn {
  font-family: var(--font-ui-cn);
  font-size: 0.875rem;
  line-height: var(--leading-cn-normal);
  font-weight: 500;
}

/* 中英混排（完整句子） */
.mixed-cn-en {
  font-family: 
    'DM Sans',
    'Source Han Sans SC',
    sans-serif;
  line-height: 1.6;
  letter-spacing: 0.02em;
}
```

### HTML 最佳实践

```html
<!-- 指定语言属性 -->
<html lang="zh-Hans-CN">

<!-- 明确标记中英文段落 -->
<p lang="zh-Hans">这是中文段落，<span lang="en">English words</span> 混合。</p>

<!-- 在关键内容上标记语言 -->
<h1 lang="zh-Hans">Claude: 强大的 AI 助手</h1>

<!-- 为屏幕阅读器优化 -->
<p>
  <ruby>
    中文
    <rt>zhōngwén</rt>
  </ruby>
  文本
</p>
```

---

## 参考资源

- **霞鹜文楷官网**：https://github.com/lxgw/LxgwWenKai
- **思源黑体**：https://github.com/adobe-fonts/source-han-sans
- **Google Fonts 中文**：https://fonts.google.com/?query=chinese
- **OpenType 标点规范**：https://www.fonttools.org/

---

**版本**：1.0.0 | **最后更新**：2026-03-17 | **适用地区**：简体中文（中国大陆）

**注**：繁体中文（台湾）和繁体中文（香港）需要单独的字体配置，可参考本文档方法自行调整。
