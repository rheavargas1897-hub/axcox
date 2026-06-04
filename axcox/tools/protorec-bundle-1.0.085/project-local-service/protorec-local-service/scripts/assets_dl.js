const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const ASSET_DIR_NAME = 'temp_assets';
const STYLE_DIR_NAME = 'temp_styles';
const MAX_ASSET_RETRY = 3;
const MAX_TEXT_RETRY = 3;
const MAX_STYLESHEET_IMPORT_DEPTH = 4;
const MAX_IMPORTED_STYLESHEET_COUNT = 120;
const MAX_STYLESHEET_BYTES = 2 * 1024 * 1024;

function createAbortError(message = '当前同步已取消') {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}

function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw createAbortError(signal.reason?.message || signal.reason || '当前同步已取消');
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(taskFactory, options = {}) {
  const retries = Math.max(1, Number(options.retries) || 1);
  const signal = options.signal;
  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    throwIfAborted(signal);
    try {
      return await taskFactory(attempt, retries);
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw error;
      }
      lastError = error;
      if (attempt >= retries) {
        throw error;
      }
      await delay(180 * attempt);
    }
  }

  throw lastError || new Error('任务执行失败');
}

function normalizeProtocolRelativeUrl(value) {
  const normalized = String(value || '').trim();
  if (normalized.startsWith('//')) {
    return `https:${normalized}`;
  }
  return normalized;
}

function isSkippableUrl(value) {
  if (!value) {
    return true;
  }

  const trimmed = String(value).trim();
  return !trimmed
    || trimmed.startsWith('data:')
    || trimmed.startsWith('blob:')
    || trimmed.startsWith('javascript:')
    || trimmed.startsWith('#')
    || trimmed.startsWith('about:');
}

function resolveUrl(src, baseUrl, fallbackExtension = '.bin') {
  const normalizedSrc = normalizeProtocolRelativeUrl(src);

  try {
    const urlObject = new URL(normalizedSrc, baseUrl);
    if (!['http:', 'https:'].includes(urlObject.protocol)) {
      return null;
    }

    urlObject.hash = '';
    const absoluteUrl = urlObject.href;

    let extension = path.extname(urlObject.pathname);
    if (!extension || extension.length > 10) {
      extension = fallbackExtension;
    }

    const baseName = path.basename(urlObject.pathname, extension) || 'asset';
    const safeBaseName = baseName.replace(/[^a-z0-9_-]/gi, '-').slice(0, 64) || 'asset';
    const hash = Buffer.from(absoluteUrl).toString('hex').slice(-12);
    const fileName = `${safeBaseName}-${hash}${extension}`;

    return {
      absoluteUrl,
      fileName
    };
  } catch (_error) {
    return null;
  }
}

function inferAcceptByUrl(url) {
  const extension = path.extname(String(url || '').split('?')[0]).toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.avif', '.ico'].includes(extension)) {
    return 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8';
  }

  if (['.woff', '.woff2', '.ttf', '.otf', '.eot'].includes(extension)) {
    return 'font/woff2,font/woff,font/ttf,font/otf,*/*;q=0.5';
  }

  if (extension === '.css') {
    return 'text/css,*/*;q=0.1';
  }

  if (['.mp4', '.webm', '.ogg', '.mp3', '.wav', '.m4a'].includes(extension)) {
    return 'video/*,audio/*,*/*;q=0.5';
  }

  return '*/*';
}

function buildHeaders(referer, accept, targetUrl = '') {
  let resolvedReferer = String(referer || '').trim();
  let origin = '';

  try {
    if (!resolvedReferer && targetUrl) {
      const targetObject = new URL(targetUrl);
      resolvedReferer = `${targetObject.origin}/`;
    }

    if (resolvedReferer) {
      origin = new URL(resolvedReferer).origin;
    }
  } catch (_error) {
    resolvedReferer = '';
    origin = '';
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept: accept,
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    Connection: 'keep-alive'
  };

  if (resolvedReferer) {
    headers.Referer = resolvedReferer;
  }

  if (origin) {
    headers.Origin = origin;
  }

  return headers;
}

