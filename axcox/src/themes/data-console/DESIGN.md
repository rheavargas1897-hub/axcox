---
version: alpha
name: 营运通设计规范
description: 面向表格驱动型后台管理系统（车辆监控、下单管理等场景）的视觉与组件规范。以清爽的绿色品牌主色搭配橙色辅助色，强调像素级间距标注和组件化思维，适合直接交付前端开发落地。

colors:
  primary: "#11a983"
  primary-hover: "#0e8f6e"
  primary-active: "#0b7a5c"
  primary-light: "#e7f8f3"
  accent: "#faa732"
  accent-hover: "#e89620"
  accent-light: "#fff6e8"
  ink: "#303133"
  body: "#303133"
  body-secondary: "#7c7d7e"
  muted: "#7c7d7e"
  muted-soft: "#a8abb2"
  hairline: "#e7eaef"
  hairline-soft: "#f0f2f5"
  canvas: "#f0f4fa"
  surface: "#ffffff"
  surface-raised: "#fafbfd"
  surface-overlay: "#ffffff"
  on-primary: "#ffffff"
  success: "#11a983"
  success-light: "#e7f8f3"
  warning: "#faa732"
  warning-light: "#fff6e8"
  danger: "#e74c3c"
  danger-light: "#fdedec"
  info: "#5b8dee"
  info-light: "#edf2fd"
  status-green: "#11a983"
  status-blue: "#5b8dee"
  status-dark: "#303133"
  status-orange: "#faa732"
  status-red: "#e74c3c"

typography:
  list-default:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  title:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: 0
  label:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: 0
  hint:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  modal-title:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  button:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: 0
  table-header:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: 0
  table-cell:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  side-nav:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0

rounded:
  none: 0px
  xs: 2px
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
  pill: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 10px
  md: 12px
  lg: 14px
  xl: 20px
  xxl: 32px
  section: 40px
  search-bar-h: 70px
  pagination-h: 72px
  modal-sm-gap: 50px
  top-padding: 12px

components:
  side-nav:
    backgroundColor: "#1e2430"
    textColor: "{colors.muted-soft}"
    typography: "{typography.side-nav}"
    width: 200px
  side-nav-item:
    backgroundColor: transparent
    textColor: "{colors.muted-soft}"
    typography: "{typography.side-nav}"
    padding: 12px 20px
    rounded: "{rounded.none}"
  side-nav-item-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.side-nav}"
    rounded: "{rounded.none}"
  top-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    height: auto
    padding: "{spacing.top-padding}"
    typography: "{typography.title}"
  search-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    height: "{spacing.search-bar-h}"
    padding: "{spacing.md}"
    rounded: "{rounded.sm}"
  data-table:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.body}"
    typography: "{typography.table-cell}"
    rounded: "{rounded.sm}"
  table-header-cell:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.table-header}"
    padding: 20px 12px
    height: 20px
  table-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.body}"
    typography: "{typography.table-cell}"
    height: 54px
  table-row-hover:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.body}"
  table-action-col:
    textColor: "{colors.primary}"
    typography: "{typography.table-cell}"
    gap: "{spacing.lg}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: 0 20px
    height: 40px
  button-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.body}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: 0 20px
    height: 40px
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: 0 20px
    height: 40px
  button-lg:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: 0 32px
    height: 40px
    width: 144px
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: 0 20px
    height: 40px
  button-text:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.button}"
    padding: 0
    height: auto
  text-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.body}"
    typography: "{typography.list-default}"
    rounded: "{rounded.sm}"
    padding: 0 12px
    height: 40px
  select-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.body}"
    typography: "{typography.list-default}"
    rounded: "{rounded.sm}"
    padding: 0 12px
    height: 40px
  status-tag-default:
    backgroundColor: "{colors.hairline-soft}"
    textColor: "{colors.body-secondary}"
    typography: "{typography.hint}"
    rounded: "{rounded.sm}"
    padding: 2px 10px
  status-tag-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 2px 10px
  status-tag-blue:
    backgroundColor: "{colors.status-blue}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 2px 10px
  status-tag-dark:
    backgroundColor: "{colors.status-dark}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 2px 10px
  status-tag-orange:
    backgroundColor: "{colors.status-orange}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 2px 10px
  status-tag-red:
    backgroundColor: "{colors.status-red}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 2px 10px
  modal-sm:
    backgroundColor: "{colors.surface-overlay}"
    textColor: "{colors.body}"
    rounded: "{rounded.lg}"
    padding: "{spacing.modal-sm-gap}"
  modal-lg:
    backgroundColor: "{colors.surface-overlay}"
    textColor: "{colors.body}"
    rounded: "{rounded.lg}"
    padding: "{spacing.modal-sm-gap}"
  modal-footer:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.body}"
    height: 56px
    padding: 0 32px
    gap: 32px
  modal-footer-btn:
    width: 76px
    height: 40px
    rounded: "{rounded.none}"
  pagination:
    backgroundColor: transparent
    textColor: "{colors.body}"
    typography: "{typography.list-default}"
    height: "{spacing.pagination-h}"
  tab-item:
    backgroundColor: transparent
    textColor: "{colors.body-secondary}"
    typography: "{typography.title}"
    padding: 12px 16px
  tab-item-active:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.title}"
  badge:
    backgroundColor: "{colors.accent-light}"
    textColor: "{colors.accent}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 2px 8px
  section-header:
    typography: "{typography.title}"
    textColor: "{colors.ink}"
    gap: "{spacing.sm}"
  detail-label:
    typography: "{typography.label}"
    textColor: "{colors.body-secondary}"
  detail-value:
    typography: "{typography.list-default}"
    textColor: "{colors.ink}"
