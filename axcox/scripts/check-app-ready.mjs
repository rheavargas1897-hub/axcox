#!/usr/bin/env node
/**
 * =====================================================
 * CLI: check-app-ready
 *
 * 功能：
 *  - AI 调用，检测 Vite dev server 和页面状态
 *  - 不依赖页面注入
 *  - 捕获已存在和后续构建/热更新错误
 *  - 页面可访问即 READY，出现错误即 ERROR
 *  - 超时返回 TIMEOUT
 *  - 默认包含构建校验，可通过 --skip-build 跳过
 *
 * 使用：
 *   node scripts/check-app-ready.mjs [页面路径]
 *   例如：node scripts/check-app-ready.mjs /prototypes/ref-app-home
 *        node scripts/check-app-ready.mjs /prototypes/home
 *
 *   跳过构建校验：
 *   node scripts/check-app-ready.mjs --skip-build /prototypes/ref-app-home
 *
 *   跳过类型校验（用于只验证页面/服务器/WebSocket）：
 *   node scripts/check-app-ready.mjs --skip-typecheck --skip-build /prototypes/ref-app-home
 *
 * 输出（JSON）：
 * {
 *   status: "READY" | "ERROR" | "TIMEOUT",
 *   phase: "server|build|page|done",
 *   message: "...",
 *   url: "http://localhost:51720/prototypes/ref-app-home",
 *   errors: [...],
 *   logs: [...],
 *   buildCheck?: { status: "SUCCESS" | "FAILED" | "SKIPPED", errors: [...], logs: [...] }
 *   lintCheck?: { status: "SUCCESS" | "FAILED" | "SKIPPED", errors: [...], logs: [...] }
 *   typeCheck?: { status: "SUCCESS" | "FAILED" | "SKIPPED", errors: [...], logs: [...] }
 *   checks?: [{ name: "lint|typecheck|build", status: "...", message: "...", errors: [...] }]
 *   homeUrl?: "http://localhost:51720"
 *   targetUrl?: "http://localhost:51720/prototypes/ref-app-home"
 *   targetPath?: "http://localhost:51720/prototypes/ref-app-home/index.html"
 * }
 * =====================================================
 */

import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import process from 'node:process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocket } from 'ws'
import { decodeOutput, getPreferredNpmCommand, getPreferredNpxCommand } from './utils/command-runtime.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const APP_ROOT = path.resolve(__dirname, '..')

/* ================= 配置 ================= */
// 解析命令行参数
const args = process.argv.slice(2);
const skipBuild = args.includes('--skip-build');
const skipTypecheck = args.includes('--skip-typecheck');
const pagePath = args.find(arg => !arg.startsWith('--')) || '/';

const CONFIG = {
  devCommand: ['run', 'dev'],       // 启动 Vite 的命令参数
  devServerInfoPath: path.resolve(__dirname, '../.axhub/make/.dev-server-info.json'), // 开发服务器信息文件
  pagePath,                         // 目标页面路径（从命令行参数获取）
  pollIntervalMs: 500,              // 页面轮询间隔
  stableCheckMs: 1000,              // 错误稳定判断时间
  timeoutMs: 30_000,                // 总超时
  serverInfoWaitMs: 10_000,         // 等待开发服务器端口信息生成
  serverInfoPollIntervalMs: 500,    // 端口信息轮询间隔
  serverHealthTimeoutMs: 1200,      // /api/health 验活超时
  websocketTimeoutMs: 1500,         // /ws 握手与 ping/pong 超时
  skipBuild,                        // 是否跳过构建校验
  skipTypecheck                     // 是否跳过类型校验
}

/* ================= 工具函数 ================= */
export function jsonExit(payload, code = 0) {
  process.stdout.write(JSON.stringify(payload, null, 2))
  process.exit(code)
}

/**
 * 尝试通过 HTTP 请求获取页面内容，检查是否有错误信息
 */