function selectRefererForAttempt(preferredReferer, targetUrl, attempt = 1) {
  const candidates = [];
  const normalizedPreferredReferer = String(preferredReferer || '').trim();
  if (normalizedPreferredReferer) {
    candidates.push(normalizedPreferredReferer);
  }

  try {
    const origin = new URL(targetUrl).origin;
    candidates.push(`${origin}/`);
    candidates.push(origin);
  } catch (_error) {
  }

  const normalizedCandidates = Array.from(new Set(candidates.filter(Boolean)));
  if (!normalizedCandidates.length) {
    return normalizedPreferredReferer || '';
  }

  const index = Math.max(0, Math.min(normalizedCandidates.length - 1, Number(attempt || 1) - 1));
  return normalizedCandidates[index];
}

async function streamToFile(readableStream, savePath, signal) {
  await fs.ensureDir(path.dirname(savePath));

  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(savePath);
    const abortHandler = () => {
      const abortError = createAbortError();
      readableStream.destroy(abortError);
      writer.destroy(abortError);
      reject(abortError);
    };

    if (signal) {
      signal.addEventListener('abort', abortHandler, { once: true });
    }

    writer.on('finish', () => {
      if (signal) {
        signal.removeEventListener('abort', abortHandler);
      }
      resolve();
    });

    writer.on('error', (error) => {
      if (signal) {
        signal.removeEventListener('abort', abortHandler);
      }
      reject(error);
    });

    readableStream.on('error', (error) => {
      if (signal) {
        signal.removeEventListener('abort', abortHandler);
      }
      reject(error);
    });

    readableStream.pipe(writer);
  });
}

async function saveBinaryFile(url, savePath, referer, options = {}) {
  const signal = options.signal;
  const retries = Number(options.maxRetries) || MAX_ASSET_RETRY;

  await withRetry(async (attempt) => {
    throwIfAborted(signal);
    const requestReferer = selectRefererForAttempt(referer, url, attempt);
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: 18000,
      signal,
      maxContentLength: 50 * 1024 * 1024,
      headers: buildHeaders(requestReferer, inferAcceptByUrl(url), url)
    });

    try {
      await streamToFile(response.data, savePath, signal);
    } catch (error) {
      await fs.remove(savePath).catch(() => undefined);
      throw error;
    }
  }, { retries, signal });
}

async function requestText(url, referer, options = {}) {
  const signal = options.signal;
  const retries = Number(options.maxRetries) || MAX_TEXT_RETRY;
  const maxBytes = Number(options.maxBytes) || MAX_STYLESHEET_BYTES;

  return withRetry(async (attempt) => {
    throwIfAborted(signal);
    const requestReferer = selectRefererForAttempt(referer, url, attempt);
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'text',
      timeout: 20000,
      signal,
      maxContentLength: maxBytes,
      headers: buildHeaders(requestReferer, 'text/css,*/*;q=0.1', url)
    });

    return response.data;
  }, { retries, signal });
}

function rewriteSrcset(srcset, referer, ensureAsset, assetPrefix = `./${ASSET_DIR_NAME}`) {
  return String(srcset || '')
    .split(',')
    .map((entry) => {
      const parts = entry.trim().split(/\s+/);
      const assetUrl = parts.shift();
      const descriptor = parts.join(' ');
      const fileName = ensureAsset(assetUrl, referer);

      if (!fileName) {
        return entry.trim();
      }

      return [`${assetPrefix}/${fileName}`, descriptor].filter(Boolean).join(' ');
    })
    .join(', ');
}

function upsertInlineStyleDeclaration(styleText, propertyName, value) {
  const property = String(propertyName || '').trim().toLowerCase();
  const normalizedValue = String(value || '').trim();
  if (!property || !normalizedValue) {
    return String(styleText || '');
  }

  const declarations = String(styleText || '')
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean);

  let found = false;
  const updated = declarations.map((entry) => {
    const separatorIndex = entry.indexOf(':');
    if (separatorIndex < 0) {
      return entry;
    }

    const currentProperty = entry.slice(0, separatorIndex).trim().toLowerCase();
    if (currentProperty !== property) {
      return entry;
    }

    found = true;
    return `${property}: ${normalizedValue}`;
  });

  if (!found) {
    updated.push(`${property}: ${normalizedValue}`);
  }

  return updated.join('; ');
}

