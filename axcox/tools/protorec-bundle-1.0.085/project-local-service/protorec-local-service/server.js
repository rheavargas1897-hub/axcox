const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const esbuild = require('esbuild');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const Module = require('module');
const cheerio = require('cheerio');

const {
  META_ROOT,
  PAGES_ASSETS_ROOT,
  PAGES_ROOT,
  PREVIEW_STATIC_ROOT,
  PROJECT_ROOT,
  WORKSPACE_ROOT
} = require('./generator/config');
const { generatePagePackage } = require('./generator');
const { downloadAssets } = require('./scripts/assets_dl');
const { cleanAndSemanticize } = require('./scripts/cleaner');

const SERVICE_ROOT = __dirname;
const CAPTURE_ROOT = path.join(WORKSPACE_ROOT, 'temp_proto');
const RESTORE_ROOT = PAGES_ROOT;
const DEFAULT_PORT = 3001;
const GENERIC_RESTORE_SEGMENTS = new Set(['index', 'home', 'page', 'list', 'detail', 'view', 'main']);
const HEALTH_PROTOCOL_VERSION = 2;
const KEEP_CAPTURE_ARTIFACTS = true;
const PROCESS_STARTED_AT = Date.now();
const MULTI_TAB_RESTORE_SESSIONS = new Map();
const SAVE_TASKS = new Map();

function loadLatestRestoreModule() {
  delete require.cache[require.resolve('./scripts/restore')];
  return require('./scripts/restore');
}