async function checkPageForErrors(url) {
  try {
    const res = await fetch(url, { method: 'GET' })
    const text = await res.text()

    // Only treat the HTML as an error page when Vite's overlay is present.
    // The app template includes global error handlers with object literals like
    // `{ error: event.error }`, which would otherwise cause false positives.
    const hasViteOverlay =
      text.includes('vite-error-overlay') ||
      text.includes('__vite_error_overlay__') ||
      /\[plugin:vite:/i.test(text) ||
      /Transform failed/i.test(text)

    if (!hasViteOverlay) return []

    const errorPatterns = [
      /\bError:\s*([^\n]+)/,
      /\bSyntaxError:\s*([^\n]+)/,
      /\bReferenceError:\s*([^\n]+)/,
      /\[plugin:vite:[^\]]+\]\s*([^\n]+)/i,
      /Transform failed/i
    ]

    for (const pattern of errorPatterns) {
      const match = text.match(pattern)
      if (match) return [match[1] || match[0]]
    }

    return ['Detected Vite error overlay but could not extract message']
  } catch (err) {
    return []
  }
}

export async function isServerAlive(url) {
  try {
    const res = await fetch(url, { method: 'GET' })
    return res.ok
  } catch {
    return false
  }
}

function normalizeProjectRoot(value) {
  if (typeof value !== 'string' || !value.trim()) return null
  return path.resolve(value)
}

function readServerInfoFile(options = {}) {
  const devServerInfoPath = options.devServerInfoPath || CONFIG.devServerInfoPath
  try {
    if (fs.existsSync(devServerInfoPath)) {
      const info = JSON.parse(fs.readFileSync(devServerInfoPath, 'utf8'))
      return {
        port: info.port,
        host: info.host || 'localhost',
        localIP: info.localIP || 'localhost'
      }
    }
  } catch (err) {
    logs.push(`Failed to read .axhub/make/.dev-server-info.json: ${err.message}`)
  }

  // 如果没有端口信息，返回 null 表示需要等待服务器启动
  return null
}

/**
 * 生成服务器首页 URL
 * 使用 localhost 而不是 0.0.0.0，因为浏览器无法访问 0.0.0.0
 */
export function getHomeUrl(serverInfo) {
  // 如果 host 是 0.0.0.0，使用 localhost 替代
  const host = serverInfo.host === '0.0.0.0' ? 'localhost' : serverInfo.host
  return `http://${host}:${serverInfo.port}`
}

/**
 * 获取可访问的 host
 * 将 0.0.0.0 转换为 localhost，因为浏览器无法直接访问 0.0.0.0
 */
export function getAccessibleHost(serverInfo) {
  return serverInfo.host === '0.0.0.0' ? 'localhost' : serverInfo.host
}

export function getTargetUrl(serverInfo, targetPath) {
  const host = getAccessibleHost(serverInfo)
  return `http://${host}:${serverInfo.port}${targetPath}`
}

export function getEntryHtmlPath(targetPath) {
  const normalized = targetPath.startsWith('/') ? targetPath : `/${targetPath}`
  if (normalized.endsWith('.html')) return normalized
  if (normalized.endsWith('/')) return `${normalized}index.html`
  return `${normalized}/index.html`
}

async function fetchJsonWithTimeout(url, timeoutMs) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: controller.signal
    })
    if (!res.ok) {
      return { ok: false, reason: `health returned ${res.status}` }
    }
    return { ok: true, body: await res.json() }
  } catch (err) {
    return { ok: false, reason: err?.name === 'AbortError' ? 'health timed out' : err?.message || String(err) }
  } finally {
    clearTimeout(timeout)
  }
}

export async function validateRuntimeServerInfo(serverInfo, options = {}) {
  if (!serverInfo) {
    return { ok: false, reason: 'missing server info' }
  }

  const timeoutMs = options.timeoutMs ?? CONFIG.serverHealthTimeoutMs
  const expectedProjectRoot = normalizeProjectRoot(options.projectRoot || APP_ROOT)
  const healthUrl = `${getHomeUrl(serverInfo)}/api/health`
  const health = await fetchJsonWithTimeout(healthUrl, timeoutMs)
  if (!health.ok) {
    return { ok: false, reason: health.reason }
  }

  const payload = health.body
  const role = payload?.role
  const healthProjectRoot = normalizeProjectRoot(payload?.projectRoot || payload?.server?.projectRoot)
  if (role !== 'runtime') {
    return { ok: false, reason: `health role is ${role || 'missing'}` }
  }
  if (!healthProjectRoot || healthProjectRoot !== expectedProjectRoot) {
    return { ok: false, reason: 'health project root mismatch' }
  }

  return { ok: true, health: payload }
}