function replaceFailedAssetReferences(content, failedAssetRegistry, localizedPrefixes = []) {
  if (!content || !(failedAssetRegistry instanceof Map) || failedAssetRegistry.size === 0) {
    return content;
  }

  let nextContent = String(content);

  failedAssetRegistry.forEach((absoluteUrl, fileName) => {
    const normalizedFileName = String(fileName || '').trim();
    const normalizedAbsoluteUrl = String(absoluteUrl || '').trim();
    if (!normalizedFileName || !normalizedAbsoluteUrl) {
      return;
    }

    localizedPrefixes.forEach((prefix) => {
      const normalizedPrefix = String(prefix || '');
      if (!normalizedPrefix) {
        return;
      }

      nextContent = nextContent.split(`${normalizedPrefix}${normalizedFileName}`).join(normalizedAbsoluteUrl);
    });
  });

  return nextContent;
}

async function restoreFailedStylesheetAssetReferences(stylesDir, failedAssetRegistry) {
  if (!(failedAssetRegistry instanceof Map) || failedAssetRegistry.size === 0) {
    return;
  }

  if (!(await fs.pathExists(stylesDir))) {
    return;
  }

  const styleFileNames = await fs.readdir(stylesDir);

  await Promise.all(styleFileNames.map(async (styleFileName) => {
    const styleFilePath = path.join(stylesDir, styleFileName);
    const stats = await fs.stat(styleFilePath);
    if (!stats.isFile()) {
      return;
    }

    const rawCss = await fs.readFile(styleFilePath, 'utf8');
    const normalizedCss = replaceFailedAssetReferences(rawCss, failedAssetRegistry, [
      `../${ASSET_DIR_NAME}/`,
      `./${ASSET_DIR_NAME}/`,
      `${ASSET_DIR_NAME}/`
    ]);

    if (normalizedCss !== rawCss) {
      await fs.writeFile(styleFilePath, normalizedCss);
    }
  }));
}