function createSaveTask(runId) {
  const controller = new AbortController();
  const task = {
    runId,
    status: 'running',
    phase: 'save',
    message: '正在同步资源与代码...',
    currentItemTitle: '',
    progressText: '',
    detail: '',
    reason: '',
    controller,
    projectDir: '',
    restoreDir: '',
    metadata: {},
    captureVariant: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  SAVE_TASKS.set(runId, task);
  return task;
}

function getSaveTask(runId) {
  const normalizedRunId = String(runId || '').trim();
  return normalizedRunId ? SAVE_TASKS.get(normalizedRunId) || null : null;
}

function updateSaveTask(runId, patch = {}) {
  const task = getSaveTask(runId);
  if (!task) {
    return null;
  }

  Object.assign(task, patch, { updatedAt: Date.now() });
  return task;
}

function cancelSaveTask(runId, reason = 'manual') {
  const task = getSaveTask(runId);
  if (!task) {
    return null;
  }

  task.reason = reason;
  task.status = 'canceled';
  task.message = reason === 'popup_closed' ? '已因关闭弹窗取消当前同步' : '已取消当前同步';
  task.updatedAt = Date.now();
  if (!task.controller.signal.aborted) {
    task.controller.abort(new Error(task.message));
  }
  return task;
}

function clearSaveTaskLater(runId) {
  if (!runId) {
    return;
  }

  setTimeout(() => {
    SAVE_TASKS.delete(runId);
  }, 60 * 1000);
}

function throwIfTaskCanceled(task) {
  if (!task) {
    return;
  }

  if (task.controller.signal.aborted) {
    const reasonMessage = task.reason === 'popup_closed' ? '已因关闭弹窗取消当前同步' : '当前同步已取消';
    const error = new Error(reasonMessage);
    error.name = 'AbortError';
    throw error;
  }
}

function createTaskProgressReporter(runId) {
  return (patch = {}) => {
    const task = updateSaveTask(runId, patch);
    throwIfTaskCanceled(task);
    return task;
  };
}

const GLOBAL_PREVIEW_PLACEHOLDER_STYLE = `<style>
input::placeholder { color: #bfbfbf !important; -webkit-text-fill-color: #bfbfbf !important; opacity: 1 !important; }
textarea::placeholder { color: #bfbfbf !important; -webkit-text-fill-color: #bfbfbf !important; opacity: 1 !important; }
input::-webkit-input-placeholder { color: #bfbfbf !important; -webkit-text-fill-color: #bfbfbf !important; opacity: 1 !important; }
textarea::-webkit-input-placeholder { color: #bfbfbf !important; -webkit-text-fill-color: #bfbfbf !important; opacity: 1 !important; }
input::-moz-placeholder { color: #bfbfbf !important; opacity: 1 !important; }
textarea::-moz-placeholder { color: #bfbfbf !important; opacity: 1 !important; }
.hammer-input::placeholder { color: #bfbfbf !important; -webkit-text-fill-color: #bfbfbf !important; opacity: 1 !important; }
.hammer-input::-webkit-input-placeholder { color: #bfbfbf !important; -webkit-text-fill-color: #bfbfbf !important; opacity: 1 !important; }
.hammer-input::-moz-placeholder { color: #bfbfbf !important; opacity: 1 !important; }
.ant-input::placeholder { color: #bfbfbf !important; -webkit-text-fill-color: #bfbfbf !important; opacity: 1 !important; }
.ant-input::-webkit-input-placeholder { color: #bfbfbf !important; -webkit-text-fill-color: #bfbfbf !important; opacity: 1 !important; }
.ant-input::-moz-placeholder { color: #bfbfbf !important; opacity: 1 !important; }
</style>`;

const app = express();
app.use(cors());
app.use(express.json({ limit: '150mb' }));

function applyLocalPreviewNoStoreHeaders(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

const localPreviewStaticOptions = {
  etag: false,
  lastModified: false,
  setHeaders(res) {
    applyLocalPreviewNoStoreHeaders(res);
  }
};

app.use('/temp_proto', express.static(CAPTURE_ROOT, localPreviewStaticOptions));
app.use('/restored', express.static(RESTORE_ROOT, localPreviewStaticOptions));
app.use(PREVIEW_STATIC_ROOT, express.static(PAGES_ROOT, localPreviewStaticOptions));

app.get('/asset-proxy', async (req, res) => {
  const rawUrl = String(req.query.url || '').trim();
  const rawReferer = String(req.query.referer || '').trim();
  if (!rawUrl) {
    res.status(400).json({ error: 'Missing url query parameter.' });
    return;
  }

  let targetUrl;
  try {
    targetUrl = new URL(rawUrl);
  } catch (_error) {
    res.status(400).json({ error: 'Invalid asset URL.' });
    return;
  }

  if (!['http:', 'https:'].includes(targetUrl.protocol)) {
    res.status(400).json({ error: 'Unsupported protocol.' });
    return;
  }

  let referer = `${targetUrl.origin}/`;
  if (rawReferer) {
    try {
      const refererUrl = new URL(rawReferer);
      if (['http:', 'https:'].includes(refererUrl.protocol)) {
        referer = refererUrl.href;
      }
    } catch (_error) {
      referer = `${targetUrl.origin}/`;
    }
  }

  try {
    const upstreamResponse = await axios({
      url: targetUrl.href,
      method: 'GET',
      responseType: 'stream',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Referer: referer,
        Origin: targetUrl.origin,
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      validateStatus: (status) => status >= 200 && status < 400
    });

    const contentType = String(upstreamResponse.headers['content-type'] || '').trim();
    const cacheControl = String(upstreamResponse.headers['cache-control'] || '').trim();
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    res.setHeader('Cache-Control', cacheControl || 'public, max-age=300');
    upstreamResponse.data.on('error', (error) => {
      if (!res.headersSent) {
        res.status(502).end('Asset proxy stream error');
        return;
      }
      res.destroy(error);
    });
    upstreamResponse.data.pipe(res);
  } catch (error) {
    const statusCode = error?.response?.status;
    if (Number.isFinite(statusCode) && statusCode >= 400 && statusCode < 600) {
      res.status(statusCode).json({ error: 'Upstream asset request failed.' });
      return;
    }
    res.status(502).json({ error: 'Failed to proxy asset.' });
  }
});

function requireFromString(code, filename) {
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(process.cwd());
  mod._compile(code, filename);
  return mod.exports;
}

async function loadComponent(entryFilePath) {
  const result = await esbuild.build({
    entryPoints: [entryFilePath],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
    target: ['node18'],
    jsx: 'automatic',
    loader: {
      '.css': 'text',
      '.ts': 'ts',
      '.tsx': 'tsx',
      '.png': 'dataurl',
      '.jpg': 'dataurl',
      '.jpeg': 'dataurl',
      '.gif': 'dataurl',
      '.webp': 'dataurl',
      '.svg': 'dataurl',
      '.ico': 'dataurl',
      '.woff': 'dataurl',
      '.woff2': 'dataurl',
      '.ttf': 'dataurl',
      '.otf': 'dataurl',
      '.eot': 'dataurl'
    },
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    define: { 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development') }
  });

  const outputFile = result.outputFiles?.[0];
  if (!outputFile) throw new Error('Preview bundle build failed: no output file.');
  const exports = requireFromString(outputFile.text, `${path.basename(entryFilePath)}.preview.cjs`);
  return exports?.default || exports;
}

function sanitizeSegment(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'index';
}

function sanitizeReadableSegment(value) {
  const normalized = String(value || '')
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || '';
}

function createShortHash(value) {
  return Buffer.from(String(value || ''))
    .toString('hex')
    .slice(0, 10) || 'root';
}

function buildCaptureRelativePath(pageUrl) {
  const urlObj = new URL(pageUrl);
  const hostSegment = sanitizeSegment(urlObj.hostname.replace(/\./g, '-'));
  const pathSegments = urlObj.pathname
    .split('/')
    .filter(Boolean)
    .map(sanitizeSegment);

  const segments = [hostSegment, ...(pathSegments.length ? pathSegments : ['index'])];

  if (urlObj.search) {
    segments.push(`query-${createShortHash(urlObj.search)}`);
  }

  return path.join(...segments);
}

function buildRestorePageSlug(pageUrl, pageTitle) {
  const urlObj = new URL(pageUrl);
  const rawPathSegments = urlObj.pathname
    .split('/')
    .filter(Boolean)
    .map(sanitizeReadableSegment)
    .filter(Boolean);

  const lastSegment = rawPathSegments[rawPathSegments.length - 1];
  const previousSegment = rawPathSegments[rawPathSegments.length - 2];
  const normalizedLastSegment = sanitizeSegment(lastSegment);
  const normalizedPreviousSegment = sanitizeSegment(previousSegment);
  const titleSegment = sanitizeReadableSegment(pageTitle);
  const hostnameSegment = sanitizeReadableSegment(urlObj.hostname.split('.').slice(0, -1).join('-') || urlObj.hostname);

  if (lastSegment && previousSegment) {
    const shouldComposeWithPrevious = GENERIC_RESTORE_SEGMENTS.has(normalizedLastSegment)
      || /^\d+$/.test(lastSegment)
      || previousSegment.toLowerCase() !== lastSegment.toLowerCase();

    if (shouldComposeWithPrevious && !GENERIC_RESTORE_SEGMENTS.has(normalizedPreviousSegment) && !/^\d+$/.test(previousSegment)) {
      return `${previousSegment}-${lastSegment}`;
    }
  }

  if (lastSegment && !GENERIC_RESTORE_SEGMENTS.has(normalizedLastSegment) && !/^\d+$/.test(lastSegment)) {
    return lastSegment;
  }

  if (titleSegment && !GENERIC_RESTORE_SEGMENTS.has(sanitizeSegment(titleSegment))) {
    return titleSegment;
  }

  return hostnameSegment || `page-${createShortHash(pageUrl)}`;
}

function buildCaptureVariantSlug(captureVariant) {
  if (!captureVariant) {
    return '';
  }

  const explicitSlug = sanitizeReadableSegment(captureVariant.slug);
  if (explicitSlug) {
    return explicitSlug;
  }

  const labelSlug = sanitizeReadableSegment(captureVariant.label);
  if (labelSlug) {
    return labelSlug;
  }

  const variantIndex = Number(captureVariant.index);
  return Number.isFinite(variantIndex) ? `tab-${variantIndex + 1}` : 'tab';
}

async function resolveAvailableRestoreSlug(baseSlug) {
  const sanitizedBaseSlug = sanitizeReadableSegment(baseSlug) || 'page';

  for (let suffix = 0; suffix < 1000; suffix += 1) {
    const candidateSlug = suffix === 0 ? sanitizedBaseSlug : `${sanitizedBaseSlug}-${suffix + 1}`;
    const candidatePath = path.join(RESTORE_ROOT, candidateSlug);
    if (!(await fs.pathExists(candidatePath))) {
      return candidateSlug;
    }
  }

  return `${sanitizedBaseSlug}-${createShortHash(Date.now())}`;
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function toWorkspaceRelativePath(filePath) {
  return toPosixPath(path.relative(WORKSPACE_ROOT, filePath));
}

function toProjectRelativePath(filePath) {
  return toPosixPath(path.relative(PROJECT_ROOT, filePath));
}

function buildCaptureQualityReport(metadata = {}, assetReport = {}) {
  const downloadedAssetCount = Number(assetReport.downloadedAssetCount) || 0;
  const failedAssetCount = Number(assetReport.failedAssetCount)
    || (Array.isArray(assetReport.failedUrls) ? assetReport.failedUrls.length : 0);
  const attemptedAssetCount = Number(assetReport.attemptedAssetCount) || (downloadedAssetCount + failedAssetCount);
  const failedAssetRatio = attemptedAssetCount > 0
    ? Number((failedAssetCount / attemptedAssetCount).toFixed(4))
    : 0;
  const runtimeStyleTextCount = Number(metadata.runtimeStyleTextCount)
    || (Array.isArray(metadata.runtimeStyleTexts) ? metadata.runtimeStyleTexts.length : 0);
  const layoutNodeSnapshotCount = Array.isArray(metadata.layoutNodeSnapshots) ? metadata.layoutNodeSnapshots.length : 0;
  const scrollContainerSnapshotCount = Array.isArray(metadata.scrollContainerSnapshots) ? metadata.scrollContainerSnapshots.length : 0;
  const browserAssetSnapshotCount = Array.isArray(metadata.browserAssetSnapshots) ? metadata.browserAssetSnapshots.length : 0;
  const warmupMetrics = metadata.warmup?.lazyWarmupMetrics || {};
  const warnings = [];
  const clampScore = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

  if (attemptedAssetCount > 0 && failedAssetRatio >= 0.2) {
    warnings.push(`资源下载失败率偏高（${Math.round(failedAssetRatio * 100)}%）`);
  }
  if (layoutNodeSnapshotCount === 0) {
    warnings.push('布局快照为空，复杂布局还原可能不稳定');
  }
  if (runtimeStyleTextCount === 0) {
    warnings.push('运行时样式采样为空，动态样式页面可能出现偏差');
  }

  const assetScore = attemptedAssetCount > 0
    ? clampScore((1 - failedAssetRatio) * 100)
    : 85;
  const runtimeStyleScore = clampScore((runtimeStyleTextCount / 40) * 100);
  const layoutSnapshotScore = clampScore((layoutNodeSnapshotCount / 260) * 100);
  const scrollSnapshotScore = clampScore((scrollContainerSnapshotCount / 24) * 100);
  const browserAssetSnapshotScore = clampScore((browserAssetSnapshotCount / 40) * 100);
  const warmupSignalCount = Object.values(warmupMetrics).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const warmupScore = warmupSignalCount > 0 ? clampScore(65 + Math.log10(warmupSignalCount + 1) * 35) : 50;
  const overallScore = clampScore(
    (assetScore * 0.32)
    + (runtimeStyleScore * 0.16)
    + (layoutSnapshotScore * 0.24)
    + (scrollSnapshotScore * 0.1)
    + (browserAssetSnapshotScore * 0.1)
    + (warmupScore * 0.08)
  );
  const grade = overallScore >= 90
    ? 'A'
    : overallScore >= 80
      ? 'B'
      : overallScore >= 70
        ? 'C'
        : overallScore >= 60
          ? 'D'
          : 'E';

  return {
    attemptedAssetCount,
    downloadedAssetCount,
    failedAssetCount,
    failedAssetRatio,
    runtimeStyleTextCount,
    layoutNodeSnapshotCount,
    scrollContainerSnapshotCount,
    browserAssetSnapshotCount,
    warmupMetrics,
    scoreBreakdown: {
      assetScore,
      runtimeStyleScore,
      layoutSnapshotScore,
      scrollSnapshotScore,
      browserAssetSnapshotScore,
      warmupScore
    },
    overallScore,
    grade,
    warnings
  };
}

function resolveRestoreEntry(relativeRestorePath) {
  const normalizedRelativePath = String(relativeRestorePath || '').replace(/^\/+|\/+$/g, '');
  if (!normalizedRelativePath) {
    throw new Error('缺少预览路径参数 path。');
  }

  const restoreDir = path.resolve(RESTORE_ROOT, normalizedRelativePath);
  const relativeToRoot = path.relative(RESTORE_ROOT, restoreDir);
  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    throw new Error('非法的预览路径。');
  }

  return path.join(restoreDir, 'index.tsx');
}

function resolveTabbedRestoreEntry(relativeRestorePath, tabIndex = 1) {
  const normalizedTabIndex = Number.parseInt(String(tabIndex || 1), 10);
  if (!Number.isFinite(normalizedTabIndex) || normalizedTabIndex <= 1) {
    return resolveRestoreEntry(relativeRestorePath);
  }

  const normalizedRelativePath = String(relativeRestorePath || '').replace(/^\/+|\/+$/g, '');
  const nextSubviewRelativePath = path.posix.join(normalizedRelativePath, 'subviews', `tab-${normalizedTabIndex}`);
  const nextSubviewEntry = path.join(path.resolve(RESTORE_ROOT, nextSubviewRelativePath), 'index.tsx');
  if (fs.existsSync(nextSubviewEntry)) {
    return nextSubviewEntry;
  }

  return resolveRestoreEntry(path.posix.join(normalizedRelativePath, '__tabs__', `tab-${normalizedTabIndex}`));
}

function buildMultiTabSessionKey(sessionId) {
  const normalizedSessionId = String(sessionId || '').trim();
  return normalizedSessionId ? `session:${normalizedSessionId}` : '';
}

async function resolveRestoreTarget({ baseRestoreSlug, relativeCapturePath, metadata = {}, captureVariant = null }) {
  const isMultiTabCapture = !!(metadata.multiTabCapture && captureVariant);
  if (!isMultiTabCapture) {
    const restoreSlug = await resolveAvailableRestoreSlug(baseRestoreSlug);
    return {
      restoreSlug,
      restoreRelativeDir: restoreSlug,
      isMultiTabCapture: false
    };
  }

  const sessionKey = buildMultiTabSessionKey(metadata.multiTabSessionId);
  let restoreSlug = sessionKey ? MULTI_TAB_RESTORE_SESSIONS.get(sessionKey)?.restoreSlug : '';

  if (!restoreSlug) {
    restoreSlug = await resolveAvailableRestoreSlug(baseRestoreSlug);
    if (sessionKey) {
      MULTI_TAB_RESTORE_SESSIONS.set(sessionKey, { restoreSlug });
    }
  }

  const variantIndex = Number(captureVariant.index);
  const restoreRelativeDir = Number.isFinite(variantIndex) && variantIndex > 0
    ? path.posix.join(restoreSlug, 'subviews', `tab-${variantIndex + 1}`)
    : restoreSlug;

  return {
    restoreSlug,
    restoreRelativeDir,
    isMultiTabCapture: true
  };
}

function finalizeRestoreTargetSession(metadata = {}, captureVariant = null) {
  const sessionKey = buildMultiTabSessionKey(metadata.multiTabSessionId);
  if (!sessionKey || !captureVariant) {
    return;
  }

  const variantIndex = Number(captureVariant.index);
  const total = Number(captureVariant.total);
  if (Number.isFinite(variantIndex) && Number.isFinite(total) && variantIndex >= total - 1) {
    MULTI_TAB_RESTORE_SESSIONS.delete(sessionKey);
  }
}

function parseTabRestoreSlug(restoreSlug) {
  const matched = /^(.*?)-tab-(\d+)(?:-(\d+))?$/.exec(String(restoreSlug || ''));
  if (!matched) {
    return null;
  }

  return {
    baseSlug: matched[1],
    tabIndex: Number(matched[2]),
    duplicateSuffix: matched[3] ? `-${matched[3]}` : ''
  };
}

function buildPreviewRestoreBase(restoreSlug) {
  const normalizedSlug = String(restoreSlug || '').replace(/^\/+|\/+$/g, '');
  return `/restored/${normalizedSlug}`;
}

function localizeMergedPreviewReference(referenceValue, restoreSlug) {
  const value = String(referenceValue || '').trim();
  if (!value) {
    return referenceValue;
  }

  if (
    value.startsWith('#')
    || value.startsWith('/')
    || /^(?:[a-z]+:)?\/\//i.test(value)
    || /^(?:data|blob|javascript|mailto|tel):/i.test(value)
  ) {
    return referenceValue;
  }

  const normalizedPath = value.replace(/^\.\//, '').replace(/^\/+/, '');
  if (!/^(?:assets|temp_assets)\//.test(normalizedPath)) {
    return referenceValue;
  }

  return `${buildPreviewRestoreBase(restoreSlug)}/${normalizedPath}`;
}

function rewriteMergedPreviewStyleValue(styleValue, restoreSlug) {
  if (!styleValue || !String(styleValue).includes('url(')) {
    return styleValue;
  }

  return String(styleValue).replace(/url\((['"]?)([^'")]+)\1\)/g, (match, quote, assetUrl) => {
    const localizedUrl = localizeMergedPreviewReference(assetUrl, restoreSlug);
    if (!localizedUrl || localizedUrl === assetUrl) {
      return match;
    }

    return `url(${quote}${localizedUrl}${quote})`;
  });
}

function rewriteMergedPreviewSrcset(srcsetValue, restoreSlug) {
  if (!srcsetValue) {
    return srcsetValue;
  }

  return String(srcsetValue)
    .split(',')
    .map((entry) => {
      const parts = entry.trim().split(/\s+/);
      const assetUrl = parts.shift();
      const descriptor = parts.join(' ');
      const localizedUrl = localizeMergedPreviewReference(assetUrl, restoreSlug);
      return [localizedUrl || assetUrl, descriptor].filter(Boolean).join(' ');
    })
    .join(', ');
}

function stripSiblingGlobalRootRules(styleValue) {
  if (!styleValue) {
    return styleValue;
  }

  return String(styleValue)
    .replace(/(?:html|body|:root)(?:\s*,\s*(?:html|body|:root))*\s*\{[^{}]*\}/g, '')
    .trim();
}

function rewriteMergedPreviewMarkup(markup, restoreSlug) {
  if (!markup || !restoreSlug) {
    return markup;
  }

  const $ = cheerio.load(`<div id="__restore-root">${markup}</div>`, { decodeEntities: false });
  const assetAttributes = ['src', 'href', 'poster', 'data-src', 'data-original', 'data-origin', 'data-url', 'data-lazy-src', 'data-lazyload', 'data-echo'];

  assetAttributes.forEach((attributeName) => {
    $(`[${attributeName}]`).each((_, element) => {
      const $element = $(element);
      $element.attr(attributeName, localizeMergedPreviewReference($element.attr(attributeName), restoreSlug));
    });
  });

  $('[srcset]').each((_, element) => {
    const $element = $(element);
    $element.attr('srcset', rewriteMergedPreviewSrcset($element.attr('srcset'), restoreSlug));
  });

  $('[style*="url("]').each((_, element) => {
    const $element = $(element);
    $element.attr('style', rewriteMergedPreviewStyleValue($element.attr('style'), restoreSlug));
  });

  $('style').each((_, element) => {
    const $element = $(element);
    $element.html(rewriteMergedPreviewStyleValue($element.html() || '', restoreSlug));
  });

  return $('#__restore-root').html() || markup;
}

function parseInlineStyleDeclarations(styleText) {
  return String(styleText || '')
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const separatorIndex = entry.indexOf(':');
      if (separatorIndex < 0) {
        return null;
      }

      const property = entry.slice(0, separatorIndex).trim().toLowerCase();
      const value = entry.slice(separatorIndex + 1).trim();
      if (!property || !value) {
        return null;
      }

      return [property, value];
    })
    .filter(Boolean);
}

function stringifyInlineStyleDeclarations(declarations) {
  return declarations
    .map(([property, value]) => `${property}:${value}`)
    .join(';');
}

function extractPixelStyleValue(styleMap, propertyName) {
  const value = styleMap.get(propertyName);
  if (!value) {
    return 0;
  }

  const matched = /(-?\d+(?:\.\d+)?)px/i.exec(value);
  return matched ? Number.parseFloat(matched[1]) : 0;
}

function sanitizePreviewMarkupInheritedTypography(markup) {
  return markup;
}

function sanitizeRootSnapshotPreviewHead(previewHead) {
  return previewHead;
}

function appendGlobalPreviewPlaceholderStyle(previewHead) {
  const normalizedPreviewHead = String(previewHead || '');
  if (normalizedPreviewHead.includes('-webkit-text-fill-color: #bfbfbf !important;')) {
    return normalizedPreviewHead;
  }

  return [normalizedPreviewHead, GLOBAL_PREVIEW_PLACEHOLDER_STYLE].filter(Boolean).join('\n');
}

function extractBestTabPanelMarkup(markup) {
  if (!markup) {
    return null;
  }

  const panelSelector = '.ant-tabs-tabpane, .el-tab-pane, .tab-pane, .hammer-tabs-tabpane, [role="tabpanel"]';
  const $ = cheerio.load(`<div id="__restore-root">${markup}</div>`, { decodeEntities: false });
  const panels = $(panelSelector).toArray();
  if (!panels.length) {
    return null;
  }

  const scoredPanels = panels.map((panel) => {
    const $panel = $(panel);
    const className = $panel.attr('class') || '';
    const style = $panel.attr('style') || '';
    const textLength = $panel.text().trim().length;
    const htmlLength = ($panel.html() || '').trim().length;
    const isActive = /active|selected|current/i.test(className)
      || $panel.attr('aria-hidden') === 'false'
      || (!/display\s*:\s*none/i.test(style) && !$panel.attr('hidden'));

    return {
      score: (isActive ? 100000 : 0) + htmlLength + textLength,
      markup: $.html($panel)
    };
  });

  scoredPanels.sort((left, right) => right.score - left.score);
  return scoredPanels[0]?.markup || null;
}

async function loadRenderedComponentMarkup(entryFilePath) {
  const Component = await loadComponent(entryFilePath);
  const previewMarkup = typeof Component.previewBodyMarkup === 'string' && Component.previewBodyMarkup.trim()
    ? Component.previewBodyMarkup
    : ReactDOMServer.renderToString(React.createElement(Component));

  return {
    Component,
    previewMarkup
  };
}

function extractStyleNodesFromPreviewHead(previewHead, restoreSlug, options = {}) {
  if (!previewHead || !String(previewHead).trim()) {
    return [];
  }

  const { stripGlobalRootRules = false } = options;
  const $ = cheerio.load(`<head>${previewHead}</head>`, { decodeEntities: false });
  $('style').each((_, element) => {
    const $element = $(element);
    const rewrittenStyle = rewriteMergedPreviewStyleValue($element.html() || '', restoreSlug);
    const nextStyle = stripGlobalRootRules ? stripSiblingGlobalRootRules(rewrittenStyle) : rewrittenStyle;
    $element.html(nextStyle);
  });

  return $('style')
    .toArray()
    .map((node) => $.html(node))
    .filter((styleNode) => styleNode && !/^<style>\s*<\/style>$/.test(styleNode.trim()));
}

function mergePreviewHeads(primaryPreviewHead, siblingPreviewEntries) {
  const primaryHead = String(primaryPreviewHead || '');
  const existingStyleNodes = new Set(extractStyleNodesFromPreviewHead(primaryHead));
  const siblingStyleNodes = siblingPreviewEntries.flatMap((entry) => extractStyleNodesFromPreviewHead(
    entry?.previewHead,
    entry?.restoreSlug,
    { stripGlobalRootRules: true }
  ));
  const appendedStyleNodes = siblingStyleNodes.filter((styleNode) => {
    if (!styleNode || existingStyleNodes.has(styleNode)) {
      return false;
    }

    existingStyleNodes.add(styleNode);
    return true;
  });

  if (!appendedStyleNodes.length) {
    return primaryHead;
  }

  return [primaryHead, ...appendedStyleNodes].filter(Boolean).join('\n');
}

function mergePreviewBodyClassNames(primaryClassName, siblingClassNames) {
  const classNames = [primaryClassName, ...siblingClassNames]
    .flatMap((value) => String(value || '').split(/\s+/))
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(new Set(classNames)).join(' ');
}

function parsePreviewBodyDataAttributes(attributeMarkup) {
  const $ = cheerio.load(`<body${String(attributeMarkup || '')}></body>`, { decodeEntities: false });
  const attributes = $('body').get(0)?.attribs || {};

  return Object.entries(attributes).filter(([name]) => name.startsWith('data-'));
}

function mergePreviewBodyDataAttributes(primaryAttributeMarkup, siblingAttributeMarkups) {
  const mergedAttributes = new Map(parsePreviewBodyDataAttributes(primaryAttributeMarkup));

  siblingAttributeMarkups.forEach((attributeMarkup) => {
    parsePreviewBodyDataAttributes(attributeMarkup).forEach(([name, value]) => {
      if (!mergedAttributes.has(name)) {
        mergedAttributes.set(name, value);
      }
    });
  });

  return Array.from(mergedAttributes.entries())
    .map(([name, value]) => ` ${name}="${String(value).replace(/"/g, '&quot;')}"`)
    .join('');
}

async function annotateSiblingTabPreviewPaths(relativeRestorePath, currentAppHtml) {
  const normalizedRelativePath = String(relativeRestorePath || '').replace(/^\/+|\/+$/g, '');
  if (!normalizedRelativePath) {
    return currentAppHtml;
  }

  const tabSelector = '.ant-tabs-tab, .el-tabs__item, .hammer-tabs-tab, [role="tab"]';
  const clickTargetSelector = '.ant-tabs-tab-btn, .hammer-tabs-tab-btn, [role="tab"]';
  const $ = cheerio.load(`<div id="__restore-root">${currentAppHtml}</div>`, { decodeEntities: false });
  const tabs = $('#__restore-root')
    .find(tabSelector)
    .toArray()
    .filter((element) => {
      const $element = $(element);
      const label = $element.text().trim();
      if (!label) {
        return false;
      }

      if ($element.attr('role') === 'tab') {
        const wrapper = $element.closest('.ant-tabs-tab, .el-tabs__item, .hammer-tabs-tab');
        if (wrapper.length && wrapper[0] !== element) {
          return false;
        }
      }

      return true;
    });

  if (tabs.length < 2) {
    return currentAppHtml;
  }

  for (let tabOrder = 1; tabOrder <= tabs.length; tabOrder += 1) {
    const tab = tabs[tabOrder - 1];
    const siblingEntryFilePath = resolveTabbedRestoreEntry(normalizedRelativePath, tabOrder);
    if (!(await fs.pathExists(siblingEntryFilePath))) {
      continue;
    }

    const previewPath = tabOrder <= 1
      ? `/preview?path=${encodeURIComponent(normalizedRelativePath)}`
      : `/preview?path=${encodeURIComponent(normalizedRelativePath)}&tab=${tabOrder}`;
    const $tab = $(tab);
    const $clickTarget = $tab.is('[role="tab"]')
      ? $tab
      : $tab.find(clickTargetSelector).first();

    $tab.attr('data-restore-preview-path', previewPath);
    if ($clickTarget.length) {
      $clickTarget.attr('data-restore-preview-path', previewPath);
    }
  }

  return $('#__restore-root').html() || currentAppHtml;
}

async function mergeSiblingTabPanels(relativeRestorePath, currentComponent, currentAppHtml) {
  const parsedSlug = parseTabRestoreSlug(relativeRestorePath);
  if (!parsedSlug) {
    return {
      appHtml: currentAppHtml,
      siblingPreviewEntries: []
    };
  }

  const tabSelector = '.ant-tabs-tab, .el-tabs__item, .hammer-tabs-tab, [role="tab"]';
  const panelSelector = '.ant-tabs-tabpane, .el-tab-pane, .tab-pane, .hammer-tabs-tabpane, [role="tabpanel"]';
  const $ = cheerio.load(`<div id="__restore-root">${currentAppHtml}</div>`, { decodeEntities: false });
  const tabs = $('#__restore-root').find(tabSelector);
  const existingPanels = $('#__restore-root').find(panelSelector);

  if (tabs.length < 2 || !existingPanels.length) {
    return {
      appHtml: currentAppHtml,
      siblingPreviewEntries: []
    };
  }

  const panelParent = existingPanels.first().parent();
  if (!panelParent.length) {
    return {
      appHtml: currentAppHtml,
      siblingPreviewEntries: []
    };
  }

  const mergedPanels = [];
  const siblingPreviewEntries = [];
  const currentPanelMarkup = extractBestTabPanelMarkup(
    typeof currentComponent.previewBodyMarkup === 'string' && currentComponent.previewBodyMarkup.trim()
      ? currentComponent.previewBodyMarkup
      : currentAppHtml
  );

  for (let tabOrder = 1; tabOrder <= tabs.length; tabOrder += 1) {
    if (tabOrder === parsedSlug.tabIndex) {
      mergedPanels.push(currentPanelMarkup);
      continue;
    }

    const siblingSlug = `${parsedSlug.baseSlug}-tab-${tabOrder}${parsedSlug.duplicateSuffix}`;
    const siblingEntryFilePath = resolveRestoreEntry(siblingSlug);
    if (!(await fs.pathExists(siblingEntryFilePath))) {
      mergedPanels.push(null);
      continue;
    }

    const { Component, previewMarkup } = await loadRenderedComponentMarkup(siblingEntryFilePath);
    const siblingRestoreSlug = typeof Component.restoreSlug === 'string' && Component.restoreSlug.trim()
      ? Component.restoreSlug.trim()
      : siblingSlug;
    siblingPreviewEntries.push({
      restoreSlug: siblingRestoreSlug,
      previewHead: Component.previewHead,
      previewBodyClassName: Component.previewBodyClassName,
      previewBodyDataAttributes: Component.previewBodyDataAttributes
    });
    mergedPanels.push(rewriteMergedPreviewMarkup(extractBestTabPanelMarkup(previewMarkup), siblingRestoreSlug));
  }

  if (mergedPanels.filter(Boolean).length < 2) {
    return {
      appHtml: currentAppHtml,
      siblingPreviewEntries
    };
  }

  existingPanels.remove();
  mergedPanels.forEach((panelMarkup) => {
    if (panelMarkup) {
      panelParent.append(panelMarkup);
    }
  });

  return {
    appHtml: $('#__restore-root').html() || currentAppHtml,
    siblingPreviewEntries
  };
}

app.get('/', async (_req, res) => {
  res.send({
    status: 'ok',
    service: 'proto-capture-restore-local-service',
    port: PORT,
    protocolVersion: HEALTH_PROTOCOL_VERSION,
    startedAt: PROCESS_STARTED_AT
  });
});

app.get('/health', async (req, res) => {
  await fs.ensureDir(CAPTURE_ROOT);
  await fs.ensureDir(RESTORE_ROOT);
  await fs.ensureDir(PAGES_ASSETS_ROOT);
  await fs.ensureDir(META_ROOT);
  res.send({
    status: 'ok',
    port: PORT,
    protocolVersion: HEALTH_PROTOCOL_VERSION,
    startedAt: PROCESS_STARTED_AT,
    captureRoot: toProjectRelativePath(CAPTURE_ROOT),
    restoreRoot: toProjectRelativePath(RESTORE_ROOT),
    restoreMetaRoot: toProjectRelativePath(META_ROOT)
  });
});

app.get('/preview', async (req, res) => {
  try {
    const relativeRestorePath = String(req.query.path || '').replace(/^\/+|\/+$/g, '');
    const requestedTab = Number.parseInt(String(req.query.tab || '1'), 10);
    const entryFilePath = resolveTabbedRestoreEntry(relativeRestorePath, requestedTab);
    const { Component } = await loadRenderedComponentMarkup(entryFilePath);
    const renderedAppHtml = ReactDOMServer.renderToString(React.createElement(Component));
    const localizedAppHtml = rewriteMergedPreviewMarkup(renderedAppHtml, relativeRestorePath);
    const appHtml = sanitizePreviewMarkupInheritedTypography(
      await annotateSiblingTabPreviewPaths(relativeRestorePath, localizedAppHtml)
    );
    const basePreviewHead = typeof Component.previewHead === 'string'
      ? Component.previewHead
      : '<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />';
    const previewHead = appendGlobalPreviewPlaceholderStyle(sanitizeRootSnapshotPreviewHead(basePreviewHead));
    
    const { createPreviewScript: latestCreatePreviewScript } = loadLatestRestoreModule();
    const previewScript = latestCreatePreviewScript();
    
    const previewBodyClassName = typeof Component.previewBodyClassName === 'string' && Component.previewBodyClassName.trim()
      ? ` class="${Component.previewBodyClassName.replace(/"/g, '&quot;')}"`
      : '';
    const previewBodyStyleRaw = typeof Component.previewBodyStyle === 'string'
      ? Component.previewBodyStyle.trim()
      : '';
    const mergedBodyStyle = ['margin:0', previewBodyStyleRaw].filter(Boolean).join('; ');
    const previewBodyStyle = ` style="${mergedBodyStyle.replace(/"/g, '&quot;')}"`;
    const previewBodyDataAttributes = typeof Component.previewBodyDataAttributes === 'string'
      ? Component.previewBodyDataAttributes
      : '';

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    applyLocalPreviewNoStoreHeaders(res);
    res.end(`<!doctype html>
<html lang="zh-CN">
  <head>
    ${previewHead}
  </head>
  <body${previewBodyStyle}${previewBodyClassName}${previewBodyDataAttributes}>
    <div id="root">${appHtml}</div>
    <script>${previewScript}</script>
  </body>
</html>`);
  } catch (error) {
    res.status(500).send({ status: 'error', message: error.message });
  }
});

app.get('/save-progress/:runId', (req, res) => {
  const task = getSaveTask(req.params.runId);
  if (!task) {
    res.status(404).send({ status: 'error', message: '未找到对应同步任务。' });
    return;
  }

  res.send({
    status: task.status,
    phase: task.phase,
    message: task.message,
    currentItemTitle: task.currentItemTitle,
    progressText: task.progressText,
    detail: task.detail,
    updatedAt: task.updatedAt
  });
});

app.post('/save-cancel/:runId', (req, res) => {
  const task = cancelSaveTask(req.params.runId, req.body?.reason || 'manual');
  if (!task) {
    res.status(404).send({ status: 'error', message: '未找到对应同步任务。' });
    return;
  }

  res.send({ status: 'success', runId: task.runId, canceled: true });
});

app.post('/save', async (req, res) => {
  const runId = String(req.body?.runId || req.body?.metadata?.syncRunId || '').trim();
  const task = runId ? createSaveTask(runId) : null;
  const reportProgress = runId ? createTaskProgressReporter(runId) : () => null;
  let projectDir = '';
  let restoreDir = '';

  try {
    const { html, url, title, screenshot, stylesheets = [], metadata = {}, captureVariant = null } = req.body;

    console.log('[proto-capture] /save request summary', {
      runId,
      hasHtml: Boolean(html),
      htmlLength: String(html || '').length,
      hasUrl: Boolean(url),
      url: url || '',
      hasTitle: Boolean(title),
      stylesheetCount: Array.isArray(stylesheets) ? stylesheets.length : 0,
      runtimeStyleTextCount: Array.isArray(metadata?.runtimeStyleTexts) ? metadata.runtimeStyleTexts.length : 0,
      layoutNodeSnapshotCount: Array.isArray(metadata?.layoutNodeSnapshots) ? metadata.layoutNodeSnapshots.length : 0,
      scrollContainerSnapshotCount: Array.isArray(metadata?.scrollContainerSnapshots) ? metadata.scrollContainerSnapshots.length : 0,
      browserAssetSnapshotCount: Array.isArray(metadata?.browserAssetSnapshots) ? metadata.browserAssetSnapshots.length : 0,
      chunkedCapture: Boolean(metadata?.chunkedCapture)
    });

    if (
      metadata?.chunkedCapture
      && !Array.isArray(metadata?.runtimeStyleTexts)
      && !Array.isArray(metadata?.layoutNodeSnapshots)
    ) {
      console.warn('[proto-capture] chunked metadata arrived without runtime styles/layout snapshots', {
        runId,
        metadataKeys: Object.keys(metadata || {})
      });
    }

    if (!html || !url) {
      if (task) {
        updateSaveTask(runId, { status: 'error', message: 'html 和 url 为必填项。' });
        clearSaveTaskLater(runId);
      }
      res.status(400).send({ status: 'error', message: 'html 和 url 为必填项。' });
      return;
    }

    if (task) {
      task.metadata = metadata;
      task.captureVariant = captureVariant;
    }

    const relativeCapturePath = buildCaptureRelativePath(url);
    const baseRestoreSlug = buildRestorePageSlug(url, title);
    const { restoreSlug, restoreRelativeDir } = await resolveRestoreTarget({
      baseRestoreSlug,
      relativeCapturePath,
      metadata,
      captureVariant
    });
    projectDir = path.join(CAPTURE_ROOT, relativeCapturePath);
    const aiSnapshotPath = path.join(projectDir, 'ai_snapshot.html');
    const rawHtmlPath = path.join(projectDir, 'source.original.html');
    const localizedHtmlPath = path.join(projectDir, 'index.html');
    const metaPath = path.join(projectDir, 'capture.meta.json');
    restoreDir = path.join(RESTORE_ROOT, restoreRelativeDir);

    if (task) {
      updateSaveTask(runId, { projectDir, restoreDir, phase: 'save', message: '正在同步资源与代码...' });
    }

    req.on('close', () => {
      if (task && task.status === 'running') {
        cancelSaveTask(runId, 'popup_closed');
      }
    });

    await fs.ensureDir(projectDir);
    reportProgress({ phase: 'save', message: '正在同步资源与代码...', currentItemTitle: '保存浏览器快照', detail: '正在写入原始 HTML 与截图' });
    console.log(`\n==========================================`);
    console.log(`🚀 正在拾取已登录页面: ${title}`);
    console.log(`📂 存储路径: ${projectDir}`);

    console.log('--- [1/4] 正在保存浏览器快照...');
    await fs.writeFile(rawHtmlPath, html);

    if (screenshot) {
      const base64Data = screenshot.replace(/^data:image\/png;base64,/, '');
      await fs.writeFile(path.join(projectDir, 'reference_full.png'), base64Data, 'base64');
    }

    console.log('--- [2/4] 正在本地化资源与样式...');
    const localizedResult = await downloadAssets(html, url, projectDir, {
      stylesheets,
      signal: task?.controller.signal,
      onProgress: reportProgress
    });

    reportProgress({ phase: 'save', message: '正在生成 AI 还原快照...', currentItemTitle: '生成 AI 快照', detail: '正在清洗页面结构供 AI 使用' });
    console.log('--- [3/4] 正在生成 AI 还原快照...');
    const cleanedHtml = cleanAndSemanticize(localizedResult.html);
    await fs.writeFile(aiSnapshotPath, cleanedHtml);

    reportProgress({ phase: 'restore', message: '正在整理还原页面...', currentItemTitle: '写入同步索引', detail: '正在写入本地化 HTML 与元数据' });
    console.log('--- [4/4] 正在写入索引与元数据...');
    await fs.writeFile(localizedHtmlPath, localizedResult.html);
    const captureQuality = buildCaptureQualityReport(metadata, localizedResult.assetReport);
    if (captureQuality.warnings.length) {
      console.warn('[proto-capture] capture quality warnings', captureQuality.warnings);
    }

    const restoreResult = await generatePagePackage({
      captureDir: projectDir,
      restoreSlug,
      restoreRelativeDir,
      pageTitle: title,
      pageUrl: url,
      localizedHtml: localizedResult.html,
      assetReport: localizedResult.assetReport,
      metadata,
      captureVariant,
      captureQuality,
      onProgress: reportProgress
    });
    const restorePreviewUrl = `http://localhost:${PORT}/preview?path=${encodeURIComponent(restoreRelativeDir)}`;
    await fs.writeJson(metaPath, {
      title,
      url,
      capturedAt: new Date().toISOString(),
      capturePath: toProjectRelativePath(projectDir),
      restoreTargetPath: toProjectRelativePath(restoreResult.pageDir),
      previewUrl: `http://localhost:${PORT}/temp_proto/${toPosixPath(relativeCapturePath)}/index.html`,
      restorePreviewUrl,
      restoreComponentPath: toProjectRelativePath(restoreResult.entryFilePath),
      restoreAssetsPath: {
        fonts: toProjectRelativePath(restoreResult.fontsDir),
        images: toProjectRelativePath(restoreResult.imagesDir)
      },
      pagesJsonPath: toProjectRelativePath(restoreResult.pagesJsonPath),
      restoreMetaPath: toProjectRelativePath(restoreResult.metaDir),
      qaReportPath: toProjectRelativePath(restoreResult.qaReportPath),
      readyState: restoreResult.readyState,
      editability: restoreResult.pageIR?.editability || null,
      qa: restoreResult.pageIR?.qa || null,
      captureVariant,
      metadata,
      assets: localizedResult.assetReport,
      captureQuality
    }, { spaces: 2 });

    if (!KEEP_CAPTURE_ARTIFACTS) {
      await fs.remove(projectDir);
    }

    let parentDir = path.dirname(projectDir);
    while (!KEEP_CAPTURE_ARTIFACTS && parentDir !== CAPTURE_ROOT && parentDir.startsWith(CAPTURE_ROOT)) {
      try {
        const files = await fs.readdir(parentDir);
        if (files.length === 0) {
          await fs.remove(parentDir);
          parentDir = path.dirname(parentDir);
        } else {
          break;
        }
      } catch (_err) {
        break;
      }
    }

    finalizeRestoreTargetSession(metadata, captureVariant);

    if (task) {
      updateSaveTask(runId, {
        status: 'success',
        phase: 'restore',
        message: '已完成抓取与还原',
        currentItemTitle: '协议页面包已生成',
        progressText: '完成'
      });
      clearSaveTaskLater(runId);
    }

    console.log(`✅ 拾取完成！截图与代码均已同步。`);
    console.log(`==========================================`);

    res.send({
      status: 'success',
      capturePath: toProjectRelativePath(projectDir),
      captureCleanupStatus: KEEP_CAPTURE_ARTIFACTS ? 'kept' : 'deleted',
      restoreTargetPath: toProjectRelativePath(restoreResult.pageDir),
      restorePreviewUrl,
      restoreComponentPath: toProjectRelativePath(restoreResult.entryFilePath),
      restoreAssetsPath: {
        fonts: toProjectRelativePath(restoreResult.fontsDir),
        images: toProjectRelativePath(restoreResult.imagesDir)
      },
      pagesJsonPath: toProjectRelativePath(restoreResult.pagesJsonPath),
      restoreMetaPath: toProjectRelativePath(restoreResult.metaDir),
      qaReportPath: toProjectRelativePath(restoreResult.qaReportPath),
      readyState: restoreResult.readyState,
      editability: restoreResult.pageIR?.editability || null,
      qa: restoreResult.pageIR?.qa || null,
      captureVariant,
      assets: localizedResult.assetReport,
      captureQuality,
      progressTitle: '协议页面包已生成'
    });
  } catch (error) {
    if (task) {
      const isCanceled = error?.name === 'AbortError' || /取消/.test(String(error?.message || ''));
      updateSaveTask(runId, {
        status: isCanceled ? 'canceled' : 'error',
        phase: task.phase || 'save',
        message: isCanceled ? '已取消当前同步' : (error.message || '处理失败'),
        currentItemTitle: '',
        progressText: ''
      });
      clearSaveTaskLater(runId);
    }

    if (projectDir) {
      await fs.remove(projectDir).catch(() => undefined);
    }
    if (task?.metadata && task?.captureVariant) {
      finalizeRestoreTargetSession(task.metadata, task.captureVariant);
    }

    console.error('❌ 处理出错:', error);
    if (error?.name === 'AbortError' || /取消/.test(String(error?.message || ''))) {
      res.status(499).send({ status: 'canceled', message: error.message || '当前同步已取消' });
      return;
    }
    res.status(500).send({ status: 'error', message: error.message });
  }
});

const configuredPort = Number.parseInt(process.env.PORT || '', 10);
const PORT = Number.isFinite(configuredPort) ? configuredPort : DEFAULT_PORT;

const server = app.listen(PORT, () => {
  console.log(`
  **********************************************
  🚀 PM 原型复刻服务器 [登录态兼容版] 已启动！
  📡 监听端口: ${PORT}
  🛠️  模式: 浏览器同步截图 (不再使用后台抓取)
  📦 restore.js 版本: 2026-04-10T11:22 (conservative runtime: evidence-driven tab/carousel activation + heuristic layout fixes opt-in)
  **********************************************
  `);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`❌ 端口 ${PORT} 被占用，请先关闭占用进程或换一个端口启动（例如 PORT=3002 node server.js）。`);
    process.exitCode = 1;
    return;
  }
  console.error('❌ 服务启动失败:', err);
  process.exitCode = 1;
});