/**
 * 读取并验证开发服务器信息。
 * 只有 .dev-server-info.json 指向仍存活、且属于当前项目的 runtime 服务时才复用。
 */
export async function getServerInfo(options = {}) {
  const info = readServerInfoFile(options)
  if (!info || options.validate === false) return info

  const validation = await validateRuntimeServerInfo(info, {
    projectRoot: options.projectRoot,
    timeoutMs: options.timeoutMs
  })
  if (validation.ok) return info

  const targetLogs = options.logs || logs
  targetLogs.push(`Ignoring stale dev server info: ${validation.reason}`)
  return null
}

export async function waitForServerInfo(options = {}) {
  const timeoutMs = options.timeoutMs ?? CONFIG.serverInfoWaitMs
  const pollIntervalMs = options.pollIntervalMs ?? CONFIG.serverInfoPollIntervalMs
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    const info = await getServerInfo(options)
    if (info) return info
    await sleep(pollIntervalMs)
  }

  return null
}

function waitForSocketMessage(ws, expectedType, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error(`Timed out waiting for WebSocket ${expectedType}`))
    }, timeoutMs)

    const onMessage = (raw) => {
      let payload
      try {
        payload = JSON.parse(String(raw))
      } catch {
        cleanup()
        reject(new Error('WebSocket returned invalid JSON'))
        return
      }

      if (payload?.type === expectedType) {
        cleanup()
        resolve(payload)
      }
    }

    const onError = (err) => {
      cleanup()
      reject(err)
    }

    const onClose = () => {
      cleanup()
      reject(new Error('WebSocket closed before readiness check completed'))
    }

    const cleanup = () => {
      clearTimeout(timeout)
      ws.off('message', onMessage)
      ws.off('error', onError)
      ws.off('close', onClose)
    }

    ws.on('message', onMessage)
    ws.on('error', onError)
    ws.on('close', onClose)
  })
}

export async function checkWebSocketReady(serverInfo, options = {}) {
  const timeoutMs = options.timeoutMs ?? CONFIG.websocketTimeoutMs
  const WebSocketClass = options.WebSocketClass || WebSocket
  const host = getAccessibleHost(serverInfo)
  const wsUrl = `ws://${host}:${serverInfo.port}/ws?client=check-app-ready`
  let ws

  try {
    ws = new WebSocketClass(wsUrl)
    const connected = await waitForSocketMessage(ws, 'connected', timeoutMs)
    const pongPromise = waitForSocketMessage(ws, 'pong', timeoutMs)
    ws.send(JSON.stringify({ type: 'ping' }))
    const pong = await pongPromise
    return { ok: true, url: wsUrl, connected, pong }
  } catch (err) {
    return {
      ok: false,
      url: wsUrl,
      error: err?.message || String(err)
    }
  } finally {
    if (ws && ws.readyState === WebSocketClass.OPEN) {
      ws.close()
    }
  }
}

/* ================= 全局状态 ================= */
let logs = []
let errors = []
let lastErrorTime = 0
let errorCache = new Set() // 用于去重错误信息

/* ================= 阶段 1：启动或 attach Vite ================= */
function startOrAttachVite() {
  logs.push('Checking Vite server...')
  const npmCommand = getPreferredNpmCommand()
  const child = spawn(npmCommand, CONFIG.devCommand, {
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: APP_ROOT,
    shell: false,
  })

  child.stdout.on('data', (data) => {
    const text = decodeOutput(data).trim()
    if (text) logs.push(text)

    // 检测构建错误
    if (/error/i.test(text) || /failed to compile/i.test(text)) {
      errors.push(text)
      lastErrorTime = Date.now()
    }
  })

  child.stderr.on('data', (data) => {
    const text = decodeOutput(data).trim()
    if (text) {
      // 过滤掉一些正常的警告信息
      if (!/deprecated|experimental/i.test(text)) {
        errors.push(text)
        lastErrorTime = Date.now()
      }
      logs.push(text)
    }
  })

  child.on('error', (err) => {
    errors.push(`Process error: ${err.message}`)
    lastErrorTime = Date.now()
  })

  return child
}

