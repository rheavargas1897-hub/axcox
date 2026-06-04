const path = require('path');

const GENERIC_PAGE_SEGMENTS = new Set(['index', 'home', 'page', 'list', 'detail', 'view', 'main']);

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

function toCamelCase(value) {
  return sanitizeReadableSegment(value)
    .split('-')
    .filter(Boolean)
    .map((segment, index) => {
      if (index === 0) {
        return segment.charAt(0).toLowerCase() + segment.slice(1);
      }

      return segment.charAt(0).toUpperCase() + segment.slice(1);
    })
    .join('') || 'item';
}

function toPascalCase(value) {
  return sanitizeReadableSegment(value)
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('') || 'GeneratedPage';
}

function createShortHash(value) {
  return Buffer.from(String(value || ''))
    .toString('hex')
    .slice(0, 10) || 'root';
}

function buildPageSlug(pageUrl, pageTitle) {
  try {
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
      const shouldComposeWithPrevious = GENERIC_PAGE_SEGMENTS.has(normalizedLastSegment)
        || /^\d+$/.test(lastSegment)
        || previousSegment.toLowerCase() !== lastSegment.toLowerCase();

      if (shouldComposeWithPrevious && !GENERIC_PAGE_SEGMENTS.has(normalizedPreviousSegment) && !/^\d+$/.test(previousSegment)) {
        return sanitizeSegment(`${previousSegment}-${lastSegment}`);
      }
    }

    if (lastSegment && !GENERIC_PAGE_SEGMENTS.has(normalizedLastSegment) && !/^\d+$/.test(lastSegment)) {
      return sanitizeSegment(lastSegment);
    }

    if (titleSegment && !GENERIC_PAGE_SEGMENTS.has(sanitizeSegment(titleSegment))) {
      return sanitizeSegment(titleSegment);
    }

    return sanitizeSegment(hostnameSegment || `page-${createShortHash(pageUrl)}`);
  } catch (_error) {
    return sanitizeSegment(pageTitle || `page-${createShortHash(Date.now())}`);
  }
}

function createUniqueNameFactory() {
  const usedNames = new Set();

  return function getUniqueName(baseName, fallbackPrefix = 'item') {
    const normalizedBase = sanitizeSegment(baseName || fallbackPrefix);
    let nextName = normalizedBase || fallbackPrefix;
    let counter = 2;

    while (usedNames.has(nextName)) {
      nextName = `${normalizedBase}-${counter}`;
      counter += 1;
    }

    usedNames.add(nextName);
    return nextName;
  };
}

function getSectionTitle(sectionKind) {
  const titleMap = {
    'top-bar': 'Top Bar',
    'main-content': 'Main Content',
    hero: 'Hero Banner',
    'detail-panel': 'Detail Panel',
    notice: 'Notice',
    'review-feed': 'Review Feed',
    'product-grid': 'Product Grid',
    'feature-list': 'Feature List',
    gallery: 'Gallery',
    'promo-strip': 'Promo Strip',
    'content-grid': 'Content Grid',
    footer: 'Footer',
    sidebar: 'Sidebar',
    'floating-layer': 'Floating Layer',
    'detail-panel': 'Detail Panel',
    table: 'Data Table',
    form: 'Form Section',
    tabs: 'Tabs',
    unknown: 'Generated Section'
  };

  return titleMap[sectionKind] || 'Generated Section';
}

function getSectionComponentName(sectionId) {
  return toPascalCase(sectionId);
}

function getAssetExportName(fileName, category, getUniqueName) {
  const parsed = path.parse(String(fileName || 'asset'));
  const rawBaseName = sanitizeReadableSegment(parsed.name);
  const normalizedBaseName = rawBaseName || `${category === 'fonts' ? 'font' : 'image'}-asset`;
  const safeName = getUniqueName(normalizedBaseName, category === 'fonts' ? 'font-asset' : 'image-asset');
  return toCamelCase(safeName);
}

module.exports = {
  buildPageSlug,
  createShortHash,
  createUniqueNameFactory,
  getAssetExportName,
  getSectionComponentName,
  getSectionTitle,
  sanitizeReadableSegment,
  sanitizeSegment,
  toCamelCase,
  toPascalCase
};
