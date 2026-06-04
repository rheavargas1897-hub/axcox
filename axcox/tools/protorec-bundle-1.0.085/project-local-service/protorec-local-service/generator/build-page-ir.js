const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');

const { GENERATION_MODE, PREVIEW_STATIC_ROOT, PROTOCOL_VERSION } = require('./config');
const { prepareLocalizedHtmlForGeneration } = require('../scripts/restore');
const { classifyPage } = require('./classify-page');
const { evaluateQAGate, resolveReadyState } = require('./protocol');
const {
  buildPageSlug,
  createUniqueNameFactory,
  getSectionComponentName,
  getSectionTitle,
  sanitizeReadableSegment,
  sanitizeSegment
} = require('./naming');

const FONT_EXTENSIONS = new Set(['.woff', '.woff2', '.ttf', '.otf', '.eot']);
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.bmp', '.avif']);
const CONTEXT_ATTRIBUTE_ALLOWLIST = new Set(['id', 'class', 'style', 'role', 'dir', 'lang', 'title', 'tabindex', 'hidden']);
const NOISE_SELECTORS = [
  'script',
  'noscript',
  '#__caoliao-browser-ext-root',
  '#__caoliao-browser-ext',
  'browser-mcp-container',
  '#c4g-content-root',
  '.c4g-widget'
].join(',');

function normalizePathForUrl(filePath) {
  return filePath.split(path.sep).join('/');
}

function normalizeAbsoluteReference(value, origin) {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return '';
  }

  try {
    return new URL(trimmed, origin || 'http://localhost').href;
  } catch (_error) {
    return '';
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getAssetCategory(fileName) {
  const extension = path.extname(String(fileName || '')).toLowerCase();
  if (FONT_EXTENSIONS.has(extension)) {
    return 'fonts';
  }

  if (IMAGE_EXTENSIONS.has(extension)) {
    return 'images';
  }

  return 'images';
}

function stripProtoAttributes(markup) {
  return String(markup || '')
    .replace(/\sdata-protorec-section="[^"]*"/g, '')
    .replace(/\sdata-protorec-role="[^"]*"/g, '');
}

function normalizeTextSnippet(value, maxLength = 80) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function buildPreviewBodyDataAttributes(attributes = {}) {
  return Object.entries(attributes)
    .filter(([name]) => name.startsWith('data-'))
    .map(([name, value]) => ` ${name}="${escapeHtml(value)}"`)
    .join('');
}

function toNumericScore(value, fallback = 0.55) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const normalized = parsed > 1 ? parsed / 100 : parsed;
  return Math.max(0, Math.min(1, Number(normalized.toFixed(4))));
}

function buildGenerationAssetMap(assets = []) {
  const assetMap = new Map();

  assets.forEach((asset) => {
    if (!asset?.fileName || !asset?.relativeAssetPath) {
      return;
    }

    assetMap.set(asset.fileName, asset.relativeAssetPath);
  });

  return assetMap;
}

async function collectCaptureAssets(captureDir, pageAssetSlug, pageDirRelativePath, assetOwnerRelativePath) {
  const assetRoot = path.join(captureDir, 'temp_assets');
  if (!(await fs.pathExists(assetRoot))) {
    return [];
  }

  const assetBaseRelativePath = assetOwnerRelativePath || pageDirRelativePath;
  const relativeToAssetsRoot = normalizePathForUrl(
    path.relative(
      pageDirRelativePath,
      path.join(assetBaseRelativePath, 'assets')
    )
  ) || '.';
  const assetFiles = await fs.readdir(assetRoot);

  return assetFiles
    .sort()
    .map((fileName) => {
      const category = getAssetCategory(fileName);
      const relativeAssetPath = normalizePathForUrl(path.join(relativeToAssetsRoot, category, fileName));
      const previewUrl = `${PREVIEW_STATIC_ROOT}/${normalizePathForUrl(path.join(assetBaseRelativePath, 'assets', category, fileName))}`;

      return {
        fileName,
        category,
        sourcePath: path.join(assetRoot, fileName),
        relativeAssetPath,
        previewUrl
      };
    });
}

function buildAssetReferenceMaps(assets = []) {
  const localAssetReferenceMap = new Map();
  const previewAssetReferenceMap = new Map();
  const byFileName = new Map();

  assets.forEach((asset) => {
    const localCandidates = [
      `./temp_assets/${asset.fileName}`,
      `temp_assets/${asset.fileName}`,
      `/temp_assets/${asset.fileName}`
    ];

    localCandidates.forEach((candidate) => {
      localAssetReferenceMap.set(candidate, asset.relativeAssetPath);
      previewAssetReferenceMap.set(candidate, asset.previewUrl);
    });

    byFileName.set(asset.fileName, asset);
  });

  return {
    byFileName,
    localAssetReferenceMap,
    previewAssetReferenceMap
  };
}

function resolveAssetReference(value, explicitMap, byFileName) {
  const rawValue = String(value || '').trim();
  if (!rawValue) {
    return rawValue;
  }

  if (rawValue.startsWith('data:') || rawValue.startsWith('blob:') || rawValue.startsWith('#') || /^(?:[a-z]+:)?\/\//i.test(rawValue)) {
    return rawValue;
  }

  const withoutHash = rawValue.split('#')[0];
  const [pathPart, queryPart] = withoutHash.split('?');
  const explicitMatch = explicitMap.get(pathPart) || explicitMap.get(rawValue);
  if (explicitMatch) {
    return queryPart ? `${explicitMatch}?${queryPart}` : explicitMatch;
  }

  const fileName = path.basename(pathPart);
  const fileAsset = byFileName.get(fileName);
  if (!fileAsset) {
    return rawValue;
  }

  const explicitPath = explicitMap.get(`./temp_assets/${fileAsset.fileName}`) || explicitMap.get(`temp_assets/${fileAsset.fileName}`);
  return queryPart && explicitPath ? `${explicitPath}?${queryPart}` : (explicitPath || rawValue);
}