/* ================= 阶段 2：轮询页面可访问性 ================= */
async function waitForPage(url) {
  const start = Date.now()
  let lastCheckTime = 0

  while (Date.now() - start < CONFIG.timeoutMs) {
    const now = Date.now()

    // 每隔一段时间尝试获取错误信息（即使页面不可访问）
    if (now - lastCheckTime > 2000) {
      const pageErrors = await checkPageForErrors(url)
      if (pageErrors.length > 0) {
        // 去重：只添加未见过的错误
        pageErrors.forEach(err => {
          const errorKey = err.substring(0, 200) // 使用前200个字符作为唯一标识
          if (!errorCache.has(errorKey)) {
            errorCache.add(errorKey)
            errors.push(err)
          }
        })
      }
      lastCheckTime = now
    }

    if (await isServerAlive(url)) return true
    await sleep(CONFIG.pollIntervalMs)
  }
  return false
}

/* ================= 阶段 3：等待稳定状态 ================= */
async function waitForStable(pageUrl) {
  const startTime = Date.now()

  while (Date.now() - startTime < CONFIG.timeoutMs) {
    const now = Date.now()

    // 页面可访问
    const pageOk = await isServerAlive(pageUrl)

    // 如果页面可访问，尝试检查页面内容中的错误
    if (pageOk) {
      const pageErrors = await checkPageForErrors(pageUrl)
      if (pageErrors.length > 0) {
        return {
          status: 'ERROR',
          phase: 'build',
          message: 'Detected error in page content',
          url: pageUrl,
          errors: pageErrors,
          logs
        }
      }
    }

    // 错误稳定：最近 stableCheckMs 内没有新的错误
    const stable = (now - lastErrorTime) > CONFIG.stableCheckMs

    if (!pageOk) {
      // 页面不可访问，继续轮询
      await sleep(CONFIG.pollIntervalMs)
      continue
    }

    if (errors.length > 0) {
      return {
        status: 'ERROR',
        phase: 'build',
        message: 'Detected Vite build/runtime error',
        url: pageUrl,
        errors,
        logs
      }
    }

    if (pageOk && stable) {
      return {
        status: 'READY',
        phase: 'done',
        message: 'Page ready and stable',
        url: pageUrl,
        errors: [],
        logs
      }
    }

    await sleep(CONFIG.pollIntervalMs)
  }

  return {
    status: 'TIMEOUT',
    phase: 'server',
    message: 'Timeout waiting for page/stable state',
    url: pageUrl,
    errors,
    logs
  }
}

/**
 * 为结果添加服务器首页信息
 */
function addUrls(result, serverInfo) {
  if (!serverInfo) {
    return {
      ...result,
      homeUrl: null,
      targetUrl: null,
      targetPath: null
    }
  }

  const entryHtmlPath = getEntryHtmlPath(CONFIG.pagePath)

  return {
    ...result,
    homeUrl: getHomeUrl(serverInfo),
    targetUrl: getTargetUrl(serverInfo, CONFIG.pagePath),
    targetPath: getTargetUrl(serverInfo, entryHtmlPath)
  }
}

function readPackageJson() {
  const pkgPath = path.resolve(APP_ROOT, 'package.json')
  try {
    return JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  } catch (err) {
    logs.push(`Failed to read package.json: ${err.message}`)
    return null
  }
}

function getScriptCommand(pkgJson, scriptName) {
  if (!pkgJson || !pkgJson.scripts) return null
  return pkgJson.scripts[scriptName] || null
}

function hasEslintConfig(pkgJson) {
  if (pkgJson && pkgJson.eslintConfig) return true
  const configFiles = [
    '.eslintrc',
    '.eslintrc.js',
    '.eslintrc.cjs',
    '.eslintrc.json',
    '.eslintrc.yaml',
    '.eslintrc.yml',
    'eslint.config.js',
    'eslint.config.cjs',
    'eslint.config.mjs'
  ]
  return configFiles.some((file) => fs.existsSync(path.resolve(APP_ROOT, file)))
}

function hasTsConfig() {
  return fs.existsSync(path.resolve(APP_ROOT, 'tsconfig.json'))
}

