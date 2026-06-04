# ProtoRec 本地服务使用说明

## 1. 环境要求

- Node.js 18 及以上
- npm 可正常使用

## 2. 启动方式

### 默认模式

- macOS：双击 `start.command`
- Windows：双击 `start.bat`

该模式会把抓取结果写到服务包目录下的 `workspace/`。

### 项目隔离模式（推荐）

- macOS / Linux：在目标项目目录执行 `/你的服务目录/start-in-project.sh`
- Windows：在目标项目目录执行 `服务目录\start-in-project.bat`
- 也可以把项目目录作为第一个参数传给脚本

项目隔离模式会把抓取结果写到当前项目下的 `.protorec/`，无需复制本地服务。

### 通用命令行方式

```bash
npm install --omit=dev
node server.js
```

### 项目隔离命令行方式

```bash
PROTO_CAPTURE_RESTORE_PROJECT_ROOT="$(pwd)" PROTO_CAPTURE_RESTORE_WORKSPACE_ROOT="$(pwd)/.protorec" node server.js
```

## 3. 启动成功标志

服务默认监听：`http://localhost:3001`

浏览器打开以下地址看到 JSON 返回即表示服务正常：

- `http://localhost:3001/`
- `http://localhost:3001/health`

## 4. 目录说明

- `workspace/pages`：还原页面输出目录
- `workspace/temp_proto`：抓取中间产物目录
- `workspace/quality`：质量报告目录
- `.protorec/pages`：项目隔离模式下的还原页面输出目录
- `.protorec/temp_proto`：项目隔离模式下的抓取中间产物目录
- `.protorec/quality`：项目隔离模式下的质量报告目录

## 5. 常见问题

### 端口 3001 被占用

可用其他端口启动：

```bash
PORT=3002 node server.js
```

### 首次启动较慢

首次启动会自动执行 `npm install --omit=dev` 安装依赖，属于正常现象。

### 怎么确认已经写入当前项目？

项目隔离模式启动后，目标项目目录下会自动出现 `.protorec/` 目录，抓取结果会落在里面。
