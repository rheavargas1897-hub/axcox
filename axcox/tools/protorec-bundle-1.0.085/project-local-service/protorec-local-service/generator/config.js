const path = require('path');

const SERVICE_ROOT = path.resolve(__dirname, '..');
const DEFAULT_PROJECT_ROOT = path.resolve(SERVICE_ROOT, '..');
const DEFAULT_WORKSPACE_ROOT = path.join(SERVICE_ROOT, 'workspace');
const WORKSPACE_ROOT = path.resolve(process.env.PROTO_CAPTURE_RESTORE_WORKSPACE_ROOT || DEFAULT_WORKSPACE_ROOT);
const PROJECT_ROOT = path.resolve(
  process.env.PROTO_CAPTURE_RESTORE_PROJECT_ROOT
  || (process.env.PROTO_CAPTURE_RESTORE_WORKSPACE_ROOT
    ? path.join(WORKSPACE_ROOT, '..')
    : DEFAULT_PROJECT_ROOT)
);
const SRC_ROOT = path.join(WORKSPACE_ROOT);
const PAGES_ROOT = path.join(WORKSPACE_ROOT, 'pages');
const PAGES_ASSETS_ROOT = path.join(PAGES_ROOT, 'assets');
const PAGE_IMAGES_ROOT = path.join(PAGES_ASSETS_ROOT, 'images');
const PAGE_FONTS_ROOT = path.join(PAGES_ASSETS_ROOT, 'fonts');
const META_ROOT = path.join(WORKSPACE_ROOT, 'temp_proto');

const PROTOCOL_VERSION = '2.0';
const GENERATION_MODE = process.env.PROTOREC_GENERATION_MODE || 'balanced';
const PREVIEW_STATIC_ROOT = '/src-pages';

const CONFIDENCE_THRESHOLDS = {
  ready: 0.78,
  flagged: 0.58
};

const EDITABILITY_THRESHOLDS = {
  ready: 78,
  workable: 58
};

module.exports = {
  SERVICE_ROOT,
  DEFAULT_PROJECT_ROOT,
  DEFAULT_WORKSPACE_ROOT,
  WORKSPACE_ROOT,
  PROJECT_ROOT,
  SRC_ROOT,
  PAGES_ROOT,
  PAGES_ASSETS_ROOT,
  PAGE_IMAGES_ROOT,
  PAGE_FONTS_ROOT,
  META_ROOT,
  PROTOCOL_VERSION,
  GENERATION_MODE,
  PREVIEW_STATIC_ROOT,
  CONFIDENCE_THRESHOLDS,
  EDITABILITY_THRESHOLDS
};