function toCheckItem(name, result) {
  if (!result) return null
  return {
    name,
    status: result.status,
    message: result.message,
    errors: result.errors || []
  }
}

function buildChecksSummary({ lintResult, typeCheckResult, buildResult }) {
  return [
    toCheckItem('lint', lintResult),
    toCheckItem('typecheck', typeCheckResult),
    toCheckItem('build', buildResult)
  ].filter(Boolean)
}

async function runCommandCheck({ label, command, args = [], env = {}, logTag }) {
  logs.push(`${label} check started`)

  return new Promise((resolve) => {
    const checkErrors = []
    const checkLogs = []
    const resolvedCommand = command === 'npm'
      ? getPreferredNpmCommand()
      : command === 'npx'
        ? getPreferredNpxCommand()
        : command

    const proc = spawn(resolvedCommand, args, {
      cwd: APP_ROOT,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe']
    })

    const appendLog = (line, isError = false) => {
      if (!line) return
      checkLogs.push(line)
      logs.push(`[${logTag}] ${line}`)
      if (isError && !/deprecated|experimental/i.test(line)) {
        checkErrors.push(line)
      }
    }

    proc.stdout.on('data', (data) => {
      appendLog(decodeOutput(data).trim(), false)
    })

    proc.stderr.on('data', (data) => {
      appendLog(decodeOutput(data).trim(), true)
    })

    proc.on('close', (code) => {
      if (code === 0 && checkErrors.length === 0) {
        resolve({
          status: 'SUCCESS',
          message: `${label} completed successfully`,
          errors: [],
          logs: checkLogs
        })
        return
      }

      resolve({
        status: 'FAILED',
        message: `${label} failed (exit code: ${code})`,
        errors: checkErrors.length > 0 ? checkErrors : [`${label} exited with code ${code}`],
        logs: checkLogs
      })
    })

    proc.on('error', (err) => {
      logs.push(`${label} process error: ${err.message}`)
      resolve({
        status: 'FAILED',
        message: `${label} process error: ${err.message}`,
        errors: [err.message],
        logs: checkLogs
      })
    })
  })
}

async function runLintCheck() {
  const pkgJson = readPackageJson()
  const lintScript = getScriptCommand(pkgJson, 'lint')

  if (lintScript) {
    return runCommandCheck({
      label: 'Lint',
      command: 'npm',
      args: ['run', 'lint'],
      logTag: 'LINT'
    })
  }

  if (!hasEslintConfig(pkgJson)) {
    return {
      status: 'SKIPPED',
      message: 'Lint skipped: no eslint config or lint script found',
      errors: [],
      logs: []
    }
  }

  return runCommandCheck({
    label: 'Lint',
    command: 'npx',
    args: ['eslint', '.'],
    logTag: 'LINT'
  })
}

async function runTypeCheck() {
  const pkgJson = readPackageJson()
  const typecheckScript = getScriptCommand(pkgJson, 'typecheck')

  if (typecheckScript) {
    return runCommandCheck({
      label: 'Typecheck',
      command: 'npm',
      args: ['run', 'typecheck'],
      logTag: 'TYPECHECK'
    })
  }

  if (!hasTsConfig()) {
    return {
      status: 'SKIPPED',
      message: 'Typecheck skipped: no tsconfig.json or typecheck script found',
      errors: [],
      logs: []
    }
  }

  return runCommandCheck({
    label: 'Typecheck',
    command: 'npx',
    args: ['tsc', '--noEmit'],
    logTag: 'TYPECHECK'
  })
}

/**
 * 扫描并更新 .axhub/make/entries.json
 * 确保新创建的目录被包含在入口列表中
 */
