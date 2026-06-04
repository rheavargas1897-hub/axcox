const fs = require('fs-extra');
const path = require('path');
const { URL } = require('url');
const cheerio = require('cheerio');

const FONT_EXTENSIONS = new Set(['.woff', '.woff2', '.ttf', '.otf', '.eot']);
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.bmp', '.avif']);

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function buildPublicRestoreBase(restoreSlug) {
  return `/restored/${restoreSlug}`;
}

function buildPublicAssetMap(assetMap, restoreSlug) {
  const publicAssetMap = new Map();
  const publicBase = buildPublicRestoreBase(restoreSlug);

  assetMap.forEach((assetPath, fileName) => {
    const normalizedPath = String(assetPath || '').replace(/^\.\//, '').replace(/^\/+/, '');
    publicAssetMap.set(fileName, normalizedPath ? `${publicBase}/${normalizedPath}` : assetPath);
  });

  return publicAssetMap;
}

function classifyAsset(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  if (FONT_EXTENSIONS.has(extension)) {
    return 'fonts';
  }

  if (IMAGE_EXTENSIONS.has(extension)) {
    return 'images';
  }

  return 'images';
}

function getAssetReference(fileName, assetMap) {
  if (!fileName) {
    return null;
  }

  const normalizedName = fileName.split('?')[0].split('#')[0];
  const normalizedBaseName = path.basename(normalizedName);
  const directMatch = assetMap.get(normalizedBaseName) || null;
  if (directMatch) {
    return directMatch;
  }

  const extension = path.extname(normalizedBaseName);
  const baseName = path.basename(normalizedBaseName, extension);
  const prefixedMatch = Array.from(assetMap.entries()).find(([candidateName]) => {
    return candidateName === normalizedBaseName
      || candidateName === `${baseName}${extension}`
      || candidateName.startsWith(`${baseName}-`) && path.extname(candidateName) === extension;
  });

  return prefixedMatch ? prefixedMatch[1] : null;
}

function extractFileName(value) {
  if (!value) {
    return null;
  }

  const cleaned = value.split('?')[0].split('#')[0];
  return path.basename(cleaned);
}

function normalizeAbsoluteReference(value, origin) {
  const trimmed = String(value || '').trim();
  if (!trimmed || !origin) {
    return '';
  }

  try {
    return new URL(trimmed, origin).href;
  } catch (_error) {
    return '';
  }
}

function createFallbackAssetProxyUrl(value, origin) {
  const absoluteUrl = normalizeAbsoluteReference(value, origin);
  if (!absoluteUrl) {
    return value;
  }

  const params = new URLSearchParams({ url: absoluteUrl });
  const referer = normalizeAbsoluteReference(origin, origin);
  if (referer) {
    params.set('referer', referer);
  }
  return `/asset-proxy?${params.toString()}`;
}

function localizeReference(value, assetMap, options = {}) {
  if (!value || value.startsWith('#') || value.startsWith('data:') || value.startsWith('javascript:')) {
    return value;
  }

  const failedAssetUrls = options.failedAssetUrls instanceof Set ? options.failedAssetUrls : null;
  if (failedAssetUrls?.size) {
    const failedAbsoluteUrl = normalizeAbsoluteReference(value, options.pageOrigin);
    if (failedAbsoluteUrl && failedAssetUrls.has(failedAbsoluteUrl)) {
      return createFallbackAssetProxyUrl(value, options.pageOrigin);
    }
  }

  const reference = getAssetReference(extractFileName(value), assetMap);
  if (reference) {
    return reference;
  }

  if (options.enableProxyFallback) {
    return createFallbackAssetProxyUrl(value, options.pageOrigin);
  }

  return value;
}

function splitInlineStyleEntries(styleText) {
  const entries = [];
  let current = '';
  let quote = '';
  let depth = 0;

  for (let index = 0; index < String(styleText || '').length; index += 1) {
    const character = styleText[index];

    if (quote) {
      current += character;
      if (character === '\\' && index + 1 < styleText.length) {
        current += styleText[index + 1];
        index += 1;
        continue;
      }

      if (character === quote) {
        quote = '';
      }
      continue;
    }

    if (character === '"' || character === '\'') {
      quote = character;
      current += character;
      continue;
    }

    if (character === '(') {
      depth += 1;
      current += character;
      continue;
    }

    if (character === ')' && depth > 0) {
      depth -= 1;
      current += character;
      continue;
    }

    if (character === ';' && depth === 0) {
      const entry = current.trim();
      if (entry) {
        entries.push(entry);
      }
      current = '';
      continue;
    }

    current += character;
  }

  const trailingEntry = current.trim();
  if (trailingEntry) {
    entries.push(trailingEntry);
  }

  return entries;
}

function parseInlineStyle(styleText) {
  const declarations = [];
  const declarationMap = new Map();

  splitInlineStyleEntries(styleText).forEach((entry) => {
      const separatorIndex = entry.indexOf(':');
      if (separatorIndex < 0) {
        return;
      }

      const property = entry.slice(0, separatorIndex).trim();
      const value = entry.slice(separatorIndex + 1).trim();
      if (!property || !value) {
        return;
      }

      const normalizedProperty = property.toLowerCase();
      if (!declarationMap.has(normalizedProperty)) {
        declarations.push(normalizedProperty);
      }
      declarationMap.set(normalizedProperty, { property, value });
    });

  return { declarations, declarationMap };
}

function mergeInlineStyles(baseStyle, overrideStyle) {
  const base = parseInlineStyle(baseStyle);
  const override = parseInlineStyle(overrideStyle);
  const orderedProperties = [...base.declarations];

  override.declarations.forEach((property) => {
    if (!base.declarationMap.has(property)) {
      orderedProperties.push(property);
    }
    base.declarationMap.set(property, override.declarationMap.get(property));
  });

  return orderedProperties
    .map((property) => base.declarationMap.get(property))
    .filter(Boolean)
    .map(({ property, value }) => `${property}: ${value}`)
    .join('; ');
}

function rewriteStyleValue(styleValue, assetMap, options = {}) {
  if (!styleValue || !styleValue.includes('url(')) {
    return styleValue;
  }

  return styleValue.replace(/url\((['"]?)([^'")]+)\1\)/g, (match, quote, assetUrl) => {
    const localizedUrl = localizeReference(assetUrl, assetMap, options);
    if (!localizedUrl || localizedUrl === assetUrl) {
      return match;
    }

    return `url(${quote}${localizedUrl}${quote})`;
  });
}

function rewriteSrcset(srcsetValue, assetMap, options = {}) {
  if (!srcsetValue) {
    return srcsetValue;
  }

  return srcsetValue
    .split(',')
    .map((entry) => {
      const parts = entry.trim().split(/\s+/);
      const assetUrl = parts.shift();
      const descriptor = parts.join(' ');
      const localizedUrl = localizeReference(assetUrl, assetMap, options);

      if (!localizedUrl) {
        return entry.trim();
      }

      return [localizedUrl, descriptor].filter(Boolean).join(' ');
    })
    .join(', ');
}

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

async function migrateCaptureAssets(captureDir, restoreDir, options = {}) {
  const signal = options.signal;
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : () => undefined;
  throwIfAborted(signal);
  const captureAssetsDir = path.join(captureDir, 'temp_assets');
  const restoreAssetsDir = path.join(restoreDir, 'assets');
  const fontsDir = path.join(restoreAssetsDir, 'fonts');
  const imagesDir = path.join(restoreAssetsDir, 'images');
  const assetMap = new Map();

  await fs.ensureDir(fontsDir);
  await fs.ensureDir(imagesDir);

  if (!(await fs.pathExists(captureAssetsDir))) {
    return assetMap;
  }

  const assetFiles = await fs.readdir(captureAssetsDir);

  for (const fileName of assetFiles) {
    throwIfAborted(signal);
    const sourcePath = path.join(captureAssetsDir, fileName);
    const stats = await fs.stat(sourcePath);
    if (!stats.isFile()) {
      continue;
    }

    const category = classifyAsset(fileName);
    onProgress({
      phase: 'restore',
      message: '正在整理还原页面...',
      currentItemTitle: fileName,
      detail: `正在迁移${category === 'fonts' ? '字体' : '图片'}：${fileName}`
    });
    const destinationPath = path.join(category === 'fonts' ? fontsDir : imagesDir, fileName);
    await fs.copy(sourcePath, destinationPath);
    assetMap.set(fileName, `./assets/${category}/${fileName}`);
  }

  return assetMap;
}

async function collectStyles($, captureDir, assetMap, metadata = {}) {
  const cssBlocks = [];
  const tempStylesDir = path.join(captureDir, 'temp_styles');
  const normalizedCssBlocks = [];
  const normalizeCssText = (cssText) => String(cssText || '').replace(/\s+/g, ' ').trim();
  const pushCssBlock = (cssText, options = {}) => {
    const localizedCssText = rewriteStyleValue(cssText, assetMap);
    const normalizedCssText = normalizeCssText(localizedCssText);
    if (!normalizedCssText) {
      return;
    }

    if (normalizedCssBlocks.includes(normalizedCssText)) {
      return;
    }

    if (options.skipIfSubsetOfExisting && normalizedCssBlocks.some((existingCssText) => existingCssText.includes(normalizedCssText))) {
      return;
    }

    cssBlocks.push(localizedCssText);
    normalizedCssBlocks.push(normalizedCssText);
  };

  $('style, link[rel~="stylesheet"]').each((_, element) => {
    const tagName = (element.tagName || element.name || '').toLowerCase();

    if (tagName === 'style') {
      pushCssBlock($(element).html() || '');
      return;
    }

    if (tagName === 'link') {
      const href = $(element).attr('href');
      const fileName = extractFileName(href);
      if (!fileName) {
        return;
      }

      const cssFilePath = path.join(tempStylesDir, fileName);
      if (!fs.existsSync(cssFilePath)) {
        return;
      }

      const cssText = fs.readFileSync(cssFilePath, 'utf8');
      pushCssBlock(cssText);
    }
  });

  const runtimeStyleTexts = Array.isArray(metadata.runtimeStyleTexts) ? metadata.runtimeStyleTexts : [];
  runtimeStyleTexts.forEach((cssText) => {
    pushCssBlock(cssText, { skipIfSubsetOfExisting: true });
  });

  return cssBlocks.join('\n');
}

function sanitizePreviewDocument($) {
  $('script, noscript, iframe').remove();
  $('link[rel~="stylesheet"], link[rel="preload"], link[rel="modulepreload"], link[as="script"], style').remove();
  $('#__caoliao-browser-ext-root').remove();
}

function sanitizeRootSnapshotStyle(styleText) {
  const SAFE_PROPERTIES = new Set([
    'background',
    'background-color',
    'background-image',
    'background-position',
    'background-repeat',
    'background-size',
    'background-clip',
    'color',
    'margin',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    'padding',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'overflow',
    'overflow-x',
    'overflow-y'
  ]);

  return splitInlineStyleEntries(styleText)
    .filter((entry) => {
      const separatorIndex = entry.indexOf(':');
      if (separatorIndex < 0) {
        return false;
      }

      const property = entry.slice(0, separatorIndex).trim().toLowerCase();
      return property.startsWith('--') || SAFE_PROPERTIES.has(property);
    })
    .join(';');
}

function buildRootSnapshotCss(rootSnapshot, assetMap) {
  const htmlCss = sanitizeRootSnapshotStyle(rewriteStyleValue(rootSnapshot?.html?.computedStyle || '', assetMap)).trim();
  const bodyCss = sanitizeRootSnapshotStyle(rewriteStyleValue(rootSnapshot?.body?.computedStyle || '', assetMap)).trim();
  const cssBlocks = [];

  if (htmlCss) {
    cssBlocks.push(`html { ${htmlCss} }`);
  }

  if (bodyCss) {
    cssBlocks.push(`body { ${bodyCss} }`);
  }

  return cssBlocks.join('\n');
}

function normalizeAttributeEntries(attributes = {}) {
  return Object.entries(attributes).filter(([name, value]) => {
    if (!name || /^on/i.test(name)) {
      return false;
    }

    return value !== false && value !== null && value !== undefined;
  });
}

function buildBodyWrapperAttributes(rootSnapshot, fallbackBodyAttributes = {}) {
  const rootSnapshotAttributes = normalizeAttributeEntries(rootSnapshot?.body?.attributes || {});
  const fallbackAttributes = normalizeAttributeEntries(fallbackBodyAttributes || {});
  const mergedAttributes = new Map(fallbackAttributes);
  rootSnapshotAttributes.forEach(([name, value]) => {
    mergedAttributes.set(name, value);
  });
  const bodyAttributes = Array.from(mergedAttributes.entries());
  const className = bodyAttributes.find(([name]) => name === 'class')?.[1];
  const style = bodyAttributes.find(([name]) => name === 'style')?.[1];
  const dataAttributes = bodyAttributes
    .filter(([name]) => name.startsWith('data-'))
    .map(([name, value]) => ` ${name}="${String(value).replace(/"/g, '&quot;')}"`)
    .join('');

  return {
    className: className ? String(className) : '',
    style: style ? String(style) : '',
    dataAttributes
  };
}

function applyFallbackNodeSnapshots($, fallbackNodeSnapshots, assetMap, options = {}) {
  if (!Array.isArray(fallbackNodeSnapshots) || !fallbackNodeSnapshots.length) {
    return;
  }

  fallbackNodeSnapshots.forEach((snapshot) => {
    if (!snapshot?.id || !snapshot.style) {
      return;
    }

    const target = $(`[data-restore-node-id="${snapshot.id}"]`).first();
    if (!target.length) {
      return;
    }

    const existingStyle = target.attr('style') || '';
    const localizedStyle = rewriteStyleValue(snapshot.style, assetMap, options);
    const nextStyle = mergeInlineStyles(existingStyle, localizedStyle);

    if (nextStyle) {
      target.attr('style', `${nextStyle};`);
    }
  });
}

function applyLayoutNodeSnapshots($, layoutNodeSnapshots) {
  if (!Array.isArray(layoutNodeSnapshots) || !layoutNodeSnapshots.length) {
    return;
  }

  layoutNodeSnapshots.forEach((snapshot) => {
    if (!snapshot?.id) {
      return;
    }

    const target = $(`[data-restore-node-id="${snapshot.id}"]`).first();
    if (!target.length) {
      return;
    }

    const attributes = {
      'data-restore-layout-width': snapshot.width,
      'data-restore-layout-height': snapshot.height,
      'data-restore-layout-parent-width': snapshot.parentWidth,
      'data-restore-layout-width-ratio': snapshot.widthRatio,
      'data-restore-layout-line-count': snapshot.lineCount,
      'data-restore-layout-white-space': snapshot.whiteSpace,
      'data-restore-layout-text-overflow': snapshot.textOverflow,
      'data-restore-layout-display': snapshot.display,
      'data-restore-layout-clamp': snapshot.clamp,
      'data-restore-layout-text': snapshot.isText,
      'data-restore-layout-multiline': snapshot.isMultilineText,
      'data-restore-layout-button': snapshot.isButtonLike,
      'data-restore-layout-container': snapshot.isContainerLike,
      'data-restore-layout-table-like': snapshot.isTableLike,
      'data-restore-layout-parent-display': snapshot.parentDisplay,
      'data-restore-layout-flex-direction': snapshot.flexDirection,
      'data-restore-layout-flex-wrap': snapshot.flexWrap,
      'data-restore-layout-justify-content': snapshot.justifyContent,
      'data-restore-layout-align-items': snapshot.alignItems,
      'data-restore-layout-align-content': snapshot.alignContent,
      'data-restore-layout-align-self': snapshot.alignSelf,
      'data-restore-layout-flex-basis': snapshot.flexBasis,
      'data-restore-layout-flex-grow': snapshot.flexGrow,
      'data-restore-layout-flex-shrink': snapshot.flexShrink,
      'data-restore-layout-order': snapshot.order,
      'data-restore-layout-grid-template-columns': snapshot.gridTemplateColumns,
      'data-restore-layout-grid-template-rows': snapshot.gridTemplateRows,
      'data-restore-layout-grid-auto-flow': snapshot.gridAutoFlow,
      'data-restore-layout-grid-column': snapshot.gridColumn,
      'data-restore-layout-grid-row': snapshot.gridRow,
      'data-restore-layout-gap': snapshot.gap,
      'data-restore-layout-row-gap': snapshot.rowGap,
      'data-restore-layout-column-gap': snapshot.columnGap,
      'data-restore-layout-min-width': snapshot.minWidth,
      'data-restore-layout-max-width': snapshot.maxWidth,
      'data-restore-layout-min-height': snapshot.minHeight,
      'data-restore-layout-max-height': snapshot.maxHeight,
      'data-restore-layout-overflow-x': snapshot.overflowX,
      'data-restore-layout-overflow-y': snapshot.overflowY,
      'data-restore-layout-table-layout': snapshot.tableLayout,
      'data-restore-layout-border-collapse': snapshot.borderCollapse
    };

    Object.entries(attributes).forEach(([name, value]) => {
      if (value === '' || value === null || value === undefined || value === false) {
        return;
      }
      target.attr(name, String(value));
    });
  });
}

function parseStaticLayoutDimension(value) {
  const normalized = String(value || '').trim();
  if (!normalized || normalized === 'auto' || normalized === 'none' || normalized === 'normal') {
    return '';
  }

  if (/^-?\d+(\.\d+)?$/.test(normalized)) {
    return normalized === '0' ? '0' : `${normalized}px`;
  }

  return normalized;
}

function parseNumericSnapshotValue(value) {
  const numeric = Number.parseFloat(String(value || '').trim());
  return Number.isFinite(numeric) ? numeric : NaN;
}

function shouldInlineWhiteSpaceValue(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return !!normalized && normalized !== 'normal';
}

function shouldApplyOverflowAxisSnapshot(overflowValue, scrollSize, clientSize) {
  const normalized = String(overflowValue || '').trim().toLowerCase();
  if (!normalized || normalized === 'visible') {
    return false;
  }

  if ((normalized === 'auto' || normalized === 'scroll')
    && Number.isFinite(scrollSize)
    && Number.isFinite(clientSize)
    && scrollSize <= clientSize + 1) {
    return false;
  }

  return true;
}

function isIntrinsicSizeManagedMediaNode(tagName, inlineStyle) {
  const normalizedTag = String(tagName || '').toLowerCase();
  if (!['img', 'svg', 'canvas', 'video'].includes(normalizedTag)) {
    return false;
  }

  const styleText = String(inlineStyle || '');
  return /position\s*:\s*absolute/i.test(styleText)
    && /(max-width|max-height)\s*:/i.test(styleText);
}

function isTableTrackSizingElementTag(tagName) {
  return [
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'td',
    'th',
    'col',
    'colgroup'
  ].includes(String(tagName || '').toLowerCase());
}

function hasViewportManagedSizeStyle(styleText) {
  const normalizedStyle = String(styleText || '');
  return /(height|min-height|max-height)\s*:\s*calc\([^;]*100(?:d|s|l)?vh/i.test(normalizedStyle)
    || /(height|min-height|max-height)\s*:\s*100(?:d|s|l)?vh/i.test(normalizedStyle);
}

function isViewportManagedScrollContainerTarget(target) {
  const styleText = String(target?.attr('style') || '');
  if (!hasViewportManagedSizeStyle(styleText)) {
    return false;
  }

  const overflowY = String(
    target?.attr('data-restore-scroll-overflow-y')
    || target?.attr('data-restore-layout-overflow-y')
    || ''
  ).trim().toLowerCase();
  if (!['auto', 'scroll', 'hidden', 'clip'].includes(overflowY)) {
    return false;
  }

  const widthRatio = parseNumericSnapshotValue(target?.attr('data-restore-layout-width-ratio') || '');
  if (Number.isFinite(widthRatio) && widthRatio < 0.8) {
    return false;
  }

  const clientHeight = parseNumericSnapshotValue(target?.attr('data-restore-scroll-client-height') || '');
  return !Number.isFinite(clientHeight) || clientHeight >= 240;
}

function isPureMediaLinkWrapperTarget(target, metrics = {}) {
  const normalizedTag = String(metrics.tagName || target?.[0]?.tagName || '').toLowerCase();
  if (normalizedTag !== 'a') {
    return false;
  }

  const textContent = String(target.text() || '').replace(/\s+/g, '').trim();
  if (textContent) {
    return false;
  }

  const elementChildren = target.children().toArray().filter((node) => node?.type === 'tag');
  if (elementChildren.length !== 1) {
    return false;
  }

  const child = target.children().first();
  const childTag = String(child?.[0]?.tagName || '').toLowerCase();
  const childContainsMedia = ['img', 'svg', 'canvas', 'video'].includes(childTag)
    || child.find('img, svg, canvas, video').length > 0;
  if (!childContainsMedia) {
    return false;
  }

  const width = Number.isFinite(metrics.width)
    ? metrics.width
    : parseNumericSnapshotValue(target.attr('data-restore-layout-width') || '');
  const height = Number.isFinite(metrics.height)
    ? metrics.height
    : parseNumericSnapshotValue(target.attr('data-restore-layout-height') || '');
  const childWidth = parseNumericSnapshotValue(child.attr('data-restore-layout-width') || '');
  const childHeight = parseNumericSnapshotValue(child.attr('data-restore-layout-height') || '');
  const childStyle = String(child.attr('style') || '');
  const looksLikeFramedMedia = /position\s*:\s*relative/i.test(childStyle);
  const childOutgrowsParent = Number.isFinite(childWidth)
    && Number.isFinite(width)
    && childWidth > width + 4;
  const sameVisualHeight = Number.isFinite(childHeight)
    && Number.isFinite(height)
    && Math.abs(childHeight - height) <= 6;

  return looksLikeFramedMedia || (childOutgrowsParent && sameVisualHeight);
}

function isContentDrivenAutoSizingTarget(target, metrics = {}) {
  const normalizedTag = String(metrics.tagName || target?.[0]?.tagName || '').toLowerCase();
  if (!['a', 'span', 'label', 'div', 'p', 'li'].includes(normalizedTag)) {
    return false;
  }

  const width = Number.isFinite(metrics.width)
    ? metrics.width
    : parseNumericSnapshotValue(target?.attr('data-restore-layout-width') || '');
  const height = Number.isFinite(metrics.height)
    ? metrics.height
    : parseNumericSnapshotValue(target?.attr('data-restore-layout-height') || '');
  const lineCount = Number.isFinite(metrics.lineCount)
    ? metrics.lineCount
    : parseNumericSnapshotValue(target?.attr('data-restore-layout-line-count') || '');
  const display = String(metrics.display || target?.attr('data-restore-layout-display') || '').toLowerCase();
  const isButtonLike = typeof metrics.isButtonLike === 'boolean'
    ? metrics.isButtonLike
    : target?.attr('data-restore-layout-button') === 'true';
  const isContainerLike = typeof metrics.isContainerLike === 'boolean'
    ? metrics.isContainerLike
    : target?.attr('data-restore-layout-container') === 'true';
  const textContent = String(target?.text() || '').replace(/\s+/g, ' ').trim();

  if (!textContent) {
    return false;
  }

  if (!Number.isFinite(width) || width <= 0 || width > 240) {
    return false;
  }

  if (Number.isFinite(lineCount) && lineCount > 2) {
    return false;
  }

  if (Number.isFinite(height) && height >= 36 && width >= 48 && height >= width * 0.75) {
    return false;
  }

  if (isButtonLike && Number.isFinite(height) && height >= 36 && width >= 48) {
    return false;
  }

  if (
    isContainerLike
    && display
    && !display.includes('inline-flex')
    && !(display === 'flex' && (!Number.isFinite(height) || height < 32))
  ) {
    return false;
  }

  const elementChildren = target.children().toArray().filter((node) => node?.type === 'tag');
  if (elementChildren.length > 4) {
    return false;
  }

  const allowedChildTags = new Set([
    'a',
    'span',
    'strong',
    'em',
    'b',
    'i',
    'u',
    'small',
    'sup',
    'sub',
    'svg',
    'img',
    'path',
    'g',
    'use',
    'input',
    'label'
  ]);
  const hasDisallowedChild = elementChildren.some((node) => {
    const childTag = String(node?.tagName || node?.name || '').toLowerCase();
    return childTag && !allowedChildTags.has(childTag);
  });
  if (hasDisallowedChild) {
    return false;
  }

  return target.find('textarea, select, button').length === 0;
}

function shouldApplyStaticLayoutValue(value) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return false;
  }

  return !['auto', 'none', 'normal'].includes(normalized);
}

function isActualTableLayoutElement(tagName, display) {
  const normalizedTag = String(tagName || '').toLowerCase();
  const normalizedDisplay = String(display || '').toLowerCase();

  return [
    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'td',
    'th',
    'col',
    'colgroup'
  ].includes(normalizedTag) || normalizedDisplay.includes('table');
}

function isStructuredLayoutContainer({
  tagName,
  display,
  isContainerLike,
  isText,
  width,
  height,
  hasScrollableOverflow
}) {
  if (!isContainerLike || isText) {
    return false;
  }

  const normalizedTag = String(tagName || '').toLowerCase();
  const normalizedDisplay = String(display || '').toLowerCase();
  if (normalizedDisplay.includes('flex') || normalizedDisplay.includes('grid') || normalizedDisplay === '-webkit-box') {
    return true;
  }

  if (['nav', 'aside', 'section', 'main', 'header', 'footer', 'form'].includes(normalizedTag)) {
    return true;
  }

  if (hasScrollableOverflow) {
    return true;
  }

  return Number.isFinite(width)
    && Number.isFinite(height)
    && width >= 180
    && height >= 40;
}

function applyStaticLayoutFallbacks($) {
  $('[data-restore-layout-width]').each((_, element) => {
    const target = $(element);
    const tagName = String(target[0]?.tagName || '').toLowerCase();
    const isTableTrackSizingElement = isTableTrackSizingElementTag(tagName);
    const display = String(target.attr('data-restore-layout-display') || '').trim();
    const parentDisplay = String(target.attr('data-restore-layout-parent-display') || '').trim();
    const isContainerLike = target.attr('data-restore-layout-container') === 'true';
    const isTableLike = target.attr('data-restore-layout-table-like') === 'true';
    const isButtonLike = target.attr('data-restore-layout-button') === 'true';
    const isText = target.attr('data-restore-layout-text') === 'true';
    const isMultilineText = target.attr('data-restore-layout-multiline') === 'true';
    const width = Number.parseFloat(target.attr('data-restore-layout-width') || '');
    const height = Number.parseFloat(target.attr('data-restore-layout-height') || '');
    const widthRatio = Number.parseFloat(target.attr('data-restore-layout-width-ratio') || '');
    const isMediaNode = ['img', 'svg', 'canvas', 'video'].includes(tagName);
    const preserveIntrinsicMediaSizing = isIntrinsicSizeManagedMediaNode(tagName, target.attr('style') || '');
    const isFlexOrGridContainer = /(flex|grid|-webkit-box)/.test(display);
    const isFlexOrGridParent = /(flex|grid|-webkit-box)/.test(parentDisplay);
    const isGridContainer = /grid/.test(display);
    const isGridParent = /grid/.test(parentDisplay);
    const isTableDisplay = /table/.test(display);
    const overflowX = String(target.attr('data-restore-layout-overflow-x') || '').trim();
    const overflowY = String(target.attr('data-restore-layout-overflow-y') || '').trim();
    const hasScrollableOverflow = ['auto', 'scroll', 'hidden', 'clip'].includes(overflowX)
      || ['auto', 'scroll', 'hidden', 'clip'].includes(overflowY);
    const isActualTableLike = isActualTableLayoutElement(tagName, display) || isTableDisplay;
    const preserveContentDrivenAutoSizing = isContentDrivenAutoSizingTarget(target, {
      tagName,
      width,
      height,
      lineCount: Number.parseFloat(target.attr('data-restore-layout-line-count') || ''),
      display,
      isButtonLike,
      isContainerLike
    });
    const effectiveButtonLike = isButtonLike
      && !preserveContentDrivenAutoSizing
      && !isPureMediaLinkWrapperTarget(target, {
      tagName,
      width,
      height
      });
    const isStructuredContainer = isStructuredLayoutContainer({
      tagName,
      display,
      isContainerLike,
      isText,
      width,
      height,
      hasScrollableOverflow
    });
    const isLargeFlexItemCandidate = isFlexOrGridParent
      && !preserveContentDrivenAutoSizing
      && Number.isFinite(width)
      && width >= 160
      && width <= 420
      && Number.isFinite(widthRatio)
      && widthRatio > 0
      && widthRatio < 1;
    const shouldApplyContainerDisplay = effectiveButtonLike
      || isFlexOrGridContainer
      || isActualTableLike
      || isStructuredContainer;
    const shouldApplyFlexItemLayout = isFlexOrGridParent && (
      effectiveButtonLike
      || (isMediaNode && !preserveIntrinsicMediaSizing)
      || isActualTableLike
      || isLargeFlexItemCandidate
      || (isStructuredContainer && width >= 160 && height >= 48)
    );
    const shouldApplyGridItemLayout = isGridParent && (
      effectiveButtonLike
      || (isMediaNode && !preserveIntrinsicMediaSizing)
      || isActualTableLike
      || isLargeFlexItemCandidate
      || (isStructuredContainer && width >= 160 && height >= 48)
    );
    const compactStackCandidate = effectiveButtonLike
      && isText
      && !isContainerLike
      && width > 0
      && width <= 96
      && height >= 48
      && height <= 120
      && height >= width;
    const scrollWidth = Number.parseFloat(target.attr('data-restore-scroll-width') || '');
    const scrollHeight = Number.parseFloat(target.attr('data-restore-scroll-height') || '');
    const scrollClientWidth = Number.parseFloat(target.attr('data-restore-scroll-client-width') || '');
    const scrollClientHeight = Number.parseFloat(target.attr('data-restore-scroll-client-height') || '');
    const declarations = [];
    const pushDeclaration = (property, value) => {
      if (!value) {
        return;
      }
      declarations.push(`${property}: ${value}`);
    };
    const pushLayoutProperty = (property, attributeName) => {
      const value = String(target.attr(attributeName) || '').trim();
      if (!shouldApplyStaticLayoutValue(value)) {
        return;
      }
      pushDeclaration(property, value);
    };
    const pushDimensionProperty = (property, attributeName) => {
      const value = parseStaticLayoutDimension(target.attr(attributeName) || '');
      if (!value) {
        return;
      }
      pushDeclaration(property, value);
    };

    if (compactStackCandidate) {
      pushDeclaration('display', 'flex');
      pushDeclaration('flex-direction', 'column');
      pushDeclaration('align-items', 'center');
      pushDeclaration('justify-content', 'center');
      pushDeclaration('text-align', 'center');
    } else if (
      display
      && display !== 'inline'
      && (
        shouldApplyContainerDisplay
        || (display === 'inline-block' && !isText)
      )
    ) {
      pushDeclaration('display', display);
    }

    if (isFlexOrGridContainer || compactStackCandidate) {
      pushLayoutProperty('flex-direction', 'data-restore-layout-flex-direction');
      pushLayoutProperty('flex-wrap', 'data-restore-layout-flex-wrap');
      pushLayoutProperty('justify-content', 'data-restore-layout-justify-content');
      pushLayoutProperty('align-items', 'data-restore-layout-align-items');
      pushLayoutProperty('align-content', 'data-restore-layout-align-content');
      pushLayoutProperty('gap', 'data-restore-layout-gap');
      pushLayoutProperty('row-gap', 'data-restore-layout-row-gap');
      pushLayoutProperty('column-gap', 'data-restore-layout-column-gap');
    }

    if (shouldApplyFlexItemLayout || shouldApplyGridItemLayout || effectiveButtonLike) {
      pushLayoutProperty('align-self', 'data-restore-layout-align-self');
      pushLayoutProperty('order', 'data-restore-layout-order');
      pushLayoutProperty('flex-grow', 'data-restore-layout-flex-grow');
      pushLayoutProperty('flex-shrink', 'data-restore-layout-flex-shrink');
    }

    if (isGridContainer) {
      pushLayoutProperty('grid-template-columns', 'data-restore-layout-grid-template-columns');
      pushLayoutProperty('grid-template-rows', 'data-restore-layout-grid-template-rows');
      pushLayoutProperty('grid-auto-flow', 'data-restore-layout-grid-auto-flow');
    }

    if (shouldApplyGridItemLayout) {
      pushLayoutProperty('grid-column', 'data-restore-layout-grid-column');
      pushLayoutProperty('grid-row', 'data-restore-layout-grid-row');
    }

    if (hasScrollableOverflow || isActualTableLike || isFlexOrGridContainer) {
      if (shouldApplyOverflowAxisSnapshot(overflowX, scrollWidth, scrollClientWidth)) {
        pushDeclaration('overflow-x', overflowX);
      }
      if (shouldApplyOverflowAxisSnapshot(overflowY, scrollHeight, scrollClientHeight)) {
        pushDeclaration('overflow-y', overflowY);
      }
    }

    if (isActualTableLike) {
      pushLayoutProperty('table-layout', 'data-restore-layout-table-layout');
      pushLayoutProperty('border-collapse', 'data-restore-layout-border-collapse');
    }

    const whiteSpaceValue = String(target.attr('data-restore-layout-white-space') || '').trim();
    if (shouldInlineWhiteSpaceValue(whiteSpaceValue)) {
      pushDeclaration('white-space', whiteSpaceValue);
    }

    const textOverflow = String(target.attr('data-restore-layout-text-overflow') || '').trim();
    if (textOverflow && textOverflow !== 'clip') {
      pushDeclaration('text-overflow', textOverflow);
    }

    const explicitFlexBasis = parseStaticLayoutDimension(target.attr('data-restore-layout-flex-basis') || '');
    if (explicitFlexBasis && (shouldApplyFlexItemLayout || shouldApplyGridItemLayout || effectiveButtonLike)) {
      pushDeclaration('flex-basis', explicitFlexBasis);
    }

    const shouldApplyExplicitWidth = Number.isFinite(width) && width > 0 && (
      compactStackCandidate
      || (isActualTableLike && !isTableTrackSizingElement)
      || effectiveButtonLike
      || (isMediaNode && !preserveIntrinsicMediaSizing)
      || isLargeFlexItemCandidate
    );
    if (shouldApplyExplicitWidth) {
      const widthValue = parseStaticLayoutDimension(width);
      pushDeclaration('width', widthValue);
      if (compactStackCandidate || isActualTableLike || effectiveButtonLike || (isMediaNode && !preserveIntrinsicMediaSizing)) {
        pushDeclaration('min-width', widthValue);
      }
      if (compactStackCandidate || isActualTableLike || isLargeFlexItemCandidate) {
        pushDeclaration('max-width', widthValue);
      }
    } else if (
      !explicitFlexBasis
      && Number.isFinite(widthRatio)
      && widthRatio > 0
      && widthRatio < 1
      && isFlexOrGridParent
      && (
        (isActualTableLike && !isTableTrackSizingElement)
        || effectiveButtonLike
        || (isMediaNode && !preserveIntrinsicMediaSizing)
        || isLargeFlexItemCandidate
        || (isStructuredContainer && width >= 160 && height >= 48)
      )
    ) {
      const percentValue = `${Math.round(widthRatio * 10000) / 100}%`;
      pushDeclaration('width', percentValue);
      pushDeclaration('flex-basis', percentValue);
    }

    const shouldApplyExplicitHeight = Number.isFinite(height) && height > 0 && (
      compactStackCandidate
      || effectiveButtonLike
      || (isActualTableLike && !isTableTrackSizingElement)
      || (isMediaNode && !preserveIntrinsicMediaSizing)
    );
    if (shouldApplyExplicitHeight) {
      const heightValue = parseStaticLayoutDimension(height);
      if (compactStackCandidate) {
        pushDeclaration('height', heightValue);
      }
      pushDeclaration('min-height', heightValue);
    }

    if (
      effectiveButtonLike
      || ((isActualTableLike && !isTableTrackSizingElement))
      || (isMediaNode && !preserveIntrinsicMediaSizing)
      || isLargeFlexItemCandidate
    ) {
      pushDimensionProperty('min-width', 'data-restore-layout-min-width');
      pushDimensionProperty('max-width', 'data-restore-layout-max-width');
      pushDimensionProperty('min-height', 'data-restore-layout-min-height');
      pushDimensionProperty('max-height', 'data-restore-layout-max-height');
    }

    if (isMultilineText && compactStackCandidate) {
      pushDeclaration('overflow', 'hidden');
    }

    if (!declarations.length) {
      return;
    }

    const mergedStyle = mergeInlineStyles(target.attr('style') || '', declarations.join('; '));
    if (mergedStyle) {
      target.attr('style', `${mergedStyle};`);
    }
  });
}

function applyBrowserAssetSnapshots($, browserAssetSnapshots) {
  if (!Array.isArray(browserAssetSnapshots) || !browserAssetSnapshots.length) {
    return;
  }

  browserAssetSnapshots.forEach((snapshot) => {
    if (!snapshot?.id || !snapshot?.attr || !snapshot?.dataUrl) {
      return;
    }

    const target = $(`[data-restore-node-id="${snapshot.id}"]`).first();
    if (!target.length) {
      return;
    }

    if (String(snapshot.attr).startsWith('style.')) {
      const rawPropertyName = String(snapshot.attr).slice('style.'.length).trim();
      if (!rawPropertyName) {
        return;
      }

      const styleProperty = rawPropertyName
        .replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
        .toLowerCase();
      const currentStyle = target.attr('style') || '';
      const mergedStyle = mergeInlineStyles(currentStyle, `${styleProperty}: ${snapshot.dataUrl}`);
      target.attr('style', mergedStyle);
      return;
    }

    target.attr(snapshot.attr, snapshot.dataUrl);
  });
}

function applyScrollContainerSnapshots($, scrollContainerSnapshots) {
  if (!Array.isArray(scrollContainerSnapshots) || !scrollContainerSnapshots.length) {
    return;
  }

  scrollContainerSnapshots.forEach((snapshot) => {
    if (!snapshot?.id) {
      return;
    }

    const target = $(`[data-restore-node-id="${snapshot.id}"]`).first();
    if (!target.length) {
      return;
    }

    if (Number.isFinite(snapshot.scrollTop)) {
      target.attr('data-restore-scroll-top', String(Math.max(0, Math.round(snapshot.scrollTop))));
    }

    if (Number.isFinite(snapshot.scrollLeft)) {
      target.attr('data-restore-scroll-left', String(Math.max(0, Math.round(snapshot.scrollLeft))));
    }

    if (Number.isFinite(snapshot.clientWidth) && snapshot.clientWidth > 0) {
      target.attr('data-restore-scroll-client-width', String(Math.round(snapshot.clientWidth)));
    }

    if (Number.isFinite(snapshot.clientHeight) && snapshot.clientHeight > 0) {
      target.attr('data-restore-scroll-client-height', String(Math.round(snapshot.clientHeight)));
    }

    if (Number.isFinite(snapshot.scrollWidth) && snapshot.scrollWidth > 0) {
      target.attr('data-restore-scroll-width', String(Math.round(snapshot.scrollWidth)));
    }

    if (Number.isFinite(snapshot.scrollHeight) && snapshot.scrollHeight > 0) {
      target.attr('data-restore-scroll-height', String(Math.round(snapshot.scrollHeight)));
    }

    if (snapshot.overflowX) {
      target.attr('data-restore-scroll-overflow-x', String(snapshot.overflowX));
    }

    if (snapshot.overflowY) {
      target.attr('data-restore-scroll-overflow-y', String(snapshot.overflowY));
    }
  });
}

function parseCssNumericValue(value) {
  const parsed = Number.parseFloat(String(value || '').trim());
  return Number.isFinite(parsed) ? parsed : NaN;
}

function resolveMaxCapturedScrollTop(scrollContainerSnapshots) {
  if (!Array.isArray(scrollContainerSnapshots) || !scrollContainerSnapshots.length) {
    return 0;
  }

  return scrollContainerSnapshots.reduce((maxValue, snapshot) => {
    const scrollTop = Number(snapshot?.scrollTop);
    if (!Number.isFinite(scrollTop) || scrollTop <= 0) {
      return maxValue;
    }

    const scrollHeight = Number(snapshot?.scrollHeight);
    const clientHeight = Number(snapshot?.clientHeight);
    const isScrollable = Number.isFinite(scrollHeight) && Number.isFinite(clientHeight)
      ? scrollHeight > clientHeight + 8
      : true;

    if (!isScrollable) {
      return maxValue;
    }

    return Math.max(maxValue, scrollTop);
  }, 0);
}

function normalizeCapturedAffixSnapshots($, options = {}) {
  const maxCapturedScrollTop = Number.isFinite(options.maxCapturedScrollTop)
    ? options.maxCapturedScrollTop
    : 0;
  const viewportWidth = Number.isFinite(options.viewportWidth) ? options.viewportWidth : 0;
  const viewportHeight = Number.isFinite(options.viewportHeight) ? options.viewportHeight : 0;
  const scrollThreshold = Math.max(120, viewportHeight * 0.2);

  if (!(maxCapturedScrollTop > scrollThreshold)) {
    return;
  }

  $('[style]').each((_, element) => {
    const $element = $(element);
    const className = String($element.attr('class') || '');
    if (!/(affix|sticky|anchor)/i.test(className)) {
      return;
    }

    const styleText = String($element.attr('style') || '').trim();
    if (!styleText || !/position\s*:\s*fixed/i.test(styleText)) {
      return;
    }

    const parsedStyle = parseInlineStyle(styleText);
    const positionValue = String(parsedStyle.declarationMap.get('position')?.value || '').trim().toLowerCase();
    if (positionValue !== 'fixed') {
      return;
    }

    const topValue = parseCssNumericValue(parsedStyle.declarationMap.get('top')?.value || '');
    if (!Number.isFinite(topValue) || topValue < -8 || topValue > 24) {
      return;
    }

    const widthValue = String(parsedStyle.declarationMap.get('width')?.value || '').trim();
    const widthNumber = parseCssNumericValue(widthValue);
    const looksLikeLargeTopBar = Number.isFinite(widthNumber) && viewportWidth > 0
      ? widthNumber >= viewportWidth * 0.35
      : true;
    if (!looksLikeLargeTopBar) {
      return;
    }

    const heightValue = String(parsedStyle.declarationMap.get('height')?.value || '').trim();
    const heightNumber = parseCssNumericValue(heightValue);
    const removableProperties = new Set(['position', 'top', 'left', 'right', 'bottom', 'z-index']);
    if (Number.isFinite(widthNumber) && viewportWidth > 0 && widthNumber >= viewportWidth * 0.35) {
      removableProperties.add('width');
    }
    if (Number.isFinite(heightNumber) && viewportHeight > 0 && heightNumber <= viewportHeight * 0.5) {
      removableProperties.add('height');
    }

    const strippedStyle = parsedStyle.declarations
      .filter((property) => !removableProperties.has(property))
      .map((property) => parsedStyle.declarationMap.get(property))
      .filter(Boolean)
      .map(({ property, value }) => `${property}: ${value}`)
      .join('; ');
    const normalizedStyle = mergeInlineStyles(
      strippedStyle,
      'position: static; top: auto; left: auto; right: auto; bottom: auto; z-index: auto'
    );
    $element.attr('style', normalizedStyle);

    $element.attr('data-restore-affix-normalized', 'true');
  });
}

function applyInteractionStateSnapshots($, interactionStateSnapshots, assetMap) {
  if (!Array.isArray(interactionStateSnapshots) || !interactionStateSnapshots.length) {
    return;
  }

  const mergedSnapshots = new Map();
  interactionStateSnapshots.forEach((snapshot) => {
    if (!snapshot?.id || !snapshot.style) {
      return;
    }

    const current = mergedSnapshots.get(snapshot.id) || { states: new Set(), style: '' };
    (Array.isArray(snapshot.states) ? snapshot.states : []).filter(Boolean).forEach((state) => current.states.add(state));
    current.style = snapshot.style;
    mergedSnapshots.set(snapshot.id, current);
  });

  mergedSnapshots.forEach((snapshot, id) => {
    const target = $(`[data-restore-node-id="${id}"]`).first();
    if (!target.length) {
      return;
    }

    const existingStyle = target.attr('style') || '';
    const localizedStyle = rewriteStyleValue(snapshot.style || '', assetMap);
    const nextStyle = [existingStyle.trim().replace(/;$/, ''), localizedStyle.trim().replace(/;$/, '')]
      .filter(Boolean)
      .join(';');

    if (nextStyle) {
      target.attr('style', `${nextStyle};`);
    }

    const states = Array.from(snapshot.states || []).join(',');
    if (states) {
      target.attr('data-restore-interaction-states', states);
    }
  });
}

function localizeMarkupFragment(markup, assetMap, options = {}) {
  if (!markup) {
    return markup;
  }

  const $fragment = cheerio.load(`<div id="__restore-fragment-root">${markup}</div>`, { decodeEntities: false });
  rewriteBodyReferences($fragment, assetMap, options);
  return $fragment('#__restore-fragment-root').html() || markup;
}

function applySampledContentSnapshots($, sampledContentSnapshots, assetMap, options = {}) {
  if (!Array.isArray(sampledContentSnapshots) || !sampledContentSnapshots.length) {
    return;
  }

  const mergedSnapshots = new Map();
  sampledContentSnapshots.forEach((snapshot) => {
    if (!snapshot?.id) {
      return;
    }

    mergedSnapshots.set(`${snapshot.id}::${snapshot.stateType || ''}::${snapshot.sampleKey || ''}`, snapshot);
    mergedSnapshots.set(snapshot.id, snapshot);
  });

  mergedSnapshots.forEach((snapshot, key) => {
    if (String(key).includes('::')) {
      return;
    }

    const target = $(`[data-restore-node-id="${snapshot.id}"]`).first();
    if (!target.length) {
      return;
    }

    normalizeAttributeEntries(snapshot.attributes || {}).forEach(([name, value]) => {
      if (name === 'data-restore-node-id') {
        return;
      }

      if (value === true) {
        target.attr(name, name);
        return;
      }

      target.attr(name, String(value));
    });

    if (typeof snapshot.html === 'string') {
      target.html(localizeMarkupFragment(snapshot.html, assetMap, options));
    }
  });
}

function buildPseudoElementSnapshotCss(pseudoElementSnapshots, assetMap) {
  if (!Array.isArray(pseudoElementSnapshots) || !pseudoElementSnapshots.length) {
    return '';
  }

  const normalizePseudoStyle = (styleText) => styleText.replace(/content\s*:\s*([^;]+)(;?)/gi, (_match, rawValue, suffix) => {
    const value = String(rawValue || '').trim();
    if (!value || value === 'none' || value === 'normal') {
      return `content:${value}${suffix || ''}`;
    }

    if (/^(['"]).*\1$/.test(value) || /^(attr|counter|counters|url)\(/i.test(value)) {
      return `content:${value}${suffix || ''}`;
    }

    return `content:${JSON.stringify(value)}${suffix || ''}`;
  });

  return pseudoElementSnapshots
    .map((snapshot) => {
      if (!snapshot?.id || !snapshot?.pseudo || !snapshot?.style) {
        return '';
      }

      const localizedStyle = normalizePseudoStyle(rewriteStyleValue(snapshot.style, assetMap)).trim();
      if (!localizedStyle) {
        return '';
      }

      if (snapshot.pseudo === '::placeholder') {
        const cleanStyle = localizedStyle.replace(/(?:color|opacity|-webkit-text-fill-color)\s*:[^;]+;?/g, '');
        const enhancedStyle = `color: #bfbfbf !important; opacity: 1 !important; ${cleanStyle}`;
        return [
          `[data-restore-node-id="${snapshot.id}"]::placeholder { ${enhancedStyle} }`,
          `[data-restore-node-id="${snapshot.id}"]::-webkit-input-placeholder { ${enhancedStyle} }`,
          `[data-restore-node-id="${snapshot.id}"]::-moz-placeholder { ${enhancedStyle} }`,
          `[data-restore-node-id="${snapshot.id}"]:-ms-input-placeholder { ${enhancedStyle} }`,
          `[data-restore-node-id="${snapshot.id}"]::-ms-input-placeholder { ${enhancedStyle} }`
        ].join('\n');
      }

      return `[data-restore-node-id="${snapshot.id}"]${snapshot.pseudo} { ${localizedStyle} }`;
    })
    .filter(Boolean)
    .join('\n');
}

function ensurePlaceholderSnapshots($, pseudoElementSnapshots) {
  const normalizedSnapshots = Array.isArray(pseudoElementSnapshots) ? [...pseudoElementSnapshots] : [];
  const existingPlaceholderIds = new Set(
    normalizedSnapshots
      .filter((snapshot) => snapshot?.id && snapshot?.pseudo === '::placeholder')
      .map((snapshot) => snapshot.id)
  );
  let syntheticIndex = 0;

  $('input[placeholder], textarea[placeholder]').each((_, element) => {
    const $element = $(element);
    const placeholderText = String($element.attr('placeholder') || '').trim();
    if (!placeholderText) {
      return;
    }

    let restoreNodeId = $element.attr('data-restore-node-id');
    if (!restoreNodeId) {
      syntheticIndex += 1;
      restoreNodeId = `restore-placeholder-node-${syntheticIndex}`;
      $element.attr('data-restore-node-id', restoreNodeId);
    }

    if (existingPlaceholderIds.has(restoreNodeId)) {
      return;
    }

    normalizedSnapshots.push({
      id: restoreNodeId,
      pseudo: '::placeholder',
      style: 'color:#bfbfbf;opacity:1'
    });
    existingPlaceholderIds.add(restoreNodeId);
  });

  return normalizedSnapshots;
}

function createPreviewScript() {
  return `
(() => {
  const TAB_CONTAINER_SELECTOR = '.ant-tabs, .el-tabs, .hammer-tabs, [role="tablist"], [data-tab-container]';
  const TAB_SELECTOR = '[role="tab"], .ant-tabs-tab, .el-tabs__item, .hammer-tabs-tab, [data-tab]';
  const PANEL_SELECTOR = '[role="tabpanel"], .ant-tabs-tabpane, .el-tab-pane, .tab-pane, .hammer-tabs-tabpane, [data-tab-panel]';
  const TAB_WRAPPER_SELECTOR = '.ant-tabs-tab, .el-tabs__item, .hammer-tabs-tab, [data-tab]';
  const ACTIVE_TAB_CLASSES = ['ant-tabs-tab-active', 'hammer-tabs-tab-active', 'is-active', 'active', 'selected', 'current'];
  const ACTIVE_PANEL_CLASSES = ['ant-tabs-tabpane-active', 'hammer-tabs-tabpane-active', 'is-active', 'active', 'show', 'selected', 'current'];
  const HIDDEN_PANEL_CLASSES = ['ant-tabs-tabpane-hidden', 'hammer-tabs-tabpane-hidden', 'hidden'];
  const SELECT_ROOT_SELECTOR = '.ant-select, .el-select, .hammer-select, [data-select-root]';
  const SELECT_TRIGGER_SELECTOR = '.ant-select-selector, .el-select__wrapper, .hammer-select-selector, [data-select-trigger]';
  const SELECT_VALUE_SELECTOR = '.ant-select-selection-item, .el-select__selected-item, .hammer-select-selection-item, [data-select-value]';
  const SELECT_MENU_SELECTOR = '.ant-select-dropdown, .el-select-dropdown, .hammer-select-dropdown, [role="listbox"], [data-select-menu]';
  const SELECT_OPTION_SELECTOR = '.ant-select-item-option, .el-select-dropdown__item, .hammer-select-item, [role="option"], [data-select-option]';
  const SELECT_OPEN_CLASSES = ['ant-select-open', 'is-focus', 'is-open', 'is-active', 'hammer-select-open'];
  const SELECT_CLEAR_SELECTOR = '.ant-select-clear, .hammer-select-clear, [data-select-clear]';
  const COLLAPSE_HEADER_SELECTOR = '.ant-collapse-header, .el-collapse-item__header, .hammer-collapse-header, [data-collapse-trigger]';
  const COLLAPSE_ITEM_SELECTOR = '.ant-collapse-item, .el-collapse-item, .hammer-collapse-item, [data-collapse-item]';
  const COLLAPSE_CONTENT_SELECTOR = '.ant-collapse-content, .el-collapse-item__wrap, .hammer-collapse-content, [data-collapse-content]';
  const COLLAPSE_ACTIVE_CLASSES = ['ant-collapse-item-active', 'is-active', 'active', 'open'];
  const DROPDOWN_TRIGGER_SELECTOR = '.ant-dropdown-trigger, .el-dropdown-link, .hammer-dropdown-trigger, [data-dropdown-trigger]';
  const DROPDOWN_MENU_SELECTOR = '.ant-dropdown, .el-dropdown-menu, .hammer-dropdown, .dropdown-menu, [role="menu"], [data-dropdown-menu]';
  const DROPDOWN_HIDDEN_CLASSES = ['ant-dropdown-hidden', 'hammer-dropdown-hidden', 'hidden'];
  const MODAL_ROOT_SELECTOR = '.ant-modal-root, .ant-drawer, .el-dialog__wrapper, .hammer-modal, [role="dialog"], .modal, [data-modal-root]';
  const MODAL_TRIGGER_SELECTOR = '[data-modal-trigger], [data-target], [data-modal-target], [aria-controls], [aria-haspopup="dialog"], a[href^="#"], .ant-btn, .el-button, button, [role="button"]';
  const MODAL_CLOSE_SELECTOR = '.ant-modal-close, .ant-drawer-close, .el-dialog__headerbtn, .modal-close, [data-modal-close]';
  const MODAL_OPEN_CLASSES = ['ant-modal-open', 'ant-drawer-open', 'is-open', 'open', 'active'];
  const MODAL_HIDDEN_CLASSES = ['hidden', 'hide', 'is-hidden', 'hidden-modal', 'modal-hidden', 'drawer-hidden', 'popup-hidden', 'ant-modal-hidden', 'ant-drawer-hidden'];
  const INPUT_WRAPPER_SELECTOR = '.ant-input-affix-wrapper, .ant-input-group-wrapper, .hammer-input-affix-wrapper, .hammer-input-wrapper, [data-input-wrapper]';
  const CLEAR_TRIGGER_SELECTOR = '.ant-input-clear-icon, .hammer-input-clear-icon, .anticon-close-circle, [data-clear-trigger]';
  const FOCUSED_INPUT_CLASSES = ['ant-input-affix-wrapper-focused', 'hammer-input-affix-wrapper-focused', 'is-focus', 'focused'];
  const FILLED_INPUT_CLASSES = ['has-value', 'is-filled'];
  const TABLE_CONTAINER_SELECTOR = '.hammer-table-container, .ant-table-container, [data-table-container]';
  const TABLE_HEADER_SELECTOR = '.hammer-table-header, .ant-table-header, [data-table-header]';
  const TABLE_BODY_SELECTOR = '.hammer-table-body, .ant-table-body, .ant-table-content, [data-table-body]';
  const TABLE_STICKY_SCROLL_SELECTOR = '.hammer-table-sticky-scroll, .ant-table-sticky-scroll, [data-table-sticky-scroll]';
  const TABLE_PING_LEFT_CLASS_NAMES = ['hammer-table-ping-left', 'ant-table-ping-left'];
  const TABLE_PING_RIGHT_CLASS_NAMES = ['hammer-table-ping-right', 'ant-table-ping-right'];
  const CAROUSEL_ROOT_SELECTOR = '[data-carousel-root]';
  const CAROUSEL_SLIDE_SELECTOR = '[data-carousel-slide]';
  const CAROUSEL_CONTROL_SELECTOR = '[data-carousel-control]';
  const CAROUSEL_ACTIVE_CLASSES = ['active', 'is-active', 'current', 'selected', 'swiper-slide-active', 'slick-active'];
  const HERO_CAROUSEL_MIN_WIDTH_RATIO = 0.75;
  const HERO_CAROUSEL_MIN_HEIGHT = 240;
  const HERO_CAROUSEL_MAX_HEIGHT = 720;
  const HERO_CAROUSEL_HEIGHT_THRESHOLD = 12;
  const HERO_CAROUSEL_INDICATOR_MIN_WIDTH = 120;
  const HERO_CAROUSEL_INDICATOR_MAX_HEIGHT = 32;
  const ENABLE_AGGRESSIVE_STATE_RECOVERY = window.__PROTO_RESTORE_ENABLE_AGGRESSIVE_STATE_RECOVERY__ === true;
  const ENABLE_HEURISTIC_LAYOUT_FIXES = window.__PROTO_RESTORE_ENABLE_HEURISTIC_LAYOUT_FIXES__ !== false;
  const ENABLE_COMPACT_ACTION_HOVER_NEUTRALIZATION = window.__PROTO_RESTORE_ENABLE_COMPACT_ACTION_HOVER_NEUTRALIZATION__ === true;
  const ENABLE_RUNTIME_AFFIX_NORMALIZATION = window.__PROTO_RESTORE_ENABLE_RUNTIME_AFFIX_NORMALIZATION__ === true;
  const ENABLE_RUNTIME_LAYOUT_SNAPSHOT_REPLAY = window.__PROTO_RESTORE_ENABLE_RUNTIME_LAYOUT_SNAPSHOT_REPLAY__ === true;
  const INTERACTIVE_RUNTIME_SELECTOR = 'a[href], button, summary, label, [role="button"], [role="tab"], [role="menuitem"], [role="option"], [role="link"], [tabindex], [data-hover-trigger], [data-clickable="true"]';
  const INTERACTIVE_RUNTIME_CLASS_PATTERN = /(btn|button|tab|menu|item|link|card|option|trigger|switch|checkbox|radio|select|dropdown)/i;
  const HOVER_SENSITIVE_INLINE_PROPERTIES = new Set([
    'color',
    '-webkit-text-fill-color',
    '-webkit-text-stroke-color',
    '-webkit-text-stroke-width',
    'background',
    'background-color',
    'background-image',
    'background-position',
    'background-repeat',
    'background-size',
    'background-clip',
    'border',
    'border-top',
    'border-right',
    'border-bottom',
    'border-left',
    'border-radius',
    'outline',
    'outline-offset',
    'box-shadow',
    'opacity',
    'transform',
    'transform-origin',
    'transform-style',
    'perspective',
    'perspective-origin',
    'filter',
    'backdrop-filter',
    'clip-path',
    'mask-image',
    'mask-size',
    'mask-repeat',
    'mask-position',
    'cursor',
    'pointer-events',
    'user-select',
    'transition',
    'transition-property',
    'transition-duration',
    'transition-delay',
    'transition-timing-function',
    'animation',
    'animation-name',
    'animation-duration',
    'animation-delay',
    'animation-iteration-count',
    'animation-direction',
    'animation-fill-mode',
    'animation-play-state',
    'animation-timing-function',
    'will-change'
  ]);

  function toArray(value) {
    return Array.prototype.slice.call(value || []);
  }

  function unique(elements) {
    return Array.from(new Set(elements.filter(Boolean)));
  }

  function isVisible(element) {
    if (!element) {
      return false;
    }

    const style = window.getComputedStyle(element);
    return !element.hidden && style.display !== 'none' && style.visibility !== 'hidden';
  }

  function toggleClasses(target, classes, active) {
    if (!target) {
      return;
    }

    classes.forEach((className) => target.classList.toggle(className, active));
  }

  function getTextContent(element) {
    return (element?.textContent || '').trim();
  }

  function matchesSelector(element, selector) {
    return !!element && typeof element.matches === 'function' && element.matches(selector);
  }

  function splitInlineStyleEntries(styleText) {
    const entries = [];
    let current = '';
    let quote = '';
    let depth = 0;

    for (let index = 0; index < String(styleText || '').length; index += 1) {
      const character = styleText[index];

      if (quote) {
        current += character;
        if (character === '\\\\' && index + 1 < styleText.length) {
          current += styleText[index + 1];
          index += 1;
          continue;
        }

        if (character === quote) {
          quote = '';
        }
        continue;
      }

      if (character === '"' || character === '\\'') {
        quote = character;
        current += character;
        continue;
      }

      if (character === '(') {
        depth += 1;
        current += character;
        continue;
      }

      if (character === ')' && depth > 0) {
        depth -= 1;
        current += character;
        continue;
      }

      if (character === ';' && depth === 0) {
        const entry = current.trim();
        if (entry) {
          entries.push(entry);
        }
        current = '';
        continue;
      }

      current += character;
    }

    const trailingEntry = current.trim();
    if (trailingEntry) {
      entries.push(trailingEntry);
    }

    return entries;
  }

  function parseInlineStyleDeclarations(styleText) {
    return splitInlineStyleEntries(styleText).map((entry) => {
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
    }).filter(Boolean);
  }

  function stringifyInlineStyleDeclarations(entries, options = {}) {
    return entries.map(([property, value]) => {
      const normalizedValue = String(value || '').trim();
      const finalValue = options.forceImportant && normalizedValue && !/!important\\s*$/i.test(normalizedValue)
        ? normalizedValue + ' !important'
        : normalizedValue;
      return property + ':' + finalValue;
    }).join(';');
  }

  function ensureRestoreNodeId(element) {
    if (!element) {
      return '';
    }

    if (element.dataset.restoreNodeId) {
      return element.dataset.restoreNodeId;
    }

    const nextId = 'restore-runtime-inline-' + String((window.__restorePreviewRuntimeInlineId = (window.__restorePreviewRuntimeInlineId || 0) + 1));
    element.dataset.restoreNodeId = nextId;
    return nextId;
  }

  function isInteractiveHoverCandidate(element) {
    if (!element || !isVisible(element) || element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') {
      return false;
    }

    if (matchesSelector(element, INTERACTIVE_RUNTIME_SELECTOR)) {
      return true;
    }

    const className = typeof element.className === 'string' ? element.className : '';
    const style = window.getComputedStyle(element);
    return INTERACTIVE_RUNTIME_CLASS_PATTERN.test(className) && style.cursor === 'pointer';
  }

  function collectInteractiveInlineTargets() {
    const targets = [];

    unique(toArray(document.querySelectorAll(INTERACTIVE_RUNTIME_SELECTOR)).concat(
      toArray(document.querySelectorAll('body *')).filter((element) => {
        const className = typeof element.className === 'string' ? element.className : '';
        return INTERACTIVE_RUNTIME_CLASS_PATTERN.test(className);
      })
    )).forEach((element) => {
      if (!isInteractiveHoverCandidate(element)) {
        return;
      }

      targets.push(element);
      toArray(element.querySelectorAll('[style]')).forEach((child) => {
        if (isVisible(child)) {
          targets.push(child);
        }
      });
    });

    return unique(targets);
  }

  function releaseInteractiveInlineStyles() {
    const targets = collectInteractiveInlineTargets();
    if (!targets.length) {
      return;
    }

    const styleElementId = 'restore-interactive-inline-style-base';
    const head = document.head || document.documentElement;
    if (!head) {
      return;
    }

    let styleElement = document.getElementById(styleElementId);
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleElementId;
      head.appendChild(styleElement);
    }

    const nextRules = [];
    targets.forEach((element) => {
      if (element.dataset.restoreInlineHoverReleased === 'true') {
        return;
      }

      const declarations = parseInlineStyleDeclarations(element.getAttribute('style') || '');
      if (!declarations.length) {
        return;
      }

      const extracted = declarations.filter(([property]) => HOVER_SENSITIVE_INLINE_PROPERTIES.has(property));
      if (!extracted.length) {
        return;
      }

      const retained = declarations.filter(([property]) => !HOVER_SENSITIVE_INLINE_PROPERTIES.has(property));
      const restoreNodeId = ensureRestoreNodeId(element);
      if (!restoreNodeId) {
        return;
      }

      const retainedStyle = stringifyInlineStyleDeclarations(retained);
      if (retainedStyle) {
        element.setAttribute('style', retainedStyle + ';');
      } else {
        element.removeAttribute('style');
      }

      nextRules.push('[data-restore-node-id="' + restoreNodeId + '"][data-restore-node-id="' + restoreNodeId + '"][data-restore-inline-hover-released="true"] { ' + stringifyInlineStyleDeclarations(extracted, { forceImportant: true }) + '; }');
      element.dataset.restoreInlineHoverReleased = 'true';
    });

    if (nextRules.length) {
      styleElement.appendChild(document.createTextNode('\\n' + nextRules.join('\\n') + '\\n'));
    }
  }

  function ensureCompactActionHoverNeutralizerStyle() {
    if (document.getElementById('protorec-compact-action-hover-neutralizer-style')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'protorec-compact-action-hover-neutralizer-style';
    style.textContent = [
      '[data-protorec-compact-action="true"]:hover,',
      '[data-protorec-compact-action="true"]:focus,',
      '[data-protorec-compact-action="true"]:focus-visible,',
      '[data-protorec-compact-action="true"]:active {',
      '  background: transparent !important;',
      '  background-color: transparent !important;',
      '  background-image: none !important;',
      '  box-shadow: none !important;',
      '}'
    ].join('\\n');
    document.head.appendChild(style);
  }

  function hasVisibleIconDescendant(element) {
    if (!element) {
      return false;
    }

    return !!element.querySelector('svg, img, [class*="icon"], [class^="icon"], .anticon, .hammer-icon');
  }

  function isTransparentBackgroundColor(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return !normalized
      || normalized === 'transparent'
      || normalized === 'rgba(0, 0, 0, 0)'
      || normalized === 'rgba(0,0,0,0)';
  }

  function isCompactDecorativeActionTarget(element) {
    if (!element || !isVisible(element)) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20 || rect.width > 96 || rect.height > 104) {
      return false;
    }

    const style = window.getComputedStyle(element);
    const display = String(style.display || '').toLowerCase();
    if (!display.includes('flex') && display !== 'block' && display !== 'inline-block') {
      return false;
    }

    const interactiveOwner = matchesSelector(element, INTERACTIVE_RUNTIME_SELECTOR)
      ? element
      : element.closest(INTERACTIVE_RUNTIME_SELECTOR);
    const interactiveStyle = interactiveOwner ? window.getComputedStyle(interactiveOwner) : style;
    if (interactiveStyle.cursor !== 'pointer' && style.cursor !== 'pointer') {
      return false;
    }

    const normalizedText = String(element.textContent || '').replace(/\\s+/g, '').trim();
    if (normalizedText.length > 8) {
      return false;
    }

    if (!hasVisibleIconDescendant(element)) {
      return false;
    }

    const baseBackgroundTransparent = isTransparentBackgroundColor(style.backgroundColor)
      && String(style.backgroundImage || '').trim().toLowerCase() === 'none';
    const ownerBackgroundTransparent = !interactiveOwner || (
      isTransparentBackgroundColor(interactiveStyle.backgroundColor)
      && String(interactiveStyle.backgroundImage || '').trim().toLowerCase() === 'none'
    );
    if (!baseBackgroundTransparent && !ownerBackgroundTransparent) {
      return false;
    }

    return String(style.boxShadow || '').trim().toLowerCase() === 'none'
      && String(interactiveStyle.boxShadow || '').trim().toLowerCase() === 'none';
  }

  function neutralizeCompactActionHoverSurfaces() {
    ensureCompactActionHoverNeutralizerStyle();

    unique(toArray(document.querySelectorAll('body *')).filter((element) => {
      const interactiveCandidate = matchesSelector(element, INTERACTIVE_RUNTIME_SELECTOR)
        || !!element.closest(INTERACTIVE_RUNTIME_SELECTOR)
        || window.getComputedStyle(element).cursor === 'pointer';
      return interactiveCandidate && isCompactDecorativeActionTarget(element);
    })).forEach((element) => {
      element.setAttribute('data-protorec-compact-action', 'true');
    });
  }

  function markBound(element, key) {
    if (!element) {
      return true;
    }

    const flagName = 'restoreBound' + key;
    if (element.dataset[flagName] === 'true') {
      return true;
    }

    element.dataset[flagName] = 'true';
    return false;
  }

  function rememberInlineStyleSnapshot(element, snapshotKey, propertyNames) {
    if (!(element instanceof HTMLElement)) {
      return {};
    }

    const storageKey = 'restoreInlineStyleSnapshot' + snapshotKey;
    if (!element.dataset[storageKey]) {
      const snapshot = {};
      propertyNames.forEach((propertyName) => {
        snapshot[propertyName] = {
          value: element.style.getPropertyValue(propertyName) || '',
          priority: element.style.getPropertyPriority(propertyName) || ''
        };
      });
      element.dataset[storageKey] = JSON.stringify(snapshot);
    }

    try {
      return JSON.parse(element.dataset[storageKey] || '{}');
    } catch (_error) {
      return {};
    }
  }

  function restoreInlineStyleSnapshot(element, snapshotKey) {
    if (!(element instanceof HTMLElement)) {
      return;
    }

    const storageKey = 'restoreInlineStyleSnapshot' + snapshotKey;
    let snapshot = {};
    try {
      snapshot = JSON.parse(element.dataset[storageKey] || '{}');
    } catch (_error) {
      snapshot = {};
    }

    Object.entries(snapshot).forEach(([propertyName, entry]) => {
      const value = entry && typeof entry.value === 'string' ? entry.value : '';
      const priority = entry && typeof entry.priority === 'string' ? entry.priority : '';
      if (value) {
        element.style.setProperty(propertyName, value, priority);
      } else {
        element.style.removeProperty(propertyName);
      }
    });
  }

  function setImportantStyleProperty(element, propertyName, value) {
    if (!(element instanceof HTMLElement)) {
      return;
    }

    element.style.setProperty(propertyName, value, 'important');
  }

  function rememberDisplay(element) {
    if (!element) {
      return;
    }

    if (!element.dataset.restoreDisplay) {
      element.dataset.restoreDisplay = element.style.display || '';
    }
  }

  function showElement(element) {
    if (!element) {
      return;
    }

    rememberDisplay(element);
    element.hidden = false;
    element.setAttribute('aria-hidden', 'false');

    if (element.dataset.restoreDisplay && element.dataset.restoreDisplay !== 'none') {
      element.style.display = element.dataset.restoreDisplay;
    } else {
      element.style.removeProperty('display');
    }
  }

  function hideElement(element) {
    if (!element) {
      return;
    }

    rememberDisplay(element);
    element.hidden = true;
    element.setAttribute('aria-hidden', 'true');
    element.style.display = 'none';
  }

  function dispatchValueChange(target) {
    if (!target) {
      return;
    }

    ['input', 'change'].forEach((eventName) => {
      target.dispatchEvent(new Event(eventName, { bubbles: true }));
    });
  }

  function findNearestByDistance(reference, candidates) {
    if (!reference || !candidates.length) {
      return null;
    }

    const referenceRect = reference.getBoundingClientRect();
    let nearest = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    candidates.forEach((candidate) => {
      const candidateRect = candidate.getBoundingClientRect();
      const deltaX = candidateRect.left - referenceRect.left;
      const deltaY = candidateRect.top - referenceRect.bottom;
      const distance = Math.abs(deltaX) + Math.abs(deltaY);

      if (distance < bestDistance) {
        bestDistance = distance;
        nearest = candidate;
      }
    });

    return nearest;
  }

  function resolvePanelByTab(tab, container) {
    const interactiveTab = tab.matches(TAB_WRAPPER_SELECTOR)
      ? tab.querySelector('[role="tab"]') || tab
      : tab;
    const controlledId = interactiveTab.getAttribute('aria-controls');
    if (controlledId) {
      return document.getElementById(controlledId);
    }

    const tabTarget = interactiveTab.getAttribute('data-target') || interactiveTab.getAttribute('href') || tab.getAttribute('data-target') || tab.getAttribute('href');
    if (tabTarget && tabTarget.startsWith('#')) {
      return container.querySelector(tabTarget) || document.getElementById(tabTarget.slice(1));
    }

    return null;
  }

  function guessPanelByIndex(container, index) {
    const panels = unique(toArray(container.querySelectorAll(PANEL_SELECTOR)));
    return panels[index] || null;
  }

  function collectTabs(container) {
    return unique(
      toArray(container.querySelectorAll(TAB_SELECTOR)).filter((element) => {
        const label = (element.textContent || '').trim();
        if (!label.length) {
          return false;
        }

        if (element.getAttribute('role') === 'tab') {
          const wrapper = element.closest(TAB_WRAPPER_SELECTOR);
          if (wrapper && wrapper !== element && container.contains(wrapper)) {
            return false;
          }
        }

        return true;
      })
    );
  }

  function collectPanels(container, tabs) {
    const resolvedPanels = tabs.map((tab, index) => resolvePanelByTab(tab, container) || guessPanelByIndex(container, index));
    const existingPanels = resolvedPanels.filter(Boolean);

    if (existingPanels.length > 0) {
      return resolvedPanels;
    }

    return unique(toArray(container.querySelectorAll(PANEL_SELECTOR)));
  }

  function setTabActive(tab, active) {
    const tabWrapper = tab.matches(TAB_WRAPPER_SELECTOR) ? tab : tab.closest(TAB_WRAPPER_SELECTOR);
    const interactiveTab = tab.matches('[role="tab"]') ? tab : tab.querySelector('[role="tab"]');
    toggleClasses(tab, ACTIVE_TAB_CLASSES, active);
    toggleClasses(tabWrapper, ACTIVE_TAB_CLASSES, active);

    if (tab.getAttribute('role') === 'tab' || tab.hasAttribute('aria-selected')) {
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    }

    if (interactiveTab) {
      interactiveTab.setAttribute('aria-selected', active ? 'true' : 'false');
      interactiveTab.setAttribute('tabindex', active ? '0' : '-1');
    }

    if (tab.hasAttribute('tabindex') || tab.getAttribute('role') === 'tab') {
      tab.setAttribute('tabindex', active ? '0' : '-1');
    }
  }

  function setPanelActive(panel, active) {
    if (!panel) {
      return;
    }

    if (!panel.dataset.restoreDisplay) {
      panel.dataset.restoreDisplay = panel.style.display || '';
    }

    toggleClasses(panel, ACTIVE_PANEL_CLASSES, active);
    toggleClasses(panel, HIDDEN_PANEL_CLASSES, !active);
    panel.hidden = !active;
    panel.setAttribute('aria-hidden', active ? 'false' : 'true');

    if (active) {
      if (panel.dataset.restoreDisplay && panel.dataset.restoreDisplay !== 'none') {
        panel.style.display = panel.dataset.restoreDisplay;
      } else {
        panel.style.removeProperty('display');
      }
      return;
    }

    panel.style.display = 'none';
  }

  function resolveInkBar(group) {
    return group.container?.querySelector('.ant-tabs-ink-bar, .hammer-tabs-ink-bar, .el-tabs__active-bar') || null;
  }

  function updateInkBar(group, activeIndex) {
    const inkBar = resolveInkBar(group);
    const activeTab = group.tabs[activeIndex];
    if (!inkBar || !activeTab) {
      return;
    }

    const activeTabWrapper = activeTab.matches(TAB_WRAPPER_SELECTOR)
      ? activeTab
      : activeTab.closest(TAB_WRAPPER_SELECTOR) || activeTab;
    const offsetParent = inkBar.offsetParent || inkBar.parentElement;
    const tabRect = activeTabWrapper.getBoundingClientRect();
    const parentRect = offsetParent?.getBoundingClientRect();

    if (!tabRect || !parentRect) {
      return;
    }

    const left = Math.round(tabRect.left - parentRect.left + (offsetParent?.scrollLeft || 0));
    const width = Math.round(tabRect.width);
    inkBar.style.left = left + 'px';
    inkBar.style.width = width + 'px';
    inkBar.style.transform = 'none';
  }

  function activateGroup(group, activeIndex) {
    group.tabs.forEach((tab, index) => {
      setTabActive(tab, index === activeIndex);
    });

    group.panels.forEach((panel, index) => {
      setPanelActive(panel, index === activeIndex);
    });

    updateInkBar(group, activeIndex);
  }

  function getInitialActiveIndex(group) {
    const tabIndex = group.tabs.findIndex((tab) => {
      const tabWrapper = tab.matches(TAB_WRAPPER_SELECTOR) ? tab : tab.closest(TAB_WRAPPER_SELECTOR);
      const interactiveTab = tab.matches('[role="tab"]') ? tab : tab.querySelector('[role="tab"]');
      return tab.getAttribute('aria-selected') === 'true'
        || interactiveTab?.getAttribute('aria-selected') === 'true'
        || ACTIVE_TAB_CLASSES.some((className) => tab.classList.contains(className) || tabWrapper?.classList.contains(className) || interactiveTab?.classList.contains(className));
    });

    if (tabIndex >= 0) {
      return tabIndex;
    }

    const visiblePanelIndexes = group.panels
      .map((panel, index) => (panel && isVisible(panel) ? index : -1))
      .filter((index) => index >= 0);

    if (visiblePanelIndexes.length === 1) {
      return visiblePanelIndexes[0];
    }

    if (visiblePanelIndexes.length > 1 && ENABLE_AGGRESSIVE_STATE_RECOVERY) {
      return visiblePanelIndexes[0];
    }

    return ENABLE_AGGRESSIVE_STATE_RECOVERY ? 0 : -1;
  }

  function resolveTabPreviewPath(tab, clickTarget) {
    const tabWrapper = tab.matches(TAB_WRAPPER_SELECTOR) ? tab : tab.closest(TAB_WRAPPER_SELECTOR);
    return clickTarget?.getAttribute('data-restore-preview-path')
      || tab.getAttribute('data-restore-preview-path')
      || tabWrapper?.getAttribute('data-restore-preview-path')
      || '';
  }

  function bindGroup(group) {
    if (!group || group.tabs.length < 2) {
      return;
    }

    if (group.panels.length >= 2) {
      const initialActiveIndex = getInitialActiveIndex(group);
      if (initialActiveIndex >= 0) {
        activateGroup(group, initialActiveIndex);
      }
    }

    group.tabs.forEach((tab, index) => {
      const clickTarget = tab.querySelector('.ant-tabs-tab-btn, .hammer-tabs-tab-btn, [role="tab"]') || tab;
      if (clickTarget.dataset.restoreTabsBound === 'true') {
        return;
      }

      clickTarget.dataset.restoreTabsBound = 'true';
      clickTarget.style.cursor = clickTarget.style.cursor || 'pointer';
      clickTarget.addEventListener('click', (event) => {
        const previewPath = resolveTabPreviewPath(tab, clickTarget);
        if (previewPath && previewPath !== (window.location.pathname + window.location.search)) {
          event.preventDefault();
          window.location.assign(previewPath);
          return;
        }

        const href = tab.getAttribute('href') || clickTarget.getAttribute('href') || '';
        if (href.startsWith('#')) {
          event.preventDefault();
        }

        if (group.panels.length >= 2) {
          activateGroup(group, index);
        }
      });
    });
  }

  function closeAllDropdownMenus(exceptMenu = null, exceptTrigger = null) {
    toArray(document.querySelectorAll(DROPDOWN_MENU_SELECTOR)).forEach((menu) => {
      if (menu === exceptMenu) {
        return;
      }

      toggleClasses(menu, DROPDOWN_HIDDEN_CLASSES, true);
      hideElement(menu);
      if (menu.dataset.restoreTriggerId && menu.dataset.restoreTriggerId !== exceptTrigger?.dataset.restoreTriggerId) {
        const relatedTrigger = document.querySelector('[data-restore-trigger-id="' + menu.dataset.restoreTriggerId + '"]');
        if (relatedTrigger) {
          relatedTrigger.setAttribute('aria-expanded', 'false');
        }
      }
    });
  }

  function resolveDropdownMenu(trigger) {
    const targetId = trigger.getAttribute('aria-controls') || trigger.getAttribute('data-target');
    if (targetId) {
      const normalizedTargetId = targetId.replace(/^#/, '');
      const targetElement = document.getElementById(normalizedTargetId);
      if (targetElement) {
        return targetElement;
      }
    }

    const href = trigger.getAttribute('href');
    if (href && href.startsWith('#')) {
      return document.getElementById(href.slice(1));
    }

    const siblingMenus = unique([
      trigger.nextElementSibling,
      trigger.parentElement?.querySelector(DROPDOWN_MENU_SELECTOR),
      trigger.closest('[data-dropdown-root]')?.querySelector(DROPDOWN_MENU_SELECTOR)
    ].filter((element) => matchesSelector(element, DROPDOWN_MENU_SELECTOR)));

    if (siblingMenus.length > 0) {
      return siblingMenus[0];
    }

    const candidates = toArray(document.querySelectorAll(DROPDOWN_MENU_SELECTOR));
    return findNearestByDistance(trigger, candidates);
  }

  function toggleDropdown(trigger, forceOpen) {
    const menu = resolveDropdownMenu(trigger);
    if (!menu) {
      return false;
    }

    if (!trigger.dataset.restoreTriggerId) {
      trigger.dataset.restoreTriggerId = String(Math.random()).slice(2);
    }

    menu.dataset.restoreTriggerId = trigger.dataset.restoreTriggerId;
    const shouldOpen = typeof forceOpen === 'boolean'
      ? forceOpen
      : menu.hidden || window.getComputedStyle(menu).display === 'none' || DROPDOWN_HIDDEN_CLASSES.some((className) => menu.classList.contains(className));

    closeAllDropdownMenus(shouldOpen ? menu : null, trigger);

    if (shouldOpen) {
      toggleClasses(menu, DROPDOWN_HIDDEN_CLASSES, false);
      showElement(menu);
      trigger.setAttribute('aria-expanded', 'true');
      return true;
    }

    toggleClasses(menu, DROPDOWN_HIDDEN_CLASSES, true);
    hideElement(menu);
    trigger.setAttribute('aria-expanded', 'false');
    return false;
  }

  function bindDropdowns() {
    toArray(document.querySelectorAll(DROPDOWN_TRIGGER_SELECTOR)).forEach((trigger) => {
      if (markBound(trigger, 'Dropdown')) {
        return;
      }

      trigger.style.cursor = trigger.style.cursor || 'pointer';
      trigger.addEventListener('click', (event) => {
        const href = trigger.getAttribute('href') || '';
        if (href.startsWith('#')) {
          event.preventDefault();
        }

        if (resolveDropdownMenu(trigger)) {
          toggleDropdown(trigger);
        }
      });
    });
  }

  function getCarouselGroups() {
    return toArray(document.querySelectorAll(CAROUSEL_ROOT_SELECTOR)).map((root) => {
      const slides = unique(toArray(root.querySelectorAll(CAROUSEL_SLIDE_SELECTOR)));
      const controls = unique(toArray(root.querySelectorAll(CAROUSEL_CONTROL_SELECTOR))).filter((element) => !slides.includes(element));
      if (slides.length < 2) {
        return null;
      }

      return { root, slides, controls };
    }).filter(Boolean);
  }

  function setCarouselSlideActive(slide, active) {
    if (!slide) {
      return;
    }

    rememberDisplay(slide);
    toggleClasses(slide, CAROUSEL_ACTIVE_CLASSES, active);
    slide.hidden = !active;
    slide.setAttribute('aria-hidden', active ? 'false' : 'true');
    slide.style.pointerEvents = active ? 'auto' : 'none';
    slide.style.opacity = active ? '1' : '0';

    if (active) {
      if (slide.dataset.restoreDisplay && slide.dataset.restoreDisplay !== 'none') {
        slide.style.display = slide.dataset.restoreDisplay;
      } else {
        slide.style.removeProperty('display');
      }
      return;
    }

    slide.style.display = 'none';
  }

  function setCarouselControlActive(control, active) {
    if (!control) {
      return;
    }

    toggleClasses(control, CAROUSEL_ACTIVE_CLASSES, active);
    control.setAttribute('aria-current', active ? 'true' : 'false');
    if (control.getAttribute('role') === 'tab') {
      control.setAttribute('aria-selected', active ? 'true' : 'false');
      control.setAttribute('tabindex', active ? '0' : '-1');
    }
  }

  function getInitialCarouselIndex(group) {
    const explicitActiveIndex = group.slides.findIndex((slide) => {
      return CAROUSEL_ACTIVE_CLASSES.some((className) => slide.classList.contains(className))
        || slide.getAttribute('aria-hidden') === 'false'
        || slide.getAttribute('aria-current') === 'true'
        || slide.getAttribute('data-active') === 'true';
    });

    if (explicitActiveIndex >= 0) {
      return explicitActiveIndex;
    }

    const visibleSlideIndexes = group.slides
      .map((slide, index) => (isVisible(slide) ? index : -1))
      .filter((index) => index >= 0);

    if (visibleSlideIndexes.length === 1) {
      return visibleSlideIndexes[0];
    }

    if (visibleSlideIndexes.length > 1 && ENABLE_AGGRESSIVE_STATE_RECOVERY) {
      return visibleSlideIndexes[0];
    }

    return ENABLE_AGGRESSIVE_STATE_RECOVERY ? 0 : -1;
  }

  function activateCarousel(group, activeIndex) {
    group.slides.forEach((slide, index) => {
      setCarouselSlideActive(slide, index === activeIndex);
    });
    group.controls.forEach((control, index) => {
      setCarouselControlActive(control, index === activeIndex);
    });
    group.root.dataset.restoreCarouselIndex = String(activeIndex);
  }

  function bindCarousels() {
    getCarouselGroups().forEach((group) => {
      const initialIndex = getInitialCarouselIndex(group);
      if (initialIndex >= 0) {
        activateCarousel(group, initialIndex);
      }

      group.controls.forEach((control, index) => {
        if (markBound(control, 'CarouselControl')) {
          return;
        }

        control.style.cursor = control.style.cursor || 'pointer';
        ['click', 'mouseenter'].forEach((eventName) => {
          control.addEventListener(eventName, (event) => {
            if (eventName === 'click') {
              const href = control.getAttribute('href') || '';
              if (href.startsWith('#')) {
                event.preventDefault();
              }
            }

            activateCarousel(group, index);
          });
        });
      });
    });
  }

  function resolveSelectRoot(element) {
    return element?.closest(SELECT_ROOT_SELECTOR) || null;
  }

  function resolveSelectMenu(selectRoot) {
    const controller = selectRoot.querySelector('[aria-controls], [data-target], [role="combobox"]');
    const controlledId = controller?.getAttribute('aria-controls') || controller?.getAttribute('data-target');
    if (controlledId) {
      const normalizedId = controlledId.replace(/^#/, '');
      const targetElement = document.getElementById(normalizedId);
      if (targetElement) {
        return targetElement;
      }

      return null;
    }

    const scopedCandidates = unique([
      selectRoot.querySelector(SELECT_MENU_SELECTOR),
      matchesSelector(selectRoot.nextElementSibling, SELECT_MENU_SELECTOR) ? selectRoot.nextElementSibling : null,
      selectRoot.parentElement?.querySelector(SELECT_MENU_SELECTOR),
      selectRoot.closest('[data-select-scope]')?.querySelector(SELECT_MENU_SELECTOR)
    ].filter(Boolean));

    if (scopedCandidates.length > 0) {
      return scopedCandidates[0];
    }

    const candidates = toArray(document.querySelectorAll(SELECT_MENU_SELECTOR));
    if (candidates.length === 1) {
      return candidates[0];
    }

    return null;
  }

  function syncSelectValue(selectRoot, value) {
    const displayValue = String(value || '').trim();
    const valueElement = selectRoot.querySelector(SELECT_VALUE_SELECTOR);
    if (valueElement) {
      valueElement.textContent = displayValue;
      valueElement.title = displayValue;
    }

    const searchInput = selectRoot.querySelector('input, textarea');
    if (searchInput && searchInput.type !== 'file') {
      searchInput.value = displayValue;
      dispatchValueChange(searchInput);
    }

    selectRoot.dataset.restoreSelectValue = displayValue;
    toggleClasses(selectRoot, FILLED_INPUT_CLASSES, Boolean(displayValue));
  }

  function openSelect(selectRoot) {
    const menu = resolveSelectMenu(selectRoot);
    closeAllDropdownMenus(menu || null);
    toggleClasses(selectRoot, SELECT_OPEN_CLASSES, true);

    const controller = selectRoot.querySelector('[role="combobox"], input[aria-expanded], input');
    if (controller) {
      controller.setAttribute('aria-expanded', 'true');
    }

    if (menu) {
      toggleClasses(menu, DROPDOWN_HIDDEN_CLASSES, false);
      showElement(menu);
    }
  }

  function closeSelect(selectRoot) {
    const menu = resolveSelectMenu(selectRoot);
    toggleClasses(selectRoot, SELECT_OPEN_CLASSES, false);

    const controller = selectRoot.querySelector('[role="combobox"], input[aria-expanded], input');
    if (controller) {
      controller.setAttribute('aria-expanded', 'false');
    }

    if (menu) {
      toggleClasses(menu, DROPDOWN_HIDDEN_CLASSES, true);
      hideElement(menu);
    }
  }

  function toggleSelect(selectRoot) {
    const isOpen = SELECT_OPEN_CLASSES.some((className) => selectRoot.classList.contains(className));
    if (isOpen) {
      closeSelect(selectRoot);
      return;
    }

    openSelect(selectRoot);
  }

  function clearSelect(selectRoot) {
    syncSelectValue(selectRoot, '');

    const selectedOptions = toArray(resolveSelectMenu(selectRoot)?.querySelectorAll(SELECT_OPTION_SELECTOR) || []);
    selectedOptions.forEach((option) => {
      option.setAttribute('aria-selected', 'false');
      toggleClasses(option, ACTIVE_TAB_CLASSES, false);
      toggleClasses(option, ['ant-select-item-option-selected', 'selected', 'is-selected'], false);
    });

    closeSelect(selectRoot);
  }

  function bindSelects() {
    toArray(document.querySelectorAll(SELECT_ROOT_SELECTOR)).forEach((selectRoot) => {
      const trigger = selectRoot.querySelector(SELECT_TRIGGER_SELECTOR) || selectRoot;
      if (!markBound(trigger, 'Select')) {
        trigger.style.cursor = trigger.style.cursor || 'pointer';
        trigger.addEventListener('click', (event) => {
          if (event.target.closest(SELECT_CLEAR_SELECTOR)) {
            return;
          }

          toggleSelect(selectRoot);
        });
      }

      const clearTrigger = selectRoot.querySelector(SELECT_CLEAR_SELECTOR);
      if (clearTrigger && !markBound(clearTrigger, 'SelectClear')) {
        clearTrigger.style.cursor = clearTrigger.style.cursor || 'pointer';
        clearTrigger.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          clearSelect(selectRoot);
        });
      }

      const menu = resolveSelectMenu(selectRoot);
      if (!menu) {
        return;
      }

      toArray(menu.querySelectorAll(SELECT_OPTION_SELECTOR)).forEach((option) => {
        if (markBound(option, 'SelectOption')) {
          return;
        }

        option.style.cursor = option.style.cursor || 'pointer';
        option.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          const optionText = option.getAttribute('data-value') || option.getAttribute('label') || getTextContent(option);
          syncSelectValue(selectRoot, optionText);

          toArray(menu.querySelectorAll(SELECT_OPTION_SELECTOR)).forEach((candidate) => {
            const isSelected = candidate === option;
            candidate.setAttribute('aria-selected', isSelected ? 'true' : 'false');
            toggleClasses(candidate, ['ant-select-item-option-selected', 'selected', 'is-selected'], isSelected);
          });

          closeSelect(selectRoot);
        });
      });
    });
  }

  function resolveCollapseContent(header) {
    const headerTarget = header.getAttribute('aria-controls') || header.getAttribute('data-target');
    if (headerTarget) {
      const normalizedTarget = headerTarget.replace(/^#/, '');
      const targetElement = document.getElementById(normalizedTarget);
      if (targetElement) {
        return targetElement;
      }
    }

    const item = header.closest(COLLAPSE_ITEM_SELECTOR);
    if (item) {
      return item.querySelector(COLLAPSE_CONTENT_SELECTOR);
    }

    return header.nextElementSibling && matchesSelector(header.nextElementSibling, COLLAPSE_CONTENT_SELECTOR)
      ? header.nextElementSibling
      : null;
  }

  function toggleCollapse(header, forceOpen) {
    const item = header.closest(COLLAPSE_ITEM_SELECTOR) || header;
    const content = resolveCollapseContent(header);
    if (!content) {
      return;
    }

    const isOpen = COLLAPSE_ACTIVE_CLASSES.some((className) => item.classList.contains(className))
      || header.getAttribute('aria-expanded') === 'true'
      || isVisible(content);
    const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !isOpen;

    toggleClasses(item, COLLAPSE_ACTIVE_CLASSES, shouldOpen);
    header.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');

    if (shouldOpen) {
      showElement(content);
      return;
    }

    hideElement(content);
  }

  function bindCollapse() {
    toArray(document.querySelectorAll(COLLAPSE_HEADER_SELECTOR)).forEach((header) => {
      if (markBound(header, 'Collapse')) {
        return;
      }

      header.style.cursor = header.style.cursor || 'pointer';
      const expanded = header.getAttribute('aria-expanded');
      if (expanded === 'true' || expanded === 'false') {
        toggleCollapse(header, expanded === 'true');
      }

      header.addEventListener('click', (event) => {
        const href = header.getAttribute('href') || '';
        if (href.startsWith('#')) {
          event.preventDefault();
        }

        toggleCollapse(header);
      });
    });
  }

  function getModalSelectorHints(trigger) {
    return unique([
      trigger?.getAttribute('data-target'),
      trigger?.getAttribute('data-modal-target'),
      trigger?.getAttribute('aria-controls'),
      trigger?.getAttribute('data-controls'),
      trigger?.getAttribute('href')
    ].map((value) => String(value || '').trim()).filter(Boolean).map((value) => {
      if (value.startsWith('javascript:')) {
        return '';
      }

      if (value.startsWith('#') || value.startsWith('.')) {
        return value;
      }

      if (/^[A-Za-z][\\w:-]*$/.test(value)) {
        return '#' + value;
      }

      return '';
    }).filter(Boolean));
  }

  function resolveModalByHint(selectorHint) {
    if (!selectorHint) {
      return null;
    }

    try {
      const targetElement = document.querySelector(selectorHint);
      if (!targetElement) {
        return null;
      }

      return targetElement.closest(MODAL_ROOT_SELECTOR) || targetElement;
    } catch (_error) {
      return null;
    }
  }

  function collectModalCandidates() {
    return unique(toArray(document.querySelectorAll(MODAL_ROOT_SELECTOR)).filter((modal) => {
      if (!modal || !(modal instanceof Element) || modal === document.body || modal.contains(document.body)) {
        return false;
      }

      const className = typeof modal.className === 'string' ? modal.className : '';
      return modal.hasAttribute('data-modal-root')
        || modal.getAttribute('role') === 'dialog'
        || modal.getAttribute('aria-modal') === 'true'
        || /(modal|dialog|drawer|popup)/i.test(className);
    }));
  }

  function isLikelyModalTrigger(trigger) {
    if (!trigger || !(trigger instanceof Element)) {
      return false;
    }

    if (trigger.hasAttribute('data-modal-trigger') || trigger.hasAttribute('data-target') || trigger.hasAttribute('data-modal-target')) {
      return true;
    }

    const ariaHasPopup = trigger.getAttribute('aria-haspopup') || '';
    if (/^(dialog|true)$/i.test(ariaHasPopup) || trigger.hasAttribute('aria-controls')) {
      return true;
    }

    const href = trigger.getAttribute('href') || '';
    if (href.startsWith('#')) {
      return true;
    }

    const className = typeof trigger.className === 'string' ? trigger.className : '';
    return /(modal|dialog|drawer|popup|details|filter|login)/i.test(className);
  }

  function getModalCandidateScore(trigger, modal, explicitHints = []) {
    if (!trigger || !modal || !(trigger instanceof Element) || !(modal instanceof Element) || modal.contains(trigger)) {
      return Number.NEGATIVE_INFINITY;
    }

    const className = typeof modal.className === 'string' ? modal.className : '';
    const modalStyle = window.getComputedStyle(modal);
    const modalText = getTextContent(modal).toLowerCase();
    const triggerText = getTextContent(trigger).toLowerCase();
    let score = 0;

    explicitHints.forEach((selectorHint) => {
      const explicitTarget = resolveModalByHint(selectorHint);
      if (explicitTarget === modal || (explicitTarget instanceof Element && explicitTarget.closest(MODAL_ROOT_SELECTOR) === modal)) {
        score += 120;
      }
    });

    if (modal.hasAttribute('data-modal-root')) {
      score += 36;
    }
    if (modal.getAttribute('role') === 'dialog' || modal.getAttribute('aria-modal') === 'true') {
      score += 24;
    }
    if (/(modal|dialog|drawer|popup)/i.test(className)) {
      score += 18;
    }
    if (modalStyle.position === 'fixed' || modalStyle.position === 'absolute' || modalStyle.position === 'sticky') {
      score += 8;
    }
    if (!isVisible(modal) || modalStyle.display === 'none') {
      score += 8;
    }

    const scopedContainer = trigger.closest('[data-modal-scope], form, section, article, aside, li, td, tr, .ant-card, .card, .ant-table-row, .el-table__row');
    if (scopedContainer instanceof Element && scopedContainer.contains(modal)) {
      score += 28;
    }
    if (trigger.parentElement instanceof Element && trigger.parentElement.contains(modal)) {
      score += 18;
    }

    if (triggerText && modalText && modalText.includes(triggerText)) {
      score += 12;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const modalRect = modal.getBoundingClientRect();
    if (triggerRect.width > 0 && triggerRect.height > 0 && modalRect.width > 0 && modalRect.height > 0) {
      const triggerCenterX = triggerRect.left + triggerRect.width / 2;
      const triggerCenterY = triggerRect.top + triggerRect.height / 2;
      const modalCenterX = modalRect.left + modalRect.width / 2;
      const modalCenterY = modalRect.top + modalRect.height / 2;
      const distance = Math.hypot(triggerCenterX - modalCenterX, triggerCenterY - modalCenterY);
      score -= Math.min(48, distance / 24);
    }

    return score;
  }

  function resolveModalFromTrigger(trigger) {
    if (!trigger || !(trigger instanceof Element)) {
      return null;
    }

    if (matchesSelector(trigger, MODAL_CLOSE_SELECTOR) || trigger.closest(MODAL_ROOT_SELECTOR)) {
      return null;
    }

    const explicitHints = getModalSelectorHints(trigger);
    for (const selectorHint of explicitHints) {
      const explicitTarget = resolveModalByHint(selectorHint);
      if (explicitTarget) {
        return explicitTarget;
      }
    }

    const nearbyModal = unique([
      trigger.parentElement?.querySelector(MODAL_ROOT_SELECTOR),
      trigger.closest('[data-modal-scope]')?.querySelector(MODAL_ROOT_SELECTOR)
    ].filter(Boolean))[0];
    if (nearbyModal) {
      return nearbyModal;
    }

    if (!isLikelyModalTrigger(trigger)) {
      return null;
    }

    const candidates = collectModalCandidates()
      .map((modal) => ({ modal, score: getModalCandidateScore(trigger, modal, explicitHints) }))
      .filter(({ score }) => Number.isFinite(score))
      .sort((left, right) => right.score - left.score);

    if (!candidates.length) {
      return null;
    }

    const [bestCandidate, nextCandidate] = candidates;
    if (bestCandidate.score < 20 && !trigger.hasAttribute('data-modal-trigger')) {
      return null;
    }
    if (nextCandidate && bestCandidate.score - nextCandidate.score < 4 && bestCandidate.score < 36) {
      return null;
    }

    return bestCandidate.modal || null;
  }

  function setModalOpenState(modal, active) {
    toggleClasses(modal, MODAL_OPEN_CLASSES, active);
    toggleClasses(modal, MODAL_HIDDEN_CLASSES, !active);

    const masks = unique([
      modal.querySelector('.ant-modal-mask'),
      modal.querySelector('.ant-drawer-mask'),
      modal.matches('.ant-modal-root, .ant-drawer, .el-dialog__wrapper, .hammer-modal, [role="dialog"], .modal') ? modal : null
    ].filter(Boolean));
    const panels = unique([
      ...toArray(modal.querySelectorAll('.ant-modal-wrap, .ant-modal, .ant-drawer-content-wrapper, .ant-drawer-content, .el-dialog, .modal-dialog, .modal-content, [role="document"]')),
      modal
    ]);

    if (active) {
      showElement(modal);
      masks.forEach((mask) => showElement(mask));
      panels.forEach((panel) => {
        toggleClasses(panel, MODAL_HIDDEN_CLASSES, false);
        showElement(panel);
      });
      document.body.style.overflow = 'hidden';
      return;
    }

    masks.forEach((mask) => {
      if (mask !== modal) {
        hideElement(mask);
      }
    });
    panels.forEach((panel) => {
      if (panel !== modal) {
        toggleClasses(panel, MODAL_HIDDEN_CLASSES, true);
        hideElement(panel);
      }
    });
    hideElement(modal);

    const visibleModals = toArray(document.querySelectorAll(MODAL_ROOT_SELECTOR)).some((candidate) => candidate !== modal && isVisible(candidate));
    if (!visibleModals) {
      document.body.style.removeProperty('overflow');
    }
  }

  function bindModalClose(modal) {
    const closeTargets = unique([
      ...toArray(modal.querySelectorAll(MODAL_CLOSE_SELECTOR)),
      modal.querySelector('.ant-modal-mask'),
      modal.querySelector('.ant-drawer-mask')
    ].filter(Boolean));

    closeTargets.forEach((target) => {
      if (markBound(target, 'ModalClose')) {
        return;
      }

      target.style.cursor = target.style.cursor || 'pointer';
      target.addEventListener('click', (event) => {
        event.preventDefault();
        if (target === modal && event.target !== modal) {
          return;
        }
        setModalOpenState(modal, false);
      });
    });
  }

  function bindModals() {
    toArray(document.querySelectorAll(MODAL_ROOT_SELECTOR)).forEach((modal) => {
      bindModalClose(modal);
    });

    toArray(document.querySelectorAll(MODAL_TRIGGER_SELECTOR)).forEach((trigger) => {
      if (matchesSelector(trigger, MODAL_CLOSE_SELECTOR) || !isLikelyModalTrigger(trigger)) {
        return;
      }

      if (markBound(trigger, 'ModalTrigger')) {
        return;
      }

      trigger.addEventListener('click', (event) => {
        const modal = resolveModalFromTrigger(trigger);
        if (!modal) {
          return;
        }

        event.preventDefault();
        setModalOpenState(modal, true);
      });
    });
  }

  function syncInputWrapperState(target) {
    const wrapper = target.closest(INPUT_WRAPPER_SELECTOR);
    const hasValue = Boolean(target.value);
    toggleClasses(wrapper, FILLED_INPUT_CLASSES, hasValue);

    if (!wrapper) {
      return;
    }

    const clearIcon = wrapper.querySelector(CLEAR_TRIGGER_SELECTOR);
    if (clearIcon) {
      clearIcon.style.visibility = hasValue ? 'visible' : 'hidden';
      clearIcon.style.pointerEvents = hasValue ? 'auto' : 'none';
    }
  }

  function clearInput(target) {
    if (!target || target.disabled || target.readOnly || target.type === 'file') {
      return;
    }

    target.value = '';
    dispatchValueChange(target);
    syncInputWrapperState(target);
    target.focus();
  }

  function bindInputs() {
    toArray(document.querySelectorAll('input, textarea')).forEach((target) => {
      if (!markBound(target, 'Input')) {
        target.addEventListener('focus', () => {
          toggleClasses(target.closest(INPUT_WRAPPER_SELECTOR), FOCUSED_INPUT_CLASSES, true);
        });
        target.addEventListener('blur', () => {
          toggleClasses(target.closest(INPUT_WRAPPER_SELECTOR), FOCUSED_INPUT_CLASSES, false);
          syncInputWrapperState(target);
        });
        target.addEventListener('input', () => {
          syncInputWrapperState(target);
        });
      }

      syncInputWrapperState(target);
    });

    toArray(document.querySelectorAll(CLEAR_TRIGGER_SELECTOR)).forEach((trigger) => {
      if (markBound(trigger, 'InputClear')) {
        return;
      }

      trigger.style.cursor = trigger.style.cursor || 'pointer';
      trigger.addEventListener('click', (event) => {
        const wrapper = trigger.closest(INPUT_WRAPPER_SELECTOR) || trigger.parentElement;
        const target = wrapper?.querySelector('input, textarea');
        if (!target) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        clearInput(target);
      });
    });
  }

  function syncTableScrollPosition(header, body) {
    if (!header || !body) {
      return;
    }

    const nextScrollLeft = body.scrollLeft || 0;
    if (Math.abs((header.scrollLeft || 0) - nextScrollLeft) > 1) {
      header.scrollLeft = nextScrollLeft;
    }
  }

  function setNodeClassList(node, classNames, active) {
    if (!node || !Array.isArray(classNames) || !classNames.length) {
      return;
    }

    classNames.forEach((className) => {
      if (!className) {
        return;
      }

      if (active) {
        node.classList.add(className);
      } else {
        node.classList.remove(className);
      }
    });
  }

  function parseSnapshotNumericValue(value) {
    const numeric = Number.parseFloat(String(value || '').trim());
    return Number.isFinite(numeric) ? numeric : NaN;
  }

  function shouldInlineSnapshotWhiteSpace(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return !!normalized && normalized !== 'normal';
  }

  function shouldApplySnapshotOverflowAxis(overflowValue, scrollSize, clientSize) {
    const normalized = String(overflowValue || '').trim().toLowerCase();
    if (!normalized || normalized === 'visible') {
      return false;
    }

    if ((normalized === 'auto' || normalized === 'scroll')
      && Number.isFinite(scrollSize)
      && Number.isFinite(clientSize)
      && scrollSize <= clientSize + 1) {
      return false;
    }

    return true;
  }

  function isIntrinsicSizeManagedMediaElement(element) {
    const normalizedTag = String(element?.tagName || '').toLowerCase();
    if (!['img', 'svg', 'canvas', 'video'].includes(normalizedTag)) {
      return false;
    }

    const styleText = String(element.getAttribute('style') || '');
    return /position\\s*:\\s*absolute/i.test(styleText)
      && /(max-width|max-height)\\s*:/i.test(styleText);
  }

  function isTableTrackSizingElement(element) {
    return [
      'thead',
      'tbody',
      'tfoot',
      'tr',
      'td',
      'th',
      'col',
      'colgroup'
    ].includes(String(element?.tagName || '').toLowerCase());
  }

  function hasViewportManagedSizeStyleText(styleText) {
    const normalizedStyle = String(styleText || '');
    return /(height|min-height|max-height)\\s*:\\s*calc\\([^;]*100(?:d|s|l)?vh/i.test(normalizedStyle)
      || /(height|min-height|max-height)\\s*:\\s*100(?:d|s|l)?vh/i.test(normalizedStyle);
  }

  function isViewportManagedScrollContainerElement(element) {
    const styleText = String(element?.getAttribute('style') || '');
    if (!hasViewportManagedSizeStyleText(styleText)) {
      return false;
    }

    const overflowY = String(
      element?.getAttribute('data-restore-scroll-overflow-y')
      || element?.getAttribute('data-restore-layout-overflow-y')
      || ''
    ).trim().toLowerCase();
    if (!['auto', 'scroll', 'hidden', 'clip'].includes(overflowY)) {
      return false;
    }

    const widthRatio = parseSnapshotNumericValue(element?.getAttribute('data-restore-layout-width-ratio') || '');
    if (Number.isFinite(widthRatio) && widthRatio < 0.8) {
      return false;
    }

    const clientHeight = parseSnapshotNumericValue(element?.getAttribute('data-restore-scroll-client-height') || '');
    return !Number.isFinite(clientHeight) || clientHeight >= 240;
  }

  function isPureMediaLinkWrapper(element) {
    const normalizedTag = String(element?.tagName || '').toLowerCase();
    if (normalizedTag !== 'a') {
      return false;
    }

    const textContent = String(element.textContent || '').replace(/\\s+/g, '').trim();
    if (textContent) {
      return false;
    }

    const elementChildren = Array.from(element.children || []).filter((child) => child instanceof HTMLElement);
    if (elementChildren.length !== 1) {
      return false;
    }

    const child = elementChildren[0];
    const childContainsMedia = /^(img|svg|canvas|video)$/i.test(child.tagName)
      || !!child.querySelector('img, svg, canvas, video');
    if (!childContainsMedia) {
      return false;
    }

    const width = parseSnapshotNumericValue(element.getAttribute('data-restore-layout-width') || element.getBoundingClientRect().width);
    const height = parseSnapshotNumericValue(element.getAttribute('data-restore-layout-height') || element.getBoundingClientRect().height);
    const childWidth = parseSnapshotNumericValue(child.getAttribute('data-restore-layout-width') || child.getBoundingClientRect().width);
    const childHeight = parseSnapshotNumericValue(child.getAttribute('data-restore-layout-height') || child.getBoundingClientRect().height);
    const childStyle = String(child.getAttribute('style') || '');
    const looksLikeFramedMedia = /position\\s*:\\s*relative/i.test(childStyle);
    const childOutgrowsParent = Number.isFinite(childWidth)
      && Number.isFinite(width)
      && childWidth > width + 4;
    const sameVisualHeight = Number.isFinite(childHeight)
      && Number.isFinite(height)
      && Math.abs(childHeight - height) <= 6;

    return looksLikeFramedMedia || (childOutgrowsParent && sameVisualHeight);
  }

  function isContentDrivenAutoSizingElement(element, metrics = {}) {
    const normalizedTag = String(metrics.tagName || element?.tagName || '').toLowerCase();
    if (!['a', 'span', 'label', 'div', 'p', 'li'].includes(normalizedTag)) {
      return false;
    }

    const width = Number.isFinite(metrics.width)
      ? metrics.width
      : parseSnapshotNumericValue(element?.getAttribute('data-restore-layout-width') || '');
    const height = Number.isFinite(metrics.height)
      ? metrics.height
      : parseSnapshotNumericValue(element?.getAttribute('data-restore-layout-height') || '');
    const lineCount = Number.isFinite(metrics.lineCount)
      ? metrics.lineCount
      : parseSnapshotNumericValue(element?.getAttribute('data-restore-layout-line-count') || '');
    const display = String(metrics.display || element?.getAttribute('data-restore-layout-display') || '').toLowerCase();
    const isButtonLike = typeof metrics.isButtonLike === 'boolean'
      ? metrics.isButtonLike
      : element?.getAttribute('data-restore-layout-button') === 'true';
    const isContainerLike = typeof metrics.isContainerLike === 'boolean'
      ? metrics.isContainerLike
      : element?.getAttribute('data-restore-layout-container') === 'true';
    const textContent = String(element?.textContent || '').replace(/\\s+/g, ' ').trim();

    if (!textContent) {
      return false;
    }

    if (!Number.isFinite(width) || width <= 0 || width > 240) {
      return false;
    }

    if (Number.isFinite(lineCount) && lineCount > 2) {
      return false;
    }

    if (Number.isFinite(height) && height >= 36 && width >= 48 && height >= width * 0.75) {
      return false;
    }

    if (isButtonLike && Number.isFinite(height) && height >= 36 && width >= 48) {
      return false;
    }

    if (
      isContainerLike
      && display
      && !display.includes('inline-flex')
      && !(display === 'flex' && (!Number.isFinite(height) || height < 32))
    ) {
      return false;
    }

    const elementChildren = Array.from(element.children || []).filter((child) => child instanceof HTMLElement);
    if (elementChildren.length > 4) {
      return false;
    }

    const allowedChildTags = new Set([
      'a',
      'span',
      'strong',
      'em',
      'b',
      'i',
      'u',
      'small',
      'sup',
      'sub',
      'svg',
      'img',
      'path',
      'g',
      'use',
      'input',
      'label'
    ]);
    const hasDisallowedChild = elementChildren.some((child) => {
      const childTag = String(child.tagName || '').toLowerCase();
      return childTag && !allowedChildTags.has(childTag);
    });
    if (hasDisallowedChild) {
      return false;
    }

    return !element.querySelector('textarea, select, button');
  }

  function ensureHiddenTableBodyScrollbarStyle() {
    if (document.getElementById('protorec-hidden-table-body-scrollbar-style')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'protorec-hidden-table-body-scrollbar-style';
    style.textContent = [
      '.protorec-table-body-hide-scrollbar {',
      '  scrollbar-width: none;',
      '  -ms-overflow-style: none;',
      '}',
      '.protorec-table-body-hide-scrollbar::-webkit-scrollbar {',
      '  width: 0 !important;',
      '  height: 0 !important;',
      '  display: none;',
      '}'
    ].join('\\n');
    document.head.appendChild(style);
  }

  function getStickyTableScrollbarMetrics(body, stickyScroll) {
    if (!body || !stickyScroll) {
      return null;
    }

    const hasHorizontalOverflow = (body.scrollWidth || 0) > (body.clientWidth || 0) + 1;
    if (!hasHorizontalOverflow) {
      return null;
    }

    const computedStyle = window.getComputedStyle(stickyScroll);
    const overflowX = String(computedStyle.overflowX || '').trim().toLowerCase();
    const measuredTrackWidth = Number(stickyScroll.clientWidth || 0);
    const computedTrackWidth = parsePixelValue(computedStyle.width || '');
    const trackWidth = Number.isFinite(computedTrackWidth)
      ? Math.max(measuredTrackWidth, computedTrackWidth)
      : measuredTrackWidth;
    const nativeScrollWidth = Number(stickyScroll.scrollWidth || 0);

    return {
      trackWidth,
      nativeScrollable: isVisible(stickyScroll)
        && ['auto', 'scroll', 'overlay'].includes(overflowX)
        && trackWidth > 1
        && nativeScrollWidth > trackWidth + 1
    };
  }

  function hasFunctionalStickyTableScrollbar(body, stickyScroll) {
    const metrics = getStickyTableScrollbarMetrics(body, stickyScroll);
    return !!metrics && metrics.nativeScrollable;
  }

  function syncStickyTableScrollbar(body, stickyScroll) {
    const metrics = getStickyTableScrollbarMetrics(body, stickyScroll);
    if (!metrics?.nativeScrollable) {
      return null;
    }

    if (metrics.nativeScrollable && Math.abs((stickyScroll.scrollLeft || 0) - (body.scrollLeft || 0)) > 1) {
      stickyScroll.scrollLeft = body.scrollLeft || 0;
    }

    return metrics;
  }

  function updateTablePingState(container, header, body, stickyScroll) {
    if (!container || !body) {
      return;
    }

    const maxScrollLeft = Math.max(0, (body.scrollWidth || 0) - (body.clientWidth || 0));
    const hasHorizontalOverflow = maxScrollLeft > 1;
    const canUseStickyScroll = hasFunctionalStickyTableScrollbar(body, stickyScroll);
    const scrollLeft = Math.max(0, body.scrollLeft || 0);
    const showLeftPing = hasHorizontalOverflow && scrollLeft > 1;
    const showRightPing = hasHorizontalOverflow && scrollLeft < maxScrollLeft - 1;
    const pingTargets = unique([
      container.closest('.hammer-table, .ant-table, [data-table-root]'),
      container.parentElement,
      container,
      header
    ].filter(Boolean));

    pingTargets.forEach((target) => {
      setNodeClassList(target, TABLE_PING_LEFT_CLASS_NAMES, showLeftPing);
      setNodeClassList(target, TABLE_PING_RIGHT_CLASS_NAMES, showRightPing);
    });

    if (stickyScroll) {
      stickyScroll.style.display = hasHorizontalOverflow && canUseStickyScroll ? '' : 'none';
      if (canUseStickyScroll) {
        ensureHiddenTableBodyScrollbarStyle();
        body.classList.toggle('protorec-table-body-hide-scrollbar', hasHorizontalOverflow);
      } else {
        body.classList.remove('protorec-table-body-hide-scrollbar');
      }
    } else {
      body.classList.remove('protorec-table-body-hide-scrollbar');
    }
  }

  function restoreScrollSnapshots() {
    toArray(document.querySelectorAll('[data-restore-scroll-top], [data-restore-scroll-left]')).forEach((element) => {
      const isRootScroller = element === document.documentElement || element === document.body;
      const isViewportManagedScroller = isViewportManagedScrollContainerElement(element);
      const nextScrollTop = Number.parseFloat(element.getAttribute('data-restore-scroll-top') || '');
      const nextScrollLeft = Number.parseFloat(element.getAttribute('data-restore-scroll-left') || '');
      const scrollWidth = Number.parseFloat(element.getAttribute('data-restore-scroll-width') || '');
      const scrollHeight = Number.parseFloat(element.getAttribute('data-restore-scroll-height') || '');
      const clientWidth = Number.parseFloat(element.getAttribute('data-restore-scroll-client-width') || '');
      const clientHeight = Number.parseFloat(element.getAttribute('data-restore-scroll-client-height') || '');
      const overflowX = element.getAttribute('data-restore-scroll-overflow-x') || '';
      const overflowY = element.getAttribute('data-restore-scroll-overflow-y') || '';

      if (shouldApplySnapshotOverflowAxis(overflowX, scrollWidth, clientWidth)) {
        element.style.overflowX = overflowX;
      }

      if (shouldApplySnapshotOverflowAxis(overflowY, scrollHeight, clientHeight)) {
        element.style.overflowY = overflowY;
      }

      const isTableViewportElement = element instanceof HTMLElement && (
        element.matches(TABLE_HEADER_SELECTOR)
        || element.matches(TABLE_BODY_SELECTOR)
        || (
          Boolean(element.closest(TABLE_CONTAINER_SELECTOR))
          && element.getAttribute('data-restore-layout-table-like') === 'true'
        )
      );

      if (
        !isTableViewportElement
        && Number.isFinite(scrollWidth)
        && scrollWidth > 0
        && Number.isFinite(clientWidth)
        && clientWidth > 0
        && scrollWidth > clientWidth + 4
      ) {
        element.style.minWidth = Math.max(Math.round(clientWidth), Math.min(Math.round(scrollWidth), Math.round(clientWidth * 1.02))) + 'px';
      }

      if (
        !isRootScroller
        && !isViewportManagedScroller
        && Number.isFinite(scrollHeight)
        && scrollHeight > 0
        && Number.isFinite(clientHeight)
        && clientHeight > 0
        && scrollHeight > clientHeight + 4
      ) {
        element.style.minHeight = Math.max(Math.round(clientHeight), Math.min(Math.round(scrollHeight), Math.round(clientHeight * 1.02))) + 'px';
      }

      if (isRootScroller) {
        element.scrollTop = 0;
        element.scrollLeft = 0;
        return;
      }

      if (Number.isFinite(nextScrollTop) && Math.abs(element.scrollTop - nextScrollTop) > 1) {
        element.scrollTop = nextScrollTop;
      }

      if (Number.isFinite(nextScrollLeft) && Math.abs(element.scrollLeft - nextScrollLeft) > 1) {
        element.scrollLeft = nextScrollLeft;
      }
    });

    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch (_error) {
      window.scrollTo(0, 0);
    }
  }

  function resolveCapturedScrollTopHint() {
    return toArray(document.querySelectorAll('[data-restore-scroll-top]')).reduce((maxValue, element) => {
      const scrollTop = Number.parseFloat(element.getAttribute('data-restore-scroll-top') || '');
      if (!Number.isFinite(scrollTop) || scrollTop <= 0) {
        return maxValue;
      }

      const scrollHeight = Number.parseFloat(element.getAttribute('data-restore-scroll-height') || '');
      const clientHeight = Number.parseFloat(element.getAttribute('data-restore-scroll-client-height') || '');
      const isScrollable = Number.isFinite(scrollHeight) && Number.isFinite(clientHeight)
        ? scrollHeight > clientHeight + 8
        : true;
      if (!isScrollable) {
        return maxValue;
      }

      return Math.max(maxValue, scrollTop);
    }, 0);
  }

  function normalizeCapturedAffixStates() {
    const capturedScrollTopHint = resolveCapturedScrollTopHint();
    const scrollThreshold = Math.max(120, window.innerHeight * 0.2);
    const pageScrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (!(capturedScrollTopHint > scrollThreshold) || pageScrollTop > 8) {
      return;
    }

    const candidates = unique(
      toArray(document.querySelectorAll('.ant-affix, .hammer-affix, [class*="affix"], [style*="position: fixed"]'))
    );

    candidates.forEach((element) => {
      if (!(element instanceof HTMLElement) || element.dataset.restoreAffixRuntimeNormalized === 'true') {
        return;
      }

      const className = typeof element.className === 'string' ? element.className : '';
      if (!/(affix|sticky|anchor)/i.test(className)) {
        return;
      }

      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.position !== 'fixed') {
        return;
      }

      const top = Number.parseFloat(computedStyle.top || '');
      if (!Number.isFinite(top) || top < -8 || top > 24) {
        return;
      }

      const rect = element.getBoundingClientRect();
      if (rect.width < window.innerWidth * 0.35 || rect.height <= 0 || rect.height > window.innerHeight * 0.5) {
        return;
      }

      element.style.position = 'static';
      element.style.top = 'auto';
      element.style.left = 'auto';
      element.style.right = 'auto';
      element.style.bottom = 'auto';
      element.style.zIndex = 'auto';

      const inlineWidth = Number.parseFloat(element.style.width || '');
      if (Number.isFinite(inlineWidth) && inlineWidth >= window.innerWidth * 0.35) {
        element.style.removeProperty('width');
      }

      const inlineHeight = Number.parseFloat(element.style.height || '');
      if (Number.isFinite(inlineHeight) && inlineHeight <= window.innerHeight * 0.5) {
        element.style.removeProperty('height');
      }

      element.dataset.restoreAffixRuntimeNormalized = 'true';
    });
  }

  function restoreLayoutSnapshots() {
    const parseDimensionValue = (value) => {
      if (!value) {
        return '';
      }

      const normalized = String(value).trim();
      if (!normalized || normalized === 'auto' || normalized === 'none' || normalized === 'normal') {
        return '';
      }

      if (/^-?\\d+(\\.\\d+)?$/.test(normalized)) {
        return normalized === '0' ? '0' : (normalized + 'px');
      }

      return normalized;
    };

    const assignStyleIfPresent = (style, property, value, priority = '') => {
      if (!value) {
        return;
      }
      style.setProperty(property, value, priority);
    };

    const assignDimensionIfPresent = (style, property, value, priority = '') => {
      const normalized = parseDimensionValue(value);
      if (!normalized) {
        return;
      }
      style.setProperty(property, normalized, priority);
    };

    const shouldForceImportantLayoutProperty = (property, value) => {
      const normalized = String(value || '').trim();
      if (!normalized) {
        return false;
      }

      if ([
        'display',
        'flex-direction',
        'flex-wrap',
        'justify-content',
        'align-items',
        'align-content',
        'align-self',
        'flex-grow',
        'flex-shrink',
        'flex-basis',
        'grid-template-columns',
        'grid-template-rows',
        'grid-auto-flow',
        'grid-column',
        'grid-row',
        'gap',
        'row-gap',
        'column-gap',
        'overflow-x',
        'overflow-y',
        'table-layout',
        'border-collapse',
        'order'
      ].includes(property)) {
        return true;
      }

      if (['width', 'min-width', 'max-width', 'min-height', 'max-height'].includes(property)) {
        return normalized !== 'auto';
      }

      return false;
    };

    const applyLayoutProperty = (style, property, value) => {
      const normalized = String(value || '').trim();
      if (!normalized) {
        return;
      }
      style.setProperty(property, normalized, shouldForceImportantLayoutProperty(property, normalized) ? 'important' : '');
    };

    const applyLayoutDimension = (style, property, value) => {
      const normalized = parseDimensionValue(value);
      if (!normalized) {
        return;
      }
      style.setProperty(property, normalized, shouldForceImportantLayoutProperty(property, normalized) ? 'important' : '');
    };

    const isActualTableLikeElement = (element, display) => {
      const normalizedTag = String(element?.tagName || '').toLowerCase();
      const normalizedDisplay = String(display || '').toLowerCase();
      return [
        'table',
        'thead',
        'tbody',
        'tfoot',
        'tr',
        'td',
        'th',
        'col',
        'colgroup'
      ].includes(normalizedTag) || normalizedDisplay.includes('table');
    };

    const isStructuredContainerElement = ({ element, display, isContainerLike, width, height, isText, hasScrollableOverflow }) => {
      if (!isContainerLike || isText) {
        return false;
      }

      const normalizedTag = String(element?.tagName || '').toLowerCase();
      const normalizedDisplay = String(display || '').toLowerCase();
      if (normalizedDisplay.includes('flex') || normalizedDisplay.includes('grid') || normalizedDisplay === '-webkit-box') {
        return true;
      }

      if (['nav', 'aside', 'section', 'main', 'header', 'footer', 'form'].includes(normalizedTag)) {
        return true;
      }

      if (hasScrollableOverflow) {
        return true;
      }

      return Number.isFinite(width)
        && Number.isFinite(height)
        && width >= 180
        && height >= 40;
    };

    const applyContainerLayoutStyles = (element) => {
      const normalizedTag = String(element?.tagName || '').toLowerCase();
      const isTableTrackElement = isTableTrackSizingElement(element);
      const display = element.getAttribute('data-restore-layout-display') || '';
      const isContainerLike = element.getAttribute('data-restore-layout-container') === 'true';
      const isTableLike = element.getAttribute('data-restore-layout-table-like') === 'true';
      const isText = element.getAttribute('data-restore-layout-text') === 'true';
      const width = Number.parseFloat(element.getAttribute('data-restore-layout-width') || '');
      const height = Number.parseFloat(element.getAttribute('data-restore-layout-height') || '');
      const widthRatio = Number.parseFloat(element.getAttribute('data-restore-layout-width-ratio') || '');
      const flexBasis = parseDimensionValue(element.getAttribute('data-restore-layout-flex-basis') || '');
      const lineCount = Number.parseFloat(element.getAttribute('data-restore-layout-line-count') || '');
      const isButtonLike = element.getAttribute('data-restore-layout-button') === 'true';
      const preserveContentDrivenAutoSizing = isContentDrivenAutoSizingElement(element, {
        width,
        height,
        lineCount,
        display,
        isButtonLike,
        isContainerLike
      });
      const parent = element.parentElement;
      const currentRect = element.getBoundingClientRect();
      const parentDisplay = element.getAttribute('data-restore-layout-parent-display') || '';
      const parentIsFlexOrGrid = parentDisplay.includes('flex') || parentDisplay.includes('grid') || parentDisplay === '-webkit-box';
      const isFlexOrGridContainer = display.includes('flex') || display.includes('grid') || display === '-webkit-box';
      const overflowX = element.getAttribute('data-restore-layout-overflow-x') || '';
      const overflowY = element.getAttribute('data-restore-layout-overflow-y') || '';
      const scrollWidth = Number.parseFloat(element.getAttribute('data-restore-scroll-width') || '');
      const scrollHeight = Number.parseFloat(element.getAttribute('data-restore-scroll-height') || '');
      const scrollClientWidth = Number.parseFloat(element.getAttribute('data-restore-scroll-client-width') || '');
      const scrollClientHeight = Number.parseFloat(element.getAttribute('data-restore-scroll-client-height') || '');
      const hasScrollableOverflow = ['auto', 'scroll', 'hidden', 'clip'].includes(overflowX)
        || ['auto', 'scroll', 'hidden', 'clip'].includes(overflowY);
      const isActualTableLike = (isTableLike || display.includes('table')) && isActualTableLikeElement(element, display);
      const shouldApplyTableBoxSizing = isActualTableLike && !isTableTrackElement;
      const isStructuredContainer = isStructuredContainerElement({
        element,
        display,
        isContainerLike,
        width,
        height,
        isText,
        hasScrollableOverflow
      });
      const shouldApplyItemSizing = parentIsFlexOrGrid && (
        !preserveContentDrivenAutoSizing
        && (
          shouldApplyTableBoxSizing
        || (isStructuredContainer && width >= 160 && height >= 48)
        )
      );

      if (display && display !== 'inline' && (isFlexOrGridContainer || isActualTableLike || isStructuredContainer)) {
        applyLayoutProperty(element.style, 'display', display);
      }

      if (isFlexOrGridContainer || display === '-webkit-box') {
        applyLayoutProperty(element.style, 'flex-direction', element.getAttribute('data-restore-layout-flex-direction') || '');
        applyLayoutProperty(element.style, 'flex-wrap', element.getAttribute('data-restore-layout-flex-wrap') || '');
        applyLayoutProperty(element.style, 'justify-content', element.getAttribute('data-restore-layout-justify-content') || '');
        applyLayoutProperty(element.style, 'align-items', element.getAttribute('data-restore-layout-align-items') || '');
        applyLayoutProperty(element.style, 'align-content', element.getAttribute('data-restore-layout-align-content') || '');
        applyLayoutProperty(element.style, 'gap', element.getAttribute('data-restore-layout-gap') || '');
        applyLayoutProperty(element.style, 'row-gap', element.getAttribute('data-restore-layout-row-gap') || '');
        applyLayoutProperty(element.style, 'column-gap', element.getAttribute('data-restore-layout-column-gap') || '');
      }

      if (display.includes('grid')) {
        applyLayoutProperty(element.style, 'grid-template-columns', element.getAttribute('data-restore-layout-grid-template-columns') || '');
        applyLayoutProperty(element.style, 'grid-template-rows', element.getAttribute('data-restore-layout-grid-template-rows') || '');
        applyLayoutProperty(element.style, 'grid-auto-flow', element.getAttribute('data-restore-layout-grid-auto-flow') || '');
      }

      if (hasScrollableOverflow || isActualTableLike || isFlexOrGridContainer) {
        if (shouldApplySnapshotOverflowAxis(overflowX, scrollWidth, scrollClientWidth)) {
          applyLayoutProperty(element.style, 'overflow-x', overflowX);
        }
        if (shouldApplySnapshotOverflowAxis(overflowY, scrollHeight, scrollClientHeight)) {
          applyLayoutProperty(element.style, 'overflow-y', overflowY);
        }
      }

      if (isActualTableLike) {
        applyLayoutProperty(element.style, 'table-layout', element.getAttribute('data-restore-layout-table-layout') || '');
        applyLayoutProperty(element.style, 'border-collapse', element.getAttribute('data-restore-layout-border-collapse') || '');
      }

      if (shouldApplyItemSizing) {
        applyLayoutProperty(element.style, 'align-self', element.getAttribute('data-restore-layout-align-self') || '');
        applyLayoutProperty(element.style, 'order', element.getAttribute('data-restore-layout-order') || '');
        applyLayoutProperty(element.style, 'flex-grow', element.getAttribute('data-restore-layout-flex-grow') || '');
        applyLayoutProperty(element.style, 'flex-shrink', element.getAttribute('data-restore-layout-flex-shrink') || '');
        applyLayoutProperty(element.style, 'flex-basis', flexBasis);
        applyLayoutDimension(element.style, 'min-width', element.getAttribute('data-restore-layout-min-width') || '');
        applyLayoutDimension(element.style, 'max-width', element.getAttribute('data-restore-layout-max-width') || '');
        applyLayoutDimension(element.style, 'min-height', element.getAttribute('data-restore-layout-min-height') || '');
        applyLayoutDimension(element.style, 'max-height', element.getAttribute('data-restore-layout-max-height') || '');
      }

      if (Number.isFinite(widthRatio) && widthRatio > 0 && widthRatio < 1 && parent instanceof HTMLElement && parentIsFlexOrGrid) {
        const parentRect = parent.getBoundingClientRect();
        const expectedWidth = parentRect.width * widthRatio;
        if (expectedWidth > 0 && Math.abs(currentRect.width - expectedWidth) > 6 && shouldApplyItemSizing) {
          applyLayoutDimension(element.style, 'width', Math.round(expectedWidth));
          if (shouldApplyTableBoxSizing) {
            applyLayoutDimension(element.style, 'max-width', Math.round(expectedWidth));
            applyLayoutDimension(element.style, 'min-width', Math.round(expectedWidth));
          }
          applyLayoutDimension(element.style, 'flex-basis', Math.round(expectedWidth));
        }
      } else if (Number.isFinite(width) && width > 0 && shouldApplyTableBoxSizing && Math.abs(currentRect.width - width) > 12) {
        applyLayoutDimension(element.style, 'width', Math.round(width));
        applyLayoutDimension(element.style, 'max-width', Math.round(width));
        applyLayoutDimension(element.style, 'min-width', Math.round(width));
        if (parentIsFlexOrGrid) {
          applyLayoutDimension(element.style, 'flex-basis', Math.round(width));
        }
      }

      if (!flexBasis && parentIsFlexOrGrid && Number.isFinite(width) && width > 0 && shouldApplyItemSizing) {
        applyLayoutDimension(element.style, 'flex-basis', Math.round(width));
      }

      if (
        !isViewportManagedScrollContainerElement(element)
        && Number.isFinite(height)
        && height > 0
        && (isStructuredContainer || shouldApplyTableBoxSizing)
        && currentRect.height + 8 < height
      ) {
        applyLayoutDimension(element.style, 'min-height', Math.round(height));
      }
    };

    toArray(document.querySelectorAll('[data-restore-layout-width]')).forEach((element) => {
      const width = Number.parseFloat(element.getAttribute('data-restore-layout-width') || '');
      const height = Number.parseFloat(element.getAttribute('data-restore-layout-height') || '');
      const lineCount = Number.parseFloat(element.getAttribute('data-restore-layout-line-count') || '');
      const clamp = Number.parseFloat(element.getAttribute('data-restore-layout-clamp') || '');
      const widthRatio = Number.parseFloat(element.getAttribute('data-restore-layout-width-ratio') || '');
      const isText = element.getAttribute('data-restore-layout-text') === 'true';
      const isMultilineText = element.getAttribute('data-restore-layout-multiline') === 'true';
      const isButtonLike = element.getAttribute('data-restore-layout-button') === 'true';
      const preserveContentDrivenAutoSizing = isContentDrivenAutoSizingElement(element, {
        width,
        height,
        lineCount,
        display: element.getAttribute('data-restore-layout-display') || '',
        isButtonLike,
        isContainerLike: element.getAttribute('data-restore-layout-container') === 'true'
      });
      const effectiveButtonLike = isButtonLike
        && !preserveContentDrivenAutoSizing
        && !isPureMediaLinkWrapper(element);
      const preserveIntrinsicMediaSizing = isIntrinsicSizeManagedMediaElement(element);
      const whiteSpace = element.getAttribute('data-restore-layout-white-space') || '';
      const textOverflow = element.getAttribute('data-restore-layout-text-overflow') || '';
      const display = element.getAttribute('data-restore-layout-display') || '';
      const isContainerLike = element.getAttribute('data-restore-layout-container') === 'true';
      const isTableLike = element.getAttribute('data-restore-layout-table-like') === 'true';
      const parent = element.parentElement;

      if (isContainerLike || isTableLike) {
        applyContainerLayoutStyles(element);
      }

      if (effectiveButtonLike && Number.isFinite(width) && width > 0) {
        const currentRect = element.getBoundingClientRect();
        if (Math.abs(currentRect.width - width) > 2) {
          applyLayoutDimension(element.style, 'width', Math.round(width));
          applyLayoutDimension(element.style, 'min-width', Math.round(width));
        }
      }

      if (Number.isFinite(height) && height > 0 && effectiveButtonLike) {
        const currentRect = element.getBoundingClientRect();
        if (Math.abs(currentRect.height - height) > 2) {
          applyLayoutDimension(element.style, 'min-height', Math.round(height));
        }
      }

      if (preserveIntrinsicMediaSizing) {
        element.style.removeProperty('width');
        element.style.removeProperty('min-width');
        element.style.removeProperty('height');
        element.style.removeProperty('min-height');
      }

      if (preserveContentDrivenAutoSizing) {
        element.style.removeProperty('width');
        element.style.removeProperty('min-width');
        element.style.removeProperty('max-width');
        element.style.removeProperty('flex-basis');
      }

      if (isText) {
        if (shouldInlineSnapshotWhiteSpace(whiteSpace)) {
          element.style.whiteSpace = whiteSpace;
        }
        if (textOverflow && textOverflow !== 'clip') {
          element.style.textOverflow = textOverflow;
        }
        if (display === '-webkit-box') {
          applyLayoutProperty(element.style, 'display', '-webkit-box');
          element.style.webkitBoxOrient = 'vertical';
        }
        if (Number.isFinite(clamp) && clamp > 0) {
          element.style.webkitLineClamp = String(Math.round(clamp));
          applyLayoutProperty(element.style, 'overflow', 'hidden');
        }
        if (isMultilineText && Number.isFinite(height) && height > 0) {
          const currentRect = element.getBoundingClientRect();
          if (currentRect.height + 2 < height) {
            applyLayoutDimension(element.style, 'min-height', Math.round(height));
          }
        }
      }

      if (parent instanceof HTMLElement && Number.isFinite(widthRatio) && widthRatio > 0 && widthRatio < 1) {
        const parentRect = parent.getBoundingClientRect();
        const expectedWidth = parentRect.width * widthRatio;
        const currentRect = element.getBoundingClientRect();
        const parentDisplay = parent instanceof HTMLElement ? window.getComputedStyle(parent).display || '' : '';
        const parentIsFlexOrGrid = parentDisplay.includes('flex') || parentDisplay.includes('grid') || parentDisplay === '-webkit-box';
        if (
          expectedWidth > 0
          && Math.abs(currentRect.width - expectedWidth) > 6
          && !isText
          && !isContainerLike
          && !isTableLike
          && !preserveContentDrivenAutoSizing
          && parentIsFlexOrGrid
        ) {
          applyLayoutDimension(element.style, 'width', Math.round(expectedWidth));
          applyLayoutDimension(element.style, 'flex-basis', Math.round(expectedWidth));
        }
      }

      if (isText && Number.isFinite(lineCount) && lineCount >= 2) {
        element.setAttribute('data-restore-line-count', String(Math.round(lineCount)));
      }
    });
  }

  function restoreInteractionStates() {
    const focusTarget = toArray(document.querySelectorAll('[data-restore-interaction-states]')).find((element) => {
      const states = String(element.getAttribute('data-restore-interaction-states') || '').split(',').map((item) => item.trim());
      return states.includes('focus') && typeof element.focus === 'function' && !element.hasAttribute('disabled');
    });

    if (focusTarget && !focusTarget.dataset.restoreFocusApplied) {
      focusTarget.dataset.restoreFocusApplied = 'true';
      try {
        focusTarget.focus({ preventScroll: true });
      } catch (error) {
        try {
          focusTarget.focus();
        } catch (nestedError) {
        }
      }
    }
  }

  function hasHorizontalOverflow(element) {
    return Boolean(element) && element.scrollWidth > element.clientWidth + 8;
  }

  function isLikelyTableBody(element) {
    if (!isVisible(element) || !hasHorizontalOverflow(element)) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    const maxCandidateHeight = Math.max(window.innerHeight * 2, 2200);
    return rect.width >= Math.min(window.innerWidth * 0.35, 520)
      && rect.height >= 80
      && rect.height <= maxCandidateHeight;
  }

  function isLikelyTableHeader(element, bodyRect, bodyScrollWidth) {
    if (!isVisible(element)) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    if (rect.bottom > bodyRect.top + 4 || rect.top < bodyRect.top - 180) {
      return false;
    }

    if (rect.height < 24 || rect.height > Math.min(120, bodyRect.height * 0.45)) {
      return false;
    }

    if (Math.abs(rect.width - bodyRect.width) > Math.max(40, bodyRect.width * 0.08)) {
      return false;
    }

    const scrollWidth = Math.max(element.scrollWidth || 0, rect.width);
    if (scrollWidth + 24 < bodyScrollWidth) {
      return false;
    }

    return element.clientHeight >= element.scrollHeight - 4;
  }

  function collectGenericTableScrollGroups() {
    const candidates = [];
    const bodies = toArray(document.querySelectorAll('body *')).filter(isLikelyTableBody);

    bodies.forEach((body) => {
      const bodyRect = body.getBoundingClientRect();
      const container = body.parentElement || body;
      const headers = unique(toArray(container.querySelectorAll('*')).filter((element) => {
        if (element === body || body.contains(element)) {
          return false;
        }

        return isLikelyTableHeader(element, bodyRect, body.scrollWidth || bodyRect.width);
      }));

      const header = headers.sort((left, right) => {
        const leftRect = left.getBoundingClientRect();
        const rightRect = right.getBoundingClientRect();
        return Math.abs(leftRect.bottom - bodyRect.top) - Math.abs(rightRect.bottom - bodyRect.top);
      })[0];

      if (!header) {
        return;
      }

      const stickyScroll = unique(toArray((container.parentElement || container).querySelectorAll('*')).filter((element) => {
        if (element === body || element === header || body.contains(element) || header.contains(element)) {
          return false;
        }

        if (!isVisible(element) || !hasHorizontalOverflow(element)) {
          return false;
        }

        const rect = element.getBoundingClientRect();
        return rect.height > 0
          && rect.height <= 32
          && rect.width >= bodyRect.width * 0.6
          && rect.width <= bodyRect.width + 48
          && rect.top >= bodyRect.bottom - 48
          && rect.top <= bodyRect.bottom + 80;
      }))[0] || null;

      candidates.push({ header, body, stickyScroll });
    });

    return candidates.filter((candidate, index, list) => list.findIndex((entry) => entry.body === candidate.body && entry.header === candidate.header) === index);
  }

  function bindTableScrollSync() {
    const explicitGroups = toArray(document.querySelectorAll(TABLE_CONTAINER_SELECTOR)).map((container) => {
      const header = container.querySelector(TABLE_HEADER_SELECTOR);
      const stickyScroll = container.parentElement?.querySelector(TABLE_STICKY_SCROLL_SELECTOR)
        || container.querySelector(TABLE_STICKY_SCROLL_SELECTOR);
      if (!header) {
        return null;
      }

      const bodyCandidates = unique(toArray(container.querySelectorAll(TABLE_BODY_SELECTOR)));
      const body = bodyCandidates.find((candidate) => candidate.scrollWidth > candidate.clientWidth + 1) || bodyCandidates[0];
      if (!body || body === header) {
        return null;
      }

      return { header, body, stickyScroll };
    }).filter(Boolean);

    unique([
      ...explicitGroups,
      ...collectGenericTableScrollGroups()
    ]).forEach(({ header, body, stickyScroll }) => {
      if (!header || !body) {
        return;
      }

      const tableContainer = body.closest(TABLE_CONTAINER_SELECTOR) || header.closest(TABLE_CONTAINER_SELECTOR);
      let syncingScrollState = false;
      const syncTableState = () => {
        if (syncingScrollState) {
          return;
        }

        syncingScrollState = true;
        syncTableScrollPosition(header, body);
        if (stickyScroll) {
          syncStickyTableScrollbar(body, stickyScroll);
        }
        updateTablePingState(tableContainer, header, body, stickyScroll);
        syncingScrollState = false;
      };

      syncTableState();

      if (!markBound(body, 'TableScrollSync')) {
        body.addEventListener('scroll', () => {
          syncTableState();
        }, { passive: true });
      }

      if (!markBound(header, 'TableScrollWheelSync')) {
        header.addEventListener('wheel', (event) => {
          const deltaX = Math.abs(event.deltaX) > Math.abs(event.deltaY)
            ? event.deltaX
            : (event.shiftKey ? event.deltaY : 0);

          if (!deltaX) {
            return;
          }

          event.preventDefault();
          body.scrollLeft += deltaX;
          syncTableState();
        }, { passive: false });
      }

      if (stickyScroll && !markBound(stickyScroll, 'TableStickyScrollSync')) {
        stickyScroll.addEventListener('scroll', () => {
          const stickyMetrics = getStickyTableScrollbarMetrics(body, stickyScroll);
          if (!stickyMetrics?.nativeScrollable) {
            return;
          }

          if (syncingScrollState) {
            return;
          }

          syncingScrollState = true;
          if (Math.abs((body.scrollLeft || 0) - (stickyScroll.scrollLeft || 0)) > 1) {
            body.scrollLeft = stickyScroll.scrollLeft || 0;
          }
          if (Math.abs((header.scrollLeft || 0) - (stickyScroll.scrollLeft || 0)) > 1) {
            header.scrollLeft = stickyScroll.scrollLeft || 0;
          }
          syncStickyTableScrollbar(body, stickyScroll);
          updateTablePingState(tableContainer, header, body, stickyScroll);
          syncingScrollState = false;
        }, { passive: true });
      }

      if (tableContainer && !markBound(tableContainer, 'TableScrollResizeSync')) {
        const syncOnResize = () => syncTableState();
        window.addEventListener('resize', syncOnResize, { passive: true });
      }
    });
  }

  function collectHeroCarouselIndicators(root, rootRect) {
    return unique(toArray(root.querySelectorAll('*')).filter((element) => {
      if (!isVisible(element)) {
        return false;
      }

      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      if (style.position !== 'absolute') {
        return false;
      }

      if (rect.width < HERO_CAROUSEL_INDICATOR_MIN_WIDTH || rect.width > rootRect.width * 0.65) {
        return false;
      }

      if (rect.height <= 0 || rect.height > HERO_CAROUSEL_INDICATOR_MAX_HEIGHT) {
        return false;
      }

      if (rect.top < rootRect.top + rootRect.height * 0.55 || rect.bottom > rootRect.bottom + 48) {
        return false;
      }

      const markerNodes = toArray(element.querySelectorAll('*')).filter((child) => {
        const childRect = child.getBoundingClientRect();
        return childRect.width > 0
          && childRect.width <= 80
          && childRect.height > 0
          && childRect.height <= 24;
      });

      return markerNodes.length >= 3;
    }));
  }

  function getNormalizedText(element) {
    return String(element?.textContent || '').replace(/\\s+/g, ' ').trim();
  }

  function collectVisibleShortTextMarkers(root) {
    return unique(toArray(root.querySelectorAll('*')).map((element) => {
      if (!isVisible(element)) {
        return null;
      }

      const text = getNormalizedText(element);
      if (!text || text.length > 16) {
        return null;
      }

      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.width > Math.min(window.innerWidth * 0.35, 220) || rect.height <= 0 || rect.height > 32) {
        return null;
      }

      return {
        element,
        key: text + '|' + String(Math.round(rect.left)) + '|' + String(Math.round(rect.top))
      };
    }).filter(Boolean).filter((entry, index, list) => list.findIndex((candidate) => candidate.key === entry.key) === index).map((entry) => entry.element));
  }

  function collectVisibleSmallMediaMarkers(root) {
    return unique(toArray(root.querySelectorAll('img, svg, canvas')).filter((element) => {
      if (!isVisible(element)) {
        return false;
      }

      const rect = element.getBoundingClientRect();
      return rect.width > 0
        && rect.height > 0
        && rect.width <= 64
        && rect.height <= 64;
    }));
  }

  function getVisibleDescendantBounds(root) {
    const descendants = toArray(root.querySelectorAll('*')).filter((element) => isVisible(element));
    if (!descendants.length) {
      return null;
    }

    const bounds = descendants.reduce((metrics, element) => {
      const rect = element.getBoundingClientRect();
      return {
        top: Math.min(metrics.top, rect.top),
        bottom: Math.max(metrics.bottom, rect.bottom)
      };
    }, { top: Number.POSITIVE_INFINITY, bottom: Number.NEGATIVE_INFINITY });

    if (!Number.isFinite(bounds.top) || !Number.isFinite(bounds.bottom)) {
      return null;
    }

    return bounds;
  }

  function getSiblingElement(element, direction) {
    let current = element?.[direction] || null;
    while (current) {
      if (current.nodeType === 1 && isVisible(current)) {
        return current;
      }
      current = current[direction] || null;
    }
    return null;
  }

  function getMeaningfulSibling(element, direction, predicate) {
    let current = element?.[direction] || null;
    while (current) {
      if (current.nodeType === 1 && isVisible(current) && predicate(current)) {
        return current;
      }
      current = current?.[direction] || null;
    }
    return null;
  }

  function collapseOverlappingEmptyBands() {
    toArray(document.querySelectorAll('body *')).filter((element) => {
      if (!isVisible(element)) {
        return false;
      }

      const rect = element.getBoundingClientRect();
      if (rect.width < window.innerWidth * 0.75 || rect.height < 16 || rect.height > 48) {
        return false;
      }

      if (getNormalizedText(element)) {
        return false;
      }

      const previous = getMeaningfulSibling(element, 'previousElementSibling', (candidate) => {
        return collectVisibleShortTextMarkers(candidate).length >= 6
          && collectVisibleSmallMediaMarkers(candidate).length >= 4;
      });
      const next = getMeaningfulSibling(element, 'nextElementSibling', (candidate) => {
        return collectVisibleShortTextMarkers(candidate).length > 0 || getNormalizedText(candidate).length > 0;
      });
      if (!previous || !next) {
        return false;
      }

      const previousRect = previous.getBoundingClientRect();
      const nextRect = next.getBoundingClientRect();
      if (previousRect.width < rect.width * 0.7 || nextRect.width < rect.width * 0.7) {
        return false;
      }

      const shortTextCount = collectVisibleShortTextMarkers(previous).length;
      if (shortTextCount < 6) {
        return false;
      }

      const mediaCount = collectVisibleSmallMediaMarkers(element).length;
      if (mediaCount > 1) {
        return false;
      }

      const style = window.getComputedStyle(element);
      const marginTop = Number.parseFloat(style.marginTop || '0');
      const overlapsPrevious = previousRect.bottom > rect.top + 2 || marginTop <= -8;
      const hugsNext = nextRect.top <= rect.bottom + 12;

      return overlapsPrevious && hugsNext;
    }).forEach((element) => {
      element.style.display = 'none';
      element.style.height = '0px';
      element.style.minHeight = '0px';
      element.style.marginTop = '0px';
      element.style.marginBottom = '0px';
      element.style.paddingTop = '0px';
      element.style.paddingBottom = '0px';
    });
  }

  function compactSparseInfoBands() {
    toArray(document.querySelectorAll('body *')).filter((element) => {
      if (!isVisible(element)) {
        return false;
      }

      const rect = element.getBoundingClientRect();
      if (rect.width < window.innerWidth * 0.75 || rect.height < 120 || rect.height > 280) {
        return false;
      }

      const shortTextMarkers = collectVisibleShortTextMarkers(element);
      const mediaMarkers = collectVisibleSmallMediaMarkers(element);
      if (shortTextMarkers.length < 3 || shortTextMarkers.length > 8 || mediaMarkers.length < 3 || mediaMarkers.length > 8) {
        return false;
      }

      const largeImages = toArray(element.querySelectorAll('img')).filter((image) => {
        if (!isVisible(image)) {
          return false;
        }

        const imageRect = image.getBoundingClientRect();
        return imageRect.width > 96 || imageRect.height > 96;
      });
      if (largeImages.length) {
        return false;
      }

      const bounds = getVisibleDescendantBounds(element);
      if (!bounds) {
        return false;
      }

      const contentHeight = Math.round(bounds.bottom - rect.top);
      return rect.height - contentHeight >= 40 && contentHeight >= 64;
    }).forEach((element) => {
      const rect = element.getBoundingClientRect();
      const bounds = getVisibleDescendantBounds(element);
      if (!bounds) {
        return;
      }

      const nextHeight = Math.max(64, Math.round(bounds.bottom - rect.top));
      element.style.height = String(nextHeight) + 'px';
      element.style.minHeight = String(nextHeight) + 'px';
      element.style.maxHeight = String(nextHeight) + 'px';
      element.style.flex = '0 0 auto';
    });
  }

  function collectAncestorChain(element, maxDepth = 12) {
    const chain = [];
    let current = element instanceof HTMLElement ? element : null;
    let depth = 0;

    while (current && depth < maxDepth) {
      chain.push(current);
      current = current.parentElement;
      depth += 1;
    }

    return chain;
  }

  function findNearestCommonAncestor(elements, maxDepth = 12) {
    const anchors = elements.filter((element) => element instanceof HTMLElement);
    if (!anchors.length) {
      return null;
    }

    const [firstAnchor, ...restAnchors] = anchors;
    const candidateChain = collectAncestorChain(firstAnchor, maxDepth);
    return candidateChain.find((candidate) => {
      return restAnchors.every((anchor) => candidate.contains(anchor));
    }) || null;
  }

  function isLikelyOffscreenActionInfoColumn(element, anchors = []) {
    if (!(element instanceof HTMLElement) || !isVisible(element)) {
      return false;
    }

    if (!anchors.every((anchor) => anchor instanceof HTMLElement && element.contains(anchor))) {
      return false;
    }

    const computedStyle = window.getComputedStyle(element);
    if (!computedStyle.display.includes('flex') || computedStyle.flexDirection !== 'row') {
      return false;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width < 320 || rect.width > Math.max(760, window.innerWidth * 0.62) || rect.height < 320) {
      return false;
    }

    const directChildren = getVisibleDirectChildren(element);
    if (directChildren.length < 6) {
      return false;
    }

    const offscreenAnchorCount = anchors.filter((anchor) => {
      const anchorRect = anchor.getBoundingClientRect();
      return anchorRect.left > rect.right + 16 || anchorRect.right < rect.left - 16;
    }).length;
    if (!offscreenAnchorCount) {
      return false;
    }

    const hasPrimaryContentColumn = directChildren.some((child) => {
      const childRect = child.getBoundingClientRect();
      return childRect.width >= rect.width * 0.85 && childRect.height >= Math.min(240, rect.height * 0.5);
    });
    if (!hasPrimaryContentColumn) {
      return false;
    }

    let overflowedTrailingChildren = 0;

    directChildren.forEach((child) => {
      const childRect = child.getBoundingClientRect();
      if (childRect.left >= rect.right - 4) {
        overflowedTrailingChildren += 1;
      }
    });

    return overflowedTrailingChildren >= 4;
  }

  function normalizeAnchoredActionInfoColumns() {
    const anchors = unique([
      document.getElementById('serviceComponent'),
      document.getElementById('prd-botnav-leftbtn'),
      document.getElementById('prd-botnav-rightbtn')
    ]).filter((element) => element instanceof HTMLElement && isVisible(element));
    if (anchors.length < 3) {
      return;
    }

    let candidate = findNearestCommonAncestor(anchors, 10);
    let depth = 0;

    while (candidate && depth < 4 && !isLikelyOffscreenActionInfoColumn(candidate, anchors)) {
      candidate = candidate.parentElement;
      depth += 1;
    }

    if (!isLikelyOffscreenActionInfoColumn(candidate, anchors)) {
      return;
    }

    setImportantStyleProperty(candidate, 'display', 'flex');
    setImportantStyleProperty(candidate, 'flex-direction', 'column');
    setImportantStyleProperty(candidate, 'align-items', 'stretch');
    setImportantStyleProperty(candidate, 'justify-content', 'flex-start');
    setImportantStyleProperty(candidate, 'align-content', 'stretch');
    setImportantStyleProperty(candidate, 'min-width', '0');
    setImportantStyleProperty(candidate, 'height', 'auto');

    getVisibleDirectChildren(candidate).forEach((child) => {
      setImportantStyleProperty(child, 'min-width', '0');
    });
  }

  function normalizeStructuredSectionLayout() {
    collapseOverlappingEmptyBands();
    compactSparseInfoBands();
    normalizeAnchoredActionInfoColumns();
  }

  function applyHeroCarouselLayoutFix() {
    const rawCandidates = toArray(document.querySelectorAll('body *')).filter((element) => {
      if (!isVisible(element)) {
        return false;
      }

      const rect = element.getBoundingClientRect();
      if (rect.top < 0 || rect.top > Math.min(window.innerHeight * 0.25, 180)) {
        return false;
      }

      if (rect.width < window.innerWidth * HERO_CAROUSEL_MIN_WIDTH_RATIO) {
        return false;
      }

      if (rect.height < HERO_CAROUSEL_MIN_HEIGHT || rect.height > HERO_CAROUSEL_MAX_HEIGHT) {
        return false;
      }

      const wideImages = toArray(element.querySelectorAll('img')).filter((image) => {
        if (!isVisible(image) || !image.naturalWidth || !image.naturalHeight) {
          return false;
        }

        const imageRect = image.getBoundingClientRect();
        return imageRect.width >= rect.width * 0.75
          && imageRect.height >= rect.height * 0.7
          && Math.abs(imageRect.top - rect.top) <= 40;
      });

      if (!wideImages.length) {
        return false;
      }

      return collectHeroCarouselIndicators(element, rect).length > 0;
    });

    const roots = [];
    rawCandidates
      .sort((left, right) => {
        const leftRect = left.getBoundingClientRect();
        const rightRect = right.getBoundingClientRect();
        return (leftRect.width * leftRect.height) - (rightRect.width * rightRect.height);
      })
      .forEach((element) => {
        if (!roots.some((root) => root.contains(element))) {
          roots.push(element);
        }
      });

    roots.forEach((root) => {
      const rootRect = root.getBoundingClientRect();
      const wideImages = toArray(root.querySelectorAll('img')).filter((image) => {
        if (!isVisible(image) || !image.naturalWidth || !image.naturalHeight) {
          return false;
        }

        const imageRect = image.getBoundingClientRect();
        return imageRect.width >= rootRect.width * 0.75
          && imageRect.height >= rootRect.height * 0.7
          && Math.abs(imageRect.top - rootRect.top) <= 40;
      });

      const indicators = collectHeroCarouselIndicators(root, rootRect);
      if (!wideImages.length || !indicators.length) {
        return;
      }

      const currentHeight = Math.round(Math.max(rootRect.height, ...wideImages.map((image) => image.getBoundingClientRect().height)));
      const indicatorMetrics = indicators.map((element) => ({
        element,
        rect: element.getBoundingClientRect(),
        top: Number.parseFloat(element.style.top || ''),
        bottom: Number.parseFloat(element.style.bottom || '')
      }));
      const expectedHeight = Math.round(Math.max(
        ...wideImages.map((image) => {
          const imageRect = image.getBoundingClientRect();
          return imageRect.width * image.naturalHeight / image.naturalWidth;
        }),
        ...indicatorMetrics.map((metric) => currentHeight + Math.max(
          Number.isFinite(metric.bottom) ? Math.round(metric.bottom) : 0,
          Math.round(metric.rect.height * 1.25)
        ))
      ));
      const hasConflictingIndicatorOffsets = indicatorMetrics.some((metric) => Number.isFinite(metric.top) && Number.isFinite(metric.bottom));

      if (hasConflictingIndicatorOffsets && expectedHeight - currentHeight >= HERO_CAROUSEL_HEIGHT_THRESHOLD) {
        unique([
          root,
          ...wideImages.map((image) => image.parentElement),
          ...toArray(root.querySelectorAll('*')).filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.width >= rootRect.width * 0.75
              && rect.height >= currentHeight * 0.7
              && Math.abs(rect.top - rootRect.top) <= 40;
          })
        ]).forEach((element) => {
          const rect = element.getBoundingClientRect();
          if (rect.height > expectedHeight + 8 || rect.height < currentHeight * 0.6) {
            return;
          }

          element.style.height = String(expectedHeight) + 'px';
          element.style.minHeight = String(expectedHeight) + 'px';
          element.style.maxHeight = 'none';
        });
      }

      const indicatorBottom = Math.max(16, Math.min(32, ...indicators.map((element) => Math.round(element.getBoundingClientRect().height))));
      indicators.forEach((element) => {
        element.style.top = 'auto';
        element.style.bottom = String(indicatorBottom) + 'px';
      });
    });
  }

  function collectGroups() {
    const groups = [];

    toArray(document.querySelectorAll(TAB_CONTAINER_SELECTOR)).forEach((container) => {
      if (container.getAttribute('role') === 'tablist') {
        if (container.closest('.ant-tabs, .el-tabs, .hammer-tabs') !== container) {
          return;
        }
        const fallbackContainer = container.parentElement || container;
        groups.push({
          container: fallbackContainer,
          tabs: collectTabs(container),
          panels: collectPanels(fallbackContainer, collectTabs(container))
        });
        return;
      }

      const tabs = collectTabs(container);
      if (tabs.length < 2) {
        return;
      }

      groups.push({
        container,
        tabs,
        panels: collectPanels(container, tabs)
      });
    });

    return groups;
  }

  function bindGlobalDismiss() {
    if (window.__restorePreviewRuntimeDismissBound) {
      return;
    }

    window.__restorePreviewRuntimeDismissBound = true;

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!target.closest(SELECT_ROOT_SELECTOR) && !target.closest(SELECT_MENU_SELECTOR)) {
        toArray(document.querySelectorAll(SELECT_ROOT_SELECTOR)).forEach((selectRoot) => {
          closeSelect(selectRoot);
        });
      }

      if (!target.closest(DROPDOWN_TRIGGER_SELECTOR) && !target.closest(DROPDOWN_MENU_SELECTOR)) {
        closeAllDropdownMenus();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeAllDropdownMenus();
        toArray(document.querySelectorAll(SELECT_ROOT_SELECTOR)).forEach((selectRoot) => {
          closeSelect(selectRoot);
        });
        toArray(document.querySelectorAll(MODAL_ROOT_SELECTOR)).forEach((modal) => {
          if (isVisible(modal)) {
            setModalOpenState(modal, false);
          }
        });
      }
    });
  }

  function hydrateReactNativeLazyImages() {
    const normalizeComparableUrl = (value) => {
      const normalizedValue = String(value || '').trim().replace(/^['"]|['"]$/g, '');
      if (!normalizedValue || normalizedValue === 'none') {
        return '';
      }

      try {
        return new URL(normalizedValue, document.baseURI).href;
      } catch (error) {
        return normalizedValue;
      }
    };

    const extractBackgroundImageUrl = (backgroundImage) => {
      const matched = String(backgroundImage || '').match(/url\\((?:\"([^\"]*)\"|'([^']*)'|([^)]*))\\)/i);
      const rawUrl = matched?.[1] || matched?.[2] || matched?.[3] || '';
      return rawUrl ? normalizeComparableUrl(rawUrl) : '';
    };

    const candidates = toArray(document.querySelectorAll('img.css-9pa8cd[src]'));

    candidates.forEach((image) => {
      const parent = image.parentElement;
      if (!parent || parent.dataset.restoreRnImageHydrated === 'true') {
        return;
      }

      const backgroundNode = toArray(parent.children).find((child) => {
        if (!(child instanceof HTMLElement) || child === image) {
          return false;
        }

        const backgroundImage = child.style.backgroundImage || window.getComputedStyle(child).backgroundImage;
        return !!backgroundImage && backgroundImage !== 'none';
      });

      if (!(backgroundNode instanceof HTMLElement)) {
        return;
      }

      const backgroundStyle = window.getComputedStyle(backgroundNode);
      const backgroundImage = backgroundStyle.backgroundImage || backgroundNode.style.backgroundImage;
      if (!backgroundImage || backgroundImage === 'none') {
        return;
      }

      image.style.opacity = '1';
      image.style.visibility = 'visible';
      image.style.zIndex = '1';
      if (!image.style.objectFit) {
        image.style.objectFit = backgroundStyle.backgroundSize === 'contain' ? 'contain' : 'cover';
      }

      const imageUrl = normalizeComparableUrl(image.currentSrc || image.getAttribute('src') || '');
      const backgroundImageUrl = extractBackgroundImageUrl(backgroundImage);
      const imageRect = image.getBoundingClientRect();
      const backgroundRect = backgroundNode.getBoundingClientRect();
      const hasNearlySameBounds = Math.abs(imageRect.width - backgroundRect.width) <= 2
        && Math.abs(imageRect.height - backgroundRect.height) <= 2;
      const hasOnlyVisualMediaChildren = toArray(parent.children).every((child) => {
        if (!(child instanceof HTMLElement)) {
          return false;
        }

        return child === image || child === backgroundNode || !getNormalizedText(child);
      });
      const isDuplicateVisualLayer = (!!imageUrl && !!backgroundImageUrl && imageUrl === backgroundImageUrl)
        || (!!imageUrl && hasNearlySameBounds && hasOnlyVisualMediaChildren);

      if (isDuplicateVisualLayer) {
        backgroundNode.style.display = 'none';
        backgroundNode.style.backgroundImage = 'none';
        parent.dataset.restoreRnImageDeduped = 'true';
      } else {
        backgroundNode.style.opacity = '1';
        backgroundNode.style.visibility = 'visible';
        backgroundNode.style.zIndex = '0';
      }

      parent.dataset.restoreRnImageHydrated = 'true';
    });
  }

  function normalizeAbsoluteAnchorLayouts() {
    const containers = toArray(document.querySelectorAll('a, [role="link"]'));

    containers.forEach((container) => {
      if (!(container instanceof HTMLElement)) {
        return;
      }

      const hasAbsoluteDescendant = toArray(container.querySelectorAll('*')).some((child) => {
        if (!(child instanceof HTMLElement)) {
          return false;
        }

        return window.getComputedStyle(child).position === 'absolute';
      });

      if (!hasAbsoluteDescendant) {
        return;
      }

      const computedStyle = window.getComputedStyle(container);
      if (computedStyle.position === 'static') {
        container.style.position = 'relative';
      }

      container.dataset.restoreAbsoluteAnchor = 'true';
    });
  }

  function isShortHeadingText(text) {
    const normalizedText = String(text || '').replace(/\\s+/g, ' ').trim();
    return normalizedText.length >= 2 && normalizedText.length <= 12;
  }

  function isPriceText(text) {
    return /^¥\\s*\\d/.test(String(text || '').replace(/\\s+/g, ' ').trim());
  }

  function isPriceFragmentText(text) {
    const normalizedText = String(text || '').replace(/\\s+/g, ' ').trim();
    return normalizedText === '¥'
      || normalizedText === '￥'
      || /^\\d[\\d,.]*$/.test(normalizedText);
  }

  function hasPriceLikeContent(root) {
    if (!(root instanceof HTMLElement)) {
      return false;
    }

    if (isPriceText(getNormalizedText(root))) {
      return true;
    }

    const leafNodes = toArray(root.querySelectorAll('div, span, p')).filter((candidate) => {
      return candidate instanceof HTMLElement
        && isVisible(candidate)
        && candidate.children.length === 0;
    });
    if (leafNodes.some((candidate) => isPriceText(getNormalizedText(candidate)))) {
      return true;
    }

    return toArray(root.querySelectorAll('div, span, p')).some((candidate) => {
      if (!(candidate instanceof HTMLElement) || !isVisible(candidate)) {
        return false;
      }

      const childLeafTexts = toArray(candidate.children)
        .filter((child) => child instanceof HTMLElement)
        .map((child) => getNormalizedText(child))
        .filter(Boolean);
      if (!childLeafTexts.length) {
        return false;
      }

      const compactJoinedText = childLeafTexts.join('');
      if (isPriceText(compactJoinedText)) {
        return true;
      }

      const hasCurrencyLeaf = childLeafTexts.some((text) => text === '¥' || text === '￥');
      const hasNumericLeaf = childLeafTexts.some((text) => /^\\d[\\d,.]*$/.test(String(text || '').trim()));
      return hasCurrencyLeaf && hasNumericLeaf;
    });
  }

  function isLikelyCtaLabelText(text) {
    const normalizedText = String(text || '').replace(/\\s+/g, ' ').trim();
    if (!normalizedText || normalizedText.length > 10) {
      return false;
    }

    if (isPriceText(normalizedText)) {
      return false;
    }

    return /[\u4e00-\u9fa5A-Za-z]/.test(normalizedText);
  }

  function getVisibleDirectChildren(root) {
    if (!(root instanceof HTMLElement)) {
      return [];
    }

    return toArray(root.children).filter((child) => child instanceof HTMLElement && isVisible(child));
  }

  function findVisualButtonLayer(buttonRoot) {
    return toArray(buttonRoot.querySelectorAll('div, a, button, span')).find((element) => {
      if (!(element instanceof HTMLElement)) {
        return false;
      }

      const style = window.getComputedStyle(element);
      if (!isVisible(element) || style.position === 'absolute') {
        return false;
      }

      return (style.backgroundImage && style.backgroundImage !== 'none')
        || (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent')
        || Number.parseFloat(style.borderRadius || '0') >= 20;
    }) || null;
  }

  function findButtonLabelLeaf(buttonRoot) {
    return toArray(buttonRoot.querySelectorAll('div, span, p')).find((element) => {
      if (!(element instanceof HTMLElement) || element.children.length) {
        return false;
      }

      return isLikelyCtaLabelText(getNormalizedText(element));
    }) || null;
  }

  function capturePurchaseButtonMetrics(buttonRoot) {
    if (!(buttonRoot instanceof HTMLElement)) {
      return {
        originalMinWidth: 0,
        originalWidth: 0
      };
    }

    const computedStyle = window.getComputedStyle(buttonRoot);
    const rect = buttonRoot.getBoundingClientRect();
    const originalMinWidth = buttonRoot.dataset.protorecOriginalMinWidth
      ? Number.parseFloat(buttonRoot.dataset.protorecOriginalMinWidth)
      : Math.max(
        parsePixelValue(buttonRoot.style.minWidth || ''),
        parsePixelValue(computedStyle.minWidth || '')
      );
    const originalWidth = buttonRoot.dataset.protorecOriginalWidth
      ? Number.parseFloat(buttonRoot.dataset.protorecOriginalWidth)
      : Math.max(
        parsePixelValue(buttonRoot.style.width || ''),
        Math.round(rect.width)
      );

    if (!buttonRoot.dataset.protorecOriginalMinWidth && Number.isFinite(originalMinWidth) && originalMinWidth > 0) {
      buttonRoot.dataset.protorecOriginalMinWidth = String(originalMinWidth);
    }
    if (!buttonRoot.dataset.protorecOriginalWidth && Number.isFinite(originalWidth) && originalWidth > 0) {
      buttonRoot.dataset.protorecOriginalWidth = String(originalWidth);
    }

    return {
      originalMinWidth: Number.isFinite(originalMinWidth) ? originalMinWidth : 0,
      originalWidth: Number.isFinite(originalWidth) ? originalWidth : 0
    };
  }

  function findPurchaseButtonPairAncestors(scope = document) {
    const groups = new Map();
    const buttons = unique(toArray((scope || document).querySelectorAll('*')).filter(isLikelyPurchaseButtonRoot));

    buttons.forEach((buttonRoot) => {
      let current = buttonRoot.parentElement;
      let depth = 0;
      while (current && depth < 5) {
        const descendants = unique(toArray(current.querySelectorAll('*')).filter(isLikelyPurchaseButtonRoot));
        if (descendants.length === 2) {
          groups.set(current, descendants);
          break;
        }
        current = current.parentElement;
        depth += 1;
      }
    });

    return Array.from(groups.entries()).map(([ancestor, pair]) => ({ ancestor, pair }));
  }

  function normalizePairedPurchaseButtons(scope = document) {
    findPurchaseButtonPairAncestors(scope).forEach(({ ancestor, pair }) => {
      if (!(ancestor instanceof HTMLElement) || !Array.isArray(pair) || pair.length !== 2) {
        return;
      }

      const [leftButton, rightButton] = pair;
      const leftMetrics = capturePurchaseButtonMetrics(leftButton);
      const rightMetrics = capturePurchaseButtonMetrics(rightButton);
      const donorMinWidth = Math.max(leftMetrics.originalMinWidth, rightMetrics.originalMinWidth);

      if (donorMinWidth >= 160) {
        [leftButton, rightButton].forEach((buttonRoot) => {
          setImportantStyleProperty(buttonRoot, 'min-width', String(Math.round(donorMinWidth)) + 'px');
          setImportantStyleProperty(buttonRoot, 'box-sizing', 'border-box');
        });
      }

      setImportantStyleProperty(ancestor, 'display', 'flex');
      setImportantStyleProperty(ancestor, 'flex-direction', 'row');
      setImportantStyleProperty(ancestor, 'align-items', 'stretch');
      setImportantStyleProperty(ancestor, 'justify-content', 'flex-start');
    });
  }

  function hasInlineQuantityStepper(root) {
    if (!(root instanceof HTMLElement) || !isVisible(root)) {
      return false;
    }

    const iconControls = unique(
      toArray(root.querySelectorAll('[tabindex], button, [role="button"]')).filter((element) => {
        if (!(element instanceof HTMLElement) || !isVisible(element)) {
          return false;
        }

        const text = getNormalizedText(element);
        if (text && !/^[+-]$/.test(text)) {
          return false;
        }

        const rect = element.getBoundingClientRect();
        if (rect.width < 20 || rect.width > 48 || rect.height < 20 || rect.height > 48) {
          return false;
        }

        return element.querySelector('svg, img') || /^[+-]$/.test(text);
      })
    );

    const quantityLeaves = unique(
      toArray(root.querySelectorAll('div, span, p')).filter((element) => {
        if (!(element instanceof HTMLElement) || !isVisible(element) || element.children.length) {
          return false;
        }

        const text = getNormalizedText(element);
        if (!/^\d+$/.test(text)) {
          return false;
        }

        const rect = element.getBoundingClientRect();
        return rect.width > 0
          && rect.width <= 56
          && rect.height > 0
          && rect.height <= 40;
      })
    );

    return iconControls.length >= 2 && quantityLeaves.length >= 1;
  }

  function findPurchaseActionRowContext(startElement) {
    let current = startElement instanceof HTMLElement ? startElement : null;
    let depth = 0;

    while (current && depth < 6) {
      if (isVisible(current)) {
        const normalizedText = getNormalizedText(current);
        const rect = current.getBoundingClientRect();
        const directChildren = getVisibleDirectChildren(current);
        const containsPurchasePair = !!(
          current.querySelector('#prd-botnav-leftbtn')
          && current.querySelector('#prd-botnav-rightbtn')
        );
        const isCompactPurchaseRow = containsPurchasePair
          && rect.height >= 40
          && rect.height <= 120
          && directChildren.length <= 4;
        const isBroadInfoColumn = containsPurchasePair
          && !!current.querySelector('#serviceComponent')
          && directChildren.length >= 6;
        if (normalizedText.includes('组合价')) {
          return { type: 'combo', row: current };
        }

        if (hasInlineQuantityStepper(current) || isCompactPurchaseRow) {
          return { type: 'main', row: current };
        }

        if (!isBroadInfoColumn && /已选[:：]/.test(normalizedText)) {
          return { type: 'main', row: current };
        }
      }

      current = current.parentElement;
      depth += 1;
    }

    return null;
  }

  function isPurchaseActionLabelText(text) {
    const normalizedText = String(text || '').replace(/\s+/g, ' ').trim();
    return normalizedText === '加入购物车' || normalizedText === '立即购买';
  }

  function hasVisibleRoundedActionSurface(element) {
    if (!(element instanceof HTMLElement) || !isVisible(element)) {
      return false;
    }

    const style = window.getComputedStyle(element);
    return (style.backgroundImage && style.backgroundImage !== 'none')
      || (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent')
      || Number.parseFloat(style.borderRadius || '0') >= 16;
  }

  function findStructuredPurchaseActionVisualRoot(labelLeaf) {
    let current = labelLeaf instanceof HTMLElement ? labelLeaf : null;
    let depth = 0;

    while (current && depth < 6) {
      const rect = current.getBoundingClientRect();
      if (
        rect.width >= 80
        && rect.width <= 280
        && rect.height >= 40
        && rect.height <= 72
        && hasVisibleRoundedActionSurface(current)
      ) {
        return current;
      }

      current = current.parentElement;
      depth += 1;
    }

    return null;
  }

  function findStructuredPurchaseButtonContainer(visualRoot, pairAncestor) {
    let current = visualRoot instanceof HTMLElement ? visualRoot : null;
    let candidate = visualRoot instanceof HTMLElement ? visualRoot : null;
    let depth = 0;

    while (current && current !== pairAncestor && depth < 4) {
      const next = current.parentElement;
      if (!(next instanceof HTMLElement) || next === pairAncestor) {
        break;
      }

      const rect = next.getBoundingClientRect();
      if (rect.width >= 80 && rect.width <= 280 && rect.height >= 40 && rect.height <= 72) {
        candidate = next;
      }

      current = next;
      depth += 1;
    }

    return candidate;
  }

  function findStructuredPurchaseActionPairs(scope = document) {
    const labelLeaves = unique(
      toArray((scope || document).querySelectorAll('div, span, p, a, button')).filter((element) => {
        return element instanceof HTMLElement
          && isVisible(element)
          && !element.children.length
          && isPurchaseActionLabelText(getNormalizedText(element));
      })
    );
    const visualRoots = unique(labelLeaves.map(findStructuredPurchaseActionVisualRoot).filter(Boolean));
    const groups = new Map();

    visualRoots.forEach((visualRoot) => {
      let current = visualRoot.parentElement;
      let depth = 0;

      while (current && depth < 6) {
        const descendants = unique(visualRoots.filter((candidate) => current.contains(candidate) && isVisible(candidate)));
        const labels = descendants.map((candidate) => getNormalizedText(candidate));
        if (descendants.length === 2 && labels.includes('加入购物车') && labels.includes('立即购买')) {
          if (!groups.has(current)) {
            const buttons = descendants
              .map((candidate) => {
                const container = findStructuredPurchaseButtonContainer(candidate, current);
                return {
                  label: getNormalizedText(candidate),
                  visualRoot: candidate,
                  container: container instanceof HTMLElement ? container : candidate
                };
              })
              .sort((left, right) => {
                return left.container.getBoundingClientRect().left - right.container.getBoundingClientRect().left;
              });
            groups.set(current, buttons);
          }
          break;
        }

        current = current.parentElement;
        depth += 1;
      }
    });

    return Array.from(groups.entries()).map(([ancestor, buttons]) => ({ ancestor, buttons }));
  }

  function captureStructuredPurchaseButtonMetrics(buttonRoot) {
    if (!(buttonRoot instanceof HTMLElement) || !isVisible(buttonRoot)) {
      return {
        paddingX: 0,
        outerWidth: 0,
        visualWidth: 0
      };
    }

    const computedStyle = window.getComputedStyle(buttonRoot);
    const paddingX = Math.max(0, parsePixelValue(computedStyle.paddingLeft || ''))
      + Math.max(0, parsePixelValue(computedStyle.paddingRight || ''));
    const outerWidth = Math.round(buttonRoot.getBoundingClientRect().width);
    const visualLayer = findVisualButtonLayer(buttonRoot);
    const visualWidth = visualLayer instanceof HTMLElement
      ? Math.round(visualLayer.getBoundingClientRect().width)
      : Math.max(0, outerWidth - paddingX);

    return {
      paddingX,
      outerWidth,
      visualWidth
    };
  }

  function normalizeStructuredPurchaseButtonRoot(buttonRoot, options = {}) {
    if (!(buttonRoot instanceof HTMLElement) || !isVisible(buttonRoot)) {
      return;
    }

    const fixedOuterWidth = Number.isFinite(options.fixedOuterWidth) ? Math.round(options.fixedOuterWidth) : 0;
    const measuredButtonHeight = Math.round(buttonRoot.getBoundingClientRect().height);
    const fixedButtonHeight = measuredButtonHeight >= 40 && measuredButtonHeight <= 72
      ? measuredButtonHeight
      : 0;

    setImportantStyleProperty(buttonRoot, 'display', 'flex');
    setImportantStyleProperty(buttonRoot, 'align-items', 'stretch');
    setImportantStyleProperty(buttonRoot, 'justify-content', 'center');
    setImportantStyleProperty(buttonRoot, 'flex-grow', '0');
    setImportantStyleProperty(buttonRoot, 'flex-shrink', '0');
    if (fixedOuterWidth > 0) {
      const nextOuterWidth = String(fixedOuterWidth) + 'px';
      setImportantStyleProperty(buttonRoot, 'flex-basis', nextOuterWidth);
      setImportantStyleProperty(buttonRoot, 'width', nextOuterWidth);
      setImportantStyleProperty(buttonRoot, 'min-width', nextOuterWidth);
      setImportantStyleProperty(buttonRoot, 'max-width', nextOuterWidth);
    } else {
      setImportantStyleProperty(buttonRoot, 'min-width', '0');
      setImportantStyleProperty(buttonRoot, 'max-width', 'none');
    }
    setImportantStyleProperty(buttonRoot, 'align-self', 'stretch');
    setImportantStyleProperty(buttonRoot, 'box-sizing', 'border-box');

    const visualLayer = findVisualButtonLayer(buttonRoot);
    if (visualLayer instanceof HTMLElement) {
      setImportantStyleProperty(visualLayer, 'display', 'flex');
      setImportantStyleProperty(visualLayer, 'align-items', 'center');
      setImportantStyleProperty(visualLayer, 'justify-content', 'center');
      setImportantStyleProperty(visualLayer, 'flex-grow', '1');
      setImportantStyleProperty(visualLayer, 'flex-shrink', '1');
      setImportantStyleProperty(visualLayer, 'flex-basis', 'auto');
      setImportantStyleProperty(visualLayer, 'width', '100%');
      setImportantStyleProperty(visualLayer, 'min-width', '0');
      setImportantStyleProperty(visualLayer, 'max-width', 'none');
      if (fixedButtonHeight > 0) {
        const nextButtonHeight = String(fixedButtonHeight) + 'px';
        // Some rounded CTA skins derive auto height from width when the inner
        // surface gets a hard width. Keep the width ownership on the outer root
        // and pin the visual surface back to the measured button height.
        setImportantStyleProperty(visualLayer, 'height', nextButtonHeight);
        setImportantStyleProperty(visualLayer, 'min-height', nextButtonHeight);
        setImportantStyleProperty(visualLayer, 'max-height', nextButtonHeight);
      } else {
        setImportantStyleProperty(visualLayer, 'height', '100%');
      }
      setImportantStyleProperty(visualLayer, 'align-self', 'stretch');
      setImportantStyleProperty(visualLayer, 'box-sizing', 'border-box');
    }

    const labelLeaf = findButtonLabelLeaf(buttonRoot);
    if (labelLeaf instanceof HTMLElement) {
      const labelHost = labelLeaf.parentElement instanceof HTMLElement ? labelLeaf.parentElement : labelLeaf;
      setImportantStyleProperty(labelHost, 'display', 'flex');
      setImportantStyleProperty(labelHost, 'align-items', 'center');
      setImportantStyleProperty(labelHost, 'justify-content', 'center');
      setImportantStyleProperty(labelHost, 'flex-grow', '1');
      setImportantStyleProperty(labelHost, 'min-width', '0');
      setImportantStyleProperty(labelHost, 'width', '100%');
      setImportantStyleProperty(labelHost, 'height', '100%');
      setImportantStyleProperty(labelHost, 'box-sizing', 'border-box');

      setImportantStyleProperty(labelLeaf, 'white-space', 'nowrap');
      setImportantStyleProperty(labelLeaf, 'overflow', 'hidden');
      setImportantStyleProperty(labelLeaf, 'text-overflow', 'ellipsis');
      setImportantStyleProperty(labelLeaf, 'min-width', '0');
      setImportantStyleProperty(labelLeaf, 'text-align', 'center');
    }
  }

  function normalizeStructuredPurchaseActionRows(scope = document) {
    findStructuredPurchaseActionPairs(scope).forEach(({ ancestor, buttons }) => {
      if (!(ancestor instanceof HTMLElement) || !Array.isArray(buttons) || buttons.length !== 2) {
        return;
      }

      const pairContainer = findNearestCommonAncestor(
        buttons.map((entry) => entry.container).filter((element) => element instanceof HTMLElement),
        6
      ) || ancestor;
      const context = findPurchaseActionRowContext(pairContainer) || findPurchaseActionRowContext(ancestor);
      if (!context || !(context.row instanceof HTMLElement)) {
        return;
      }

      const [leftButton, rightButton] = buttons.map((entry) => entry.container);
      setImportantStyleProperty(context.row, 'display', 'flex');
      setImportantStyleProperty(context.row, 'flex-direction', 'row');
      setImportantStyleProperty(context.row, 'flex-wrap', 'nowrap');
      setImportantStyleProperty(context.row, 'align-items', 'center');
      setImportantStyleProperty(context.row, 'min-width', '0');

      if (context.type === 'combo') {
        setImportantStyleProperty(context.row, 'justify-content', 'flex-end');
      }

      if (pairContainer instanceof HTMLElement) {
        setImportantStyleProperty(pairContainer, 'display', 'flex');
        setImportantStyleProperty(pairContainer, 'flex-direction', 'row');
        setImportantStyleProperty(pairContainer, 'flex-wrap', 'nowrap');
        setImportantStyleProperty(pairContainer, 'align-items', 'stretch');
        setImportantStyleProperty(pairContainer, 'justify-content', 'flex-start');
        setImportantStyleProperty(pairContainer, 'min-width', '0');
      }

      const metrics = [leftButton, rightButton].map((buttonRoot) => captureStructuredPurchaseButtonMetrics(buttonRoot));
      const measuredVisualWidths = metrics
        .map((entry) => entry.visualWidth)
        .filter((width) => width >= 120 && width <= 240);
      const targetVisualWidth = measuredVisualWidths.length
        ? Math.max(...measuredVisualWidths)
        : Math.max(
          140,
          Math.round(
            Math.max(
              120,
              ((pairContainer instanceof HTMLElement ? pairContainer : ancestor).getBoundingClientRect().width
                - metrics.reduce((sum, entry) => sum + entry.paddingX, 0))
              / 2
            )
          )
        );

      normalizeStructuredPurchaseButtonRoot(leftButton, {
        fixedOuterWidth: targetVisualWidth + metrics[0].paddingX,
        fixedVisualWidth: targetVisualWidth
      });
      normalizeStructuredPurchaseButtonRoot(rightButton, {
        fixedOuterWidth: targetVisualWidth + metrics[1].paddingX,
        fixedVisualWidth: targetVisualWidth
      });
    });
  }

  function isLikelyPurchaseButtonRoot(element) {
    if (!(element instanceof HTMLElement) || !isVisible(element)) {
      return false;
    }

    if (element.querySelector('input[type="checkbox"], input[type="radio"], [role="combobox"], [role="listbox"], select')) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width < 96 || rect.width > 260 || rect.height < 40 || rect.height > 72) {
      return false;
    }

    if (!findVisualButtonLayer(element) || !findButtonLabelLeaf(element)) {
      return false;
    }

    const style = window.getComputedStyle(element);
    return style.display.includes('flex') || style.flexShrink !== '0' || style.cursor === 'pointer' || element.tabIndex >= 0;
  }

  function isLikelyProductCard(element) {
    if (!(element instanceof HTMLElement) || !isVisible(element)) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width < 140 || rect.width > 340 || rect.height < 140 || rect.height > 520) {
      return false;
    }

    const mediaNodes = toArray(element.querySelectorAll('img, svg, canvas')).filter((media) => {
      if (!(media instanceof HTMLElement) || !isVisible(media)) {
        return false;
      }

      const mediaRect = media.getBoundingClientRect();
      return mediaRect.width >= 72
        && mediaRect.height >= 72
        && mediaRect.width <= 240
        && mediaRect.height <= 240;
    });
    if (!mediaNodes.length) {
      return false;
    }

    const textLeaves = toArray(element.querySelectorAll('div, span, p')).filter((candidate) => {
      if (!(candidate instanceof HTMLElement) || candidate.children.length || !isVisible(candidate)) {
        return false;
      }

      const text = getNormalizedText(candidate);
      if (!text || isPriceText(text) || isLikelyCtaLabelText(text)) {
        return false;
      }

      const candidateRect = candidate.getBoundingClientRect();
      return text.length >= 6
        && candidateRect.width >= 80
        && candidateRect.height <= 80;
    });

    const hasPrice = toArray(element.querySelectorAll('div, span, p')).some((candidate) => {
      return candidate instanceof HTMLElement && isVisible(candidate) && isPriceText(getNormalizedText(candidate));
    });

    return textLeaves.length > 0 && (hasPrice || mediaNodes.length >= 2);
  }

  function collectLikelyProductCards(root) {
    if (!(root instanceof HTMLElement)) {
      return [];
    }

    const candidates = toArray(root.querySelectorAll('*')).filter(isLikelyProductCard);
    return candidates.filter((candidate) => {
      return !candidates.some((other) => other !== candidate && other.contains(candidate));
    });
  }

  function findNearestProductCard(element, scopeRoot = document.body) {
    let current = element instanceof HTMLElement ? element : null;
    let depth = 0;

    while (current && depth < 6 && current !== scopeRoot) {
      if (isLikelyProductCard(current)) {
        return current;
      }

      current = current.parentElement;
      depth += 1;
    }

    return null;
  }

  function findChoiceInfoTitleLeaf(card) {
    if (!(card instanceof HTMLElement) || !isVisible(card)) {
      return null;
    }

    const candidates = toArray(card.querySelectorAll('div, span, p')).filter((element) => {
      if (!(element instanceof HTMLElement) || !isVisible(element) || element.children.length) {
        return false;
      }

      const text = getNormalizedText(element);
      if (!text || text.length < 8 || isPriceText(text) || isLikelyCtaLabelText(text)) {
        return false;
      }

      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0 || rect.height > 84) {
        return false;
      }

      return true;
    });

    if (!candidates.length) {
      return null;
    }

    return candidates.sort((left, right) => {
      const leftText = getNormalizedText(left);
      const rightText = getNormalizedText(right);
      const leftStyle = window.getComputedStyle(left);
      const rightStyle = window.getComputedStyle(right);
      const leftClamp = Number.parseFloat(left.style.webkitLineClamp || leftStyle.webkitLineClamp || '');
      const rightClamp = Number.parseFloat(right.style.webkitLineClamp || rightStyle.webkitLineClamp || '');
      const leftHasClamp = (Number.isFinite(leftClamp) && leftClamp >= 2)
        || leftStyle.display === '-webkit-box';
      const rightHasClamp = (Number.isFinite(rightClamp) && rightClamp >= 2)
        || rightStyle.display === '-webkit-box';

      if (leftHasClamp !== rightHasClamp) {
        return leftHasClamp ? -1 : 1;
      }

      return rightText.length - leftText.length;
    })[0] || null;
  }

  function isLikelyChoiceInfoCard(element) {
    if (!(element instanceof HTMLElement) || !isVisible(element)) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    if (rect.height < 96 || rect.height > 320) {
      return false;
    }

    const titleLeaf = findChoiceInfoTitleLeaf(element);
    if (!titleLeaf) {
      return false;
    }

    const hasPrice = hasPriceLikeContent(element);
    if (!hasPrice) {
      return false;
    }

    const choiceInputCount = toArray(element.querySelectorAll('input[type="checkbox"], input[type="radio"]')).length;
    const shortChoiceLabels = toArray(element.querySelectorAll('div, span, p')).filter((candidate) => {
      if (!(candidate instanceof HTMLElement) || !isVisible(candidate) || candidate.children.length) {
        return false;
      }

      const text = getNormalizedText(candidate);
      return !!text
        && text.length >= 1
        && text.length <= 24
        && !isPriceFragmentText(text)
        && !isPriceText(text)
        && !isLikelyCtaLabelText(text);
    });
    const hasChoiceControl = choiceInputCount > 0
      || (
        toArray(element.querySelectorAll('svg')).filter((svg) => svg instanceof SVGElement).length > 0
        && shortChoiceLabels.length >= 2
      );
    if (!hasChoiceControl) {
      return false;
    }

    const directChildren = toArray(element.children).filter((child) => child instanceof HTMLElement);
    if (directChildren.length < 3) {
      return false;
    }

    return true;
  }

  function collectLikelyChoiceInfoCards(root) {
    if (!(root instanceof HTMLElement)) {
      return [];
    }

    return toArray(root.children).filter((child) => {
      return child instanceof HTMLElement && isLikelyChoiceInfoCard(child);
    });
  }

  function collectLikelyChoiceInfoGroups(root) {
    if (!(root instanceof HTMLElement)) {
      return [];
    }

    const candidates = unique([root, ...toArray(root.querySelectorAll('[role="group"], div'))]);
    return candidates
      .map((group) => {
        const cards = collectLikelyChoiceInfoCards(group);
        return { group, cards };
      })
      .filter(({ cards }) => cards.length >= 3)
      .sort((left, right) => right.cards.length - left.cards.length);
  }

  function normalizeChoiceInfoCard(card, options = {}) {
    if (!(card instanceof HTMLElement) || !isVisible(card)) {
      return;
    }

    const cardWidth = Number.isFinite(options.cardWidth) ? Math.round(options.cardWidth) : 188;
    const preserveWidth = options.preserveWidth === true;
    const directChildren = toArray(card.children).filter((child) => child instanceof HTMLElement);
    const titleLeaf = findChoiceInfoTitleLeaf(card);

    setImportantStyleProperty(card, 'display', 'flex');
    setImportantStyleProperty(card, 'flex-direction', 'column');
    setImportantStyleProperty(card, 'align-items', 'stretch');
    setImportantStyleProperty(card, 'justify-content', 'flex-start');
    setImportantStyleProperty(card, 'flex-grow', preserveWidth ? '0' : '1');
    setImportantStyleProperty(card, 'flex-shrink', preserveWidth ? '0' : '1');
    setImportantStyleProperty(card, 'flex-basis', preserveWidth ? String(cardWidth) + 'px' : '0');
    setImportantStyleProperty(card, 'width', String(cardWidth) + 'px');
    setImportantStyleProperty(card, 'max-width', String(cardWidth) + 'px');
    setImportantStyleProperty(card, 'min-width', preserveWidth ? String(cardWidth) + 'px' : '0');
    setImportantStyleProperty(card, 'box-sizing', 'border-box');

    directChildren.forEach((child) => {
      setImportantStyleProperty(child, 'min-width', '0');
      if (getNormalizedText(child) || child.querySelector('input, svg')) {
        setImportantStyleProperty(child, 'width', '100%');
        setImportantStyleProperty(child, 'max-width', '100%');
        setImportantStyleProperty(child, 'align-self', 'stretch');
        setImportantStyleProperty(child, 'box-sizing', 'border-box');
      }
    });

    if (titleLeaf instanceof HTMLElement) {
      const titleRow = titleLeaf.parentElement instanceof HTMLElement ? titleLeaf.parentElement : titleLeaf;
      setImportantStyleProperty(titleRow, 'display', 'flex');
      setImportantStyleProperty(titleRow, 'align-items', 'flex-start');
      setImportantStyleProperty(titleRow, 'justify-content', 'flex-start');
      setImportantStyleProperty(titleRow, 'width', '100%');
      setImportantStyleProperty(titleRow, 'max-width', '100%');
      setImportantStyleProperty(titleRow, 'min-width', '0');
      setImportantStyleProperty(titleRow, 'height', 'auto');
      setImportantStyleProperty(titleRow, 'min-height', '42px');
      setImportantStyleProperty(titleRow, 'box-sizing', 'border-box');

      setImportantStyleProperty(titleLeaf, 'display', '-webkit-box');
      setImportantStyleProperty(titleLeaf, '-webkit-box-orient', 'vertical');
      setImportantStyleProperty(titleLeaf, '-webkit-line-clamp', '2');
      setImportantStyleProperty(titleLeaf, 'overflow', 'hidden');
      setImportantStyleProperty(titleLeaf, 'text-overflow', 'ellipsis');
      setImportantStyleProperty(titleLeaf, 'white-space', 'normal');
      setImportantStyleProperty(titleLeaf, 'width', '100%');
      setImportantStyleProperty(titleLeaf, 'max-width', '100%');
      setImportantStyleProperty(titleLeaf, 'min-width', '0');
      setImportantStyleProperty(titleLeaf, 'box-sizing', 'border-box');
      setImportantStyleProperty(titleLeaf, 'text-align', 'left');
      setImportantStyleProperty(titleLeaf, 'align-self', 'stretch');
    }

    directChildren.forEach((child) => {
      if (!getNormalizedText(child)) {
        return;
      }

      const hasPrice = hasPriceLikeContent(child);
      if (hasPrice) {
        setImportantStyleProperty(child, 'display', 'flex');
        setImportantStyleProperty(child, 'align-items', 'center');
        setImportantStyleProperty(child, 'justify-content', 'flex-start');
      }

      if (child.querySelector('input, svg')) {
        setImportantStyleProperty(child, 'width', '100%');
        setImportantStyleProperty(child, 'max-width', '100%');
        setImportantStyleProperty(child, 'align-self', 'stretch');
      }
    });
  }

  function normalizeChoiceInfoGroups(root) {
    collectLikelyChoiceInfoGroups(root).forEach(({ group, cards }) => {
      if (!(group instanceof HTMLElement) || cards.length < 3) {
        return;
      }

      const visibleCards = cards.filter((card) => isVisible(card));
      if (visibleCards.length < 3) {
        return;
      }

      const groupRect = group.getBoundingClientRect();
      const horizontalPadding = 24;
      const estimatedGap = 12;
      const fallbackWidth = 188;
      const measuredCardWidths = visibleCards
        .map((card) => Math.round(card.getBoundingClientRect().width))
        .filter((width) => width >= 156 && width <= 280)
        .sort((left, right) => left - right);
      const preservedWidth = measuredCardWidths.length
        ? measuredCardWidths[Math.floor(measuredCardWidths.length / 2)]
        : 0;
      const preserveWidth = preservedWidth >= 180;
      const computedWidth = groupRect.width > 0
        ? (groupRect.width - horizontalPadding - estimatedGap * Math.max(0, visibleCards.length - 1)) / visibleCards.length
        : fallbackWidth;
      const compactViewportCap = window.innerWidth > 0 && groupRect.width > window.innerWidth * 1.2
        ? Math.max(176, Math.min(220, Math.round(window.innerWidth * 0.28)))
        : 236;
      const cardWidth = preserveWidth
        ? preservedWidth
        : Math.max(156, Math.min(compactViewportCap, Math.round(computedWidth || fallbackWidth)));

      setImportantStyleProperty(group, 'display', 'flex');
      setImportantStyleProperty(group, 'flex-direction', 'row');
      setImportantStyleProperty(group, 'align-items', 'flex-start');
      setImportantStyleProperty(group, 'flex-wrap', 'nowrap');
      setImportantStyleProperty(group, 'min-width', '0');

      visibleCards.forEach((card) => normalizeChoiceInfoCard(card, { cardWidth, preserveWidth }));
    });
  }

  function normalizeProductCardText(card) {
    if (!(card instanceof HTMLElement) || !isVisible(card)) {
      return;
    }

    const cardRect = card.getBoundingClientRect();
    if (cardRect.width <= 0) {
      return;
    }

    toArray(card.querySelectorAll('*')).forEach((element) => {
      if (!(element instanceof HTMLElement)) {
        return;
      }

      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.display.includes('flex') || computedStyle.display === '-webkit-box') {
        setImportantStyleProperty(element, 'min-width', '0');
      }
    });

    toArray(card.querySelectorAll('div, span, p')).forEach((element) => {
      if (!(element instanceof HTMLElement) || !isVisible(element) || element.children.length) {
        return;
      }

      const text = getNormalizedText(element);
      if (!text || text.length < 8 || isPriceText(text) || isLikelyCtaLabelText(text)) {
        return;
      }

      const computedStyle = window.getComputedStyle(element);
      const clamp = Number.parseFloat(element.style.webkitLineClamp || computedStyle.webkitLineClamp || '');
      const hasClamp = (Number.isFinite(clamp) && clamp >= 2)
        || computedStyle.display === '-webkit-box'
        || String(element.className || '').includes('r-krxsd3');
      if (!hasClamp) {
        return;
      }

      const elementRect = element.getBoundingClientRect();
      if (elementRect.width <= 0 || elementRect.width > cardRect.width * 2) {
        return;
      }

      const marginLeft = parsePixelValue(computedStyle.marginLeft || '');
      const marginRight = parsePixelValue(computedStyle.marginRight || '');
      const horizontalInset = Math.max(0, marginLeft) + Math.max(0, marginRight);
      const nextWidth = Math.max(
        96,
        Math.round(Math.min(cardRect.width, Math.max(cardRect.width - horizontalInset, cardRect.width * 0.72)))
      );

      setImportantStyleProperty(element, 'width', String(nextWidth) + 'px');
      setImportantStyleProperty(element, 'max-width', String(nextWidth) + 'px');
      setImportantStyleProperty(element, 'min-width', '0');
      setImportantStyleProperty(element, 'box-sizing', 'border-box');
      if (element.parentElement && window.getComputedStyle(element.parentElement).display.includes('flex')) {
        setImportantStyleProperty(element, 'align-self', 'center');
      }
    });
  }

  function normalizePurchaseButtons(scope = document) {
    const buttonRoots = unique(
      toArray((scope || document).querySelectorAll('*')).filter(isLikelyPurchaseButtonRoot)
    );

    buttonRoots.forEach((buttonRoot) => {
      const computedStyle = window.getComputedStyle(buttonRoot);
      const metrics = capturePurchaseButtonMetrics(buttonRoot);
      const measuredWidth = Math.round(buttonRoot.getBoundingClientRect().width);
      const intrinsicMinWidth = Math.max(
        metrics.originalMinWidth,
        measuredWidth >= 160 && measuredWidth <= 320 ? measuredWidth : 0
      );

      if (intrinsicMinWidth >= 96) {
        setImportantStyleProperty(buttonRoot, 'min-width', String(Math.round(intrinsicMinWidth)) + 'px');
      } else {
        setImportantStyleProperty(buttonRoot, 'min-width', '0');
      }
      setImportantStyleProperty(buttonRoot, 'box-sizing', 'border-box');

      const visualLayer = findVisualButtonLayer(buttonRoot);
      if (visualLayer) {
        setImportantStyleProperty(visualLayer, 'display', 'flex');
        setImportantStyleProperty(visualLayer, 'align-items', 'center');
        setImportantStyleProperty(visualLayer, 'justify-content', 'center');
        if (intrinsicMinWidth >= 96) {
          setImportantStyleProperty(visualLayer, 'min-width', String(Math.round(intrinsicMinWidth)) + 'px');
        } else {
          setImportantStyleProperty(visualLayer, 'min-width', '0');
        }
        setImportantStyleProperty(visualLayer, 'box-sizing', 'border-box');
      }

      const labelLeaf = findButtonLabelLeaf(buttonRoot);
      if (labelLeaf) {
        setImportantStyleProperty(labelLeaf, 'white-space', 'nowrap');
        setImportantStyleProperty(labelLeaf, 'overflow', 'hidden');
        setImportantStyleProperty(labelLeaf, 'text-overflow', 'ellipsis');
        setImportantStyleProperty(labelLeaf, 'min-width', '0');
      }
    });

    normalizePairedPurchaseButtons(scope);
  }

  function normalizeSectionTitleBlock(root, titleTextValue) {
    if (!(root instanceof HTMLElement) || !titleTextValue) {
      return;
    }

    const matches = unique(
      toArray(root.querySelectorAll('div, span, p, h1, h2, h3')).filter((element) => {
        return element instanceof HTMLElement
          && getNormalizedText(element) === titleTextValue;
      })
    );

    if (!matches.length) {
      return;
    }

    const visibleMatches = matches.filter((element) => isVisible(element));
    const titleNode = visibleMatches.find((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width >= 32 && rect.height <= 120;
    }) || visibleMatches[0] || matches[0];

    matches.forEach((element) => {
      if (!(element instanceof HTMLElement) || element === titleNode) {
        return;
      }

      const computedStyle = window.getComputedStyle(element);
      const opacity = Number.parseFloat(computedStyle.opacity || '1');
      const isGhost = opacity <= 0.05
        || computedStyle.visibility === 'hidden'
        || computedStyle.position === 'absolute'
        || Number.parseFloat(computedStyle.zIndex || '0') < 0;
      if (!isGhost) {
        return;
      }

      setImportantStyleProperty(element, 'display', 'none');
      setImportantStyleProperty(element, 'height', '0px');
      setImportantStyleProperty(element, 'min-height', '0px');
      setImportantStyleProperty(element, 'margin', '0px');
      setImportantStyleProperty(element, 'padding', '0px');
      setImportantStyleProperty(element, 'overflow', 'hidden');
    });

    if (!(titleNode instanceof HTMLElement)) {
      return;
    }

    const titleRow = titleNode.parentElement instanceof HTMLElement ? titleNode.parentElement : titleNode;
    const previousSibling = getSiblingElement(titleRow, 'previousElementSibling');
    if (previousSibling instanceof HTMLElement) {
      const previousRect = previousSibling.getBoundingClientRect();
      const titleRect = titleRow.getBoundingClientRect();
      if (previousRect.height <= 4 && titleRect.top - previousRect.bottom <= 8) {
        setImportantStyleProperty(titleRow, 'margin-top', '12px');
      }
    }
  }

  function normalizeStructuredSectionTitles() {
    toArray(document.querySelectorAll('section[data-section-id], header[data-section-id], footer[data-section-id]')).forEach((root) => {
      if (!(root instanceof HTMLElement) || !isVisible(root)) {
        return;
      }

      const titleCandidates = unique(
        toArray(root.querySelectorAll('div, span, p, h1, h2, h3')).filter((element) => {
          if (!(element instanceof HTMLElement) || !isVisible(element)) {
            return false;
          }

          const text = getNormalizedText(element);
          if (!isShortHeadingText(text)) {
            return false;
          }

          const rect = element.getBoundingClientRect();
          return rect.width >= 32
            && rect.width <= Math.min(window.innerWidth * 0.35, 320)
            && rect.height <= 120;
        }).map((element) => getNormalizedText(element))
      );

      titleCandidates.forEach((text) => {
        normalizeSectionTitleBlock(root, text);
      });
    });
  }

  function normalizeComboRecommendationLayout() {
    toArray(document.querySelectorAll('section[data-section-id], div[data-section-id]')).forEach((root) => {
      if (!(root instanceof HTMLElement) || !isVisible(root)) {
        return;
      }

      const productCards = collectLikelyProductCards(root);
      const choiceInfoGroups = collectLikelyChoiceInfoGroups(root);
      const purchaseButtons = unique(toArray(root.querySelectorAll('*')).filter(isLikelyPurchaseButtonRoot));
      const visibleSelects = toArray(root.querySelectorAll('[role="combobox"], select, [data-protorec-open]')).filter((element) => {
        return element instanceof HTMLElement && isVisible(element);
      });
      const hasComboPriceLabel = toArray(root.querySelectorAll('div, span, p')).some((element) => {
        return element instanceof HTMLElement
          && isVisible(element)
          && getNormalizedText(element) === '组合价:';
      });
      const hasStructuredChoiceCards = choiceInfoGroups.some(({ cards }) => cards.length >= 3);

      const shouldNormalize = (
        productCards.length >= 2
        && purchaseButtons.length >= 2
        && (visibleSelects.length > 0 || hasStructuredChoiceCards)
      ) || (
        hasStructuredChoiceCards
        && (purchaseButtons.length >= 2 || hasComboPriceLabel)
      );

      if (!shouldNormalize) {
        return;
      }

      normalizePurchaseButtons(root);
      normalizeChoiceInfoGroups(root);
      productCards.forEach((card) => normalizeProductCardText(card));

      const heading = unique(
        toArray(root.querySelectorAll('div, span, p, h1, h2, h3'))
          .map((element) => getNormalizedText(element))
          .filter((text) => isShortHeadingText(text) && !isPriceText(text))
      )[0];
      if (heading) {
        normalizeSectionTitleBlock(root, heading);
      }

      toArray(root.querySelectorAll('*')).forEach((element) => {
        if (!(element instanceof HTMLElement) || !isVisible(element)) {
          return;
        }

        const computedStyle = window.getComputedStyle(element);
        const fixedHeight = parsePixelValue(computedStyle.height || element.style.height || '');
        if (fixedHeight < 200 || fixedHeight > 700 || computedStyle.position === 'absolute') {
          return;
        }

        const bounds = getVisibleDescendantBounds(element);
        if (!bounds) {
          return;
        }

        const rect = element.getBoundingClientRect();
        if (bounds.bottom <= rect.bottom + 4) {
          return;
        }

        setImportantStyleProperty(element, 'height', 'auto');
        setImportantStyleProperty(element, 'min-height', String(Math.round(fixedHeight)) + 'px');
        setImportantStyleProperty(element, 'max-height', 'none');
      });
    });
  }

  let deferredHeuristicLayoutPassTimer = null;

  function runHeuristicLayoutFixes() {
    applyHeroCarouselLayoutFix();
    normalizeStructuredSectionLayout();
    normalizeComboRecommendationLayout();
    normalizeStructuredPurchaseActionRows();
    normalizeRelatedGoodsTitle();
  }

  function scheduleDeferredHeuristicLayoutPass() {
    if (deferredHeuristicLayoutPassTimer) {
      window.clearTimeout(deferredHeuristicLayoutPassTimer);
    }

    deferredHeuristicLayoutPassTimer = window.setTimeout(() => {
      deferredHeuristicLayoutPassTimer = null;
      window.requestAnimationFrame(() => {
        runHeuristicLayoutFixes();
      });
    }, 80);
  }

  function normalizeRelatedGoodsTitle() {
    toArray(document.querySelectorAll('section[data-section-id], div[data-section-id]')).forEach((root) => {
      if (!(root instanceof HTMLElement) || !isVisible(root)) {
        return;
      }

      const productCards = collectLikelyProductCards(root);
      if (productCards.length < 4) {
        return;
      }

      const hasViewMore = toArray(root.querySelectorAll('div, span, p, a')).some((element) => {
        return element instanceof HTMLElement && isVisible(element) && getNormalizedText(element) === '查看更多';
      });
      if (!hasViewMore) {
        return;
      }

      productCards.forEach((card) => normalizeProductCardText(card));

      const titleText = unique(
        toArray(root.querySelectorAll('div, span, p, h1, h2, h3'))
          .map((element) => getNormalizedText(element))
          .filter((text) => isShortHeadingText(text) && text !== '查看更多' && !isPriceText(text))
      )[0];
      if (titleText) {
        normalizeSectionTitleBlock(root, titleText);
      }
    });
  }

  function normalizeRuntimeAssetUrl(value) {
    const normalizedValue = String(value || '').trim().replace(/^['"]|['"]$/g, '');
    if (!normalizedValue || normalizedValue === 'none' || normalizedValue.startsWith('data:') || normalizedValue.startsWith('blob:') || normalizedValue.startsWith('javascript:') || normalizedValue.startsWith('#')) {
      return '';
    }

    try {
      return new URL(normalizedValue, document.baseURI).href;
    } catch (error) {
      return '';
    }
  }

  function buildRuntimeAssetProxyUrl(value) {
    const absoluteUrl = normalizeRuntimeAssetUrl(value);
    if (!absoluteUrl) {
      return '';
    }

    if (absoluteUrl.includes('/asset-proxy?url=')) {
      return absoluteUrl;
    }

    const params = new URLSearchParams({ url: absoluteUrl });
    const referer = normalizeRuntimeAssetUrl(document.baseURI);
    if (referer) {
      params.set('referer', referer);
    }
    return '/asset-proxy?' + params.toString();
  }

  function collectImageRuntimeCandidates(image) {
    if (!(image instanceof HTMLImageElement)) {
      return [];
    }

    const candidates = [
      image.getAttribute('src'),
      image.currentSrc,
      image.getAttribute('data-src'),
      image.getAttribute('data-original'),
      image.getAttribute('data-origin'),
      image.getAttribute('data-url'),
      image.getAttribute('data-lazy-src'),
      image.getAttribute('data-lazyload'),
      image.getAttribute('data-echo')
    ].map((value) => String(value || '').trim()).filter(Boolean);

    const srcset = String(image.getAttribute('srcset') || '').trim();
    if (srcset) {
      srcset.split(',').forEach((entry) => {
        const [assetUrl] = entry.trim().split(/\\s+/, 1);
        if (assetUrl) {
          candidates.push(assetUrl);
        }
      });
    }

    return Array.from(new Set(candidates));
  }

  function hydrateBrokenImages(scope = document) {
    toArray(scope.querySelectorAll('img')).forEach((image) => {
      if (!(image instanceof HTMLImageElement)) {
        return;
      }

      if (!image.dataset.restoreImageFallbackBound) {
        image.dataset.restoreImageFallbackBound = 'true';
        image.addEventListener('error', () => {
          if (image.dataset.restoreImageFallbackApplied === 'true') {
            return;
          }

          const fallbackCandidate = collectImageRuntimeCandidates(image)
            .map((candidate) => buildRuntimeAssetProxyUrl(candidate))
            .find(Boolean);

          if (!fallbackCandidate) {
            return;
          }

          image.dataset.restoreImageFallbackApplied = 'true';
          image.removeAttribute('srcset');
          image.setAttribute('src', fallbackCandidate);
        });
      }

      const shouldHydrateMissingSource = !String(image.getAttribute('src') || '').trim();
      const shouldHydrateBrokenSource = image.complete && image.naturalWidth === 0;
      if (!shouldHydrateMissingSource && !shouldHydrateBrokenSource) {
        return;
      }

      const fallbackCandidate = collectImageRuntimeCandidates(image)
        .map((candidate) => buildRuntimeAssetProxyUrl(candidate))
        .find(Boolean);

      if (!fallbackCandidate) {
        return;
      }

      image.dataset.restoreImageFallbackApplied = 'true';
      image.removeAttribute('srcset');
      image.setAttribute('src', fallbackCandidate);
    });
  }

  function parsePixelValue(value) {
    const numeric = Number.parseFloat(String(value || '').trim());
    return Number.isFinite(numeric) ? numeric : NaN;
  }

  function parseTranslateYValue(transformValue) {
    const normalized = String(transformValue || '').trim();
    if (!normalized || normalized === 'none') {
      return 0;
    }

    const matrix3dMatch = normalized.match(/matrix3d\\(([^)]*)\\)/i);
    if (matrix3dMatch) {
      const values = matrix3dMatch[1].split(',').map((entry) => Number.parseFloat(entry.trim()));
      return Number.isFinite(values[13]) ? values[13] : 0;
    }

    const matrixMatch = normalized.match(/matrix\\(([^)]*)\\)/i);
    if (matrixMatch) {
      const values = matrixMatch[1].split(',').map((entry) => Number.parseFloat(entry.trim()));
      return Number.isFinite(values[5]) ? values[5] : 0;
    }

    const translateYMatch = normalized.match(/translateY\\(([-+]?\\d+(?:\\.\\d+)?)px\\)/i);
    if (translateYMatch) {
      return Number.parseFloat(translateYMatch[1]);
    }

    const translate3dMatch = normalized.match(/translate3d\\([^,]+,\\s*([-+]?\\d+(?:\\.\\d+)?)px/i);
    if (translate3dMatch) {
      return Number.parseFloat(translate3dMatch[1]);
    }

    const translateMatch = normalized.match(/translate\\([^,]+,\\s*([-+]?\\d+(?:\\.\\d+)?)px/i);
    if (translateMatch) {
      return Number.parseFloat(translateMatch[1]);
    }

    return 0;
  }

  function sampleRasterVisualMetrics(image) {
    if (!(image instanceof HTMLImageElement) || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
      return null;
    }

    try {
      const sampleSize = 24;
      const canvas = document.createElement('canvas');
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        return null;
      }

      context.clearRect(0, 0, sampleSize, sampleSize);
      context.drawImage(image, 0, 0, sampleSize, sampleSize);
      const pixels = context.getImageData(0, 0, sampleSize, sampleSize).data;

      const borderIndexes = new Set();
      for (let x = 0; x < sampleSize; x += 1) {
        borderIndexes.add(x);
        borderIndexes.add((sampleSize - 1) * sampleSize + x);
      }
      for (let y = 0; y < sampleSize; y += 1) {
        borderIndexes.add(y * sampleSize);
        borderIndexes.add(y * sampleSize + sampleSize - 1);
      }

      let opaquePixelCount = 0;
      let strongContentPixelCount = 0;
      let borderContentPixelCount = 0;
      let luminanceSum = 0;
      let luminanceSquareSum = 0;
      let saturationSum = 0;
      let saturationSquareSum = 0;

      for (let index = 0; index < sampleSize * sampleSize; index += 1) {
        const offset = index * 4;
        const red = pixels[offset];
        const green = pixels[offset + 1];
        const blue = pixels[offset + 2];
        const alpha = pixels[offset + 3] / 255;
        if (alpha < 0.1) {
          continue;
        }

        opaquePixelCount += 1;
        const maxChannel = Math.max(red, green, blue) / 255;
        const minChannel = Math.min(red, green, blue) / 255;
        const saturation = maxChannel <= 0 ? 0 : (maxChannel - minChannel) / maxChannel;
        const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
        const hasStrongContent = saturation > 0.08 || luminance < 240;

        luminanceSum += luminance;
        luminanceSquareSum += luminance * luminance;
        saturationSum += saturation;
        saturationSquareSum += saturation * saturation;

        if (hasStrongContent) {
          strongContentPixelCount += 1;
          if (borderIndexes.has(index)) {
            borderContentPixelCount += 1;
          }
        }
      }

      if (!opaquePixelCount) {
        return null;
      }

      const luminanceMean = luminanceSum / opaquePixelCount;
      const saturationMean = saturationSum / opaquePixelCount;
      return {
        opaqueRatio: opaquePixelCount / (sampleSize * sampleSize),
        strongRatio: strongContentPixelCount / opaquePixelCount,
        borderRatio: borderContentPixelCount / borderIndexes.size,
        luminanceVariance: luminanceSquareSum / opaquePixelCount - luminanceMean * luminanceMean,
        saturationVariance: saturationSquareSum / opaquePixelCount - saturationMean * saturationMean
      };
    } catch (_error) {
      return null;
    }
  }

  function normalizeTableCellWidthConstraints() {
    toArray(document.querySelectorAll('td, th')).forEach((cell) => {
      if (!(cell instanceof HTMLElement) || !isVisible(cell)) {
        return;
      }

      const computedStyle = window.getComputedStyle(cell);
      if (computedStyle.display !== 'table-cell') {
        return;
      }

      const inlineMaxWidth = parsePixelValue(
        cell.style.maxWidth
        || cell.getAttribute('data-restore-layout-max-width')
        || ''
      );
      if (!Number.isFinite(inlineMaxWidth) || inlineMaxWidth <= 0) {
        return;
      }

      const rect = cell.getBoundingClientRect();
      if (rect.width < 120 || rect.width <= inlineMaxWidth + 16) {
        return;
      }

      const nextWidth = Math.round(rect.width);
      cell.style.maxWidth = String(nextWidth) + 'px';

      if (computedStyle.position === 'sticky' && cell.scrollWidth > rect.width + 12) {
        const hasDenseWrappedMetadata = Boolean(
          cell.querySelector('.hammer-jc-sesame-rolling-tag, .hammer-tag, .hammer-jc-supplier-tag-button')
          || toArray(cell.querySelectorAll('[data-restore-layout-multiline="true"], .hammer-typography-ellipsis-multiple-line'))
            .filter((element) => element instanceof HTMLElement && isVisible(element)).length >= 2
        );

        if (!hasDenseWrappedMetadata) {
          cell.style.minWidth = String(nextWidth) + 'px';
        } else {
          cell.style.removeProperty('min-width');
        }
      }
    });
  }

  function classifyFramedAbsoluteMediaImage(image) {
    if (!(image instanceof HTMLImageElement) || image.dataset.restoreFramedMediaNormalized === 'true' || !isVisible(image)) {
      return null;
    }

    const parent = image.parentElement;
    if (!(parent instanceof HTMLElement)) {
      return null;
    }

    const computedStyle = window.getComputedStyle(image);
    const parentStyle = window.getComputedStyle(parent);
    if (computedStyle.position !== 'absolute' || parentStyle.position === 'static') {
      return null;
    }

    const parentRect = parent.getBoundingClientRect();
    if (
      parentRect.width < 24
      || parentRect.width > 180
      || parentRect.height < 24
      || parentRect.height > 180
    ) {
      return null;
    }

    const styleText = String(image.getAttribute('style') || '');
    const left = parsePixelValue(computedStyle.left);
    const top = parsePixelValue(computedStyle.top);
    const hasCenteredOffsets = /left\\s*:\\s*50%/i.test(styleText)
      || /top\\s*:\\s*50%/i.test(styleText)
      || (
        Number.isFinite(left)
        && Number.isFinite(top)
        && Math.abs(left - parentRect.width / 2) <= 3
        && Math.abs(top - parentRect.height / 2) <= 3
      );
    if (!hasCenteredOffsets) {
      return null;
    }

    if (computedStyle.transform && computedStyle.transform !== 'none') {
      return null;
    }

    const naturalWidth = image.naturalWidth || 0;
    const naturalHeight = image.naturalHeight || 0;
    const naturalRatio = naturalWidth > 0 && naturalHeight > 0
      ? naturalWidth / naturalHeight
      : (parentRect.width > 0 && parentRect.height > 0 ? parentRect.width / parentRect.height : 1);
    const parentClassName = typeof parent.className === 'string' ? parent.className : '';
    const imageClassName = typeof image.className === 'string' ? image.className : '';
    const classText = (parentClassName + ' ' + imageClassName + ' ' + String(image.getAttribute('alt') || '')).toLowerCase();
    const parentRadius = parsePixelValue(parentStyle.borderRadius);
    const hasSurfaceBackground = parentStyle.backgroundColor
      && parentStyle.backgroundColor !== 'transparent'
      && parentStyle.backgroundColor !== 'rgba(0, 0, 0, 0)';
    const isSquareWrapper = Math.abs(parentRect.width - parentRect.height) <= 12
      && Math.max(parentRect.width, parentRect.height) <= 120;
    const hasLogoHints = parent.getAttribute('role') === 'logo'
      || /(logo|brand|icon|avatar|emblem|seal)/i.test(classText);
    const visualMetrics = sampleRasterVisualMetrics(image);
    const looksLikePhotoThumbnail = Boolean(
      isSquareWrapper
      && naturalWidth >= 72
      && naturalHeight >= 56
      && naturalRatio >= 0.9
      && naturalRatio <= 1.8
      && visualMetrics
      && visualMetrics.opaqueRatio >= 0.9
      && visualMetrics.strongRatio >= 0.75
      && visualMetrics.borderRatio >= 0.45
      && (
        visualMetrics.luminanceVariance >= 2000
        || visualMetrics.saturationVariance >= 0.01
      )
    );

    if (looksLikePhotoThumbnail) {
      return 'photo';
    }

    if (
      !hasLogoHints
      && isSquareWrapper
      && (hasSurfaceBackground || (Number.isFinite(parentRadius) && parentRadius >= 4) || image.naturalWidth > 0)
      && naturalRatio >= 0.9
      && naturalRatio <= 1.75
    ) {
      return 'photo';
    }

    if (hasLogoHints || isSquareWrapper) {
      return 'logo';
    }

    return null;
  }

  function normalizeFramedMediaElements() {
    toArray(document.querySelectorAll('img')).forEach((image) => {
      const mediaKind = classifyFramedAbsoluteMediaImage(image);
      if (!mediaKind) {
        return;
      }

      const parent = image.parentElement;
      if (!(parent instanceof HTMLElement)) {
        return;
      }

      parent.style.overflow = parent.style.overflow || 'hidden';
      image.style.left = '50%';
      image.style.top = '50%';
      image.style.transform = 'translate(-50%, -50%)';
      image.style.objectPosition = 'center center';

      if (mediaKind === 'photo') {
        image.style.width = '100%';
        image.style.height = '100%';
        image.style.maxWidth = 'none';
        image.style.maxHeight = 'none';
        image.style.objectFit = 'cover';
      } else {
        image.style.objectFit = 'contain';
        image.style.maxWidth = '100%';
        image.style.maxHeight = '100%';
        if (parsePixelValue(image.style.width || '') > parent.getBoundingClientRect().width + 8) {
          image.style.removeProperty('width');
        }
        if (parsePixelValue(image.style.height || '') > parent.getBoundingClientRect().height + 8) {
          image.style.removeProperty('height');
        }
      }

      image.dataset.restoreFramedMediaNormalized = 'true';
    });
  }

  function normalizeOverflowingStickyMediaCells() {
    toArray(document.querySelectorAll('td, th')).forEach((cell) => {
      if (!(cell instanceof HTMLElement) || !isVisible(cell)) {
        return;
      }

      const computedStyle = window.getComputedStyle(cell);
      if (computedStyle.position !== 'sticky') {
        return;
      }

      const rect = cell.getBoundingClientRect();
      if (rect.width < 32 || rect.width > 96 || getNormalizedText(cell)) {
        return;
      }

      const overflowingAbsoluteImages = toArray(cell.querySelectorAll('img')).filter((image) => {
        if (!(image instanceof HTMLImageElement) || !isVisible(image)) {
          return false;
        }

        if (window.getComputedStyle(image).position !== 'absolute') {
          return false;
        }

        const imageRect = image.getBoundingClientRect();
        return imageRect.left < rect.left - 4
          || imageRect.right > rect.right + 4
          || imageRect.width > rect.width + 8;
      });

      if (!overflowingAbsoluteImages.length) {
        return;
      }

      const onlyDecorativeTopRibbons = overflowingAbsoluteImages.every((image) => {
        const style = window.getComputedStyle(image);
        const imageRect = image.getBoundingClientRect();
        const left = parsePixelValue(style.left);
        const top = parsePixelValue(style.top);
        return imageRect.height > 0
          && imageRect.height <= Math.min(28, rect.height * 0.35)
          && (!Number.isFinite(top) || top <= 4)
          && Number.isFinite(left)
          && left <= -8
          && imageRect.width <= rect.width * 1.8;
      });
      if (onlyDecorativeTopRibbons) {
        return;
      }

      cell.style.overflow = 'hidden';
    });
  }

  function normalizeTableBadgeSurfaces() {
    unique(toArray(document.querySelectorAll(
      '.hammer-table-body .hammer-jc-sesame-rolling-tag-item, '
      + '.hammer-table-body .hammer-tag.hammer-tag-processing, '
      + '.hammer-table-body .hammer-tag.hammer-tag-orange, '
      + '.ant-table-body .hammer-jc-sesame-rolling-tag-item, '
      + '.ant-table-body .hammer-tag.hammer-tag-processing, '
      + '.ant-table-body .hammer-tag.hammer-tag-orange'
    ))).forEach((badge) => {
      if (!(badge instanceof HTMLElement) || !isVisible(badge) || badge.dataset.restoreTableBadgeNormalized === 'true') {
        return;
      }

      const computedStyle = window.getComputedStyle(badge);
      const inlineColor = parseInlineStyleDeclarations(badge.getAttribute('style') || '')
        .find(([property]) => property === 'color')?.[1] || '';
      const accentColor = String(inlineColor || computedStyle.color || '').trim() || 'rgb(26, 114, 255)';
      const isBorderless = badge.classList.contains('hammer-tag-borderless');

      if (badge.classList.contains('hammer-jc-sesame-rolling-tag-item')) {
        // Supplier-table rolling tags are outline chips in the source page:
        // keep the semantic accent color, but restore the white badge surface.
        setImportantStyleProperty(badge, 'background-color', 'rgb(255, 255, 255)');
        setImportantStyleProperty(badge, 'border-color', accentColor);
        setImportantStyleProperty(badge, 'color', accentColor);
        badge.dataset.restoreTableBadgeNormalized = 'true';
        return;
      }

      const computedBackground = String(computedStyle.backgroundColor || '').trim();
      if (computedBackground !== 'rgb(255, 255, 255)' && computedBackground !== 'rgba(255, 255, 255, 1)') {
        return;
      }

      if (badge.classList.contains('hammer-tag-processing')) {
        setImportantStyleProperty(badge, 'background-color', 'rgb(230, 244, 255)');
        setImportantStyleProperty(badge, 'border-color', isBorderless ? 'transparent' : 'rgb(148, 200, 255)');
        setImportantStyleProperty(badge, 'color', 'rgb(26, 114, 255)');
        badge.dataset.restoreTableBadgeNormalized = 'true';
        return;
      }

      if (badge.classList.contains('hammer-tag-orange')) {
        setImportantStyleProperty(badge, 'background-color', 'rgb(255, 247, 230)');
        setImportantStyleProperty(badge, 'border-color', isBorderless ? 'transparent' : 'rgb(255, 213, 145)');
        setImportantStyleProperty(badge, 'color', 'rgb(212, 107, 8)');
        badge.dataset.restoreTableBadgeNormalized = 'true';
      }
    });
  }

  function normalizeClippedTableBadgeGroups() {
    unique(toArray(document.querySelectorAll(
      '.hammer-table-body .hammer-jc-sesame-rolling-tag, '
      + '.ant-table-body .hammer-jc-sesame-rolling-tag, '
      + 'td .hammer-jc-sesame-rolling-tag, '
      + 'th .hammer-jc-sesame-rolling-tag'
    ))).forEach((group) => {
      if (!(group instanceof HTMLElement) || !isVisible(group) || group.dataset.restoreTableBadgeGroupNormalized === 'true') {
        return;
      }

      const badges = toArray(group.querySelectorAll('.hammer-jc-sesame-rolling-tag-item, .hammer-tag'))
        .filter((badge) => badge instanceof HTMLElement && isVisible(badge));
      if (badges.length < 2) {
        return;
      }

      const computedStyle = window.getComputedStyle(group);
      const fixedHeight = parsePixelValue(computedStyle.height || group.style.height || '');
      const usesClipping = computedStyle.overflowY === 'hidden'
        || computedStyle.overflowY === 'clip'
        || computedStyle.overflowX === 'hidden'
        || computedStyle.overflowX === 'clip';
      if (!usesClipping || fixedHeight <= 0 || fixedHeight > 24) {
        return;
      }

      const groupRect = group.getBoundingClientRect();
      if (groupRect.height <= 0 || groupRect.width <= 0) {
        return;
      }

      const badgeMetrics = badges.map((badge) => {
        const rect = badge.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0
          ? { top: rect.top, bottom: rect.bottom, height: rect.height }
          : null;
      }).filter(Boolean);
      if (!badgeMetrics.length) {
        return;
      }

      const firstRowTop = badgeMetrics.reduce(
        (minTop, metric) => Math.min(minTop, metric.top),
        Number.POSITIVE_INFINITY
      );
      const firstRowBadges = badgeMetrics.filter((metric) => Math.abs(metric.top - firstRowTop) <= 2);
      const hasFirstRowVerticalClipping = firstRowBadges.some((metric) => (
        metric.top < groupRect.top - 1
        || metric.bottom > groupRect.bottom + 1
        || metric.height > group.clientHeight + 2
      ));
      if (!hasFirstRowVerticalClipping) {
        return;
      }

      if (fixedHeight > 0) {
        setImportantStyleProperty(group, 'min-height', String(Math.round(Math.min(fixedHeight, 20))) + 'px');
      }
      setImportantStyleProperty(group, 'height', 'auto');
      setImportantStyleProperty(group, 'max-height', 'none');
      setImportantStyleProperty(group, 'overflow', 'visible');
      setImportantStyleProperty(group, 'overflow-x', 'visible');
      setImportantStyleProperty(group, 'overflow-y', 'visible');
      setImportantStyleProperty(group, 'white-space', 'normal');
      group.dataset.restoreTableBadgeGroupNormalized = 'true';
    });
  }

  function ensureCompactIconHoverStyle() {
    if (document.getElementById('protorec-compact-icon-hover-style')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'protorec-compact-icon-hover-style';
    style.textContent = [
      '[data-protorec-compact-icon-hover="true"]:hover,',
      '[data-protorec-compact-icon-hover="true"]:focus,',
      '[data-protorec-compact-icon-hover="true"]:focus-visible,',
      '[data-protorec-compact-icon-hover="true"]:active {',
      '  border-radius: var(--protorec-compact-icon-hover-radius, 8px) !important;',
      '  background: var(--protorec-compact-icon-hover-bg, rgb(242, 245, 248)) !important;',
      '  background-image: var(--protorec-compact-icon-hover-bg-image, none) !important;',
      '  background-color: var(--protorec-compact-icon-hover-bg-color, rgb(242, 245, 248)) !important;',
      '  border-color: var(--protorec-compact-icon-hover-border, transparent) !important;',
      '  border-style: var(--protorec-compact-icon-hover-border-style, solid) !important;',
      '  border-width: var(--protorec-compact-icon-hover-border-width, 1px) !important;',
      '  box-shadow: var(--protorec-compact-icon-hover-shadow, rgb(242, 245, 248) 0 0 0 999px inset) !important;',
      '}'
    ].join('\\n');
    document.head.appendChild(style);
  }

  function applyCompactIconHoverTokens(element) {
    if (!(element instanceof HTMLElement)) {
      return;
    }

    const className = typeof element.className === 'string' ? element.className : '';
    element.style.setProperty('--protorec-compact-icon-hover-radius', '8px');

    if (/hammer-btn-primary/i.test(className) && /hammer-btn-variant-solid/i.test(className)) {
      element.style.setProperty('--protorec-compact-icon-hover-bg', 'linear-gradient(153.02deg, #4291ff, #15d1d0)');
      element.style.setProperty('--protorec-compact-icon-hover-bg-image', 'linear-gradient(153.02deg, #4291ff, #15d1d0)');
      element.style.setProperty('--protorec-compact-icon-hover-bg-color', 'rgba(0, 0, 0, 0)');
      element.style.setProperty('--protorec-compact-icon-hover-border', 'transparent');
      element.style.setProperty('--protorec-compact-icon-hover-border-style', 'none');
      element.style.setProperty('--protorec-compact-icon-hover-border-width', '0');
      element.style.setProperty('--protorec-compact-icon-hover-shadow', 'none');
      return;
    }

    if (/hammer-btn-default/i.test(className) && /hammer-btn-variant-outlined/i.test(className)) {
      element.style.setProperty('--protorec-compact-icon-hover-bg', 'rgb(236, 240, 244)');
      element.style.setProperty('--protorec-compact-icon-hover-bg-image', 'none');
      element.style.setProperty('--protorec-compact-icon-hover-bg-color', 'rgb(236, 240, 244)');
      element.style.setProperty('--protorec-compact-icon-hover-border', 'rgb(205, 210, 216)');
      element.style.setProperty('--protorec-compact-icon-hover-border-style', 'solid');
      element.style.setProperty('--protorec-compact-icon-hover-border-width', '1px');
      element.style.setProperty('--protorec-compact-icon-hover-shadow', 'rgb(236, 240, 244) 0 0 0 999px inset');
      return;
    }

    if (/hammer-btn-link/i.test(className) && /hammer-btn-variant-link/i.test(className)) {
      element.style.setProperty('--protorec-compact-icon-hover-bg', 'rgba(26, 114, 255, 0.12)');
      element.style.setProperty('--protorec-compact-icon-hover-bg-image', 'none');
      element.style.setProperty('--protorec-compact-icon-hover-bg-color', 'rgba(26, 114, 255, 0.12)');
      element.style.setProperty('--protorec-compact-icon-hover-border', 'transparent');
      element.style.setProperty('--protorec-compact-icon-hover-border-style', 'solid');
      element.style.setProperty('--protorec-compact-icon-hover-border-width', '1px');
      element.style.setProperty('--protorec-compact-icon-hover-shadow', 'rgba(26, 114, 255, 0.12) 0 0 0 999px inset');
      return;
    }

    element.style.setProperty('--protorec-compact-icon-hover-bg', 'rgb(242, 245, 248)');
    element.style.setProperty('--protorec-compact-icon-hover-bg-image', 'none');
    element.style.setProperty('--protorec-compact-icon-hover-bg-color', 'rgb(242, 245, 248)');
    element.style.setProperty('--protorec-compact-icon-hover-border', 'transparent');
    element.style.setProperty('--protorec-compact-icon-hover-border-style', 'solid');
    element.style.setProperty('--protorec-compact-icon-hover-border-width', '1px');
    element.style.setProperty('--protorec-compact-icon-hover-shadow', 'rgb(242, 245, 248) 0 0 0 999px inset');
  }

  function setCompactIconHoverState(element, isActive) {
    if (!(element instanceof HTMLElement)) {
      return;
    }

    rememberInlineStyleSnapshot(element, 'CompactIconHover', [
      'background',
      'background-image',
      'background-color',
      'border',
      'border-color',
      'border-style',
      'border-width',
      'border-radius',
      'box-shadow'
    ]);

    if (!isActive) {
      restoreInlineStyleSnapshot(element, 'CompactIconHover');
      return;
    }

    const className = typeof element.className === 'string' ? element.className : '';
    setImportantStyleProperty(element, 'border-radius', '8px');

    if (/hammer-btn-primary/i.test(className) && /hammer-btn-variant-solid/i.test(className)) {
      setImportantStyleProperty(element, 'background', 'linear-gradient(153.02deg, #4291ff, #15d1d0)');
      setImportantStyleProperty(element, 'background-image', 'linear-gradient(153.02deg, #4291ff, #15d1d0)');
      setImportantStyleProperty(element, 'border', 'none');
      setImportantStyleProperty(element, 'border-width', '0');
      setImportantStyleProperty(element, 'border-style', 'none');
      setImportantStyleProperty(element, 'border-color', 'transparent');
      setImportantStyleProperty(element, 'box-shadow', 'none');
      return;
    }

    if (/hammer-btn-default/i.test(className) && /hammer-btn-variant-outlined/i.test(className)) {
      setImportantStyleProperty(element, 'background', 'rgb(236, 240, 244)');
      setImportantStyleProperty(element, 'background-image', 'none');
      setImportantStyleProperty(element, 'background-color', 'rgb(236, 240, 244)');
      setImportantStyleProperty(element, 'border-color', 'rgb(205, 210, 216)');
      setImportantStyleProperty(element, 'box-shadow', 'rgb(236, 240, 244) 0 0 0 999px inset');
      return;
    }

    if (/hammer-btn-link/i.test(className) && /hammer-btn-variant-link/i.test(className)) {
      setImportantStyleProperty(element, 'background', 'rgba(26, 114, 255, 0.12)');
      setImportantStyleProperty(element, 'background-image', 'none');
      setImportantStyleProperty(element, 'background-color', 'rgba(26, 114, 255, 0.12)');
      setImportantStyleProperty(element, 'box-shadow', 'rgba(26, 114, 255, 0.12) 0 0 0 999px inset');
      return;
    }

    setImportantStyleProperty(element, 'background', 'rgb(242, 245, 248)');
    setImportantStyleProperty(element, 'background-image', 'none');
    setImportantStyleProperty(element, 'background-color', 'rgb(242, 245, 248)');
    setImportantStyleProperty(element, 'box-shadow', 'rgb(242, 245, 248) 0 0 0 999px inset');
  }

  function normalizeVerticalFeedCarousels() {
    unique(toArray(document.querySelectorAll('.hammer-carousel-vertical, .slick-slider.slick-vertical, .slick-vertical'))).forEach((root) => {
      if (!(root instanceof HTMLElement) || !isVisible(root)) {
        return;
      }

      const list = root.querySelector('.slick-list');
      const track = root.querySelector('.slick-track');
      if (!(list instanceof HTMLElement) || !(track instanceof HTMLElement)) {
        return;
      }

      const slides = unique([
        ...toArray(track.children),
        ...toArray(track.querySelectorAll('.slick-slide'))
      ]).filter((child) => child instanceof HTMLElement && child.classList.contains('slick-slide') && child.closest('.slick-track') === track);
      if (slides.length < 3) {
        return;
      }

      const listHeight = list.clientHeight || list.getBoundingClientRect().height;
      if (listHeight < 120) {
        return;
      }

      const computedTrackStyle = window.getComputedStyle(track);
      const trackTranslateY = parseTranslateYValue(computedTrackStyle.transform || track.style.transform);
      const trackHeight = Math.max(track.scrollHeight || 0, track.getBoundingClientRect().height || 0, parsePixelValue(track.style.height || ''));
      const allSlidesHidden = slides.every((slide) => slide.getAttribute('aria-hidden') === 'true');
      const hasSuspiciousCapturedState = Math.abs(trackTranslateY) > listHeight * 1.5
        || trackHeight > listHeight * 4
        || allSlidesHidden;

      if (!hasSuspiciousCapturedState) {
        return;
      }

      const anchorSlide = slides.find((slide) => !slide.classList.contains('slick-cloned')) || slides[0];
      const anchorIndex = Math.max(0, slides.indexOf(anchorSlide));
      const anchorOffset = Math.max(0, Math.round(anchorSlide.offsetTop || 0));
      const anchorHeight = Math.max(
        1,
        Math.round(anchorSlide.getBoundingClientRect().height || parsePixelValue(anchorSlide.style.height || '') || 48)
      );
      const visibleCount = Math.max(1, Math.min(slides.length, Math.ceil(listHeight / anchorHeight) + 1));

      track.style.transition = 'none';
      track.style.transform = 'translate3d(0px, -' + String(anchorOffset) + 'px, 0px)';
      track.style.height = 'auto';

      slides.forEach((slide, index) => {
        const isActive = index >= anchorIndex && index < anchorIndex + visibleCount;
        slide.classList.toggle('slick-active', isActive);
        slide.classList.toggle('slick-current', index === anchorIndex);
        slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      });
    });
  }

  function normalizeCompactIconHoverTargets() {
    ensureCompactIconHoverStyle();

    unique(toArray(document.querySelectorAll(
      'button, a, [role="button"], .hammer-btn, [class*="supplier-tag-button"], [class*="icon-button"]'
    )).filter((element) => {
      if (!(element instanceof HTMLElement) || !isVisible(element)) {
        return false;
      }

      const rect = element.getBoundingClientRect();
      if (rect.width < 20 || rect.width > 36 || rect.height < 20 || rect.height > 36) {
        return false;
      }

      if (getNormalizedText(element)) {
        return false;
      }

      if (!element.querySelector('img, svg')) {
        return false;
      }

      const className = typeof element.className === 'string' ? element.className : '';
      return /(hammer-btn|supplier-tag-button|icon)/i.test(className);
    })).forEach((element) => {
      element.setAttribute('data-protorec-compact-icon-hover', 'true');
      applyCompactIconHoverTokens(element);

      if (!markBound(element, 'CompactIconHoverState')) {
        element.addEventListener('mouseenter', () => {
          setCompactIconHoverState(element, true);
        });
        element.addEventListener('mouseleave', () => {
          setCompactIconHoverState(element, false);
        });
        element.addEventListener('focus', () => {
          setCompactIconHoverState(element, true);
        });
        element.addEventListener('blur', () => {
          setCompactIconHoverState(element, false);
        });
      }
    });
  }

  function boot(options = {}) {
    const isMutationPass = options && options.isMutation === true;

    hydrateBrokenImages();
    releaseInteractiveInlineStyles();
    if (ENABLE_COMPACT_ACTION_HOVER_NEUTRALIZATION && !isMutationPass) {
      neutralizeCompactActionHoverSurfaces();
    }
    hydrateReactNativeLazyImages();
    normalizeAbsoluteAnchorLayouts();
    if (ENABLE_RUNTIME_AFFIX_NORMALIZATION && !isMutationPass) {
      normalizeCapturedAffixStates();
    }
    collectGroups().forEach(bindGroup);
    bindDropdowns();
    bindCarousels();
    bindSelects();
    bindCollapse();
    bindModals();
    bindInputs();
    if (!isMutationPass) {
      restoreScrollSnapshots();
      if (ENABLE_RUNTIME_AFFIX_NORMALIZATION) {
        normalizeCapturedAffixStates();
      }
      if (ENABLE_RUNTIME_LAYOUT_SNAPSHOT_REPLAY) {
        restoreLayoutSnapshots();
      }
      restoreInteractionStates();
    }
    bindTableScrollSync();
    normalizeTableCellWidthConstraints();
    normalizeOverflowingStickyMediaCells();
    normalizeFramedMediaElements();
    normalizeTableBadgeSurfaces();
    normalizeClippedTableBadgeGroups();
    normalizeVerticalFeedCarousels();
    normalizeCompactIconHoverTargets();
    if (ENABLE_HEURISTIC_LAYOUT_FIXES) {
      runHeuristicLayoutFixes();
      if (!isMutationPass) {
        scheduleDeferredHeuristicLayoutPass();
      }
    }
    bindGlobalDismiss();
    hydrateBrokenImages();
  }

  let observer = null;

  function watchDomChanges() {
    if (observer) {
      return;
    }

    let timer = null;
    observer = new MutationObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        boot({ isMutation: true });
      }, 16);
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.__restorePreviewRuntime = {
    boot
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      boot();
      watchDomChanges();
    }, { once: true });
  } else {
    boot();
    watchDomChanges();
  }
})();
  `.trim();
}

function pickPreviewHead($, pageTitle, restoreSlug, combinedCss, rootSnapshotCss = '', pseudoElementCss = '') {
  const headNodes = [];

  $('head').children().each((_, element) => {
    const $element = $(element);
    const tagName = element.tagName?.toLowerCase();

    if (tagName === 'script') {
      return;
    }

    if (tagName === 'title') {
      return;
    }

    if (tagName === 'style' || tagName === 'link') {
      return;
    }

    if (tagName === 'meta') {
      headNodes.push($.html($element));
    }
  });

  if (combinedCss.trim()) {
    headNodes.push(`<style>${combinedCss}</style>`);
  }

  if (rootSnapshotCss.trim()) {
    headNodes.push(`<style>${rootSnapshotCss}</style>`);
  }

  if (pseudoElementCss.trim()) {
    headNodes.push(`<style>${pseudoElementCss}</style>`);
  }

  headNodes.push(`<style>
    [data-restore-absolute-anchor='true'] {
      color: inherit !important;
    }

    .css-9pa8cd[src] { 
      opacity: 1 !important; 
      visibility: visible !important; 
      z-index: 1 !important;
    }

    [data-restore-rn-image-hydrated='true'] {
      isolation: isolate !important;
    }

    html body [data-protorec-compact-icon-hover='true']:hover,
    html body [data-protorec-compact-icon-hover='true']:focus-visible,
    [data-protorec-compact-icon-hover='true']:hover,
    [data-protorec-compact-icon-hover='true']:focus-visible {
      background: rgb(242, 245, 248) !important;
      box-shadow: rgb(242, 245, 248) 0 0 0 999px inset !important;
      border-radius: 8px !important;
    }

    html body [data-protorec-compact-icon-hover='true'].hammer-btn-primary.hammer-btn-variant-solid:not(.hammer-btn-background-ghost):not(:disabled):not(.hammer-btn-disabled):hover,
    html body [data-protorec-compact-icon-hover='true'].hammer-btn-primary.hammer-btn-variant-solid:not(.hammer-btn-background-ghost):not(:disabled):not(.hammer-btn-disabled):focus-visible,
    [data-protorec-compact-icon-hover='true'].hammer-btn-primary.hammer-btn-variant-solid:hover,
    [data-protorec-compact-icon-hover='true'].hammer-btn-primary.hammer-btn-variant-solid:focus-visible {
      background: linear-gradient(153.02deg, #4291ff, #15d1d0) !important;
      border: none !important;
      box-shadow: none !important;
    }

    html body [data-protorec-compact-icon-hover='true'].hammer-btn-default.hammer-btn-variant-outlined:not(:disabled):not(.hammer-btn-disabled):hover,
    html body [data-protorec-compact-icon-hover='true'].hammer-btn-default.hammer-btn-variant-outlined:not(:disabled):not(.hammer-btn-disabled):focus-visible {
      background: rgb(236, 240, 244) !important;
      box-shadow: rgb(236, 240, 244) 0 0 0 999px inset !important;
      border-color: rgb(205, 210, 216) !important;
    }

    html body [data-protorec-compact-icon-hover='true'].hammer-btn-link.hammer-btn-variant-link:not(:disabled):not(.hammer-btn-disabled):hover,
    html body [data-protorec-compact-icon-hover='true'].hammer-btn-link.hammer-btn-variant-link:not(:disabled):not(.hammer-btn-disabled):focus-visible {
      background: rgba(26, 114, 255, 0.12) !important;
      box-shadow: rgba(26, 114, 255, 0.12) 0 0 0 999px inset !important;
    }
  </style>`);

  return [
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${pageTitle}</title>`,
    `<base href="${buildPublicRestoreBase(restoreSlug)}/" />`,
    ...headNodes
  ].join('\n');
}

function rewriteBodyReferences($, assetMap, options = {}) {
  $('[src]').each((_, element) => {
    const $element = $(element);
    const tagName = $element[0]?.tagName?.toLowerCase();
    const src = $element.attr('src');
    const failedAssetUrls = options.failedAssetUrls instanceof Set ? options.failedAssetUrls : null;
    if (tagName === 'img' && failedAssetUrls?.size) {
      const failedAbsoluteUrl = normalizeAbsoluteReference(src, options.pageOrigin);
      if (failedAbsoluteUrl && failedAssetUrls.has(failedAbsoluteUrl)) {
        $element.attr('src', createFallbackAssetProxyUrl(src, options.pageOrigin));
        return;
      }
    }
    $element.attr('src', localizeReference(src, assetMap, options));
  });

  $('[poster]').each((_, element) => {
    const $element = $(element);
    $element.attr('poster', localizeReference($element.attr('poster'), assetMap, options));
  });

  $('[srcset]').each((_, element) => {
    const $element = $(element);
    $element.attr('srcset', rewriteSrcset($element.attr('srcset'), assetMap, options));
  });

  $('[href]').each((_, element) => {
    const $element = $(element);
    const href = $element.attr('href');

    if ($element[0].tagName?.toLowerCase() === 'a') {
      if (!href || href.startsWith('#') || /^([a-z]+:)?\/\//i.test(href)) {
        return;
      }
    }

    $element.attr('href', localizeReference(href, assetMap));
  });

  $('[style*="url("]').each((_, element) => {
    const $element = $(element);
    $element.attr('style', rewriteStyleValue($element.attr('style'), assetMap));
  });
}

function prepareLocalizedHtmlForGeneration({
  html = '',
  metadata = {},
  assetMap = new Map(),
  options = {}
}) {
  const $ = cheerio.load(String(html || ''), { decodeEntities: false });
  const maxCapturedScrollTop = resolveMaxCapturedScrollTop(metadata.scrollContainerSnapshots);

  rewriteBodyReferences($, assetMap, options);
  applySampledContentSnapshots($, metadata.sampledContentSnapshots, assetMap, options);
  applyBrowserAssetSnapshots($, metadata.browserAssetSnapshots);
  applyFallbackNodeSnapshots($, metadata.fallbackNodeSnapshots, assetMap, options);
  applyLayoutNodeSnapshots($, metadata.layoutNodeSnapshots);
  applyScrollContainerSnapshots($, metadata.scrollContainerSnapshots);
  applyStaticLayoutFallbacks($);
  applyInteractionStateSnapshots($, metadata.interactionStateSnapshots, assetMap, options);
  normalizeCapturedAffixSnapshots($, {
    maxCapturedScrollTop,
    viewportWidth: Number(metadata?.viewport?.width) || 0,
    viewportHeight: Number(metadata?.viewport?.height) || 0
  });

  return {
    html: $.html() || String(html || ''),
    maxCapturedScrollTop
  };
}

async function restoreCapturedPage({
  captureDir,
  restoreRoot,
  relativeCapturePath,
  restoreSlug,
  restoreRelativeDir = restoreSlug,
  pageTitle,
  pageUrl = '',
  assetReport = {},
  metadata = {},
  signal,
  onProgress
}) {
  throwIfAborted(signal);
  onProgress?.({
    phase: 'restore',
    message: '正在整理还原页面...',
    currentItemTitle: '读取本地化页面',
    detail: '正在载入同步后的 HTML 内容'
  });
  const localizedHtmlPath = path.join(captureDir, 'index.html');
  const localizedHtml = await fs.readFile(localizedHtmlPath, 'utf8');
  const restoreDir = path.join(restoreRoot, restoreRelativeDir);
  const restoreFilePath = path.join(restoreDir, 'index.tsx');

  await fs.ensureDir(restoreDir);
  onProgress?.({
    phase: 'restore',
    message: '正在整理还原页面...',
    currentItemTitle: '迁移图片与字体',
    detail: '正在整理还原资源目录'
  });
  const assetMap = await migrateCaptureAssets(captureDir, restoreDir, { signal, onProgress });
  const publicAssetMap = buildPublicAssetMap(assetMap, toPosixPath(restoreRelativeDir));
  const pageOrigin = metadata.url || pageUrl;
  const failedAssetUrls = new Set(
    Array.isArray(assetReport.failedUrls)
      ? assetReport.failedUrls
          .map((value) => normalizeAbsoluteReference(value, pageOrigin))
          .filter(Boolean)
      : []
  );
  const rewriteOptions = {
    enableProxyFallback: true,
    pageOrigin,
    failedAssetUrls
  };
  throwIfAborted(signal);
  const $ = cheerio.load(localizedHtml, { decodeEntities: false });
  const fallbackBodyAttributes = $('body').get(0)?.attribs || {};
  const preparedHtml = prepareLocalizedHtmlForGeneration({
    html: localizedHtml,
    metadata,
    assetMap: publicAssetMap,
    options: rewriteOptions
  });
  const prepared$ = cheerio.load(preparedHtml.html, { decodeEntities: false });
  $('html').replaceWith(prepared$('html'));
  const maxCapturedScrollTop = preparedHtml.maxCapturedScrollTop;
  if (maxCapturedScrollTop > 0) {
    fallbackBodyAttributes['data-restore-captured-max-scroll-top'] = String(Math.round(maxCapturedScrollTop));
  }
  normalizeCapturedAffixSnapshots($, {
    maxCapturedScrollTop,
    viewportWidth: Number(metadata.viewport?.width),
    viewportHeight: Number(metadata.viewport?.height)
  });
  applyInteractionStateSnapshots($, metadata.interactionStateSnapshots, assetMap);
  const normalizedPseudoElementSnapshots = ensurePlaceholderSnapshots($, metadata.pseudoElementSnapshots);

  const normalizedTitle = pageTitle || $('title').text() || path.basename(relativeCapturePath);
  onProgress?.({
    phase: 'restore',
    message: '正在整理还原页面...',
    currentItemTitle: '整理预览结构',
    detail: '正在合并样式与预览头信息'
  });
  const combinedCss = await collectStyles($, captureDir, publicAssetMap, metadata);
  const rootSnapshotCss = buildRootSnapshotCss(metadata.rootSnapshot, publicAssetMap);
  const pseudoElementCss = buildPseudoElementSnapshotCss(normalizedPseudoElementSnapshots, publicAssetMap);
  const bodyWrapperAttributes = buildBodyWrapperAttributes(metadata.rootSnapshot, fallbackBodyAttributes);
  sanitizePreviewDocument($);
  const previewHead = pickPreviewHead($, normalizedTitle, toPosixPath(restoreRelativeDir), combinedCss, rootSnapshotCss, pseudoElementCss);
  const bodyMarkup = $('body').html() || $.root().html() || '';
  const previewScript = createPreviewScript();

  throwIfAborted(signal);
  onProgress?.({
    phase: 'restore',
    message: '正在整理还原页面...',
    currentItemTitle: '写入还原页面',
    detail: '正在生成 index.tsx 文件'
  });
  await fs.writeFile(
    restoreFilePath,
    `import React from 'react';

type RestoredPageComponent = React.FC & {
  previewHead?: string;
  previewScript?: string;
  previewBodyMarkup?: string;
  restoreSlug?: string;
  previewBodyClassName?: string;
  previewBodyStyle?: string;
  previewBodyDataAttributes?: string;
};

const previewHead = ${JSON.stringify(previewHead)};
const previewScript = ${JSON.stringify(previewScript)};
const bodyMarkup = ${JSON.stringify(bodyMarkup)};
const restoreSlug = ${JSON.stringify(restoreSlug)};
const previewBodyClassName = ${JSON.stringify(bodyWrapperAttributes.className)};
const previewBodyStyle = ${JSON.stringify(bodyWrapperAttributes.style)};
const previewBodyDataAttributes = ${JSON.stringify(bodyWrapperAttributes.dataAttributes)};

const RestoredPage: RestoredPageComponent = () => {
  React.useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const parserContainer = document.createElement('div');
    parserContainer.innerHTML = previewHead;
    const parsedTitle = parserContainer.querySelector('title')?.textContent?.trim() || '';
    const styleContents = Array.from(parserContainer.querySelectorAll('style'))
      .map((node) => node.textContent || '')
      .filter(Boolean);
    const previousTitle = document.title;
    const previousBodyClassName = document.body.className;
    const previousBodyStyle = document.body.getAttribute('style') || '';
    const previousBodyDataAttributes = Array.from(document.body.attributes)
      .filter((attribute) => attribute.name.startsWith('data-'))
      .map((attribute) => [attribute.name, attribute.value]);
    const desiredBodyAttributesContainer = document.createElement('div');
    desiredBodyAttributesContainer.innerHTML = '<body' + previewBodyDataAttributes + '></body>';
    const desiredBodyAttributes = Array.from(desiredBodyAttributesContainer.querySelector('body')?.attributes || [])
      .filter((attribute) => attribute.name.startsWith('data-'));
    const injectedStyleNodes = styleContents.map((cssText, index) => {
      const styleNode = document.createElement('style');
      styleNode.setAttribute('data-proto-capture-restore-style', restoreSlug + '-' + index);
      styleNode.textContent = cssText;
      document.head.appendChild(styleNode);
      return styleNode;
    });

    if (parsedTitle) {
      document.title = parsedTitle;
    }

    if (previewBodyClassName) {
      document.body.className = previewBodyClassName;
    }

    if (previewBodyStyle) {
      document.body.setAttribute('style', previewBodyStyle);
    } else {
      document.body.removeAttribute('style');
    }

    Array.from(document.body.attributes)
      .filter((attribute) => attribute.name.startsWith('data-'))
      .forEach((attribute) => {
        document.body.removeAttribute(attribute.name);
      });

    desiredBodyAttributes.forEach((attribute) => {
      document.body.setAttribute(attribute.name, attribute.value);
    });

    const scriptNode = document.createElement('script');
    scriptNode.setAttribute('data-proto-capture-restore-script', restoreSlug);
    scriptNode.textContent = previewScript;
    document.body.appendChild(scriptNode);

    return () => {
      injectedStyleNodes.forEach((styleNode) => styleNode.remove());
      scriptNode.remove();
      document.title = previousTitle;
      document.body.className = previousBodyClassName;
      if (previousBodyStyle) {
        document.body.setAttribute('style', previousBodyStyle);
      } else {
        document.body.removeAttribute('style');
      }
      Array.from(document.body.attributes)
        .filter((attribute) => attribute.name.startsWith('data-'))
        .forEach((attribute) => {
          document.body.removeAttribute(attribute.name);
        });
      previousBodyDataAttributes.forEach(([name, value]) => {
        document.body.setAttribute(name, value);
      });
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: bodyMarkup }} />;
};

RestoredPage.previewHead = previewHead;
RestoredPage.previewScript = previewScript;
RestoredPage.previewBodyMarkup = bodyMarkup;
RestoredPage.restoreSlug = restoreSlug;
RestoredPage.previewBodyClassName = previewBodyClassName;
RestoredPage.previewBodyStyle = previewBodyStyle;
RestoredPage.previewBodyDataAttributes = previewBodyDataAttributes;
RestoredPage.displayName = 'RestoredPage';

export default RestoredPage;
`
  );

  return {
    restoreDir,
    restoreFilePath,
    restoreSlug,
    restoreRelativeDir: toPosixPath(restoreRelativeDir),
    componentRelativePath: toPosixPath(path.relative(path.dirname(restoreRoot), restoreFilePath)),
    relativeCapturePath: toPosixPath(relativeCapturePath),
    assetDirectories: {
      fonts: toPosixPath(path.relative(restoreRoot, path.join(restoreDir, 'assets', 'fonts'))),
      images: toPosixPath(path.relative(restoreRoot, path.join(restoreDir, 'assets', 'images')))
    }
  };
}

module.exports = {
  restoreCapturedPage,
  createPreviewScript,
  prepareLocalizedHtmlForGeneration
};