function rewriteStyleValue(styleValue, explicitMap, byFileName) {
  if (!styleValue || !String(styleValue).includes('url(')) {
    return styleValue;
  }

  return String(styleValue).replace(/url\((['"]?)([^'")]+)\1\)/g, (match, quote, assetUrl) => {
    const nextUrl = resolveAssetReference(assetUrl, explicitMap, byFileName);
    if (!nextUrl || nextUrl === assetUrl) {
      return match;
    }

    return `url(${quote}${nextUrl}${quote})`;
  });
}

function rewriteSrcsetValue(srcsetValue, explicitMap, byFileName) {
  if (!srcsetValue) {
    return srcsetValue;
  }

  return String(srcsetValue)
    .split(',')
    .map((entry) => {
      const trimmed = entry.trim();
      if (!trimmed) {
        return trimmed;
      }

      const parts = trimmed.split(/\s+/);
      const assetUrl = parts.shift();
      const descriptor = parts.join(' ');
      const nextUrl = resolveAssetReference(assetUrl, explicitMap, byFileName);
      return [nextUrl || assetUrl, descriptor].filter(Boolean).join(' ');
    })
    .join(', ');
}

function rewriteMarkupAssets(markup, explicitMap, byFileName) {
  if (!markup) {
    return markup;
  }

  const $ = cheerio.load(`<div id="__protorec-root">${markup}</div>`, { decodeEntities: false });
  const assetAttributes = ['src', 'poster', 'href', 'data-src', 'data-original', 'data-url', 'data-image', 'data-bg', 'data-background-image'];

  assetAttributes.forEach((attributeName) => {
    $(`[${attributeName}]`).each((_, element) => {
      const $element = $(element);
      const currentValue = $element.attr(attributeName);
      const nextValue = resolveAssetReference(currentValue, explicitMap, byFileName);
      if (nextValue && nextValue !== currentValue) {
        $element.attr(attributeName, nextValue);
      }
    });
  });

  $('[srcset]').each((_, element) => {
    const $element = $(element);
    $element.attr('srcset', rewriteSrcsetValue($element.attr('srcset'), explicitMap, byFileName));
  });

  $('[style*="url("]').each((_, element) => {
    const $element = $(element);
    $element.attr('style', rewriteStyleValue($element.attr('style'), explicitMap, byFileName));
  });

  $('style').each((_, element) => {
    const $element = $(element);
    $element.html(rewriteStyleValue($element.html() || '', explicitMap, byFileName));
  });

  return $('#__protorec-root').html() || markup;
}

async function collectStyleText({ $, captureDir, metadata = {}, explicitMap, byFileName }) {
  const cssBlocks = [];
  const seenBlocks = new Set();

  const pushCssBlock = (cssText) => {
    const normalized = String(cssText || '').trim();
    if (!normalized) {
      return;
    }

    const rewritten = rewriteStyleValue(normalized, explicitMap, byFileName);
    if (seenBlocks.has(rewritten)) {
      return;
    }

    seenBlocks.add(rewritten);
    cssBlocks.push(rewritten);
  };

  $('style').each((_, element) => {
    pushCssBlock($(element).html() || '');
  });

  const stylesheetLinks = $('link[rel~="stylesheet"]')
    .toArray()
    .map((element) => $(element).attr('href'))
    .filter(Boolean);

  for (const stylesheetHref of stylesheetLinks) {
    const fileName = path.basename(String(stylesheetHref).split('?')[0]);
    const localStylePath = path.join(captureDir, 'temp_styles', fileName);
    if (!(await fs.pathExists(localStylePath))) {
      continue;
    }

    pushCssBlock(await fs.readFile(localStylePath, 'utf8'));
  }

  const runtimeStyleTexts = Array.isArray(metadata.runtimeStyleTexts) ? metadata.runtimeStyleTexts : [];
  runtimeStyleTexts.forEach(pushCssBlock);

  return cssBlocks.join('\n\n');
}

const GENERIC_NAME_TOKENS = new Set([
  'app',
  'body',
  'box',
  'container',
  'content',
  'default',
  'inner',
  'index',
  'item',
  'layout',
  'main',
  'module',
  'page',
  'panel',
  'react',
  'region',
  'root',
  'select',
  'section',
  'shell',
  'slot',
  'view',
  'wrapper'
]);
const STRONG_SECTION_KINDS = new Set([
  'top-bar',
  'sidebar',
  'footer',
  'hero',
  'tabs',
  'form',
  'table',
  'detail-panel',
  'notice',
  'review-feed',
  'product-grid',
  'feature-list',
  'gallery',
  'promo-strip',
  'floating-layer'
]);
const TAB_CONTAINER_SELECTOR = '.ant-tabs, .el-tabs, .hammer-tabs, [role="tablist"], [data-tab-container], [class*="tabs"]';
const TAB_SELECTOR = '.ant-tabs-tab, .el-tabs__item, .hammer-tabs-tab, [role="tab"], [data-tab]';
const PANEL_SELECTOR = '.ant-tabs-tabpane, .el-tab-pane, .tab-pane, .hammer-tabs-tabpane, [role="tabpanel"], [data-tab-panel]';
const ANCHOR_TAB_LABEL_PATTERN = /^(详情|图文详情|商品详情|参数|规格参数|评价(?:\([^)]+\))?)$/;
const CAROUSEL_CONTAINER_SELECTOR = '.swiper, .swiper-container, #swiper, [id="swiper"], [id*="swiper"], .slick-slider, .ant-carousel, [class*="carousel"], [class*="swiper"], [data-carousel], [data-swiper]';
const CAROUSEL_SLIDE_SELECTOR = '.swiper-slide, .slick-slide, .ant-carousel .slick-slide, .r-cpa5s6, [class*="slide"], [data-slide]';
const CAROUSEL_CONTROL_SELECTOR = '.slick-dots li, .swiper-pagination-bullet, .swiper-button-next, .swiper-button-prev, [data-slide-to], [aria-label*="slide"], [data-carousel-control]';
const DISMISSIBLE_LAYER_SELECTOR = '[role="dialog"], [class*="cookie"], [class*="banner"], [class*="modal"], [class*="dialog"], [class*="drawer"], [class*="toast"], [class*="popup"]';
const DISMISS_BUTTON_SELECTOR = 'button, [role="button"], [aria-label*="close"], [class*="close"], [class*="dismiss"], [data-close]';
const DROPDOWN_GROUP_SELECTOR = '.dropdown, [class*="dropdown"], [data-dropdown], [aria-haspopup="true"]';
const DROPDOWN_MENU_SELECTOR = '[role="menu"], [role="listbox"], ul, .menu, .dropdown-menu, .select-dropdown';
const BLOCKABLE_SECTION_KINDS = new Set([
  'top-bar',
  'main-content',
  'detail-panel',
  'notice',
  'review-feed',
  'hero',
  'product-grid',
  'feature-list',
  'gallery',
  'promo-strip',
  'content-grid',
  'footer'
]);
const BLOCK_SECTION_PROMOTION_KINDS = new Set([
  'top-bar',
  'hero-media',
  'product-detail-hero',
  'promo-banner',
  'icon-grid',
  'featured-shelf',
  'product-shelf',
  'recommend-shelf',
  'detail-anchor-bar',
  'detail-content',
  'spec-list',
  'legal-notice',
  'review-feed',
  'service-strip',
  'footer',
  'floating-layer',
  'media-cluster'
]);
const PRIORITIZED_STABLE_DESCENDANT_PATTERN = /(navigationlayout|product[_-]content[_-]box|product[_-]gallery[_-]box|prd-gallery|prd-detail|servicecomponent|service-prd-list|rndiyweb|proddetail|prd-reviews(?:-tl)?|vbiz-footer|product-installment-menu)/;

function getInlineStyle($element) {
  return String($element.attr('style') || '').toLowerCase();
}

function isHiddenUtilityNode($, $element, stats = getElementStats($, $element)) {
  const inlineStyle = getInlineStyle($element);
  const identity = getElementIdentity($element);

  if (!/display\s*:\s*none/.test(inlineStyle) && !/visibility\s*:\s*hidden/.test(inlineStyle)) {
    return false;
  }

  if (/background-image\s*:/.test(inlineStyle)) {
    return false;
  }

  return !stats.textLength
    && !stats.imageCount
    && !stats.inputCount
    && stats.childCount <= 1
    && !/(dialog|modal|cookie|banner|drawer|toast|popup)/.test(identity);
}

function isPlaceholderShell($, $element, stats = getElementStats($, $element)) {
  const tagName = getElementTagName($element.get(0));
  const inlineStyle = getInlineStyle($element);
  const identity = getElementIdentity($element);

  if (/background-image\s*:/.test(inlineStyle)) {
    return false;
  }

  if (stats.textLength || stats.imageCount || stats.inputCount || stats.headingCount) {
    return false;
  }

  if (isHiddenUtilityNode($, $element, stats)) {
    return true;
  }

  if (stats.childCount === 0 && stats.htmlLength <= 96) {
    return true;
  }

  if (
    stats.childCount <= 1
    && stats.htmlLength <= 180
    && /(root|container|wrapper|mount|region|portal|select|slot|placeholder)/.test(identity)
    && ['div', 'section', 'aside', 'nav', 'header', 'footer'].includes(tagName)
  ) {
    return true;
  }

  return false;
}

function isLikelySpacer($, $element, stats = getElementStats($, $element)) {
  const inlineStyle = getInlineStyle($element);
  const identity = getElementIdentity($element);

  if (isPlaceholderShell($, $element, stats)) {
    return true;
  }

  if (
    !stats.textLength
    && !stats.imageCount
    && !stats.inputCount
    && stats.childCount === 0
    && stats.htmlLength <= 96
  ) {
    return true;
  }

  if (
    !stats.textLength
    && !stats.imageCount
    && stats.childCount <= 1
    && stats.htmlLength <= 180
    && /(margin-top|margin-bottom|padding-top|padding-bottom|height\s*:)/.test(inlineStyle)
  ) {
    return true;
  }

  return /(spacer|divider|separator|gap)/.test(identity)
    && !stats.textLength
    && !stats.imageCount;
}

function getElementIdentity($element) {
  return [
    String($element.attr('id') || ''),
    String($element.attr('class') || ''),
    String($element.attr('role') || ''),
    String($element.attr('data-testid') || ''),
    String($element.attr('aria-label') || ''),
    String($element.attr('name') || '')
  ].join(' ').toLowerCase();
}

function getElementTagName(element) {
  return String(element?.tagName || element?.name || '').toLowerCase();
}

function getElementStats($, $element) {
  const htmlLength = String($.html($element) || '').trim().length;
  const textContent = normalizeTextSnippet($element.text() || '', 240);

  return {
    htmlLength,
    textLength: textContent.length,
    textSnippet: textContent,
    childCount: $element.children().length,
    headingCount: $element.find('h1, h2, h3, h4, [role="heading"]').length,
    imageCount: $element.find('img, picture, svg, canvas, video').length,
    inputCount: $element.find('input, select, textarea, [role="textbox"], [contenteditable="true"]').length,
    tabCount: $element.find(TAB_SELECTOR).length
  };
}

function isMeaningfulElement($, element) {
  if (!element || element.type !== 'tag') {
    return false;
  }

  const $element = $(element);
  const tagName = getElementTagName(element);
  if (!tagName || ['meta', 'title', 'style', 'link', 'script', 'noscript'].includes(tagName)) {
    return false;
  }

  const stats = getElementStats($, $element);
  if (isPlaceholderShell($, $element, stats)) {
    return false;
  }

  return Boolean(
    stats.textLength
    || stats.imageCount
    || stats.inputCount
    || stats.headingCount
    || stats.childCount >= 2
    || stats.htmlLength > 320
  );
}

function collectMeaningfulChildren($, $element) {
  return $element
    .children()
    .toArray()
    .filter((element) => isMeaningfulElement($, element))
    .filter((element) => !isLikelySpacer($, $(element)));
}

function normalizeNameCandidate(value) {
  return sanitizeSegment(String(value || '').replace(/([a-z0-9])([A-Z])/g, '$1-$2'));
}

function normalizeCompactText(value) {
  return String(value || '')
    .replace(/\s+/g, '')
    .trim();
}

function isGenericNameToken(value) {
  const normalized = normalizeNameCandidate(value);
  if (!normalized || normalized.length < 3) {
    return true;
  }

  if (/^(react|region|content|page|layout)-/.test(normalized) || /-root$/.test(normalized) && /^(react|region|content|page|layout)/.test(normalized)) {
    return true;
  }

  return normalized
    .split('-')
    .every((segment) => !segment || GENERIC_NAME_TOKENS.has(segment));
}

function looksLikeOverlay($element) {
  const identity = getElementIdentity($element);
  const inlineStyle = String($element.attr('style') || '').toLowerCase();

  return /(cookie|modal|dialog|drawer|popover|tooltip|toast|popup|float|floating)/.test(identity)
    || /position\s*:\s*fixed/.test(inlineStyle)
    || /position\s*:\s*sticky/.test(inlineStyle);
}

function findStableDescendantDescriptor($element) {
  const descendants = $element.find('[id], [data-testid], [aria-label]');
  const maxChecks = Math.min(descendants.length, 120);

  for (let index = 0; index < maxChecks; index += 1) {
    const $descendant = descendants.eq(index);
    const identity = getElementIdentity($descendant);

    if (PRIORITIZED_STABLE_DESCENDANT_PATTERN.test(identity)) {
      return {
        id: String($descendant.attr('id') || ''),
        dataTestId: String($descendant.attr('data-testid') || ''),
        ariaLabel: String($descendant.attr('aria-label') || ''),
        identity
      };
    }
  }

  for (let index = 0; index < maxChecks; index += 1) {
    const $descendant = descendants.eq(index);
    const normalizedId = normalizeNameCandidate($descendant.attr('id'));
    const identity = getElementIdentity($descendant);
    const dataTestId = normalizeNameCandidate($descendant.attr('data-testid'));
    const ariaLabel = normalizeNameCandidate($descendant.attr('aria-label'));

    if (
      (normalizedId && !isGenericNameToken(normalizedId) && !/^\d+$/.test(normalizedId))
      || (dataTestId && !isGenericNameToken(dataTestId))
      || (ariaLabel && !isGenericNameToken(ariaLabel))
      || /(navigationlayout|product-content-box|product-gallery-box|prd-gallery|prd-detail|servicecomponent|service-prd-list|rndiyweb|proddetail|prd-reviews|vbiz-footer)/.test(identity)
    ) {
      return {
        id: String($descendant.attr('id') || ''),
        dataTestId: String($descendant.attr('data-testid') || ''),
        ariaLabel: String($descendant.attr('aria-label') || ''),
        identity
      };
    }
  }

  return null;
}

function inferSectionKind($element) {
  const identity = getElementIdentity($element);
  const tagName = getElementTagName($element.get(0));
  const stats = {
    childCount: $element.children().length,
    imageCount: $element.find('img, picture, svg, canvas, video').length,
    inputCount: $element.find('input, select, textarea, [role="textbox"], [contenteditable="true"]').length
  };
  const textContent = normalizeTextSnippet($element.text() || '', 120).toLowerCase();

  if (/footer|copyright|warrant|legal/.test(identity)) {
    return 'footer';
  }

  if (looksLikeOverlay($element)) {
    return 'floating-layer';
  }

  if (tagName === 'header' || tagName === 'nav' || /(header|nav|navigation|toolbar|topbar|top-bar|menu-bar|navigationlayout)/.test(identity)) {
    return 'top-bar';
  }

  if (tagName === 'aside' || /(sidebar|sider|aside)/.test(identity)) {
    return 'sidebar';
  }

  if (/(hero|banner|kv|masthead|carousel|swiper|slick)/.test(identity)) {
    return 'hero';
  }

  if (/(tab|tabs)/.test(identity) || $element.find(TAB_SELECTOR).length >= 2) {
    return 'tabs';
  }

  if ((/(product|goods|sku|recommend|floor|card|commodity)/.test(identity) || /新品|热销|推荐|商品/.test(textContent))
    && (stats.imageCount >= 2 || stats.childCount >= 3)) {
    return 'product-grid';
  }

  if (/(service|feature|benefit|advantage)/.test(identity)) {
    return 'feature-list';
  }

  if (/(gallery|album)/.test(identity) && stats.imageCount >= 3) {
    return 'gallery';
  }

  if (/(promo|campaign|activity|sale|coupon)/.test(identity)) {
    return 'promo-strip';
  }

  if ((/(table|list|grid)/.test(identity) || $element.find('table, [role="table"], .ant-table, .el-table').length)
    && stats.childCount >= 2) {
    return 'table';
  }

  if (/(form|filter|search)/.test(identity) || stats.inputCount >= 2) {
    return 'form';
  }

  if (stats.imageCount >= 4 && stats.childCount >= 4) {
    return 'content-grid';
  }

  return 'main-content';
}

function looksLikeGenericWrapper($, $element) {
  const identity = getElementIdentity($element);
  const tagName = getElementTagName($element.get(0));
  const stats = getElementStats($, $element);
  const tokenList = identity
    .split(/\s+/)
    .map(normalizeNameCandidate)
    .filter(Boolean);
  const allGeneric = !tokenList.length
    || tokenList.every((token) => isGenericNameToken(token) || /(root|wrapper|container|layout|shell|inner|content)/.test(token));

  return tagName === 'div'
    && stats.childCount >= 1
    && stats.htmlLength >= 1200
    && allGeneric
    && !STRONG_SECTION_KINDS.has(inferSectionKind($element));
}

function isStrongBoundaryCandidate($, $element, siblingCount = 1) {
  const kind = inferSectionKind($element);
  const stats = getElementStats($, $element);
  const tagName = getElementTagName($element.get(0));

  if (kind === 'floating-layer') {
    return true;
  }

  if (STRONG_SECTION_KINDS.has(kind)) {
    return true;
  }

  if (['header', 'footer', 'main', 'section', 'article', 'aside', 'nav'].includes(tagName) && stats.htmlLength >= 180) {
    return true;
  }

  if (stats.headingCount >= 1 && stats.imageCount >= 1 && stats.htmlLength >= 600) {
    return true;
  }

  if (siblingCount >= 3 && stats.htmlLength >= 1200) {
    return true;
  }

  return false;
}

function dedupeElements(elements = []) {
  const seen = new Set();
  return elements.filter((element) => {
    if (!element || seen.has(element)) {
      return false;
    }

    seen.add(element);
    return true;
  });
}

function collectPromotedChildren($, $element, depth = 0) {
  const directChildren = collectMeaningfulChildren($, $element);
  if (!directChildren.length) {
    return [];
  }

  const strongDirectChildren = directChildren.filter((child) => isStrongBoundaryCandidate($, $(child), directChildren.length));
  if (strongDirectChildren.length >= 2) {
    return strongDirectChildren;
  }

  const nestedStrongChildren = [];
  directChildren.forEach((child) => {
    const $child = $(child);
    if (!looksLikeGenericWrapper($, $child) && depth > 0) {
      return;
    }

    const grandChildren = collectMeaningfulChildren($, $child);
    const strongGrandChildren = grandChildren.filter((grandChild) => isStrongBoundaryCandidate($, $(grandChild), grandChildren.length));
    if (strongGrandChildren.length >= 2) {
      nestedStrongChildren.push(...strongGrandChildren);
    }
  });

  if (nestedStrongChildren.length >= 2) {
    return nestedStrongChildren;
  }

  if (looksLikeGenericWrapper($, $element) && directChildren.length >= 2) {
    return directChildren.filter((child) => getElementStats($, $(child)).htmlLength >= 600);
  }

  return [];
}

function collectSectionElements($) {
  let candidates = collectMeaningfulChildren($, $('body'));

  if (!candidates.length) {
    return [];
  }

  for (let depth = 0; depth < 4; depth += 1) {
    const nextCandidates = [];
    let changed = false;

    candidates.forEach((element) => {
      const $element = $(element);
      const promotedChildren = collectPromotedChildren($, $element, depth);

      if (promotedChildren.length >= 2 && (looksLikeGenericWrapper($, $element) || candidates.length <= 3 || getElementStats($, $element).htmlLength >= 6000)) {
        nextCandidates.push(...promotedChildren);
        changed = true;
        return;
      }

      nextCandidates.push(element);
    });

    candidates = dedupeElements(nextCandidates);
    if (!changed) {
      break;
    }
  }

  return candidates.filter((element) => isMeaningfulElement($, element));
}

function pickSectionBaseName($element, sectionKind) {
  const rawCandidates = [
    $element.attr('id'),
    $element.attr('data-testid'),
    $element.attr('aria-label'),
    ...String($element.attr('class') || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 8),
    $element.find('h1, h2, h3, h4, [role="heading"]').first().text()
  ];

  const normalizedCandidate = rawCandidates
    .map((value) => normalizeNameCandidate(value))
    .find((value) => value && !isGenericNameToken(value));

  if (normalizedCandidate) {
    if (/-root$/.test(normalizedCandidate) && !/(navigation|cookie|footer|sidebar)/.test(normalizedCandidate)) {
      return sectionKind || normalizedCandidate;
    }

    return normalizedCandidate;
  }

  return sectionKind || 'section';
}

function collectTopLevelMatches($, rootSelector, matchSelector) {
  return $(rootSelector)
    .find(matchSelector)
    .toArray()
    .filter((element) => $(element).parents(matchSelector).length === 0);
}

function collectAnchorTabItems($, $container) {
  const seenLabels = new Set();

  return $container
    .find('div, span, a, button, [role="button"], [tabindex]')
    .toArray()
    .filter((element) => {
      const $element = $(element);
      const label = normalizeCompactText($element.text() || '');
      if (!ANCHOR_TAB_LABEL_PATTERN.test(label) || seenLabels.has(label)) {
        return false;
      }

      const nestedMatchCount = $element
        .find('div, span, a, button, [role="button"], [tabindex]')
        .toArray()
        .filter((child) => ANCHOR_TAB_LABEL_PATTERN.test(normalizeCompactText($(child).text() || '')))
        .length;
      if (nestedMatchCount > 0) {
        return false;
      }

      seenLabels.add(label);
      return true;
    })
    .slice(0, 5);
}

function collectTabDescriptors($, $root, sectionId, getUniqueInteractionId) {
  const descriptors = [];
  const tabContainers = collectTopLevelMatches($, '#__protorec-interaction-root', TAB_CONTAINER_SELECTOR);

  tabContainers.forEach((containerElement) => {
    const $container = $(containerElement);
    const tabs = $container.find(TAB_SELECTOR)
      .toArray()
      .filter((element) => {
        const $element = $(element);
        if (!$element.text().trim()) {
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
    const panels = $container.find(PANEL_SELECTOR)
      .toArray()
      .filter((element) => $(element).parents(PANEL_SELECTOR).length === 0);

    if (tabs.length < 2 || !panels.length) {
      return;
    }

    const interactionId = getUniqueInteractionId(`${sectionId}-tabs`, 'tabs');
    const defaultIndex = Math.max(0, tabs.findIndex((element, index) => {
      const $element = $(element);
      const panel = panels[index];
      const panelStyle = panel ? String($(panel).attr('style') || '') : '';

      return $element.attr('aria-selected') === 'true'
        || /active|selected|current|is-active/.test(String($element.attr('class') || ''))
        || /display\s*:\s*none/.test(panelStyle) === false;
    }));

    $container.attr('data-protorec-interaction-id', interactionId);
    $container.attr('data-protorec-interaction-kind', 'tabs');
    tabs.forEach((element, index) => {
      $(element).attr('data-protorec-tab-index', String(index));
      $(element).attr('data-protorec-interaction-id', interactionId);
      if (index === defaultIndex) {
        $(element).attr('data-protorec-tab-active', 'true');
      }
    });
    panels.forEach((element, index) => {
      $(element).attr('data-protorec-panel-index', String(index));
      $(element).attr('data-protorec-interaction-id', interactionId);
      if (index === defaultIndex) {
        $(element).attr('data-protorec-panel-active', 'true');
      }
    });

    descriptors.push({
      id: interactionId,
      kind: 'tabs',
      sectionId,
      label: `Tabs (${tabs.length})`,
      confidence: 0.78,
      itemCount: tabs.length,
      defaultIndex
    });
  });

  const anchorCandidates = $('#__protorec-interaction-root')
    .find('div, nav, section')
    .toArray()
    .filter((element) => {
      const $container = $(element);
      const compactText = normalizeCompactText($container.text() || '');
      if (!/详情.*参数.*评价/.test(compactText) || compactText.length > 80) {
        return false;
      }

      const items = collectAnchorTabItems($, $container);
      return items.length >= 2;
    });
  const anchorContainers = anchorCandidates.filter((element) => {
    return !anchorCandidates.some((other) => other !== element && $(element).find(other).length > 0);
  });

  anchorContainers.forEach((containerElement) => {
    const $container = $(containerElement);
    const tabs = collectAnchorTabItems($, $container);
    if (tabs.length < 2) {
      return;
    }

    const interactionId = getUniqueInteractionId(`${sectionId}-tabs`, 'tabs');
    const defaultIndex = Math.max(0, tabs.findIndex((element) => {
      const $element = $(element);
      return $element.attr('aria-selected') === 'true'
        || /active|selected|current|is-active/.test(String($element.attr('class') || ''));
    }));

    $container.attr('data-protorec-interaction-id', interactionId);
    $container.attr('data-protorec-interaction-kind', 'tabs');
    tabs.forEach((element, index) => {
      $(element).attr('data-protorec-tab-index', String(index));
      $(element).attr('data-protorec-interaction-id', interactionId);
      if (index === defaultIndex) {
        $(element).attr('data-protorec-tab-active', 'true');
      }
    });

    descriptors.push({
      id: interactionId,
      kind: 'tabs',
      sectionId,
      label: `Tabs (${tabs.length})`,
      confidence: 0.66,
      itemCount: tabs.length,
      defaultIndex
    });
  });

  return descriptors;
}

function looksLikeCloseButton($element) {
  const identity = getElementIdentity($element);
  const textContent = normalizeTextSnippet($element.text() || '', 30).toLowerCase();

  return /(close|dismiss|cancel|icon-close|btn-close|modal-close)/.test(identity)
    || ['x', '×'].includes(textContent)
    || !textContent;
}

function collectDismissibleDescriptors($, sectionId, getUniqueInteractionId) {
  const descriptors = [];
  const layers = collectTopLevelMatches($, '#__protorec-interaction-root', DISMISSIBLE_LAYER_SELECTOR);

  layers.forEach((element) => {
    const $layer = $(element);
    const buttons = $layer.find(DISMISS_BUTTON_SELECTOR)
      .toArray()
      .filter((button) => looksLikeCloseButton($(button)));

    if (!buttons.length) {
      return;
    }

    const interactionId = getUniqueInteractionId(`${sectionId}-dismiss`, 'dismiss');
    $layer.attr('data-protorec-interaction-id', interactionId);
    $layer.attr('data-protorec-interaction-kind', 'dismissible');
    buttons.slice(0, 4).forEach((button) => {
      $(button).attr('data-protorec-dismiss-trigger', interactionId);
    });

    descriptors.push({
      id: interactionId,
      kind: 'dismissible',
      sectionId,
      label: 'Dismissible Layer',
      confidence: 0.68,
      itemCount: buttons.length
    });
  });

  return descriptors;
}

function collectCarouselDescriptors($, sectionId, getUniqueInteractionId) {
  const descriptors = [];
  const groups = collectTopLevelMatches($, '#__protorec-interaction-root', CAROUSEL_CONTAINER_SELECTOR);

  groups.forEach((element) => {
    const $group = $(element);
    const slides = $group.find(CAROUSEL_SLIDE_SELECTOR)
      .toArray()
      .filter((slide) => isMeaningfulElement($, slide));

    if (slides.length < 2) {
      return;
    }

    const interactionId = getUniqueInteractionId(`${sectionId}-carousel`, 'carousel');
    $group.attr('data-protorec-interaction-id', interactionId);
    $group.attr('data-protorec-interaction-kind', 'carousel');

    slides.forEach((slide, index) => {
      $(slide).attr('data-protorec-slide-index', String(index));
      $(slide).attr('data-protorec-interaction-id', interactionId);
      if (index === 0) {
        $(slide).attr('data-protorec-slide-active', 'true');
      }
    });

    const controls = $group.find(CAROUSEL_CONTROL_SELECTOR).toArray();
    controls.forEach((control, index) => {
      const $control = $(control);
      const identity = getElementIdentity($control);
      $control.attr('data-protorec-interaction-id', interactionId);

      if (/prev|left/.test(identity)) {
        $control.attr('data-protorec-carousel-prev', 'true');
        return;
      }

      if (/next|right/.test(identity)) {
        $control.attr('data-protorec-carousel-next', 'true');
        return;
      }

      $control.attr('data-protorec-slide-target', String(index % slides.length));
    });

    descriptors.push({
      id: interactionId,
      kind: 'carousel',
      sectionId,
      label: `Carousel (${slides.length})`,
      confidence: 0.72,
      itemCount: slides.length
    });
  });

  return descriptors;
}

function collectDropdownDescriptors($, sectionId, getUniqueInteractionId) {
  const descriptors = [];
  const groups = collectTopLevelMatches($, '#__protorec-interaction-root', DROPDOWN_GROUP_SELECTOR);

  groups.forEach((element) => {
    const $group = $(element);
    const trigger = $group.is('[aria-haspopup="true"]')
      ? $group
      : $group.find('button, a, [role="button"], [aria-haspopup="true"]').first();
    const menu = $group.find(DROPDOWN_MENU_SELECTOR).first();

    if (!trigger.length || !menu.length) {
      return;
    }

    const interactionId = getUniqueInteractionId(`${sectionId}-dropdown`, 'dropdown');
    $group.attr('data-protorec-interaction-id', interactionId);
    $group.attr('data-protorec-interaction-kind', 'dropdown');
    trigger.attr('data-protorec-dropdown-trigger', interactionId);
    menu.attr('data-protorec-dropdown-menu', interactionId);

    descriptors.push({
      id: interactionId,
      kind: 'dropdown',
      sectionId,
      label: 'Dropdown',
      confidence: 0.64,
      itemCount: menu.children().length || 1
    });
  });

  return descriptors;
}

function annotateSectionMarkup(markup, sectionId, getUniqueInteractionId) {
  const $ = cheerio.load(`<div id="__protorec-interaction-root">${markup}</div>`, { decodeEntities: false });
  const descriptors = [
    ...collectTabDescriptors($, $('#__protorec-interaction-root'), sectionId, getUniqueInteractionId),
    ...collectCarouselDescriptors($, sectionId, getUniqueInteractionId),
    ...collectDismissibleDescriptors($, sectionId, getUniqueInteractionId),
    ...collectDropdownDescriptors($, sectionId, getUniqueInteractionId)
  ];

  return {
    markup: $('#__protorec-interaction-root').html() || markup,
    descriptors
  };
}

function getSectionShellTag(sectionKind) {
  switch (sectionKind) {
    case 'top-bar':
      return 'header';
    case 'footer':
      return 'footer';
    case 'sidebar':
      return 'aside';
    default:
      return 'section';
  }
}

function resolveSectionRenderMode(sectionKind, stats, interactionCount, blockCount = 0) {
  if (blockCount >= 2) {
    return 'component-blocks';
  }

  if (stats.htmlLength >= 180000) {
    return 'fallback-body-fragment';
  }

  if (STRONG_SECTION_KINDS.has(sectionKind) || interactionCount > 0) {
    return 'component-fragment';
  }

  if (sectionKind === 'main-content' && stats.htmlLength >= 80000) {
    return 'fallback-body-fragment';
  }

  return 'component-fragment';
}

function resolveSectionConfidence(sectionKind, stats, interactionCount, blockCount = 0) {
  const baseline = {
    'top-bar': 0.8,
    sidebar: 0.76,
    footer: 0.82,
    hero: 0.78,
    tabs: 0.78,
    form: 0.74,
    table: 0.74,
    'detail-panel': 0.74,
    notice: 0.78,
    'review-feed': 0.72,
    'product-grid': 0.72,
    'feature-list': 0.72,
    gallery: 0.7,
    'promo-strip': 0.68,
    'content-grid': 0.66,
    'floating-layer': 0.64,
    'main-content': 0.62
  }[sectionKind] || 0.6;

  const headingBoost = stats.headingCount ? 0.03 : 0;
  const interactionBoost = interactionCount ? 0.04 : 0;
  const blockBoost = blockCount >= 2 ? Math.min(0.08, 0.04 + (blockCount * 0.004)) : 0;
  const oversizePenalty = stats.htmlLength >= 120000 ? 0.1 : stats.htmlLength >= 60000 ? 0.05 : 0;

  return Number(Math.max(0.42, Math.min(0.92, baseline + headingBoost + interactionBoost + blockBoost - oversizePenalty)).toFixed(2));
}

function buildSectionSummary($element, sectionKind, stats) {
  const headingText = normalizeTextSnippet($element.find('h1, h2, h3, h4, [role="heading"]').first().text() || '', 80);
  const summary = headingText || stats.textSnippet || getSectionTitle(sectionKind);
  return summary || getSectionTitle(sectionKind);
}

function getBlockTitle(blockKind) {
  return {
    'top-bar': 'Top Bar',
    'hero-media': 'Hero Media',
    'product-detail-hero': 'Product Detail Hero',
    'promo-banner': 'Promo Banner',
    'icon-grid': 'Icon Grid',
    'featured-shelf': 'Featured Shelf',
    'product-shelf': 'Product Shelf',
    'recommend-shelf': 'Recommend Shelf',
    'detail-anchor-bar': 'Detail Anchor Bar',
    'detail-content': 'Detail Content',
    'spec-list': 'Spec List',
    'legal-notice': 'Legal Notice',
    'review-feed': 'Review Feed',
    'service-strip': 'Service Strip',
    footer: 'Footer',
    'floating-layer': 'Floating Layer',
    'media-cluster': 'Media Cluster',
    'content-block': 'Content Block'
  }[blockKind] || 'Content Block';
}

function hasStableBlockIdentity($element) {
  const descendant = findStableDescendantDescriptor($element);
  const id = normalizeNameCandidate($element.attr('id') || descendant?.id);
  const identity = [getElementIdentity($element), descendant?.identity || ''].join(' ').trim();

  if (id && !isGenericNameToken(id)) {
    return true;
  }

  return /(navigationlayout|navigation-layout|prod-|icongrid-|icon-grid-|picture-whole-|footer|warrant|copyright|service|benefit)/.test(identity);
}

function inferBlockKind($element) {
  const descendant = findStableDescendantDescriptor($element);
  const identity = [getElementIdentity($element), descendant?.identity || ''].join(' ').trim();
  const stats = {
    childCount: $element.children().length,
    imageCount: $element.find('img, picture, svg, canvas, video').length,
    inputCount: $element.find('input, select, textarea, [role="textbox"], [contenteditable="true"]').length
  };
  const textContent = normalizeTextSnippet($element.text() || '', 160);
  const loweredText = textContent.toLowerCase();
  const compactText = normalizeCompactText(textContent);
  const idCandidate = normalizeNameCandidate($element.attr('id') || descendant?.id);

  if (/footer|copyright|warrant|legal|vbiz-footer/.test(identity) || /隐私政策|服务协议|版权所有|备案|友情链接/.test(textContent)) {
    return 'footer';
  }

  if (/详情参数评价/.test(compactText) && /(加入购物车|立即购买)/.test(textContent)) {
    return 'detail-anchor-bar';
  }

  if (/prd-reviews|reviewsscrollviewid|prd-reviews-tl/.test(identity) || /只看当前商品评价|最热门|评价\(/.test(textContent)) {
    return 'review-feed';
  }

  if (/特别提醒|仅作示意|请以实物为准|理论值|实际使用|实时调整和修订/.test(textContent)) {
    return 'legal-notice';
  }

  if (
    /主要参数|规格参数/.test(textContent)
    || (
      /(操作系统|屏幕尺寸|电池容量|机身内存|cpu型号|上市时间|传播名|特色功能)/i.test(textContent)
      && stats.childCount >= 8
    )
  ) {
    return 'spec-list';
  }

  if (/header|nav|navigation|toolbar|topbar|top-bar|menu-bar|navigationlayout/.test(identity)) {
    return 'top-bar';
  }

  if (looksLikeOverlay($element)) {
    return 'floating-layer';
  }

  if (/product[_-]content[_-]box|product[_-]gallery[_-]box|prd[_-]gallery|prd[_-]detail|product-installment-menu/.test(identity)) {
    return 'product-detail-hero';
  }

  if (/rndiyweb|recommenditem/.test(identity) || /搭配推荐|相关好物|看了又看|为您推荐/.test(textContent)) {
    return 'recommend-shelf';
  }

  if (/proddetail/.test(identity) || /richtextcontent/.test(loweredText)) {
    return 'detail-content';
  }

  if (/picture-whole|hero|banner|kv|masthead/.test(identity) || /^picture-whole-\d+$/.test(idCandidate)) {
    if (/服务|权益/.test(textContent)) {
      return 'service-strip';
    }

    return (stats.imageCount >= 3 || stats.htmlLength >= 5000)
      ? 'hero-media'
      : 'promo-banner';
  }

  if (/icon\s*grid|icongrid|feature|benefit/.test(identity) || (stats.imageCount >= 8 && stats.childCount >= 2 && textContent.length <= 120)) {
    return 'icon-grid';
  }

  if (
    /service|support|benefit|warrant/.test(identity)
    || /服务与权益|品质保证|免运费|官方售后|全国联保/.test(textContent)
  ) {
    return 'service-strip';
  }

  if (
    /(product|goods|sku|recommend|floor|card|commodity|prod-)/.test(identity)
    || ((/更多|立即购买|¥/.test(textContent) || /buy|price/.test(loweredText)) && stats.imageCount >= 3)
  ) {
    if (/甄选|推荐|精选|新品|热销/.test(textContent) && !/更多/.test(textContent)) {
      return 'featured-shelf';
    }

    return 'product-shelf';
  }

  if (stats.imageCount >= 4 && stats.childCount >= 3) {
    return 'media-cluster';
  }

  return 'content-block';
}

function isStrongBlockCandidate($, $element, siblingCount = 1) {
  const blockKind = inferBlockKind($element);
  const stats = getElementStats($, $element);

  if (['top-bar', 'hero-media', 'product-detail-hero', 'promo-banner', 'icon-grid', 'featured-shelf', 'product-shelf', 'recommend-shelf', 'detail-anchor-bar', 'detail-content', 'spec-list', 'legal-notice', 'review-feed', 'service-strip', 'footer', 'floating-layer'].includes(blockKind)) {
    return true;
  }

  if (hasStableBlockIdentity($element) && stats.htmlLength >= 900) {
    return true;
  }

  if (stats.imageCount >= 2 && stats.htmlLength >= 1400) {
    return true;
  }

  if (siblingCount >= 4 && stats.htmlLength >= 1800) {
    return true;
  }

  return false;
}

function pickDominantChild($, children = []) {
  return children.reduce((largest, child) => {
    if (!largest) {
      return child;
    }

    const childLength = getElementStats($, $(child)).htmlLength;
    const currentLargestLength = getElementStats($, $(largest)).htmlLength;
    return childLength > currentLargestLength ? child : largest;
  }, null);
}

function descendToBlockContainer($, $root) {
  let $current = $root;

  for (let depth = 0; depth < 8; depth += 1) {
    const currentStats = getElementStats($, $current);
    const directChildren = collectMeaningfulChildren($, $current);

    if (!directChildren.length) {
      break;
    }

    const strongDirectChildren = directChildren.filter((child) => isStrongBlockCandidate($, $(child), directChildren.length));
    if (strongDirectChildren.length >= 2) {
      return {
        $container: $current,
        candidateChildren: strongDirectChildren
      };
    }

    if (directChildren.length === 1 && (looksLikeGenericWrapper($, $current) || currentStats.htmlLength >= 3000)) {
      $current = $(directChildren[0]);
      continue;
    }

    const dominantChild = pickDominantChild($, directChildren);
    if (dominantChild && looksLikeGenericWrapper($, $current)) {
      const dominantStats = getElementStats($, $(dominantChild));
      const dominantRatio = dominantStats.htmlLength / Math.max(currentStats.htmlLength, 1);
      if (dominantRatio >= 0.82) {
        $current = $(dominantChild);
        continue;
      }
    }

    return {
      $container: $current,
      candidateChildren: directChildren
    };
  }

  return {
    $container: $current,
    candidateChildren: collectMeaningfulChildren($, $current)
  };
}

function shouldExtractSectionBlocks(sectionKind, stats) {
  return stats.htmlLength >= 18000
    || (BLOCKABLE_SECTION_KINDS.has(sectionKind) && stats.htmlLength >= 12000)
    || (stats.childCount >= 8 && stats.htmlLength >= 8000);
}

function pickBlockBaseName($element, blockKind) {
  const descendant = findStableDescendantDescriptor($element);
  const normalizedId = normalizeNameCandidate($element.attr('id') || descendant?.id);
  const rawCandidates = [
    descendant?.dataTestId,
    descendant?.ariaLabel,
    $element.attr('data-testid'),
    $element.attr('aria-label'),
    ...String($element.attr('class') || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 6),
    $element.find('h1, h2, h3, h4, [role="heading"]').first().text()
  ];

  if (/^navigation-layout/.test(normalizedId) || /^navigationlayout/.test(normalizedId)) {
    return 'top-bar';
  }

  if (/^icon-grid-\d+/.test(normalizedId) || /^icongrid-\d+/.test(normalizedId)) {
    return 'icon-grid';
  }

  if (/^picture-whole-\d+/.test(normalizedId) || /^prod-\d+/.test(normalizedId)) {
    return blockKind;
  }

  if (normalizedId && !isGenericNameToken(normalizedId) && !/\d{5,}/.test(normalizedId)) {
    return normalizedId;
  }

  const normalizedCandidate = rawCandidates
    .map((value) => normalizeNameCandidate(value))
    .find((value) => value
      && !isGenericNameToken(value)
      && !/\d{5,}/.test(value)
      && !/^(css|r)-[a-z0-9-]+$/.test(value));

  return normalizedCandidate || blockKind || 'content-block';
}

function buildBlockSummary($element, blockKind, stats) {
  const headingText = normalizeTextSnippet($element.find('h1, h2, h3, h4, [role="heading"]').first().text() || '', 80);
  return headingText || stats.textSnippet || getBlockTitle(blockKind);
}

function resolveBlockConfidence(blockKind, stats, interactionCount) {
  const baseline = {
    'top-bar': 0.84,
    'hero-media': 0.8,
    'product-detail-hero': 0.82,
    'promo-banner': 0.76,
    'icon-grid': 0.8,
    'featured-shelf': 0.8,
    'product-shelf': 0.78,
    'recommend-shelf': 0.8,
    'detail-anchor-bar': 0.74,
    'detail-content': 0.76,
    'spec-list': 0.78,
    'legal-notice': 0.8,
    'review-feed': 0.76,
    'service-strip': 0.78,
    footer: 0.82,
    'floating-layer': 0.72,
    'media-cluster': 0.72,
    'content-block': 0.68
  }[blockKind] || 0.66;

  const interactionBoost = interactionCount ? 0.04 : 0;
  const oversizePenalty = stats.htmlLength >= 90000 ? 0.08 : stats.htmlLength >= 50000 ? 0.04 : 0;

  return Number(Math.max(0.48, Math.min(0.94, baseline + interactionBoost - oversizePenalty)).toFixed(2));
}

function resolvePromotedSectionKind(blockKind = 'content-block') {
  return {
    'top-bar': 'top-bar',
    'hero-media': 'hero',
    'product-detail-hero': 'detail-panel',
    'promo-banner': 'promo-strip',
    'icon-grid': 'feature-list',
    'featured-shelf': 'product-grid',
    'product-shelf': 'product-grid',
    'recommend-shelf': 'product-grid',
    'detail-anchor-bar': 'tabs',
    'detail-content': 'detail-panel',
    'spec-list': 'detail-panel',
    'legal-notice': 'notice',
    'review-feed': 'review-feed',
    'service-strip': 'feature-list',
    footer: 'footer',
    'floating-layer': 'floating-layer',
    'media-cluster': 'gallery',
    'content-block': 'main-content'
  }[blockKind] || 'main-content';
}

function shouldPromoteBlocksToSections(sectionKind, stats, blocks = []) {
  if (!Array.isArray(blocks) || blocks.length < 4) {
    return false;
  }

  const promotableBlocks = blocks.filter((block) => BLOCK_SECTION_PROMOTION_KINDS.has(block.kind));
  const distinctKinds = new Set(promotableBlocks.map((block) => block.kind));
  const hasMixedStructuralKinds = distinctKinds.has('top-bar')
    || distinctKinds.has('footer')
    || distinctKinds.has('hero-media')
    || distinctKinds.has('promo-banner')
    || distinctKinds.has('product-detail-hero')
    || distinctKinds.has('detail-anchor-bar')
    || distinctKinds.has('review-feed');

  if (Number(stats?.htmlLength || 0) >= 160000 && promotableBlocks.length >= 4) {
    return true;
  }

  return ['main-content', 'product-grid', 'content-grid'].includes(sectionKind)
    && promotableBlocks.length >= 4
    && distinctKinds.size >= 3
    && hasMixedStructuralKinds;
}

function isPromotedBlockSection(section = {}) {
  return section?.diagnostics?.extraction?.reason === 'promoted-from-section-block';
}

function createPromotedSectionsFromBlocks({
  section,
  blocks,
  explicitLocalMap,
  explicitPreviewMap,
  byFileName,
  getUniqueSectionId
}) {
  return blocks.map((block) => {
    const promotedKind = resolvePromotedSectionKind(block.kind);
    const sectionBaseName = block.id || promotedKind || 'section';
    const sectionId = getUniqueSectionId(sectionBaseName, promotedKind || 'section');
    const componentName = `${getSectionComponentName(sectionId)}Section`;
    const $fragment = cheerio.load(`<div id="__protorec-promoted-root">${block.markup}</div>`, { decodeEntities: false });
    let $element = $fragment('#__protorec-promoted-root').children().first();

    if (!$element.length) {
      $element = $fragment('#__protorec-promoted-root');
    }

    const stats = getElementStats($fragment, $element);
    const interactionCount = Array.isArray(block.interactionIds) ? block.interactionIds.length : 0;
    const confidence = resolveSectionConfidence(promotedKind, stats, interactionCount, 0);
    const renderMode = resolveSectionRenderMode(promotedKind, stats, interactionCount, 0);
    const extraction = {
      eligible: true,
      attempted: true,
      status: 'promoted',
      reason: 'promoted-from-section-block',
      parentSectionId: section.id,
      parentSectionKind: section.kind,
      parentComponentName: section.componentName,
      sourceBlockId: block.id,
      sourceBlockKind: block.kind,
      sourceBlockConfidence: Number(block.confidence || 0),
      sourceSelectorHint: block?.diagnostics?.source?.selectorHint || '',
      sourceMatchedRules: block?.diagnostics?.classification?.matchedRules || [],
      sourceHtmlLength: Number(block?.stats?.htmlLength || 0)
    };

    return {
      id: sectionId,
      title: block.title,
      kind: promotedKind,
      confidence,
      summary: block.summary,
      renderMode,
      shellTag: getSectionShellTag(promotedKind),
      markup: stripProtoAttributes(rewriteMarkupAssets(block.markup, explicitLocalMap, byFileName)),
      previewMarkup: stripProtoAttributes(rewriteMarkupAssets(block.previewMarkup || block.markup, explicitPreviewMap, byFileName)),
      blocks: [],
      componentName,
      fileName: `${componentName}.tsx`,
      interactionIds: Array.isArray(block.interactionIds) ? block.interactionIds : [],
      contextWrappers: Array.isArray(block.contextWrappers) ? block.contextWrappers : [],
      diagnostics: createSectionDiagnostics({
        $element,
        sectionId,
        sectionBaseName,
        sectionKind: promotedKind,
        stats,
        renderMode,
        confidence,
        interactionCount,
        blockCount: 0,
        componentName,
        extraction,
        contextWrappers: Array.isArray(block.contextWrappers) ? block.contextWrappers : []
      }),
      stats: {
        htmlLength: stats.htmlLength,
        childCount: stats.childCount,
        imageCount: stats.imageCount,
        blockCount: 0
      }
    };
  });
}

function isAcceptedBlockCandidate($, child, siblingCount = 1) {
  const $child = $(child);
  const childStats = getElementStats($, $child);

  if (isLikelySpacer($, $child, childStats)) {
    return false;
  }

  return isStrongBlockCandidate($, $child, siblingCount)
    || hasStableBlockIdentity($child)
    || childStats.htmlLength >= 2400;
}

function filterAcceptedBlockCandidates($, candidateChildren = []) {
  return dedupeElements(candidateChildren.filter((child) => {
    return isAcceptedBlockCandidate($, child, candidateChildren.length);
  }));
}

function findNestedBlockContainer($, $root, minAcceptedCount = 2) {
  const rootStats = getElementStats($, $root);
  let bestMatch = null;

  $root.find('div, section, article, nav, main, aside').each((_, element) => {
    const $candidate = $(element);
    const candidateStats = getElementStats($, $candidate);
    if (candidateStats.htmlLength < 2400 || candidateStats.htmlLength >= rootStats.htmlLength * 0.995) {
      return;
    }

    const candidateChildren = collectMeaningfulChildren($, $candidate);
    if (candidateChildren.length < minAcceptedCount) {
      return;
    }

    const acceptedCandidates = filterAcceptedBlockCandidates($, candidateChildren);
    if (acceptedCandidates.length < minAcceptedCount) {
      return;
    }

    const totalAcceptedHtml = acceptedCandidates.reduce((total, child) => {
      return total + getElementStats($, $(child)).htmlLength;
    }, 0);
    const htmlCoverage = totalAcceptedHtml / Math.max(candidateStats.htmlLength, 1);
    if (acceptedCandidates.length < 3 && htmlCoverage < 0.35) {
      return;
    }

    const stableIdentityCount = acceptedCandidates.filter((child) => {
      const $child = $(child);
      return hasStableBlockIdentity($child) || normalizeNameCandidate($child.attr('id'));
    }).length;
    const distinctKinds = new Set(acceptedCandidates.map((child) => inferBlockKind($(child)))).size;
    const averageChildHtml = totalAcceptedHtml / Math.max(acceptedCandidates.length, 1);
    if (acceptedCandidates.length >= 8 && averageChildHtml < 2500 && distinctKinds <= 2) {
      return;
    }
    if (acceptedCandidates.length >= 8 && averageChildHtml < 2500 && stableIdentityCount < 2) {
      return;
    }

    const score = (acceptedCandidates.length * 100)
      + (stableIdentityCount * 160)
      + (distinctKinds * 15)
      + Math.round(htmlCoverage * 20)
      + (candidateChildren.length >= 4 ? 10 : 0)
      + Math.round(Math.min(80, averageChildHtml / 1200));

    if (!bestMatch || score > bestMatch.score || (score === bestMatch.score && candidateStats.htmlLength > bestMatch.containerStats.htmlLength)) {
      bestMatch = {
        $container: $candidate,
        candidateChildren,
        acceptedCandidates,
        containerStats: candidateStats,
        htmlCoverage: Number(htmlCoverage.toFixed(4)),
        score
      };
    }
  });

  return bestMatch;
}

function extractSectionBlocks({
  sectionId,
  sectionKind,
  rawMarkup,
  stats,
  explicitLocalMap,
  explicitPreviewMap,
  byFileName,
  getUniqueInteractionId
}) {
  const eligibleForExtraction = shouldExtractSectionBlocks(sectionKind, stats);
  if (!eligibleForExtraction) {
    return {
      blocks: [],
      descriptors: [],
      contextWrappers: [],
      diagnostics: {
        eligible: false,
        attempted: false,
        status: 'skipped',
        reason: 'section-not-eligible-for-block-extraction',
        sectionHtmlLength: Number(stats?.htmlLength || 0),
        sectionChildCount: Number(stats?.childCount || 0),
        container: null,
        containerHtmlLength: 0,
        candidateChildCount: 0,
        acceptedCandidateCount: 0,
        htmlCoverage: 0
      }
    };
  }

  const $ = cheerio.load(`<div id="__protorec-section-root">${rawMarkup}</div>`, { decodeEntities: false });
  let $root = $('#__protorec-section-root').children().first();

  if (!$root.length) {
    $root = $('#__protorec-section-root');
  }

  let { $container, candidateChildren } = descendToBlockContainer($, $root);
  let containerStats = getElementStats($, $container);
  let blockElements = filterAcceptedBlockCandidates($, candidateChildren);
  let nestedContainer = null;

  if (blockElements.length < 2) {
    nestedContainer = findNestedBlockContainer($, $root, 2);
    if (nestedContainer) {
      $container = nestedContainer.$container;
      candidateChildren = nestedContainer.candidateChildren;
      containerStats = nestedContainer.containerStats;
      blockElements = nestedContainer.acceptedCandidates;
    }
  }

  const extractionBaseDiagnostics = {
    eligible: true,
    attempted: true,
    status: 'failed',
    reason: 'insufficient-block-candidates',
    sectionHtmlLength: Number(stats?.htmlLength || 0),
    sectionChildCount: Number(stats?.childCount || 0),
    container: summarizeElementSource($container, containerStats),
    containerHtmlLength: Number(containerStats?.htmlLength || 0),
    candidateChildCount: candidateChildren.length,
    acceptedCandidateCount: 0,
    htmlCoverage: 0
  };
  const sharedContextWrappers = collectContextBridgeWrappers($, $root, $container);

  if (blockElements.length < 2) {
    return {
      blocks: [],
      descriptors: [],
      contextWrappers: [],
      diagnostics: extractionBaseDiagnostics
    };
  }

  const htmlCoverage = blockElements.reduce((total, child) => {
    return total + getElementStats($, $(child)).htmlLength;
  }, 0) / Math.max(containerStats.htmlLength, 1);
  const roundedHtmlCoverage = Number(htmlCoverage.toFixed(4));

  if (blockElements.length < 3 && htmlCoverage < 0.55) {
    return {
      blocks: [],
      descriptors: [],
      contextWrappers: [],
      diagnostics: {
        ...extractionBaseDiagnostics,
        reason: 'insufficient-html-coverage',
        acceptedCandidateCount: blockElements.length,
        htmlCoverage: roundedHtmlCoverage
      }
    };
  }

  const getUniqueBlockId = createUniqueNameFactory();
  const descriptors = [];
  const blocks = blockElements
    .map((child, childIndex) => {
      const $child = $(child);
      const childMarkup = stripProtoAttributes($.html($child) || '');
      if (!childMarkup.trim()) {
        return null;
      }

      const blockStats = getElementStats($, $child);
      const blockKind = inferBlockKind($child);
      const blockId = getUniqueBlockId(pickBlockBaseName($child, blockKind), blockKind || 'content-block');
      const annotatedMarkup = annotateSectionMarkup(childMarkup, `${sectionId}-${blockId}`, getUniqueInteractionId);
      const interactionCount = annotatedMarkup.descriptors.length;
      const confidence = resolveBlockConfidence(blockKind, blockStats, interactionCount);

      descriptors.push(...annotatedMarkup.descriptors);

      return {
        id: blockId,
        sectionId,
        title: getBlockTitle(blockKind),
        kind: blockKind,
        summary: buildBlockSummary($child, blockKind, blockStats),
        confidence,
        renderMode: 'component-fragment',
        markup: stripProtoAttributes(rewriteMarkupAssets(annotatedMarkup.markup, explicitLocalMap, byFileName)),
        previewMarkup: stripProtoAttributes(rewriteMarkupAssets(annotatedMarkup.markup, explicitPreviewMap, byFileName)),
        interactionIds: annotatedMarkup.descriptors.map((descriptor) => descriptor.id),
        contextWrappers: sharedContextWrappers,
        stats: {
          htmlLength: blockStats.htmlLength,
          childCount: blockStats.childCount,
          imageCount: blockStats.imageCount
        },
        diagnostics: createBlockDiagnostics({
          $element: $child,
          sectionId,
          blockId,
          blockKind,
          blockStats,
          confidence,
          interactionCount,
          extraction: {
            status: 'success',
            source: 'section-block-extraction',
            containerSelector: extractionBaseDiagnostics.container.selectorHint,
            candidateIndex: childIndex,
            siblingCount: blockElements.length,
            htmlCoverage: roundedHtmlCoverage,
            containerHtmlLength: Number(containerStats?.htmlLength || 0)
          },
          contextWrappers: sharedContextWrappers
        })
      };
    })
    .filter(Boolean);

  if (blocks.length < 2) {
    return {
      blocks: [],
      descriptors: [],
      contextWrappers: [],
      diagnostics: {
        ...extractionBaseDiagnostics,
        reason: 'insufficient-renderable-blocks',
        acceptedCandidateCount: blocks.length,
        htmlCoverage: roundedHtmlCoverage
      }
    };
  }

  return {
    blocks,
    descriptors,
    contextWrappers: sharedContextWrappers,
    diagnostics: {
      ...extractionBaseDiagnostics,
      status: 'success',
      reason: nestedContainer ? 'nested-container-extracted-blocks' : 'extracted-multiple-blocks',
      nestedSearch: nestedContainer
        ? {
          strategy: 'descendant-container-search',
          score: nestedContainer.score
        }
        : null,
      acceptedCandidateCount: blocks.length,
      htmlCoverage: roundedHtmlCoverage
    }
  };
}

function buildSections({ $, explicitLocalMap, explicitPreviewMap, byFileName }) {
  const sectionElements = collectSectionElements($);
  const getUniqueSectionId = createUniqueNameFactory();
  const getUniqueInteractionId = createUniqueNameFactory();
  const interactions = [];
  const sections = [];

  sectionElements.forEach((element) => {
    const $element = $(element);
    const rawMarkup = $.html($element) || '';
    if (!rawMarkup || !rawMarkup.trim()) {
      return;
    }

    const sectionKind = inferSectionKind($element);
    const stats = getElementStats($, $element);
    const sectionBaseName = pickSectionBaseName($element, sectionKind);
    const sectionId = getUniqueSectionId(sectionBaseName, sectionKind || 'section');
    const baseMarkup = stripProtoAttributes(rawMarkup);
    const ancestorContextWrappers = collectAncestorContextWrappers($, $element);
    const extractedBlocks = extractSectionBlocks({
      sectionId,
      sectionKind,
      rawMarkup: baseMarkup,
      stats,
      explicitLocalMap,
      explicitPreviewMap,
      byFileName,
      getUniqueInteractionId
    });

    if (shouldPromoteBlocksToSections(sectionKind, stats, extractedBlocks.blocks)) {
      const promotedSections = createPromotedSectionsFromBlocks({
        section: {
          id: sectionId,
          kind: sectionKind,
          componentName: `${getSectionComponentName(sectionId)}Section`
        },
        blocks: extractedBlocks.blocks,
        explicitLocalMap,
        explicitPreviewMap,
        byFileName,
        getUniqueSectionId
      });

      extractedBlocks.descriptors.forEach((descriptor) => {
        interactions.push(descriptor);
      });

      sections.push(...promotedSections);
      return;
    }

    let rewrittenMarkup = rewriteMarkupAssets(baseMarkup, explicitLocalMap, byFileName);
    let previewMarkup = rewriteMarkupAssets(baseMarkup, explicitPreviewMap, byFileName);
    let sectionDescriptors = extractedBlocks.descriptors;
    let blocks = extractedBlocks.blocks;
    let contextWrappers = ancestorContextWrappers;

    if (!blocks.length) {
      const annotatedMarkup = annotateSectionMarkup(baseMarkup, sectionId, getUniqueInteractionId);
      rewrittenMarkup = rewriteMarkupAssets(annotatedMarkup.markup, explicitLocalMap, byFileName);
      previewMarkup = rewriteMarkupAssets(annotatedMarkup.markup, explicitPreviewMap, byFileName);
      sectionDescriptors = annotatedMarkup.descriptors;
    } else {
      contextWrappers = dedupeContextWrappers(
        ancestorContextWrappers.concat(
          Array.isArray(extractedBlocks.contextWrappers) ? extractedBlocks.contextWrappers : []
        )
      );
    }

    const confidence = resolveSectionConfidence(sectionKind, stats, sectionDescriptors.length, blocks.length);
    const renderMode = resolveSectionRenderMode(sectionKind, stats, sectionDescriptors.length, blocks.length);
    const componentName = `${getSectionComponentName(sectionId)}Section`;
    const diagnostics = createSectionDiagnostics({
      $element,
      sectionId,
      sectionBaseName,
      sectionKind,
      stats,
      renderMode,
      confidence,
      interactionCount: sectionDescriptors.length,
      blockCount: blocks.length,
      componentName,
      extraction: extractedBlocks.diagnostics,
      contextWrappers
    });

    sectionDescriptors.forEach((descriptor) => {
      interactions.push(descriptor);
    });

    sections.push({
      id: sectionId,
      title: getSectionTitle(sectionKind),
      kind: sectionKind,
      confidence,
      summary: buildSectionSummary($element, sectionKind, stats),
      renderMode,
      shellTag: getSectionShellTag(sectionKind),
      markup: stripProtoAttributes(rewrittenMarkup),
      previewMarkup: stripProtoAttributes(previewMarkup),
      blocks,
      componentName,
      fileName: `${componentName}.tsx`,
      interactionIds: sectionDescriptors.map((descriptor) => descriptor.id),
      contextWrappers,
      diagnostics,
      stats: {
        htmlLength: stats.htmlLength,
        childCount: stats.childCount,
        imageCount: stats.imageCount,
        blockCount: blocks.length
      }
    });
  });

  if (!sections.length) {
    const fallbackMarkup = $('body').html() || '';
    if (fallbackMarkup.trim()) {
      const $body = $('body');
      const fallbackStats = getElementStats($, $body);
      const annotatedFallbackMarkup = annotateSectionMarkup(stripProtoAttributes(fallbackMarkup), 'main-content', getUniqueInteractionId);
      const componentName = 'MainContentSection';
      const confidence = 0.46;
      const renderMode = 'fallback-body-fragment';
      sections.push({
        id: 'main-content',
        title: 'Main Content',
        kind: 'main-content',
        confidence,
        summary: 'Fallback body content',
        renderMode,
        shellTag: 'section',
        markup: stripProtoAttributes(rewriteMarkupAssets(annotatedFallbackMarkup.markup, explicitLocalMap, byFileName)),
        previewMarkup: stripProtoAttributes(rewriteMarkupAssets(annotatedFallbackMarkup.markup, explicitPreviewMap, byFileName)),
        componentName,
        fileName: 'MainContentSection.tsx',
        interactionIds: annotatedFallbackMarkup.descriptors.map((descriptor) => descriptor.id),
        contextWrappers: [],
        diagnostics: createSectionDiagnostics({
          $element: $body,
          sectionId: 'main-content',
          sectionBaseName: 'main-content',
          sectionKind: 'main-content',
          stats: fallbackStats,
          renderMode,
          confidence,
          interactionCount: annotatedFallbackMarkup.descriptors.length,
          blockCount: 0,
          componentName,
          contextWrappers: [],
          extraction: {
            eligible: false,
            attempted: false,
            status: 'fallback',
            reason: 'no-stable-sections-detected',
            sectionHtmlLength: Number(fallbackStats?.htmlLength || 0),
            sectionChildCount: Number(fallbackStats?.childCount || 0),
            container: summarizeElementSource($body, fallbackStats),
            containerHtmlLength: Number(fallbackStats?.htmlLength || 0),
            candidateChildCount: $body.children().length,
            acceptedCandidateCount: 0,
            htmlCoverage: 0
          }
        }),
        stats: {
          htmlLength: fallbackMarkup.length,
          childCount: $('body').children().length,
          imageCount: $('body').find('img, picture, svg, canvas, video').length
        }
      });
      interactions.push(...annotatedFallbackMarkup.descriptors);
    }
  }

  return {
    sections,
    interactions
  };
}

function createViewDefinition({ relativePageDir, pageSlug, pageTitle, metadata = {}, captureVariant = null }) {
  const routeSegments = String(relativePageDir || '').split('/').filter(Boolean);
  const subviewsIndex = routeSegments.indexOf('subviews');
  const baseRouteId = subviewsIndex >= 0
    ? routeSegments.slice(0, subviewsIndex).join('/')
    : relativePageDir;

  if (metadata?.multiTabCapture || captureVariant || subviewsIndex >= 0) {
    const inferredTabNumber = Number.isFinite(Number(captureVariant?.index))
      ? Number(captureVariant.index) + 1
      : Number((routeSegments[subviewsIndex + 1] || '').replace(/[^\d]/g, '')) || 1;

    return {
      baseRouteId: baseRouteId || pageSlug,
      assetSlug: sanitizeSegment((baseRouteId || pageSlug).replace(/[\\/]+/g, '-')) || pageSlug,
      currentRouteId: relativePageDir,
      viewId: `tab-${inferredTabNumber}`,
      viewKind: inferredTabNumber === 1 ? 'root-tab' : 'tab',
      viewLabel: metadata?.activeTab?.label || `Tab ${inferredTabNumber}`,
      viewOrder: inferredTabNumber,
      isSubview: inferredTabNumber > 1,
      defaultViewId: 'tab-1'
    };
  }

  return {
    baseRouteId: relativePageDir,
    assetSlug: sanitizeSegment((relativePageDir || pageSlug).replace(/[\\/]+/g, '-')) || pageSlug,
    currentRouteId: relativePageDir,
    viewId: 'default',
    viewKind: 'page',
    viewLabel: pageTitle || 'Default View',
    viewOrder: 1,
    isSubview: false,
    defaultViewId: 'default'
  };
}

function resolveStyleConfidence(captureQuality = {}, metadata = {}, sourceCssText = '') {
  const captureScore = toNumericScore(captureQuality?.scoreBreakdown?.runtimeStyleScore, 0.52);
  const cssLength = String(sourceCssText || '').trim().length;
  const runtimeStyleTexts = Array.isArray(metadata?.runtimeStyleTexts)
    ? metadata.runtimeStyleTexts.filter((value) => String(value || '').trim())
    : [];
  const runtimeStyleTextLength = runtimeStyleTexts.reduce((total, value) => total + String(value || '').length, 0);
  const stylesheetCoverageScore = cssLength >= 20000
    ? 0.58
    : cssLength >= 12000
      ? 0.54
      : cssLength >= 6000
        ? 0.46
        : 0;
  const runtimeTextCoverageScore = runtimeStyleTextLength >= 6000
    ? 0.56
    : runtimeStyleTextLength >= 2000
      ? 0.5
      : runtimeStyleTextLength >= 500
        ? 0.44
        : 0;

  return Number(Math.max(captureScore, stylesheetCoverageScore, runtimeTextCoverageScore).toFixed(4));
}

function createConfidenceBreakdown(captureQuality = {}, metadata = {}, sections = [], interactions = [], sourceCssText = '') {
  const layout = toNumericScore(captureQuality?.scoreBreakdown?.layoutSnapshotScore, 0.62);
  const styles = resolveStyleConfidence(captureQuality, metadata, sourceCssText);
  const assets = toNumericScore(captureQuality?.scoreBreakdown?.assetScore, 0.7);
  const structuredSectionCount = sections.filter((section) => ['component-fragment', 'component-blocks'].includes(section.renderMode)).length;
  const content = Math.max(0.45, Math.min(0.92, 0.4 + (sections.length * 0.05) + (structuredSectionCount * 0.04)));
  const tabSignal = metadata?.activeTab ? 0.12 : 0;
  const scrollSignal = Array.isArray(metadata?.scrollContainerSnapshots) && metadata.scrollContainerSnapshots.length ? 0.1 : 0;
  const layoutSignal = Array.isArray(metadata?.layoutNodeSnapshots) && metadata.layoutNodeSnapshots.length ? 0.12 : 0;
  const interactionSignal = Math.min(0.18, interactions.length * 0.04);
  const interactionScore = Math.max(0.42, Math.min(0.86, 0.4 + scrollSignal + tabSignal + layoutSignal + interactionSignal));
  const page = Number((
    (layout * 0.28)
    + (styles * 0.2)
    + (assets * 0.18)
    + (content * 0.18)
    + (interactionScore * 0.16)
  ).toFixed(4));

  return {
    page,
    layout,
    styles,
    assets,
    interactions: interactionScore,
    content
  };
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Number(value || 0)));
}

function toPercentRatio(numerator, denominator, fallback = 0) {
  if (!denominator) {
    return fallback;
  }

  return clampPercent((numerator / denominator) * 100);
}

function looksMaintainableName(value) {
  const normalized = normalizeNameCandidate(value);
  if (!normalized) {
    return false;
  }

  if (isGenericNameToken(normalized)) {
    return false;
  }

  if (/^(css|r)-[a-z0-9-]+$/.test(normalized)) {
    return false;
  }

  if (/^(section|content-block|block|item)(-\d+)?$/.test(normalized)) {
    return false;
  }

  return !/^\d+$/.test(normalized);
}

function summarizeElementSource($element, stats = null) {
  const resolvedStats = stats || {
    textSnippet: normalizeTextSnippet($element.text() || '', 120)
  };
  const tagName = getElementTagName($element.get(0)) || 'div';
  const id = String($element.attr('id') || '').trim();
  const className = String($element.attr('class') || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .join(' ');
  const dataTestId = String($element.attr('data-testid') || '').trim();
  const ariaLabel = String($element.attr('aria-label') || '').trim();

  const selectorHint = [
    tagName,
    id ? `#${id}` : '',
    className ? `.${className.split(/\s+/).join('.')}` : ''
  ].filter(Boolean).join('');

  return {
    tagName,
    id,
    className,
    dataTestId,
    ariaLabel,
    selectorHint,
    textSnippet: resolvedStats.textSnippet || ''
  };
}

function pickContextAttributes(attributes = {}) {
  return Object.entries(attributes || {}).reduce((result, [rawName, rawValue]) => {
    const name = String(rawName || '').trim().toLowerCase();
    if (!name || name.startsWith('on') || name.startsWith('data-protorec-')) {
      return result;
    }

    if (
      !CONTEXT_ATTRIBUTE_ALLOWLIST.has(name)
      && !name.startsWith('data-')
      && !name.startsWith('aria-')
    ) {
      return result;
    }

    const value = rawValue === '' ? '' : String(rawValue ?? '');
    if (name === 'class' && !value.trim()) {
      return result;
    }

    result[name] = value;
    return result;
  }, {});
}

function shouldPreserveContextElement($, $element, options = {}) {
  const { force = false } = options;
  const tagName = getElementTagName($element?.get?.(0));
  if (!tagName || ['html', 'body'].includes(tagName)) {
    return false;
  }

  const attrs = pickContextAttributes($element.get(0)?.attribs || {});
  const attrNames = Object.keys(attrs);
  if (!attrNames.length) {
    return false;
  }

  if (force) {
    return true;
  }

  if (attrs.id || attrs.style) {
    return true;
  }

  const classTokens = String(attrs.class || '')
    .split(/\s+/)
    .map(normalizeNameCandidate)
    .filter(Boolean);
  const hasNonGenericClass = classTokens.some((token) => !isGenericNameToken(token));
  if (hasNonGenericClass) {
    return true;
  }

  return attrNames.some((name) => (
    name === 'role'
    || name === 'dir'
    || name === 'lang'
    || name === 'title'
    || name === 'tabindex'
    || name === 'hidden'
    || name.startsWith('data-')
    || name.startsWith('aria-')
  ));
}

function createContextWrapperDescriptor($, $element, options = {}) {
  const { force = false, reason = 'ancestor' } = options;
  if (!shouldPreserveContextElement($, $element, { force })) {
    return null;
  }

  return {
    tagName: getElementTagName($element.get(0)) || 'div',
    attrs: pickContextAttributes($element.get(0)?.attribs || {}),
    selectorHint: summarizeElementSource($element).selectorHint,
    reason
  };
}

function dedupeContextWrappers(wrappers = []) {
  const seen = new Set();
  return wrappers.filter((wrapper) => {
    if (!wrapper) {
      return false;
    }

    const key = `${wrapper.tagName}|${JSON.stringify(wrapper.attrs || {})}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function areContextWrappersEquivalent(left, right) {
  if (!left || !right) {
    return false;
  }

  return String(left.tagName || '') === String(right.tagName || '')
    && JSON.stringify(left.attrs || {}) === JSON.stringify(right.attrs || {});
}

function collectSharedContextWrapperPrefix(sections = []) {
  const wrapperLists = sections
    .map((section) => (Array.isArray(section?.contextWrappers) ? section.contextWrappers : []));

  if (wrapperLists.length < 2 || wrapperLists.some((wrappers) => !wrappers.length)) {
    return [];
  }

  const sharedPrefix = [];
  const maxPrefixLength = Math.min(...wrapperLists.map((wrappers) => wrappers.length));

  for (let index = 0; index < maxPrefixLength; index += 1) {
    const candidate = wrapperLists[0][index];
    const isShared = wrapperLists.every((wrappers) => areContextWrappersEquivalent(candidate, wrappers[index]));
    if (!isShared) {
      break;
    }

    sharedPrefix.push(candidate);
  }

  return sharedPrefix;
}

function optimizeSharedPageContextWrappers(sections = []) {
  const pageContextWrappers = collectSharedContextWrapperPrefix(sections);
  if (!pageContextWrappers.length) {
    return {
      pageContextWrappers: [],
      sections
    };
  }

  return {
    pageContextWrappers,
    sections: sections.map((section) => ({
      ...section,
      contextWrappers: Array.isArray(section.contextWrappers)
        ? section.contextWrappers.slice(pageContextWrappers.length)
        : []
    }))
  };
}

function collectAncestorContextWrappers($, $element, maxDepth = 8) {
  const wrappers = [];
  let current = $element.parent();
  let depth = 0;

  while (current?.length && depth < maxDepth) {
    const tagName = getElementTagName(current.get(0));
    if (!tagName || ['html', 'body'].includes(tagName)) {
      break;
    }

    const wrapper = createContextWrapperDescriptor($, current, {
      reason: 'section-ancestor'
    });
    if (wrapper) {
      wrappers.unshift(wrapper);
    }

    current = current.parent();
    depth += 1;
  }

  return dedupeContextWrappers(wrappers);
}

function collectContextBridgeWrappers($, $ancestor, $descendant) {
  if (!$ancestor?.length || !$descendant?.length) {
    return [];
  }

  const ancestorNode = $ancestor.get(0);
  const chain = [];
  let current = $descendant.get(0);
  let depth = 0;

  while (current && depth < 24) {
    chain.push($(current));
    if (current === ancestorNode) {
      break;
    }
    current = current.parent;
    depth += 1;
  }

  if (!chain.length || chain[chain.length - 1]?.get?.(0) !== ancestorNode) {
    return [];
  }

  return dedupeContextWrappers(
    chain
      .reverse()
      .map(($node, index, nodes) => createContextWrapperDescriptor($, $node, {
        force: index === 0 || index === nodes.length - 1,
        reason: index === 0
          ? 'section-root'
          : (index === nodes.length - 1 ? 'block-container' : 'context-bridge')
      }))
      .filter(Boolean)
  );
}

function buildContextDiagnostics(contextWrappers = [], strategy = 'none') {
  return {
    strategy,
    wrapperCount: Array.isArray(contextWrappers) ? contextWrappers.length : 0,
    wrappers: Array.isArray(contextWrappers) ? contextWrappers : []
  };
}

function collectSectionRuleMatches($element, stats) {
  const identity = getElementIdentity($element);
  const tagName = getElementTagName($element.get(0));
  const textContent = normalizeTextSnippet($element.text() || '', 120).toLowerCase();
  const matches = [];

  if (/footer|copyright|warrant|legal/.test(identity)) {
    matches.push('footer-keywords');
  }
  if (looksLikeOverlay($element)) {
    matches.push('overlay-positioning');
  }
  if (tagName === 'header' || tagName === 'nav' || /(header|nav|navigation|toolbar|topbar|top-bar|menu-bar|navigationlayout)/.test(identity)) {
    matches.push('top-bar-signals');
  }
  if (tagName === 'aside' || /(sidebar|sider|aside)/.test(identity)) {
    matches.push('sidebar-signals');
  }
  if (/(hero|banner|kv|masthead|carousel|swiper|slick)/.test(identity)) {
    matches.push('hero-keywords');
  }
  if (/(tab|tabs)/.test(identity) || $element.find(TAB_SELECTOR).length >= 2) {
    matches.push('tab-signals');
  }
  if ((/(product|goods|sku|recommend|floor|card|commodity)/.test(identity) || /新品|热销|推荐|商品/.test(textContent))
    && (stats.imageCount >= 2 || stats.childCount >= 3)) {
    matches.push('product-density');
  }
  if (/(service|feature|benefit|advantage)/.test(identity)) {
    matches.push('feature-keywords');
  }
  if (/(gallery|album)/.test(identity) && stats.imageCount >= 3) {
    matches.push('gallery-density');
  }
  if (/(promo|campaign|activity|sale|coupon)/.test(identity)) {
    matches.push('promo-keywords');
  }
  if ((/(table|list|grid)/.test(identity) || $element.find('table, [role="table"], .ant-table, .el-table').length)
    && stats.childCount >= 2) {
    matches.push('table-grid-structure');
  }
  if (/(form|filter|search)/.test(identity) || stats.inputCount >= 2) {
    matches.push('form-input-signals');
  }
  if (stats.imageCount >= 4 && stats.childCount >= 4) {
    matches.push('dense-visual-grid');
  }

  return matches;
}

function collectBlockRuleMatches($element, stats, blockKind) {
  const identity = getElementIdentity($element);
  const textContent = normalizeTextSnippet($element.text() || '', 160);
  const matches = [];

  if (blockKind === 'footer' || /footer|copyright|warrant|legal|vbiz-footer/.test(identity)) {
    matches.push('footer-signals');
  }
  if (blockKind === 'top-bar' || /header|nav|navigation|toolbar|topbar|top-bar|menu-bar|navigationlayout/.test(identity)) {
    matches.push('top-bar-signals');
  }
  if (blockKind === 'product-detail-hero' || /product[_-]content[_-]box|product[_-]gallery[_-]box|prd[_-]gallery|prd[_-]detail/.test(identity)) {
    matches.push('product-detail-signals');
  }
  if (blockKind === 'floating-layer' || looksLikeOverlay($element)) {
    matches.push('overlay-signals');
  }
  if (blockKind === 'icon-grid' || /icon\s*grid|icongrid|feature|benefit/.test(identity)) {
    matches.push('icon-grid-signals');
  }
  if (blockKind === 'service-strip' || /服务与权益|品质保证|免运费|官方售后|全国联保/.test(textContent)) {
    matches.push('service-strip-signals');
  }
  if (blockKind === 'hero-media' || /picture-whole|hero|banner|kv|masthead/.test(identity)) {
    matches.push('hero-banner-signals');
  }
  if (blockKind === 'promo-banner') {
    matches.push('promo-banner-fragment');
  }
  if (blockKind === 'featured-shelf') {
    matches.push('featured-product-signals');
  }
  if (blockKind === 'product-shelf' || /(product|goods|sku|recommend|floor|card|commodity|prod-)/.test(identity)) {
    matches.push('product-shelf-signals');
  }
  if (blockKind === 'recommend-shelf' || /rndiyweb|recommenditem/.test(identity) || /搭配推荐|相关好物|为您推荐/.test(textContent)) {
    matches.push('recommend-shelf-signals');
  }
  if (blockKind === 'detail-anchor-bar' || /详情参数评价/.test(normalizeCompactText(textContent))) {
    matches.push('detail-anchor-signals');
  }
  if (blockKind === 'detail-content' || /richtextcontent|主要参数/.test(identity + textContent.toLowerCase())) {
    matches.push('detail-content-signals');
  }
  if (blockKind === 'spec-list' || /主要参数|规格参数|操作系统|屏幕尺寸|电池容量|机身内存|cpu型号|上市时间|传播名|特色功能/i.test(textContent)) {
    matches.push('spec-list-signals');
  }
  if (blockKind === 'legal-notice' || /特别提醒|仅作示意|请以实物为准|理论值|实际使用|实时调整和修订/.test(textContent)) {
    matches.push('legal-notice-signals');
  }
  if (blockKind === 'review-feed' || /prd-reviews|评价/.test(identity + textContent)) {
    matches.push('review-feed-signals');
  }
  if (stats.imageCount >= 4 && stats.childCount >= 3) {
    matches.push('dense-media-cluster');
  }
  if (hasStableBlockIdentity($element)) {
    matches.push('stable-dom-identity');
  }

  return matches;
}

function explainSectionRenderMode(sectionKind, stats, interactionCount, blockCount = 0, extraction = {}) {
  const reasons = [];

  if (extraction?.reason === 'promoted-from-section-block') {
    reasons.push('来自超大混合 section 的稳定 block，已提升为独立 section 输出');
  }

  if (blockCount >= 2) {
    reasons.push('已成功拆分出多个 block，优先输出 component-blocks');
    return reasons;
  }

  if (stats.htmlLength >= 180000) {
    reasons.push('HTML 体量过大，降级为 fallback-body-fragment');
    return reasons;
  }

  if (STRONG_SECTION_KINDS.has(sectionKind)) {
    reasons.push('命中强语义 section 类型，输出 component-fragment');
  }

  if (interactionCount > 0) {
    reasons.push(`检测到 ${interactionCount} 个基础交互信号，保持组件化输出`);
  }

  if (sectionKind === 'main-content' && stats.htmlLength >= 80000) {
    reasons.push('main-content 体量过大，降级为 fallback-body-fragment');
    return reasons;
  }

  if (!reasons.length) {
    reasons.push('默认使用 component-fragment 保持结构化输出');
  }

  return reasons;
}

function explainSectionConfidence(sectionKind, stats, interactionCount, blockCount = 0, extraction = {}) {
  const reasons = [];

  if (extraction?.reason === 'promoted-from-section-block') {
    reasons.push('由稳定 block 提升为 section，边界更明确');
  }

  if (stats.headingCount) {
    reasons.push('存在标题语义，提升可识别性');
  }
  if (interactionCount > 0) {
    reasons.push(`提取到 ${interactionCount} 个交互信号`);
  }
  if (blockCount >= 2) {
    reasons.push(`成功拆分为 ${blockCount} 个 block`);
  }
  if (stats.htmlLength >= 120000) {
    reasons.push('区块体量极大，置信度受惩罚');
  } else if (stats.htmlLength >= 60000) {
    reasons.push('区块体量偏大，置信度轻微受惩罚');
  }
  if (!reasons.length) {
    reasons.push(`${sectionKind} 类型使用基础置信度`);
  }

  return reasons;
}

function explainBlockConfidence(blockKind, stats, interactionCount = 0) {
  const reasons = [];

  if (interactionCount > 0) {
    reasons.push(`block 内检测到 ${interactionCount} 个交互信号`);
  }
  if (stats.htmlLength >= 90000) {
    reasons.push('block 体量过大，置信度受惩罚');
  } else if (stats.htmlLength >= 50000) {
    reasons.push('block 体量偏大，置信度轻微受惩罚');
  }
  if (['product-shelf', 'featured-shelf', 'promo-banner', 'service-strip', 'hero-media', 'product-detail-hero', 'recommend-shelf', 'detail-content', 'spec-list', 'legal-notice', 'review-feed'].includes(blockKind)) {
    reasons.push('命中稳定业务块类型');
  }
  if (!reasons.length) {
    reasons.push(`${blockKind} 类型使用基础置信度`);
  }

  return reasons;
}

function assessVibecodingTarget({
  targetType,
  kind,
  renderMode = 'component-fragment',
  confidence = 0,
  interactionCount = 0,
  htmlLength = 0,
  namingQuality = 'generic'
}) {
  let suitabilityScore = Math.round((Number(confidence) || 0) * 100);
  const reasons = [];

  if (renderMode === 'fallback-body-fragment') {
    suitabilityScore -= 30;
    reasons.push('仍是 fallback fragment，直接修改风险高');
  } else {
    suitabilityScore += 6;
    reasons.push('已是结构化组件输出');
  }

  if (interactionCount > 0) {
    suitabilityScore -= 18;
    reasons.push('包含基础交互，改动时需要保留行为');
  }

  if (htmlLength >= 50000) {
    suitabilityScore -= 14;
    reasons.push('结构体量较大，改动面偏广');
  } else if (htmlLength >= 24000) {
    suitabilityScore -= 8;
    reasons.push('结构体量中等，建议局部修改');
  } else {
    suitabilityScore += 4;
    reasons.push('结构体量适中，适合先做局部调整');
  }

  if (namingQuality === 'maintainable') {
    suitabilityScore += 5;
    reasons.push('命名可读性较好，AI 更容易定位');
  } else {
    suitabilityScore -= 6;
    reasons.push('命名偏通用，AI 定位成本偏高');
  }

  if (['promo-banner', 'service-strip', 'featured-shelf', 'product-shelf', 'hero-media', 'product-detail-hero', 'recommend-shelf', 'detail-content', 'spec-list', 'legal-notice', 'detail-panel', 'notice', 'icon-grid'].includes(kind)) {
    suitabilityScore += 10;
    reasons.push('属于相对独立的业务块，适合先做二次 vibecoding');
  }

  if (['top-bar', 'footer', 'floating-layer', 'tabs', 'form', 'detail-anchor-bar'].includes(kind)) {
    suitabilityScore -= 16;
    reasons.push('属于全局或行为敏感区块，建议谨慎编辑');
  }

  if (targetType === 'section' && kind === 'main-content') {
    suitabilityScore -= 8;
    reasons.push('section 粒度较粗，建议优先改 block 而不是整段 section');
  }

  const normalizedScore = clampPercent(suitabilityScore);
  let changeRisk = 'medium';
  if (normalizedScore >= 78) {
    changeRisk = 'low';
  } else if (normalizedScore < 58) {
    changeRisk = 'high';
  }

  return {
    suitabilityScore: normalizedScore,
    changeRisk,
    reasons: Array.from(new Set(reasons))
  };
}

function createSectionIssues({ renderMode, confidence, stats, interactionCount, blockCount, extraction = {} }) {
  const issues = [];

  if (renderMode === 'fallback-body-fragment') {
    issues.push('section 仍使用 fallback-body-fragment');
  }
  if (Number(confidence || 0) < 0.6) {
    issues.push('section 置信度偏低');
  }
  if (Number(stats?.htmlLength || 0) >= 50000 && blockCount < 2 && extraction?.reason !== 'promoted-from-section-block') {
    issues.push('section 体量较大但尚未成功拆分为 block');
  }
  if (interactionCount > 0) {
    issues.push('section 内含基础交互，改动时需保留行为');
  }
  if (extraction?.sourceBlockKind === 'review-feed' && Number(stats?.htmlLength || 0) >= 80000) {
    issues.push('review 区内容量较大，建议优先调整筛选条或单卡模板');
  }

  return issues;
}

function createBlockIssues({ kind, confidence, stats, interactionCount }) {
  const issues = [];

  if (Number(confidence || 0) < 0.66) {
    issues.push('block 置信度偏低');
  }
  if (Number(stats?.htmlLength || 0) >= 35000) {
    issues.push('block 体量偏大，建议继续局部抽象');
  }
  if (interactionCount > 0) {
    issues.push('block 内含基础交互');
  }
  if (['top-bar', 'footer', 'floating-layer'].includes(kind)) {
    issues.push('block 属于全局敏感区块');
  }

  return issues;
}

function createSectionDiagnostics({
  $element,
  sectionId,
  sectionBaseName,
  sectionKind,
  stats,
  renderMode,
  confidence,
  interactionCount,
  blockCount,
  componentName,
  extraction = {},
  contextWrappers = []
}) {
  const source = summarizeElementSource($element, stats);
  const namingQuality = looksMaintainableName(sectionId) ? 'maintainable' : 'generic';
  const vibecoding = assessVibecodingTarget({
    targetType: 'section',
    kind: sectionKind,
    renderMode,
    confidence,
    interactionCount,
    htmlLength: stats.htmlLength,
    namingQuality
  });

  return {
    source,
    naming: {
      baseName: sectionBaseName,
      finalId: sectionId,
      componentName,
      quality: namingQuality
    },
    classification: {
      kind: sectionKind,
      matchedRules: collectSectionRuleMatches($element, stats)
    },
    structure: {
      htmlLength: stats.htmlLength,
      childCount: stats.childCount,
      imageCount: stats.imageCount,
      interactionCount,
      blockCount
    },
    context: buildContextDiagnostics(
      contextWrappers,
      Array.isArray(contextWrappers) && contextWrappers.length
        ? (blockCount > 0 ? 'ancestor+section-root+block-container' : 'ancestor-only')
        : 'none'
    ),
    extraction,
    renderDecision: {
      mode: renderMode,
      reasons: explainSectionRenderMode(sectionKind, stats, interactionCount, blockCount, extraction)
    },
    confidenceDecision: {
      score: confidence,
      reasons: explainSectionConfidence(sectionKind, stats, interactionCount, blockCount, extraction)
    },
    issues: createSectionIssues({ renderMode, confidence, stats, interactionCount, blockCount, extraction }),
    vibecoding
  };
}

function createBlockDiagnostics({
  $element,
  sectionId,
  blockId,
  blockKind,
  blockStats,
  confidence,
  interactionCount,
  extraction = {},
  contextWrappers = []
}) {
  const source = summarizeElementSource($element, blockStats);
  const namingQuality = looksMaintainableName(blockId) ? 'maintainable' : 'generic';
  const vibecoding = assessVibecodingTarget({
    targetType: 'block',
    kind: blockKind,
    renderMode: 'component-fragment',
    confidence,
    interactionCount,
    htmlLength: blockStats.htmlLength,
    namingQuality
  });

  return {
    source,
    parentSectionId: sectionId,
    naming: {
      finalId: blockId,
      quality: namingQuality
    },
    classification: {
      kind: blockKind,
      matchedRules: collectBlockRuleMatches($element, blockStats, blockKind)
    },
    structure: {
      htmlLength: blockStats.htmlLength,
      childCount: blockStats.childCount,
      imageCount: blockStats.imageCount,
      interactionCount
    },
    context: buildContextDiagnostics(
      contextWrappers,
      Array.isArray(contextWrappers) && contextWrappers.length
        ? 'shared-section-context'
        : 'none'
    ),
    extraction,
    confidenceDecision: {
      score: confidence,
      reasons: explainBlockConfidence(blockKind, blockStats, interactionCount)
    },
    issues: createBlockIssues({
      kind: blockKind,
      confidence,
      stats: blockStats,
      interactionCount
    }),
    vibecoding
  };
}

function buildEditabilityTarget(section, block = null) {
  const isBlock = Boolean(block);
  const diagnostics = isBlock ? (block?.diagnostics || {}) : (section?.diagnostics || {});
  const structure = diagnostics?.structure || {};
  const vibecoding = diagnostics?.vibecoding || {};
  const source = diagnostics?.source || {};
  const matchedRules = diagnostics?.classification?.matchedRules || [];
  const interactionIds = Array.isArray(isBlock ? block?.interactionIds : section?.interactionIds)
    ? (isBlock ? block.interactionIds : section.interactionIds)
    : [];
  const target = {
    targetType: isBlock ? 'block' : 'section',
    sectionId: section.id,
    sectionTitle: section.title,
    sectionKind: section.kind,
    componentName: section.componentName,
    sectionComponentName: section.componentName,
    targetId: isBlock ? block.id : section.id,
    title: isBlock ? block.title : section.title,
    kind: isBlock ? block.kind : section.kind,
    summary: isBlock ? block.summary : section.summary,
    renderMode: isBlock ? block.renderMode : section.renderMode,
    confidence: Number(isBlock ? block.confidence : section.confidence || 0),
    interactionIds,
    interactionCount: Number(structure.interactionCount || interactionIds.length || 0),
    htmlLength: Number(structure.htmlLength || (isBlock ? block?.stats?.htmlLength : section?.stats?.htmlLength) || 0),
    changeRisk: vibecoding.changeRisk || 'medium',
    suitabilityScore: Number(vibecoding.suitabilityScore || 0),
    reasons: Array.from(new Set(vibecoding.reasons || [])),
    issues: Array.isArray(diagnostics?.issues) ? diagnostics.issues : [],
    location: {
      sectionId: section.id,
      blockId: isBlock ? block.id : null,
      componentName: section.componentName,
      selectorHint: source.selectorHint || '',
      matchedRules,
      renderMode: isBlock ? block.renderMode : section.renderMode,
      targetKind: isBlock ? block.kind : section.kind,
      interactionIds
    }
  };

  let recommendedAction = '可作为局部 AI vibecoding 起点，优先做文案、图片与间距层修改';
  if (target.renderMode === 'fallback-body-fragment') {
    recommendedAction = '先补结构化拆分与命名，再做二次原型编辑';
  } else if (target.changeRisk === 'high') {
    recommendedAction = '暂缓直接修改，先确认交互与边界，再决定是否拆分';
  } else if (target.interactionCount > 0) {
    recommendedAction = '可编辑，但要优先保留现有交互节点与状态容器';
  } else if (target.htmlLength >= 28000) {
    recommendedAction = '适合先做局部调整，避免一次性重写整个区块';
  }

  let severity = 'low';
  if (target.renderMode === 'fallback-body-fragment' || target.changeRisk === 'high') {
    severity = 'high';
  } else if (target.issues.length >= 2 || target.confidence < 0.66) {
    severity = 'medium';
  }

  return {
    ...target,
    severity,
    recommendedAction
  };
}

function riskRank(changeRisk = 'medium') {
  return {
    low: 0,
    medium: 1,
    high: 2
  }[changeRisk] ?? 1;
}

function severityRank(severity = 'medium') {
  return {
    high: 0,
    medium: 1,
    low: 2
  }[severity] ?? 1;
}

function compareRecommendedTargets(left, right) {
  if (left.targetType !== right.targetType) {
    return left.targetType === 'block' ? -1 : 1;
  }
  if (left.changeRisk !== right.changeRisk) {
    return riskRank(left.changeRisk) - riskRank(right.changeRisk);
  }
  if (left.suitabilityScore !== right.suitabilityScore) {
    return right.suitabilityScore - left.suitabilityScore;
  }
  if (left.interactionCount !== right.interactionCount) {
    return left.interactionCount - right.interactionCount;
  }
  return left.htmlLength - right.htmlLength;
}

function compareProblemAreas(left, right) {
  if (left.severity !== right.severity) {
    return severityRank(left.severity) - severityRank(right.severity);
  }
  if (left.changeRisk !== right.changeRisk) {
    return riskRank(right.changeRisk) - riskRank(left.changeRisk);
  }
  if (left.issues.length !== right.issues.length) {
    return right.issues.length - left.issues.length;
  }
  return left.suitabilityScore - right.suitabilityScore;
}

function isStructurallyDecomposedSection(section = {}) {
  const blockCount = Array.isArray(section.blocks) ? section.blocks.length : 0;
  return blockCount >= 2 || isPromotedBlockSection(section);
}

function buildEditabilityScoreDrivers({
  totalSections,
  structuredSectionCount,
  blockSectionCount,
  promotedSectionCount,
  totalBlocks,
  fallbackSectionCount,
  oversizedUnsplitSectionCount,
  lowConfidenceSectionCount,
  interactions,
  blockNameQualityCount,
  blockList
}) {
  const positive = [];
  const negative = [];

  if (structuredSectionCount > 0) {
    positive.push({
      key: 'structured-sections',
      weight: structuredSectionCount === totalSections ? 'high' : 'medium',
      summary: `${structuredSectionCount}/${totalSections || 0} 个 section 已采用结构化组件输出`
    });
  }

  if (blockSectionCount > 0 || totalBlocks > 0 || promotedSectionCount > 0) {
    positive.push({
      key: 'block-decomposition',
      weight: totalBlocks >= 6 || promotedSectionCount >= 4 ? 'high' : 'medium',
      summary: promotedSectionCount > 0
        ? `${promotedSectionCount} 个稳定 block 已提升为独立 section，${blockSectionCount} 个 section 继续拆成 ${totalBlocks} 个 block`
        : `${blockSectionCount} 个 section 已继续拆成 ${totalBlocks} 个 block`
    });
  }

  if (interactions.length > 0) {
    positive.push({
      key: 'interaction-protocol',
      weight: 'medium',
      summary: `已保留 ${interactions.length} 个基础交互协议线索`
    });
  }

  if (blockList.length > 0 && blockNameQualityCount >= Math.ceil(blockList.length * 0.75)) {
    positive.push({
      key: 'maintainable-naming',
      weight: 'medium',
      summary: '多数 block 命名具备业务语义，便于 AI 精准定位'
    });
  }

  if (oversizedUnsplitSectionCount > 0) {
    negative.push({
      key: 'oversized-unsplit-sections',
      weight: oversizedUnsplitSectionCount >= 2 ? 'high' : 'medium',
      summary: `仍有 ${oversizedUnsplitSectionCount} 个超大 section 未拆分`
    });
  }

  if (fallbackSectionCount > 0) {
    negative.push({
      key: 'fallback-sections',
      weight: fallbackSectionCount >= Math.max(2, Math.ceil(totalSections / 2)) ? 'high' : 'medium',
      summary: `仍有 ${fallbackSectionCount} 个 section 处于 fallback 输出`
    });
  }

  if (lowConfidenceSectionCount > 0) {
    negative.push({
      key: 'low-confidence-sections',
      weight: lowConfidenceSectionCount >= 2 ? 'high' : 'medium',
      summary: `仍有 ${lowConfidenceSectionCount} 个低置信度 section`
    });
  }

  if (!interactions.length) {
    negative.push({
      key: 'missing-interactions',
      weight: 'medium',
      summary: '当前页面未提取到稳定基础交互协议'
    });
  }

  return {
    positive,
    negative
  };
}

function createEditabilityReport(sections = [], interactions = [], confidence = {}) {
  const totalSections = sections.length;
  const totalBlocks = sections.reduce((sum, section) => sum + (Array.isArray(section.blocks) ? section.blocks.length : 0), 0);
  const structuredSectionCount = sections.filter((section) => section.renderMode !== 'fallback-body-fragment').length;
  const blockSectionCount = sections.filter((section) => Array.isArray(section.blocks) && section.blocks.length >= 2).length;
  const promotedSectionCount = sections.filter((section) => isPromotedBlockSection(section)).length;
  const fallbackSectionCount = sections.filter((section) => section.renderMode === 'fallback-body-fragment').length;
  const lowConfidenceSectionCount = sections.filter((section) => Number(section.confidence || 0) < 0.6).length;
  const oversizedSectionCount = sections.filter((section) => Number(section?.stats?.htmlLength || 0) >= 50000).length;
  const oversizedUnsplitSectionCount = sections.filter((section) => {
    const htmlLength = Number(section?.stats?.htmlLength || 0);
    return htmlLength >= 50000 && !isStructurallyDecomposedSection(section);
  }).length;
  const editableHotspots = sections.flatMap((section) => {
    if (Array.isArray(section.blocks) && section.blocks.length) {
      return section.blocks.map((block) => `${section.id}.${block.id}`);
    }

    if (section.renderMode !== 'fallback-body-fragment') {
      return [section.id];
    }

    return [];
  });
  const editableHotspotCount = editableHotspots.length;
  const interactiveSurfaceCount = sections.filter((section) => Array.isArray(section.interactionIds) && section.interactionIds.length).length;
  const sectionNameQualityCount = sections.filter((section) => looksMaintainableName(section.id)).length;
  const blockList = sections.flatMap((section) => Array.isArray(section.blocks) ? section.blocks : []);
  const blockNameQualityCount = blockList.filter((block) => looksMaintainableName(block.id)).length;
  const sectionTargets = sections.map((section) => buildEditabilityTarget(section));
  const blockTargets = sections.flatMap((section) => (
    Array.isArray(section.blocks)
      ? section.blocks.map((block) => buildEditabilityTarget(section, block))
      : []
  ));
  const allTargets = blockTargets.concat(sectionTargets);

  const structureScore = clampPercent(
    (toPercentRatio(structuredSectionCount, totalSections, 0) * 0.65)
    + (toPercentRatio(blockSectionCount + promotedSectionCount, totalSections, totalSections ? 0 : 0) * 0.25)
    + (fallbackSectionCount === 0 && totalSections ? 10 : 0)
  );

  const decomposedOversizedCount = oversizedSectionCount - oversizedUnsplitSectionCount;
  const decompositionScore = clampPercent(
    (toPercentRatio(decomposedOversizedCount, oversizedSectionCount, 75) * 0.65)
    + (clampPercent((Math.min(totalBlocks, 18) / 18) * 100) * 0.35)
  );

  const maintainabilityScore = clampPercent(
    (toPercentRatio(sectionNameQualityCount, totalSections, 0) * 0.45)
    + (toPercentRatio(blockNameQualityCount, blockList.length, 70) * 0.35)
    + ((lowConfidenceSectionCount === 0 && totalSections) ? 20 : Math.max(0, 20 - (lowConfidenceSectionCount * 10)))
  );

  const stabilityScore = clampPercent(
    ((Number(confidence.page) || 0) * 100 * 0.7)
    + (toPercentRatio(interactiveSurfaceCount, Math.max(totalSections, 1), interactions.length ? 0 : 70) * 0.15)
    + (toPercentRatio(editableHotspotCount, Math.max(totalSections, 1), 0) * 0.15)
  );

  const score = Number(clampPercent(
    (structureScore * 0.35)
    + (decompositionScore * 0.35)
    + (maintainabilityScore * 0.2)
    + (stabilityScore * 0.1)
  ).toFixed(2));

  const blockers = [];
  if (!totalSections) {
    blockers.push('no-sections');
  }
  if (!editableHotspotCount) {
    blockers.push('no-editable-hotspots');
  }
  if (totalSections === 1 && oversizedUnsplitSectionCount >= 1) {
    blockers.push('single-giant-fragment');
  }
  if (fallbackSectionCount >= Math.max(2, Math.ceil(totalSections / 2)) && totalSections > 1) {
    blockers.push('fallback-pressure');
  }

  const warnings = [];
  if (oversizedUnsplitSectionCount > 0) {
    warnings.push(`仍有 ${oversizedUnsplitSectionCount} 个超大区块未继续拆分`);
  }
  if (lowConfidenceSectionCount > 0) {
    warnings.push(`仍有 ${lowConfidenceSectionCount} 个低置信度区块`);
  }
  if (blockList.length >= 4 && toPercentRatio(blockNameQualityCount, blockList.length, 0) < 75) {
    warnings.push('部分 block 命名仍偏通用，后续 AI 编辑定位成本偏高');
  }
  if (!interactions.length) {
    warnings.push('当前页面未提取到稳定基础交互协议');
  }

  let status = 'weak';
  if (!blockers.length && score >= 78) {
    status = 'strong';
  } else if (score >= 58 && blockers.length < 2) {
    status = 'workable';
  } else if (blockers.length >= 2 || score < 45) {
    status = 'blocked';
  }

  const suggestedNextActions = [];
  if (oversizedUnsplitSectionCount > 0) {
    suggestedNextActions.push('继续把超大 section 拆成 block 级结构，避免后续 AI 只能修改整段 fragment');
  }
  if (lowConfidenceSectionCount > 0) {
    suggestedNextActions.push('优先复核低置信度 section 的边界和命名，提升后续 AI 二次编辑稳定性');
  }
  if (blockList.length >= 4 && toPercentRatio(blockNameQualityCount, blockList.length, 0) < 75) {
    suggestedNextActions.push('优化 block 命名，让标题和 id 更贴近业务语义而不是 DOM 语义');
  }
  if (!interactions.length) {
    suggestedNextActions.push('补充 tabs、dropdown、dismiss、carousel 等基础交互识别与回放');
  }

  const recommendedFirstEdits = allTargets
    .filter((target) => target.renderMode !== 'fallback-body-fragment' && target.changeRisk !== 'high' && target.suitabilityScore >= 68)
    .sort(compareRecommendedTargets)
    .slice(0, 5);

  const lowRiskTargets = allTargets
    .filter((target) => target.renderMode !== 'fallback-body-fragment' && target.changeRisk === 'low')
    .sort(compareRecommendedTargets)
    .slice(0, 8);

  const avoidForNow = allTargets
    .filter((target) => (
      target.renderMode === 'fallback-body-fragment'
      || target.changeRisk === 'high'
      || (target.kind === 'review-feed' && target.htmlLength >= 80000)
      || ['top-bar', 'footer', 'floating-layer', 'tabs', 'form'].includes(target.kind)
    ))
    .sort(compareProblemAreas)
    .slice(0, 8);

  const problemAreas = allTargets
    .filter((target) => (
      target.issues.length
      || target.renderMode === 'fallback-body-fragment'
      || target.changeRisk === 'high'
      || target.confidence < 0.66
    ))
    .sort(compareProblemAreas)
    .slice(0, 12);

  const scoreDrivers = buildEditabilityScoreDrivers({
    totalSections,
    structuredSectionCount,
    blockSectionCount,
    promotedSectionCount,
    totalBlocks,
    fallbackSectionCount,
    oversizedUnsplitSectionCount,
    lowConfidenceSectionCount,
    interactions,
    blockNameQualityCount,
    blockList
  });

  return {
    score,
    normalizedScore: Number((score / 100).toFixed(4)),
    status,
    editableHotspotCount,
    hotspots: editableHotspots.slice(0, 12),
    blockers,
    warnings,
    suggestedNextActions,
    locationDimensions: [
      {
        key: 'sectionId',
        label: 'Section',
        description: '定位到页面结构层级中的 section'
      },
      {
        key: 'targetId',
        label: 'Target',
        description: '定位到具体 section 或 block'
      },
      {
        key: 'componentName',
        label: 'Component',
        description: '定位到生成后的组件文件'
      },
      {
        key: 'selectorHint',
        label: 'Selector Hint',
        description: '定位到原始 DOM 来源线索'
      },
      {
        key: 'matchedRules',
        label: 'Matched Rules',
        description: '说明该目标命中了哪些识别规则'
      },
      {
        key: 'interactionIds',
        label: 'Interactions',
        description: '定位到与该区块绑定的交互协议'
      }
    ],
    problemAreas,
    recommendedFirstEdits,
    lowRiskTargets,
    avoidForNow,
    scoreDrivers,
    breakdown: {
      structure: Number(structureScore.toFixed(2)),
      decomposition: Number(decompositionScore.toFixed(2)),
      maintainability: Number(maintainabilityScore.toFixed(2)),
      stability: Number(stabilityScore.toFixed(2))
    },
    metrics: {
      totalSections,
      structuredSectionCount,
      blockSectionCount,
      promotedSectionCount,
      totalBlocks,
      fallbackSectionCount,
      oversizedSectionCount,
      oversizedUnsplitSectionCount,
      lowConfidenceSectionCount,
      interactionCount: interactions.length,
      interactiveSurfaceCount,
      sectionNameQualityCount,
      blockNameQualityCount,
      recommendedFirstEditCount: recommendedFirstEdits.length,
      lowRiskTargetCount: lowRiskTargets.length,
      avoidForNowCount: avoidForNow.length,
      problemAreaCount: problemAreas.length
    }
  };
}

async function buildPageIR(input = {}) {
  const {
    captureDir,
    localizedHtml,
    pageTitle,
    pageUrl,
    metadata = {},
    assetReport = {},
    captureQuality = {},
    restoreSlug = '',
    restoreRelativeDir = '',
    captureVariant = null,
    onProgress
  } = input;

  const relativePageDir = normalizePathForUrl(restoreRelativeDir || restoreSlug || buildPageSlug(pageUrl, pageTitle));
  const pageSlug = sanitizeSegment(relativePageDir.replace(/[\\/]+/g, '-')) || sanitizeSegment(restoreSlug || buildPageSlug(pageUrl, pageTitle));
  const view = createViewDefinition({
    relativePageDir,
    pageSlug,
    pageTitle,
    metadata,
    captureVariant
  });
  const pageAssetSlug = view.assetSlug || pageSlug;
  const assetOwnerRouteId = view.baseRouteId || relativePageDir;

  onProgress?.({
    phase: 'restore',
    message: '正在生成页面协议包...',
    currentItemTitle: '构建 PageIR',
    detail: '正在提取页面结构、资源和样式'
  });

  const htmlContent = localizedHtml || await fs.readFile(path.join(captureDir, 'index.html'), 'utf8');
  const assets = await collectCaptureAssets(captureDir, pageAssetSlug, relativePageDir, assetOwnerRouteId);
  const generationAssetMap = buildGenerationAssetMap(assets);
  const pageOrigin = metadata?.url || pageUrl || '';
  const failedAssetUrls = new Set(
    Array.isArray(assetReport?.failedUrls)
      ? assetReport.failedUrls
          .map((value) => normalizeAbsoluteReference(value, pageOrigin))
          .filter(Boolean)
      : []
  );
  const preparedHtmlResult = prepareLocalizedHtmlForGeneration({
    html: htmlContent,
    metadata,
    assetMap: generationAssetMap,
    options: {
      enableProxyFallback: true,
      pageOrigin,
      failedAssetUrls
    }
  });
  const $ = cheerio.load(preparedHtmlResult.html || htmlContent, { decodeEntities: false });
  if (preparedHtmlResult.maxCapturedScrollTop > 0) {
    $('body').attr('data-restore-captured-max-scroll-top', String(Math.round(preparedHtmlResult.maxCapturedScrollTop)));
  }
  const viewport = {
    width: Number(metadata?.viewport?.width) || 0,
    height: Number(metadata?.viewport?.height) || 0
  };
  const { byFileName, localAssetReferenceMap, previewAssetReferenceMap } = buildAssetReferenceMaps(assets);
  const sourceCssText = await collectStyleText({
    $,
    captureDir,
    metadata,
    explicitMap: localAssetReferenceMap,
    byFileName
  });
  const previewCssText = await collectStyleText({
    $,
    captureDir,
    metadata,
    explicitMap: previewAssetReferenceMap,
    byFileName
  });

  $(NOISE_SELECTORS).remove();
  $('style, link[rel~="stylesheet"], meta, title').remove();

  const archetype = classifyPage({ $, metadata });
  const { sections: extractedSections, interactions } = buildSections({
    $,
    explicitLocalMap: localAssetReferenceMap,
    explicitPreviewMap: previewAssetReferenceMap,
    byFileName
  });
  const {
    sections,
    pageContextWrappers
  } = optimizeSharedPageContextWrappers(extractedSections);
  const confidence = createConfidenceBreakdown(captureQuality, metadata, sections, interactions, sourceCssText);
  const bodyAttributes = $('body').get(0)?.attribs || {};
  const previewHeadTemplate = [
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(pageTitle || $('title').first().text() || pageSlug)}</title>`,
    `<base href="${PREVIEW_STATIC_ROOT}/${normalizePathForUrl(relativePageDir)}/" />`,
    '__PROTOREC_GENERATED_STYLE__'
  ].join('\n');
  const degradedSections = sections
    .filter((section) => section.renderMode === 'fallback-body-fragment' || section.confidence < 0.6)
    .map((section) => ({
      id: section.id,
      kind: section.kind,
      renderMode: section.renderMode,
      confidence: section.confidence
    }));
  const editability = createEditabilityReport(sections, interactions, confidence);
  const qa = evaluateQAGate({
    pageConfidence: confidence.page,
    degradedSections,
    editability,
    interactions
  });
  const readyState = qa.readyState || resolveReadyState(confidence.page, degradedSections, editability);

  const pageMeta = {
    id: pageSlug,
    routeId: relativePageDir,
    baseRouteId: view.baseRouteId,
    title: pageTitle || $('title').first().text() || pageSlug,
    archetype,
    generationMode: GENERATION_MODE,
    protocolVersion: PROTOCOL_VERSION,
    sourceUrl: pageUrl,
    pageConfidence: confidence.page,
    editabilityScore: editability.score,
    editabilityStatus: editability.status,
    qaStatus: qa.status,
    releaseDecision: qa.releaseDecision,
    readyState,
    viewId: view.viewId,
    viewLabel: view.viewLabel,
    preservedInteractions: interactions.map((item) => `${item.kind}:${item.label}`)
  };

  return {
    protocolVersion: PROTOCOL_VERSION,
    pageSlug,
    assetSlug: pageAssetSlug,
    routeId: relativePageDir,
    baseRouteId: view.baseRouteId,
    pageTitle: pageMeta.title,
    pageMeta,
    sourceUrl: pageUrl,
    capturedAt: metadata?.capturedAt || new Date().toISOString(),
    generationMode: GENERATION_MODE,
    viewport,
    archetype,
    sections,
    sectionOrder: sections.map((section) => section.id),
    interactions,
    pageContextWrappers,
    view,
    degradedSections,
    editability,
    qa,
    readyState,
    confidence,
    assets,
    assetSummary: {
      attemptedAssetCount: Number(assetReport?.attemptedAssetCount) || assets.length,
      downloadedAssetCount: Number(assetReport?.downloadedAssetCount) || assets.length,
      failedAssetCount: Number(assetReport?.failedAssetCount) || 0
    },
    bodyAttributes: {
      className: String(bodyAttributes.class || ''),
      style: String(bodyAttributes.style || ''),
      dataAttributes: buildPreviewBodyDataAttributes(bodyAttributes)
    },
    sourceCssText,
    previewCssText,
    previewHeadTemplate,
    previewBodyMarkup: '',
    notes: {
      sectionExtraction: 'semantic-boundary-splitting+block-decomposition',
      assetBinding: 'relative-page-assets',
      cssMode: 'layered-generated-and-source-styles',
      interactionMode: 'declarative-dom-markers',
      editabilityMode: 'pm-ai-vibecoding-gate-v1'
    }
  };
}

module.exports = {
  buildPageIR
};