async function downloadAssets(htmlContent, baseUrl, outputDir, options = {}) {
  const signal = options.signal;
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : () => undefined;
  throwIfAborted(signal);

  onProgress({ phase: 'save', message: '正在分析资源引用...', currentItemTitle: '分析页面资源引用' });

  const $ = cheerio.load(htmlContent, { decodeEntities: false });
  const assetsDir = path.join(outputDir, ASSET_DIR_NAME);
  const stylesDir = path.join(outputDir, STYLE_DIR_NAME);
  await fs.ensureDir(assetsDir);
  await fs.ensureDir(stylesDir);

  let pendingAssetCount = 0;
  let completedAssetCount = 0;
  const assetTasks = [];
  const assetRegistry = new Map();
  const failedAssetRegistry = new Map();
  const failedUrlSet = new Set();
  const stylesheetRegistry = new Map();
  const stylesheetImportCounter = { count: 0 };
  const assetReport = {
    attemptedAssetCount: 0,
    downloadedAssetCount: 0,
    localizedStylesheetCount: 0,
    failedAssetCount: 0,
    failedUrls: []
  };

  const pushFailedUrl = (url) => {
    const normalizedUrl = String(url || '').trim();
    if (!normalizedUrl || failedUrlSet.has(normalizedUrl)) {
      return;
    }
    failedUrlSet.add(normalizedUrl);
    assetReport.failedUrls.push(normalizedUrl);
    assetReport.failedAssetCount = failedUrlSet.size;
  };

  const ensureAsset = (assetUrl, referer = baseUrl, optionsForAsset = {}) => {
    if (isSkippableUrl(assetUrl)) {
      return null;
    }

    throwIfAborted(signal);
    const resolved = resolveUrl(assetUrl, referer, optionsForAsset.fallbackExtension || '.bin');
    if (!resolved) {
      return null;
    }

    if (!assetRegistry.has(resolved.absoluteUrl)) {
      assetRegistry.set(resolved.absoluteUrl, resolved.fileName);
      assetReport.attemptedAssetCount += 1;
      pendingAssetCount += 1;

      onProgress({
        phase: 'save',
        message: '正在同步资源与代码...',
        currentItemTitle: resolved.fileName,
        progressText: `${completedAssetCount}/${pendingAssetCount}`,
        detail: `正在同步资源：${resolved.fileName}`
      });

      const savePath = path.join(assetsDir, resolved.fileName);
      const task = saveBinaryFile(resolved.absoluteUrl, savePath, referer, {
        signal,
        maxRetries: optionsForAsset.maxRetries || MAX_ASSET_RETRY
      })
        .then(() => {
          failedAssetRegistry.delete(resolved.fileName);
          assetReport.downloadedAssetCount += 1;
          completedAssetCount += 1;
          onProgress({
            phase: 'save',
            message: '正在同步资源与代码...',
            currentItemTitle: resolved.fileName,
            progressText: `${completedAssetCount}/${pendingAssetCount}`,
            detail: `已完成资源：${resolved.fileName}`
          });
        })
        .catch(async (error) => {
          if (error?.name === 'AbortError') {
            throw error;
          }

          failedAssetRegistry.set(resolved.fileName, resolved.absoluteUrl);
          pushFailedUrl(resolved.absoluteUrl);
          await fs.remove(savePath).catch(() => undefined);
        });

      assetTasks.push(task);
    }

    return assetRegistry.get(resolved.absoluteUrl);
  };

  const localizeCssText = async (rawCssText, localizeOptions = {}) => {
    throwIfAborted(signal);
    let cssText = String(rawCssText || '');
    if (!cssText.trim()) {
      return cssText;
    }

    const cssBaseUrl = localizeOptions.cssBaseUrl || baseUrl;
    const stylesheetDepth = Number(localizeOptions.stylesheetDepth) || 0;
    const ancestry = localizeOptions.ancestry instanceof Set ? localizeOptions.ancestry : new Set();
    const assetPrefix = String(localizeOptions.assetPrefix || `../${ASSET_DIR_NAME}`);
    const stylesheetPrefix = String(localizeOptions.stylesheetPrefix || '.').replace(/\/+$/g, '');

    const importRegex = /@import\s+(?:url\(\s*)?(['"]?)([^'"\)\s]+)\1\s*\)?\s*([^;]*);/gi;
    const replacements = [];
    let match;

    while ((match = importRegex.exec(cssText)) !== null) {
      const fullText = String(match[0] || '');
      const importUrl = String(match[2] || '').trim();
      const trailing = String(match[3] || '').trim();

      if (isSkippableUrl(importUrl)) {
        continue;
      }

      if (stylesheetDepth + 1 > MAX_STYLESHEET_IMPORT_DEPTH || stylesheetImportCounter.count >= MAX_IMPORTED_STYLESHEET_COUNT) {
        continue;
      }

      const importedFileName = await ensureStylesheetFile(importUrl, cssBaseUrl, '', {
        depth: stylesheetDepth + 1,
        ancestry
      });

      if (!importedFileName) {
        continue;
      }

      const localizedImportUrl = `${stylesheetPrefix}/${importedFileName}`.replace(/\/+/g, '/');
      const replacement = trailing
        ? `@import url("${localizedImportUrl}") ${trailing};`
        : `@import url("${localizedImportUrl}");`;

      replacements.push({
        start: match.index,
        end: match.index + fullText.length,
        replacement
      });
    }

    if (replacements.length) {
      replacements
        .sort((left, right) => right.start - left.start)
        .forEach((replacement) => {
          cssText = `${cssText.slice(0, replacement.start)}${replacement.replacement}${cssText.slice(replacement.end)}`;
        });
    }

    cssText = cssText.replace(/url\((['"]?)([^'")]+)\1\)/g, (fullMatch, quote, assetUrl) => {
      const normalizedAssetUrl = String(assetUrl || '').trim();
      if (!normalizedAssetUrl
        || isSkippableUrl(normalizedAssetUrl)
        || /\.css(?:[?#].*)?$/i.test(normalizedAssetUrl)
        || /^(?:\.\.\/|\.\/)?temp_styles\//i.test(normalizedAssetUrl)) {
        return fullMatch;
      }

      const fileName = ensureAsset(normalizedAssetUrl, cssBaseUrl);
      if (!fileName) {
        return fullMatch;
      }

      return `url(${quote}${assetPrefix}/${fileName}${quote})`;
    });

    return cssText;
  };

  const ensureStylesheetFile = async (stylesheetUrl, referer = baseUrl, stylesheetText = '', optionsForStylesheet = {}) => {
    throwIfAborted(signal);

    if (isSkippableUrl(stylesheetUrl)) {
      return null;
    }

    const depth = Number(optionsForStylesheet.depth) || 0;
    const ancestry = optionsForStylesheet.ancestry instanceof Set ? optionsForStylesheet.ancestry : new Set();
    if (depth > MAX_STYLESHEET_IMPORT_DEPTH || stylesheetImportCounter.count >= MAX_IMPORTED_STYLESHEET_COUNT) {
      return null;
    }

    const resolved = resolveUrl(stylesheetUrl, referer, '.css');
    if (!resolved) {
      return null;
    }

    if (ancestry.has(resolved.absoluteUrl)) {
      return null;
    }

    if (stylesheetRegistry.has(resolved.absoluteUrl)) {
      return stylesheetRegistry.get(resolved.absoluteUrl);
    }

    stylesheetImportCounter.count += 1;
    const nextAncestry = new Set(ancestry);
    nextAncestry.add(resolved.absoluteUrl);

    const task = (async () => {
      onProgress({
        phase: 'save',
        message: '正在同步资源与代码...',
        currentItemTitle: resolved.fileName,
        detail: `正在同步样式：${resolved.fileName}`
      });

      const rawCss = String(stylesheetText || '').trim()
        || await requestText(resolved.absoluteUrl, referer, { signal, maxRetries: MAX_TEXT_RETRY, maxBytes: MAX_STYLESHEET_BYTES });

      const localizedCss = await localizeCssText(rawCss, {
        cssBaseUrl: resolved.absoluteUrl,
        stylesheetDepth: depth,
        ancestry: nextAncestry,
        assetPrefix: `../${ASSET_DIR_NAME}`,
        stylesheetPrefix: '.'
      });

      await fs.writeFile(path.join(stylesDir, resolved.fileName), localizedCss, 'utf8');
      assetReport.localizedStylesheetCount += 1;
      return resolved.fileName;
    })().catch((error) => {
      if (error?.name === 'AbortError') {
        throw error;
      }

      pushFailedUrl(resolved.absoluteUrl);
      return null;
    });

    stylesheetRegistry.set(resolved.absoluteUrl, task);
    return task;
  };

  const rewriteInlineStyle = (styleValue, referer = baseUrl, assetPrefix = `./${ASSET_DIR_NAME}`) => {
    if (!styleValue || !String(styleValue).includes('url(')) {
      return styleValue;
    }

    return String(styleValue).replace(/url\((['"]?)([^'")]+)\1\)/g, (fullMatch, quote, assetUrl) => {
      const fileName = ensureAsset(assetUrl, referer);
      if (!fileName) {
        return fullMatch;
      }

      return `url(${quote}${assetPrefix}/${fileName}${quote})`;
    });
  };

  const mediaLikeSelectors = 'img, source, video, audio, track, iframe, embed, object, input[type="image"], image';
  const srcLikeAttributes = [
    'src',
    'data-src',
    'data-original',
    'data-origin',
    'data-url',
    'data-lazy-src',
    'data-lazyload',
    'data-echo',
    'data-image',
    'data-background-image',
    'poster',
    'xlink:href'
  ];
  const srcsetLikeAttributes = ['srcset', 'data-srcset', 'data-lazy-srcset', 'data-original-srcset'];

  $(mediaLikeSelectors).each((_, el) => {
    const $el = $(el);
    srcLikeAttributes.forEach((attrName) => {
      const attrValue = $el.attr(attrName);
      if (!attrValue) {
        return;
      }

      const fileName = ensureAsset(attrValue, baseUrl);
      if (!fileName) {
        return;
      }

      const localizedPath = `./${ASSET_DIR_NAME}/${fileName}`;
      $el.attr(attrName, localizedPath);

      if (attrName !== 'poster' && (el.tagName || '').toLowerCase() !== 'object') {
        $el.attr('src', localizedPath);
      }

      if ((el.tagName || '').toLowerCase() === 'object') {
        $el.attr('data', localizedPath);
      }
    });

    srcsetLikeAttributes.forEach((attrName) => {
      const attrValue = $el.attr(attrName);
      if (!attrValue) {
        return;
      }

      const rewritten = rewriteSrcset(attrValue, baseUrl, ensureAsset, `./${ASSET_DIR_NAME}`);
      $el.attr(attrName, rewritten);
      if (attrName !== 'srcset') {
        $el.attr('srcset', rewritten);
      }
    });
  });

  $('[srcset], [data-srcset], [data-lazy-srcset], [data-original-srcset]').each((_, el) => {
    const $el = $(el);
    ['srcset', 'data-srcset', 'data-lazy-srcset', 'data-original-srcset'].forEach((attrName) => {
      const value = $el.attr(attrName);
      if (!value) {
        return;
      }
      $el.attr(attrName, rewriteSrcset(value, baseUrl, ensureAsset, `./${ASSET_DIR_NAME}`));
    });
  });

  $('[data-bg], [data-background], [data-background-image], [data-lazy-bg], [data-lazy-background], [data-image], [data-cover], [data-thumb]').each((_, el) => {
    const $el = $(el);
    const candidateValue = [
      'data-bg',
      'data-background',
      'data-background-image',
      'data-lazy-bg',
      'data-lazy-background',
      'data-image',
      'data-cover',
      'data-thumb'
    ]
      .map((attrName) => $el.attr(attrName))
      .find((value) => !isSkippableUrl(value));

    if (!candidateValue) {
      return;
    }

    const fileName = ensureAsset(candidateValue, baseUrl);
    if (!fileName) {
      return;
    }

    const localizedBackground = `url("./${ASSET_DIR_NAME}/${fileName}")`;
    const nextStyle = upsertInlineStyleDeclaration($el.attr('style') || '', 'background-image', localizedBackground);
    $el.attr('style', nextStyle);
  });

  $('[style]').each((_, el) => {
    const $el = $(el);
    const styleValue = $el.attr('style');
    const localizedStyle = rewriteInlineStyle(styleValue, baseUrl, `./${ASSET_DIR_NAME}`);
    if (localizedStyle) {
      $el.attr('style', localizedStyle);
    }
  });

  const styleNodes = $('style').toArray();
  for (const styleNode of styleNodes) {
    throwIfAborted(signal);
    const cssText = $(styleNode).html() || '';
    if (!String(cssText).trim()) {
      continue;
    }

    const localizedCss = await localizeCssText(cssText, {
      cssBaseUrl: baseUrl,
      stylesheetDepth: 0,
      ancestry: new Set(),
      assetPrefix: `./${ASSET_DIR_NAME}`,
      stylesheetPrefix: `./${STYLE_DIR_NAME}`
    });

    $(styleNode).html(localizedCss);
  }

  const externalStylesheets = $('link[rel~="stylesheet"]')
    .map((_, el) => ({
      element: $(el),
      href: $(el).attr('href'),
      media: $(el).attr('media') || 'all'
    }))
    .get();

  const capturedStylesheets = Array.isArray(options.stylesheets) ? options.stylesheets : [];
  const toAbsoluteHref = (href, referer = baseUrl) => {
    try {
      return new URL(href, referer).href;
    } catch (_error) {
      return String(href || '').trim();
    }
  };
  const capturedStylesheetMap = new Map(
    capturedStylesheets
      .map((stylesheet) => [toAbsoluteHref(stylesheet?.href, baseUrl), stylesheet])
      .filter(([href]) => Boolean(href))
  );

  for (const stylesheet of externalStylesheets) {
    throwIfAborted(signal);
    const absoluteHref = toAbsoluteHref(stylesheet.href, baseUrl);
    const localizedFile = await ensureStylesheetFile(
      stylesheet.href,
      baseUrl,
      capturedStylesheetMap.get(absoluteHref)?.cssText || '',
      { depth: 0, ancestry: new Set() }
    );

    if (localizedFile) {
      stylesheet.element.attr('href', `./${STYLE_DIR_NAME}/${localizedFile}`);
      stylesheet.element.attr('media', stylesheet.media);
    }
  }

  const knownStylesheets = new Set(externalStylesheets.map((item) => toAbsoluteHref(item.href, baseUrl)));

  for (const stylesheet of capturedStylesheets) {
    throwIfAborted(signal);
    const absoluteHref = toAbsoluteHref(stylesheet?.href, baseUrl);
    if (!absoluteHref || knownStylesheets.has(absoluteHref)) {
      continue;
    }

    const localizedFile = await ensureStylesheetFile(stylesheet.href, baseUrl, stylesheet.cssText || '', {
      depth: 0,
      ancestry: new Set()
    });

    if (localizedFile) {
      $('head').append(`<link rel="stylesheet" href="./${STYLE_DIR_NAME}/${localizedFile}" media="${stylesheet.media || 'all'}">`);
      knownStylesheets.add(absoluteHref);
    }
  }

  const linkNodes = $('link[rel], link[as]').toArray();
  for (const node of linkNodes) {
    const $node = $(node);
    const rel = String($node.attr('rel') || '').toLowerCase();
    const asType = String($node.attr('as') || '').toLowerCase();
    const href = $node.attr('href');

    if (!href || rel.includes('stylesheet')) {
      continue;
    }

    if (rel.includes('preload') && asType === 'style') {
      const localizedFile = await ensureStylesheetFile(href, baseUrl, '', { depth: 0, ancestry: new Set() });
      if (localizedFile) {
        $node.attr('href', `./${STYLE_DIR_NAME}/${localizedFile}`);
      }
      continue;
    }

    if (rel.includes('icon')
      || rel.includes('apple-touch-icon')
      || rel.includes('mask-icon')
      || rel.includes('preload')
      || rel.includes('prefetch')
      || ['image', 'font', 'video', 'audio'].includes(asType)) {
      const fileName = ensureAsset(href, baseUrl);
      if (fileName) {
        $node.attr('href', `./${ASSET_DIR_NAME}/${fileName}`);
      }
    }
  }

  console.log(`📡 正在尝试下载 ${assetTasks.length} 个资源，并本地化 ${assetReport.localizedStylesheetCount} 个样式文件...`);
  throwIfAborted(signal);
  onProgress({
    phase: 'save',
    message: '正在同步资源与代码...',
    currentItemTitle: assetTasks.length ? '批量写入资源文件' : '资源同步已完成',
    progressText: `${completedAssetCount}/${pendingAssetCount || completedAssetCount}`,
    detail: assetTasks.length ? `正在等待 ${assetTasks.length} 个资源任务完成` : '未发现需要额外下载的资源'
  });

  await Promise.allSettled(assetTasks);
  throwIfAborted(signal);

  if (failedAssetRegistry.size > 0) {
    const htmlWithFailedAssetFallbacks = replaceFailedAssetReferences($.html(), failedAssetRegistry, [
      `./${ASSET_DIR_NAME}/`,
      `${ASSET_DIR_NAME}/`,
      `../${ASSET_DIR_NAME}/`
    ]);

    await restoreFailedStylesheetAssetReferences(stylesDir, failedAssetRegistry);

    return {
      html: htmlWithFailedAssetFallbacks,
      assetReport
    };
  }

  return {
    html: $.html(),
    assetReport
  };
}

module.exports = { downloadAssets };