---

## Overview

"营运通"（Operations Management）是一套面向**表格驱动型后台管理系统**的设计规范，覆盖车辆监控、下单管理、物流追踪等典型 B2B 运营场景。系统以**清爽的绿色品牌主色 + 橙色辅助色**建立视觉识别，强调**像素级间距标注**和**组件化思维**，适合直接交付前端开发落地。

整体采用经典后台布局：左侧 200px 固定导航 + 顶部操作栏 + 搜索筛选区 + 中部数据表格 + 底部分页栏。所有间距、字号、颜色均从真实运营界面中提取，确保高信息密度下仍保持清晰可读。

**Key Characteristics:**
- 绿色主色 (`{colors.primary}` — #11a983) + 橙色辅助 (`{colors.accent}` — #faa732) — 清爽、理性、识别度高
- 页面底色 `{colors.canvas}` (#f0f4fa) — 浅蓝灰，比纯白柔和，适合长时间数据查阅
- 表格行高 54px，列首 20-21px — 高密度数据场景下保证可读性的最小舒适高度
- 列表按钮默认**直角**样式 (`{rounded.none}`) — 后台系统特有的硬朗克制，减少视觉噪音
- 侧边栏 200px 深色底 — 与浅色内容区形成稳定分区
- 状态标签双模式：浅色底（默认/未选中）+ 高饱和填充（已选中/激活）— 一眼区分状态
- 统一苹方字体 (`PingFang SC`) — 中文后台系统最可靠的选择

## Colors

### 品牌色
- **主色 / Green** (`{colors.primary}` — #11a983): 品牌主色。用于主按钮、选中态、链接、状态标签激活态、侧边栏选中项。
- **主色悬停** (`{colors.primary-hover}` — #0e8f6e): 按钮 hover 态。
- **主色按下** (`{colors.primary-active}` — #0b7a5c): 按钮 active 态。
- **主色浅底** (`{colors.primary-light}` — #e7f8f3): 选中行背景、成功/正常状态浅色标签。

### 辅助色
- **强调橙** (`{colors.accent}` — #faa732): 警示/强调色。用于警告状态标签、重点关注标识。
- **强调橙悬停** (`{colors.accent-hover}` — #e89620): 橙色按钮 hover 态。
- **强调橙浅底** (`{colors.accent-light}` — #fff6e8): 警告/待处理状态浅色标签。

### 表面与背景
- **页面底色** (`{colors.canvas}` — #f0f4fa): 全局页面背景。浅蓝灰调，比纯白更柔和不刺眼。
- **表面白** (`{colors.surface}` — #ffffff): 卡片、表格、输入框、弹窗背景。
- **浮起表面** (`{colors.surface-raised}` — #fafbfd): 表格悬停行、详情卡片内 subtle 分层。
- **覆盖层** (`{colors.surface-overlay}` — #ffffff): 弹窗、下拉菜单背景。

### 文字色
- **正文色** (`{colors.ink}` — #303133): 所有主文字、标题、表头。深灰而非纯黑，减轻长时间阅读疲劳。
- **正文色（同）** (`{colors.body}` — #303133): 与 ink 同色，作为默认正文字。
- **提示字** (`{colors.body-secondary}` — #7c7d7e): 次要文字、描述文字、占位符。
- **弱文字** (`{colors.muted}` — #7c7d7e): 与 body-secondary 同色，禁用态文字。
- **极弱文字** (`{colors.muted-soft}` — #a8abb2): 占位提示、水印文字、侧边栏未选中项。

### 分割线
- **分割线** (`{colors.hairline}` — #e7eaef): 表格边框、输入框边框、卡片分割线。
- **软分割** (`{colors.hairline-soft}` — #f0f2f5): 表格内部分隔、subtle 分区线。

### 状态标签色
用于表格中车辆/订单状态标签的填充色：
- **绿色激活** (`{colors.status-green}` — #11a983): 「已绑定」「使用中」等正常状态
- **蓝色激活** (`{colors.status-blue}` — #5b8dee): 「运输中」「处理中」等进行中状态
- **深灰激活** (`{colors.status-dark}` — #303133): 「停用」「已关闭」等终止/中性状态
- **橙色激活** (`{colors.status-orange}` — #faa732): 「待审核」「即将到期」等警示状态
- **红色激活** (`{colors.status-red}` — #e74c3c): 「已逾期」「异常」等紧急状态

### 语义色
- **成功** (`{colors.success}` — #11a983): 同主色。成功提示、正常状态。
- **警告** (`{colors.warning}` — #faa732): 同辅助色。警告提示、待处理。
- **危险** (`{colors.danger}` — #e74c3c): 删除按钮、错误提示、异常状态。
- **信息** (`{colors.info}` — #5b8dee): 信息提示、中性通知。

## Typography

### 字体策略
系统**统一使用苹方（PingFang SC）**作为中文字体，Windows 回退到 Microsoft YaHei。不引入外部 Web 字体，确保零延迟渲染和一致的跨平台表现。

字体栈：`'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif`

### 字号层级

| Token | 字号 | 字重 | 用途 |
|-------|------|------|------|
| `{typography.list-default}` | 14px | 400 | 表格数据、列表内容、正文 |
| `{typography.title}` | 14px | 600 | 页面标题、表头、卡片标题 |
| `{typography.label}` | 12px | 600 | 表单字段名、状态标签（激活态） |
| `{typography.hint}` | 12px | 400 | 提示文字、描述、状态标签（默认态） |
| `{typography.modal-title}` | 16px | 600 | 弹窗标题 |
| `{typography.button}` | 14px | 400 | 按钮文字 |
| `{typography.table-header}` | 14px | 600 | 表头列名 |
| `{typography.table-cell}` | 14px | 400 | 表格数据单元格 |
| `{typography.side-nav}` | 14px | 400 | 侧边栏菜单项 |

### 原则
- 正文字号统一 14px——这是中文后台系统的最佳平衡点：够大易读，又不会浪费纵向空间。
- 提示/标签用 12px——比正文小一档，形成清晰的信息层级，同时又不会太小导致中文笔划粘连。
- 字重只有 400（常规）和 600（加粗）两级——足够区分层级，避免过度变化。
- 弹窗标题 16px——比页面标题大一点，帮助用户聚焦当前弹窗任务。
- 不使用斜体和过度的 letter-spacing——中文排版不需要。

## Layout

### 全局布局结构
经典后台三栏布局（左-上-中-下）：

| 区域 | 尺寸 | 说明 |
|------|------|------|
| **侧边栏** | 宽 200px，高 100vh | 深色底固定导航，不随内容滚动 |
| **顶栏** | 间距 12px | 页面标题/面包屑/全局操作入口 |
| **搜索区** | 高 70px | 筛选条件区，多个输入框+按钮横向排列 |
| **内容区** | 弹性填充 | 数据表格主体 |
| **分页栏** | 高 72px | 底部分页组件，右对齐 |

### 间距系统
- **Base unit:** 非严格 4px 倍数——间距从实际运营界面测量提取。
- **Tokens:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 10px · `{spacing.md}` 12px · `{spacing.lg}` 14px · `{spacing.xl}` 20px · `{spacing.xxl}` 32px · `{spacing.section}` 40px.
- **搜索区高度:** `{spacing.search-bar-h}` (70px) — 筛选条件整行高度。
- **分页栏高度:** `{spacing.pagination-h}` (72px) — 底部分页区。
- **弹窗小间距:** `{spacing.modal-sm-gap}` (50px) — 小弹窗内部表单区左右 padding。
- **顶栏上间距:** `{spacing.top-padding}` (12px) — 顶部内容距页面顶部。

### 表格间距
- **表头 padding:** 上下 20px（列首 20px），左右 12px。header 总高约 20+20+行高。
- **数据行高:** 54px（含上下 padding）。这是后台系统密集表格的行业标准——足够放下一行 14px 文字 + 舒适上下留白。
- **操作列按钮间距:** 14px — 表格最右侧「详情」「暂停」「绑定」等操作按钮之间的横向 gap。
- **列表按钮间距:** 32px — 表格上方批量操作按钮组之间的间距。
- **详情类组件按钮间距:** 40px — 详情/表单页底部操作按钮间距。

## Elevation & Depth

| 层级 | 处理方式 | 使用场景 |
|------|---------|---------|
| 基底 | `{colors.canvas}` 背景 | 全局页面底色 |
| 表面 | 白色背景 + 1px `{colors.hairline}` 边框 | 表格、卡片、输入框 |
| 浮起 | 白色背景 + `{colors.surface-raised}` | 表格悬停行 |
| 覆盖 | 白色背景 + 微弱阴影 | 弹窗、下拉菜单 |

深度策略：**边框优先于阴影**。静态内容（表格、卡片）一律用 `{colors.hairline}` 细线界定，只有弹窗和下拉才使用阴影表示"覆盖"关系。这保持了后台系统的简洁克制。

## Shapes

### 圆角
后台系统以**直角为主**，仅在特定场景使用小圆角：

| Token | 值 | 使用场景 |
|-------|-----|---------|
| `{rounded.none}` | 0px | **默认按钮**（列表按钮全部直角）、侧边栏菜单项 |
| `{rounded.xs}` | 2px | 极少使用 |
| `{rounded.sm}` | 4px | 输入框、选择框、搜索区卡片、状态标签 |
| `{rounded.md}` | 6px | 表格外容器 |
| `{rounded.lg}` | 8px | 弹窗/对话框 |
| `{rounded.pill}` | 9999px | 暂无使用场景（预留） |

### 原则
- **列表按钮一律直角**——这是后台系统区别于消费端产品的关键特征。直角按钮更硬朗、更专业。
- 输入框和标签用 4px 小圆角——柔化但不浮夸。
- 弹窗用 8px——稍大一点以示"浮起"，但不过度。
- 永远不要在同一个组件内混用不同圆角值。

## Components

### 侧边栏（Side Nav）
**`side-nav`** — 左侧 200px 固定宽度深色导航栏。背景深灰（#1e2430），菜单项白色半透明文字。选中项绿色填充背景 + 白色文字。直角无圆角。菜单项高 48px，padding 12px × 20px。顶部放置 Logo 区域（高 56px），底部可放用户头像/退出。

### 顶栏（Top Bar）
**`top-bar`** — 内容区顶部，上间距 12px。承载页面标题（14px / 600）、面包屑导航和全局操作按钮（如「新增订单」）。

### 搜索区（Search Bar）
**`search-bar`** — 70px 高的横向筛选区。白色背景，4px 圆角，内含多个输入框 + 选择框 + 查询/重置按钮。输入框高 40px。各筛选项间距 12px。

### 按钮（Button）
系统按钮统一 **40px 高度**，默认**直角**（0px 圆角）：

**`button-primary`** — 绿色主按钮。背景 `{colors.primary}`，白色文字，高度 40px，左右 padding 20px。Hover 加深至 `{colors.primary-hover}`。

**`button-default`** — 白色默认按钮。白色背景 + `{colors.hairline}` 边框，`{colors.body}` 文字。用于「取消」「重置」等次要操作。

**`button-accent`** — 橙色按钮。背景 `{colors.accent}`。用于警示性操作。

**`button-danger`** — 红色按钮。背景 `{colors.danger}`。用于「删除」「禁用」等破坏性操作。

**`button-lg`** — 大尺寸按钮。宽 144px，高 40px，用于列表区组件按钮。按钮之间间距 32px。

**`button-text`** — 文字按钮。透明背景，`{colors.primary}` 文字色。用于表格操作列中的「详情」「编辑」等行内链接。

**列表按钮间距规范：**
- 列表区组件按钮之间间距：`{spacing.xxl}` (32px)
- 表格操作列按钮间距：`{spacing.lg}` (14px)
- 详情/表单页底部按钮间距：`{spacing.section}` (40px)

### 数据表格（Data Table）
系统最核心的组件：

- **表头** (`table-header-cell`): `{colors.canvas}` 浅灰蓝背景，14px / 600 苹方字体，`{colors.ink}` 文字色。列首上下 padding 各 20px（总列首区 20px+20px+文字高度），左右 12px。
- **数据行** (`table-row`): 白色背景，14px / 400 苹方字体，`{colors.body}` 文字色。行高 54px（含 padding）。
- **行悬停** (`table-row-hover`): `{colors.surface-raised}` 微灰背景。
- **操作列** (`table-action-col`): 表格最右侧列。`{colors.primary}` 绿色文字按钮（「详情」「暂停」「绑定」等），按钮间距 14px。
- **表格外容器**: 白色背景，`{rounded.sm}` (4px) 圆角，`{colors.hairline}` 边框。

**典型表头字段：** 监控状态、车牌号、车辆类型、套餐、套餐状态、下单时间、下单公司、上牌公司、操作。

### 状态标签（Status Tag）
语义化状态标签，分为**默认态**（浅色底）和**激活态**（高饱和填充）两类：

**默认态** (`status-tag-default`):
- 浅灰底 (`{colors.hairline-soft}`) + `{colors.body-secondary}` 文字（#7c7d7e）
- 12px / 400 苹方 · 4px 圆角 · padding 2px × 10px
- 用于「未绑定」「默认」等非强调状态

**激活态** — 高饱和填充标签，白色文字：
- `status-tag-active` (绿色): 「已绑定」「使用中」「正常」
- `status-tag-blue` (蓝色): 「运输中」「进行中」
- `status-tag-dark` (深灰): 「停用」「已关闭」
- `status-tag-orange` (橙色): 「待审核」「即将到期」
- `status-tag-red` (红色): 「已逾期」「异常」
- 统一 12px / 600 苹方 · 4px 圆角 · padding 2px × 10px

### 弹窗（Modal）
两种弹窗规格：

**小弹窗** (`modal-sm`):
- 单列表单布局（如「邮箱验证」弹窗）
- 内容区间距 `{spacing.modal-sm-gap}` (50px)
- 标题 16px / 600
- 8px 圆角

**大弹窗** (`modal-lg`):
- 多字段表单布局
- 标题 16px / 600（`{typography.modal-title}`）
- 按钮区 (`modal-footer`): 高 56px，按钮宽 76px，按钮间距 32px
- 8px 圆角

### 输入框（Input）
**`text-input`** — 高 40px，白色背景，`{colors.hairline}` 边框，`{rounded.sm}` (4px) 圆角，padding 0 × 12px。文字 14px / 400，占位符 `{colors.muted-soft}` (#a8abb2)。聚焦态边框变 `{colors.primary}`。

**`select-input`** — 同 text-input 尺寸，右侧带下拉箭头。

### 分页（Pagination）
**`pagination`** — 内容区底部，总高度 72px。页码按钮样式与系统按钮一致（直角、40px 高）。当前页：绿色背景 + 白色文字。其他页：白色背景 + 深灰文字。

### 标签/徽章（Tabs & Badges）
**`tab-item`** — 水平 Tab。未选中：`{colors.body-secondary}` 文字。选中 (`tab-item-active`): `{colors.primary}` 绿色文字。无背景变化，无底部横线（靠颜色区分）。

### 详情页排版
**大标题与小标题间距:** `{spacing.sm}` (10px)。详情字段使用 `detail-label` (12px / 600 / `{colors.body-secondary}`) + `detail-value` (14px / 400 / `{colors.ink}`) 的标签-值对排列。

## Do's and Don'ts

### Do
- 列表按钮使用**直角**（0px 圆角）——后台系统的专业感来源于克制。
- 表格行高保持 54px——这是密集数据可读性的底线。
- 状态标签使用语义色+白色文字（激活态）或浅灰底+灰色文字（默认态）——两种模式覆盖全部状态。
- 正文统一 14px，提示统一 12px——两级字号，清晰层级。
- 侧边栏保持 200px 固定宽度——不随内容变化，给导航稳定的空间感。
- 绿色主色 + 橙色辅助——两者功能分明：绿色表正常/完成，橙色表警示/待处理。
- 白色卡片用 `{colors.hairline}` (#e7eaef) 细线界定——边框优先于阴影。
- 弹窗标题用 16px / 600——比页面标题大一号，聚焦注意力。

### Don't
- 不要在列表/表格场景给按钮加圆角——直角是后台系统的视觉锚点。
- 不要使用 12px 以下的字号——中文笔划复杂，太小无法辨认。
- 不要在静态卡片上使用阴影——阴影只用于弹窗/下拉等"覆盖"场景。
- 不要给侧边栏菜单项加圆角——与列表按钮一致，保持直角。
- 不要混合使用不同圆角值——同一场景的同类元素圆角必须统一。
- 不要用纯黑 (#000) 作为文字色——最深的正文色是 `{colors.ink}` (#303133)。
- 不要引入第三种品牌色——绿色 + 橙色足够覆盖全部业务语义。

## Responsive Behavior

### 断点

| 名称 | 宽度 | 关键变化 |
|------|------|---------|
| 窄屏 | < 1024px | 侧边栏收起（汉堡菜单）；表格水平滚动；搜索区纵向堆叠 |
| 标准 | 1024–1440px | 侧边栏展开 200px；表格全宽；搜索区单行 |
| 宽屏 | > 1440px | 同标准，内容区最大宽度可设上限 |

### 表格响应式
- 列数超过视口宽度时：横向滚动，固定左侧关键列（如车牌号）。
- 行高始终 54px，不随视口缩小。
- 操作列固定在右侧。

## Iteration Guide

1. 一次只修改一个组件。引用其 token key（如 `{component.data-table}`, `{component.button-primary}`）。
2. 变体在 `components:` 下以独立条目存在（`-hover`, `-active` 等）。
3. 始终使用 `{token.refs}` 引用，禁止硬编码 hex 值。
4. 按钮高度统一 40px。表格行高统一 54px。搜索区统一 70px。分页区统一 72px。侧边栏统一 200px。
5. 列表按钮统一直角 (`{rounded.none}`)。输入框统一 4px 圆角 (`{rounded.sm}`)。弹窗统一 8px 圆角 (`{rounded.lg}`)。
6. 中文字号下限 12px。正文 14px。弹窗标题 16px。
7. 不确定时：减少装饰，增加留白。

## Known Gaps

- 图标系统未定义——建议使用统一图标库（如 Element Icons 或 Lucide），尺寸 14-16px。
- 深色模式未覆盖——当前规范仅适用于浅色界面。
- 移动端适配不做详细覆盖——后台系统以桌面端为主。
- 图表（ECharts）配色未单独定义——可复用状态标签色系统。
- 动画/过渡未定义——建议使用 150-200ms ease-out 作为 hover 过渡。