async function scanEntries() {
  logs.push('Scanning entries...')

  return new Promise((resolve) => {
    const scanProcess = spawn(process.execPath, ['scripts/scan-entries.js'], {
      cwd: APP_ROOT,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    scanProcess.stdout.on('data', (data) => {
      const text = decodeOutput(data).trim()
      if (text) logs.push(`[SCAN] ${text}`)
    })

    scanProcess.stderr.on('data', (data) => {
      const text = decodeOutput(data).trim()
      if (text) logs.push(`[SCAN ERROR] ${text}`)
    })

    scanProcess.on('close', (code) => {
      if (code === 0) {
        logs.push('Entry scanning completed')
        resolve({ success: true })
      } else {
        logs.push(`Entry scanning failed with exit code ${code}`)
        resolve({ success: false })
      }
    })

    scanProcess.on('error', (err) => {
      logs.push(`Entry scanning error: ${err.message}`)
      resolve({ success: false })
    })
  })
}

/**
 * 执行独立构建校验
 * 针对指定的入口 key 执行单独构建，不是全量构建
 */
async function runBuildCheck(entryKey) {
  const originalEntryKey = String(entryKey ?? '').trim()
  logs.push(`Starting build check for entry: ${originalEntryKey || '(auto)'}`)

  // 先扫描入口，确保 .axhub/make/entries.json 是最新的
  const scanResult = await scanEntries()
  if (!scanResult.success) {
    return {
      status: 'FAILED',
      message: 'Failed to scan entries before build',
      errors: ['Entry scanning failed'],
      logs: []
    }
  }

  const resolvedEntryKey = originalEntryKey || resolveDefaultEntryKey()
  if (!resolvedEntryKey) {
    logs.push('Build check skipped: no entry key resolved')
    return {
      status: 'SKIPPED',
      message: 'Build check skipped: no entry key resolved',
      errors: [],
      logs: []
    }
  }

  return new Promise((resolve) => {
    const buildErrors = []
    const buildLogs = []
    const npxCommand = getPreferredNpxCommand()

    // 使用 ENTRY_KEY 环境变量触发单独构建
    const buildProcess = spawn(npxCommand, ['vite', 'build'], {
      cwd: APP_ROOT,
      env: { ...process.env, ENTRY_KEY: resolvedEntryKey },
      stdio: ['ignore', 'pipe', 'pipe']
    })

    buildProcess.stdout.on('data', (data) => {
      const text = decodeOutput(data).trim()
      if (text) {
        buildLogs.push(text)
        logs.push(`[BUILD] ${text}`)
      }
    })

    buildProcess.stderr.on('data', (data) => {
      const text = decodeOutput(data).trim()
      if (text) {
        buildLogs.push(text)
        logs.push(`[BUILD ERROR] ${text}`)
        // 捕获构建错误
        if (/error|failed/i.test(text) && !/deprecated|experimental/i.test(text)) {
          buildErrors.push(text)
        }
      }
    })

    buildProcess.on('close', (code) => {
      if (code === 0 && buildErrors.length === 0) {
        logs.push(`Build check completed successfully for ${resolvedEntryKey}`)
        resolve({
          status: 'SUCCESS',
          message: `Build completed successfully for ${resolvedEntryKey}`,
          errors: [],
          logs: buildLogs
        })
      } else {
        logs.push(`Build check failed for ${resolvedEntryKey} with exit code ${code}`)
        resolve({
          status: 'FAILED',
          message: `Build failed for ${resolvedEntryKey} (exit code: ${code})`,
          errors: buildErrors.length > 0 ? buildErrors : [`Build process exited with code ${code}`],
          logs: buildLogs
        })
      }
    })

    buildProcess.on('error', (err) => {
      logs.push(`Build process error: ${err.message}`)
      resolve({
        status: 'FAILED',
        message: `Build process error: ${err.message}`,
        errors: [err.message],
        logs: buildLogs
      })
    })
  })
}

function resolveDefaultEntryKey() {
  try {
    const entriesPath = path.resolve(APP_ROOT, '.axhub/make/entries.json')
    if (!fs.existsSync(entriesPath)) return null
    const raw = JSON.parse(fs.readFileSync(entriesPath, 'utf8'))
    const jsEntries = raw && typeof raw === 'object' ? (raw.js || {}) : {}
    const keys = Object.keys(jsEntries || {}).filter(Boolean).sort((a, b) => a.localeCompare(b))
    if (keys.length === 0) return null

    const pickFromPrefix = (prefix) => keys.find((k) => k.startsWith(prefix))
    return (
      pickFromPrefix('prototypes/') ||
      pickFromPrefix('themes/') ||
      keys[0] ||
      null
    )
  } catch (err) {
    logs.push(`Failed to resolve default entry key: ${err.message}`)
    return null
  }
}

/**
 * 从页面路径推断入口 key
 * 例如：/prototypes/ref-app-home -> prototypes/ref-app-home
 */
function getEntryKeyFromPath(pagePath) {
  // 移除开头的斜杠
  return pagePath.replace(/^\//, '')
}

/* ================= 主流程 ================= */
async function main() {
  try {
    // 获取服务器信息
    const serverInfo = await getServerInfo()

    // 如果没有端口信息，等待服务器启动
    if (!serverInfo) {
      logs.push('Waiting for server to start...')
      // 启动服务器并等待
      const viteProcess = startOrAttachVite()

      // 等待 .axhub/make/.dev-server-info.json 文件生成
      const newServerInfo = await waitForServerInfo()

      if (!newServerInfo) {
        return jsonExit(addUrls({
          status: 'ERROR',
          phase: 'server',
          message: 'Server failed to start - no port information available',
          url: CONFIG.pagePath,
          errors: ['Server did not write port information within timeout'],
          logs
        }, null), 1)
      }

      // 使用新获取的服务器信息
      const accessibleHost = getAccessibleHost(newServerInfo)
      const pageUrl = `http://${accessibleHost}:${newServerInfo.port}${CONFIG.pagePath}`

      logs.push(`Target URL: ${pageUrl}`)
      logs.push(`Server info: port=${newServerInfo.port}, host=${newServerInfo.host}`)

      // 继续后续流程...
      await continueWithServerInfo(newServerInfo, pageUrl, viteProcess)
    } else {
      const accessibleHost = getAccessibleHost(serverInfo)
      const pageUrl = `http://${accessibleHost}:${serverInfo.port}${CONFIG.pagePath}`

      logs.push(`Target URL: ${pageUrl}`)
      logs.push(`Server info: port=${serverInfo.port}, host=${serverInfo.host}`)

      // 继续后续流程...
      await continueWithServerInfo(serverInfo, pageUrl, null)
    }
  } catch (err) {
    const serverInfo = await getServerInfo({ validate: false })
    jsonExit(addUrls({
      status: 'ERROR',
      phase: 'server',
      message: err.message,
      url: CONFIG.pagePath,
      errors: [String(err)],
      logs
    }, serverInfo), 1)
  }
}

async function continueWithServerInfo(serverInfo, pageUrl, viteProcess) {
  try {
    // 步骤 1: 执行 lint 检查
    const lintResult = await runLintCheck()
    if (lintResult.status === 'FAILED') {
      return jsonExit(addUrls({
        status: 'ERROR',
        phase: 'lint',
        message: lintResult.message,
        url: pageUrl,
        errors: lintResult.errors,
        logs,
        lintCheck: lintResult,
        checks: buildChecksSummary({ lintResult })
      }, serverInfo), 1)
    }

    // 步骤 2: 执行 typecheck 检查（除非指定 --skip-typecheck）
    let typeCheckResult = null
    if (!CONFIG.skipTypecheck) {
      typeCheckResult = await runTypeCheck()
      if (typeCheckResult.status === 'FAILED') {
        return jsonExit(addUrls({
          status: 'ERROR',
          phase: 'typecheck',
          message: typeCheckResult.message,
          url: pageUrl,
          errors: typeCheckResult.errors,
          logs,
          lintCheck: lintResult,
          typeCheck: typeCheckResult,
          checks: buildChecksSummary({ lintResult, typeCheckResult })
        }, serverInfo), 1)
      }
    } else {
      logs.push('Typecheck skipped (--skip-typecheck flag)')
      typeCheckResult = {
        status: 'SKIPPED',
        message: 'Typecheck skipped (--skip-typecheck flag)',
        errors: [],
        logs: []
      }
    }

    // 步骤 3: 执行构建校验（除非指定 --skip-build）
    let buildResult = null
    if (!CONFIG.skipBuild) {
      const entryKey = getEntryKeyFromPath(CONFIG.pagePath)
      logs.push(`Build check enabled for entry: ${entryKey}`)
      buildResult = await runBuildCheck(entryKey)

      // 如果构建失败，直接返回错误
      if (buildResult.status === 'FAILED') {
        return jsonExit(addUrls({
          status: 'ERROR',
          phase: 'build',
          message: buildResult.message,
          url: pageUrl,
          errors: buildResult.errors,
          logs,
          buildCheck: buildResult,
          lintCheck: lintResult,
          typeCheck: typeCheckResult,
          checks: buildChecksSummary({ lintResult, typeCheckResult, buildResult })
        }, serverInfo), 1)
      }
    } else {
      logs.push('Build check skipped (--skip-build flag)')
      buildResult = {
        status: 'SKIPPED',
        message: 'Build check skipped (--skip-build flag)',
        errors: [],
        logs: []
      }
    }

    // 步骤 4: 开发服务器校验
    let activeServerInfo = serverInfo
    let activePageUrl = pageUrl
    const accessibleHost = getAccessibleHost(activeServerInfo)

    // 检查服务器是否已经在运行
    const serverAlreadyRunning = await isServerAlive(`http://${accessibleHost}:${activeServerInfo.port}`)

    let viteChild = viteProcess
    if (!serverAlreadyRunning && !viteChild) {
      logs.push('Server not running, starting Vite...')
      viteChild = startOrAttachVite()
      const refreshedServerInfo = await waitForServerInfo()
      if (!refreshedServerInfo) {
        if (viteChild) viteChild.kill()
        return jsonExit(addUrls({
          status: 'ERROR',
          phase: 'server',
          message: 'Server failed to start - no fresh port information available',
          url: CONFIG.pagePath,
          errors: ['Server did not write reachable port information within timeout'],
          logs,
          buildCheck: buildResult,
          lintCheck: lintResult,
          typeCheck: typeCheckResult,
          checks: buildChecksSummary({ lintResult, typeCheckResult, buildResult })
        }, null), 1)
      }
      activeServerInfo = refreshedServerInfo
      activePageUrl = getTargetUrl(activeServerInfo, CONFIG.pagePath)
      logs.push(`Refreshed target URL: ${activePageUrl}`)
      logs.push(`Refreshed server info: port=${activeServerInfo.port}, host=${activeServerInfo.host}`)
    } else {
      logs.push('Server already running, skipping start')
    }

    // 等待页面可访问
    const pageReachable = await waitForPage(activePageUrl)
    if (!pageReachable) {
      if (viteChild) viteChild.kill()
      return jsonExit(addUrls({
        status: 'TIMEOUT',
        phase: 'page',
        message: 'Page never became reachable',
        url: activePageUrl,
        errors,
        logs,
        buildCheck: buildResult,
        lintCheck: lintResult,
        typeCheck: typeCheckResult,
        checks: buildChecksSummary({ lintResult, typeCheckResult, buildResult })
      }, activeServerInfo), 1)
    }

    const websocketResult = await checkWebSocketReady(activeServerInfo)
    logs.push(`WebSocket readiness check: ${websocketResult.url}`)
    if (!websocketResult.ok) {
      if (viteChild) viteChild.kill()
      return jsonExit(addUrls({
        status: 'ERROR',
        phase: 'websocket',
        message: 'Make WebSocket service is not ready',
        url: activePageUrl,
        errors: [websocketResult.error],
        logs,
        buildCheck: buildResult,
        lintCheck: lintResult,
        typeCheck: typeCheckResult,
        checks: buildChecksSummary({ lintResult, typeCheckResult, buildResult }),
        websocketUrl: websocketResult.url
      }, activeServerInfo), 1)
    }
    logs.push('WebSocket readiness confirmed: connected + pong')

    // 等待稳定状态
    const result = await waitForStable(activePageUrl)

    // 清理进程
    if (viteChild) viteChild.kill()

    // 添加构建结果到最终输出
    const finalResult = {
      ...result,
      buildCheck: buildResult,
      lintCheck: lintResult,
      typeCheck: typeCheckResult,
      checks: buildChecksSummary({ lintResult, typeCheckResult, buildResult })
    }

    jsonExit(addUrls(finalResult, activeServerInfo), result.status === 'READY' ? 0 : 1)
  } catch (err) {
    jsonExit(addUrls({
      status: 'ERROR',
      phase: 'server',
      message: err.message,
      url: CONFIG.pagePath,
      errors: [String(err)],
      logs
    }, serverInfo), 1)
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main()
}
