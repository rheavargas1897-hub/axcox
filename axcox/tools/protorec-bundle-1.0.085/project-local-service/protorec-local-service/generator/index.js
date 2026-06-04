const fs = require('fs-extra');
const path = require('path');

const {
  META_ROOT,
  PAGES_ROOT
} = require('./config');
const { sanitizeSegment } = require('./naming');
const { buildPageIR } = require('./build-page-ir');
const { emitHandoff } = require('./emit-handoff');
const { emitPageAssets } = require('./emit-page-assets');
const { emitPageEntry } = require('./emit-page-entry');
const { emitPageInteractions } = require('./emit-page-interactions');
const { emitPageModel } = require('./emit-page-model');
const { emitPageSections } = require('./emit-page-sections');
const { emitPageStyles } = require('./emit-page-style');
const { createProtocolManifest, resolveReadyState } = require('./protocol');

async function ensureGeneratorRoots() {
  await fs.ensureDir(PAGES_ROOT);
  await fs.ensureDir(META_ROOT);
}

async function copyPageAssets(pageIR) {
  const assetOwnerRouteId = pageIR.baseRouteId || pageIR.routeId;
  const pageAssetsRoot = path.join(PAGES_ROOT, assetOwnerRouteId, 'assets');
  const imagesDir = path.join(pageAssetsRoot, 'images');
  const fontsDir = path.join(pageAssetsRoot, 'fonts');

  await fs.ensureDir(imagesDir);
  await fs.ensureDir(fontsDir);

  for (const asset of pageIR.assets) {
    const targetDir = asset.category === 'fonts' ? fontsDir : imagesDir;
    await fs.copy(asset.sourcePath, path.join(targetDir, asset.fileName));
  }

  return {
    imagesDir,
    fontsDir
  };
}

function buildSectionDebugRecords(pageIR) {
  return (pageIR.sections || []).map((section) => ({
    id: section.id,
    title: section.title,
    kind: section.kind,
    summary: section.summary,
    confidence: Number(section.confidence || 0),
    renderMode: section.renderMode,
    componentName: section.componentName,
    interactionIds: section.interactionIds || [],
    contextWrappers: section.contextWrappers || [],
    stats: section.stats || {},
    diagnostics: section.diagnostics || null,
    blockIds: Array.isArray(section.blocks) ? section.blocks.map((block) => block.id) : []
  }));
}

function buildBlockDebugRecords(pageIR) {
  return (pageIR.sections || []).flatMap((section) => (
    Array.isArray(section.blocks)
      ? section.blocks.map((block) => ({
        id: block.id,
        sectionId: section.id,
        sectionComponentName: section.componentName,
        title: block.title,
        kind: block.kind,
        summary: block.summary,
        confidence: Number(block.confidence || 0),
        renderMode: block.renderMode,
        interactionIds: block.interactionIds || [],
        contextWrappers: block.contextWrappers || [],
        stats: block.stats || {},
        diagnostics: block.diagnostics || null
      }))
      : []
  ));
}

function buildGenerationDebug(pageIR, outputPaths, input = {}) {
  return {
    page: {
      pageSlug: pageIR.pageSlug,
      routeId: pageIR.routeId,
      baseRouteId: pageIR.baseRouteId,
      pageTitle: pageIR.pageTitle,
      sourceUrl: pageIR.sourceUrl,
      view: pageIR.view
    },
    generation: {
      protocolVersion: pageIR.protocolVersion,
      generationMode: pageIR.generationMode,
      readyState: pageIR.readyState,
      qaStatus: pageIR?.qa?.status || 'unknown',
      releaseDecision: pageIR?.qa?.releaseDecision || 'unknown',
      pageConfidence: Number(pageIR?.confidence?.page || 0),
      editabilityScore: Number(pageIR?.editability?.score || 0),
      editabilityStatus: pageIR?.editability?.status || 'unknown'
    },
    counts: {
      sectionCount: Array.isArray(pageIR.sections) ? pageIR.sections.length : 0,
      blockCount: Array.isArray(pageIR.sections)
        ? pageIR.sections.reduce((sum, section) => sum + (Array.isArray(section.blocks) ? section.blocks.length : 0), 0)
        : 0,
      degradedSectionCount: Array.isArray(pageIR.degradedSections) ? pageIR.degradedSections.length : 0,
      interactionCount: Array.isArray(pageIR.interactions) ? pageIR.interactions.length : 0,
      assetCount: Array.isArray(pageIR.assets) ? pageIR.assets.length : 0
    },
    debugFocus: {
      qaPrimaryReason: pageIR?.qa?.primaryReason || '',
      qaBlockers: pageIR?.qa?.blockers || [],
      qaWarnings: pageIR?.qa?.warnings || [],
      blockers: pageIR?.editability?.blockers || [],
      warnings: pageIR?.editability?.warnings || [],
      problemAreas: pageIR?.editability?.problemAreas || [],
      recommendedFirstEdits: pageIR?.editability?.recommendedFirstEdits || [],
      lowRiskTargets: pageIR?.editability?.lowRiskTargets || [],
      avoidForNow: pageIR?.editability?.avoidForNow || []
    },
    outputs: {
      pageDir: outputPaths.pageDir,
      entryFilePath: outputPaths.entryFilePath,
      metaDir: outputPaths.metaDir,
      sectionsDir: outputPaths.sectionsDir,
      stylesDir: outputPaths.stylesDir,
      pagesJsonPath: outputPaths.pagesJsonPath || '',
      imagesDir: outputPaths.imagesDir,
      fontsDir: outputPaths.fontsDir
    },
    input: {
      captureDir: input.captureDir || '',
      restoreSlug: input.restoreSlug || '',
      restoreRelativeDir: input.restoreRelativeDir || '',
      pageTitle: input.pageTitle || '',
      pageUrl: input.pageUrl || '',
      hasLocalizedHtml: Boolean(input.localizedHtml),
      captureVariant: input.captureVariant || null
    }
  };
}

async function writeEvidencePackage(pageIR, outputPaths, input = {}) {
  const metaDir = outputPaths.metaDir;
  await fs.ensureDir(metaDir);

  const manifest = createProtocolManifest(pageIR, {
    pageDir: outputPaths.pageDir,
    entryFilePath: outputPaths.entryFilePath,
    qaReportPath: outputPaths.qaReportPath,
    imagesDir: outputPaths.imagesDir,
    fontsDir: outputPaths.fontsDir,
    metaDir,
    debugFiles: [
      'section-debug.json',
      'block-debug.json',
      'editability-debug.json',
      'generation-debug.json',
      'qa-report.json'
    ]
  });

  await fs.writeJson(path.join(metaDir, 'manifest.json'), manifest, { spaces: 2 });
  await fs.writeJson(path.join(metaDir, 'confidence-report.json'), pageIR.confidence, { spaces: 2 });
  await fs.writeJson(path.join(metaDir, 'editability-report.json'), pageIR.editability || {}, { spaces: 2 });
  await fs.writeJson(path.join(metaDir, 'qa-report.json'), pageIR.qa || {}, { spaces: 2 });
  await fs.writeJson(path.join(metaDir, 'section-debug.json'), buildSectionDebugRecords(pageIR), { spaces: 2 });
  await fs.writeJson(path.join(metaDir, 'block-debug.json'), buildBlockDebugRecords(pageIR), { spaces: 2 });
  await fs.writeJson(path.join(metaDir, 'editability-debug.json'), {
    summary: {
      score: Number(pageIR?.editability?.score || 0),
      status: pageIR?.editability?.status || 'unknown',
      readyState: pageIR?.readyState || 'blocked',
      qaStatus: pageIR?.qa?.status || 'unknown'
    },
    locationDimensions: pageIR?.editability?.locationDimensions || [],
    hotspots: pageIR?.editability?.hotspots || [],
    blockers: pageIR?.editability?.blockers || [],
    warnings: pageIR?.editability?.warnings || [],
    scoreDrivers: pageIR?.editability?.scoreDrivers || {},
    recommendedFirstEdits: pageIR?.editability?.recommendedFirstEdits || [],
    lowRiskTargets: pageIR?.editability?.lowRiskTargets || [],
    avoidForNow: pageIR?.editability?.avoidForNow || [],
    problemAreas: pageIR?.editability?.problemAreas || []
  }, { spaces: 2 });
  await fs.writeJson(path.join(metaDir, 'generation-debug.json'), buildGenerationDebug(pageIR, outputPaths, input), { spaces: 2 });

  const captureMetaPath = path.join(input.captureDir || '', 'capture.meta.json');
  const sourceHtmlPath = path.join(input.captureDir || '', 'source.original.html');
  const referenceImagePath = path.join(input.captureDir || '', 'reference_full.png');

  if (input.captureDir && await fs.pathExists(captureMetaPath)) {
    await fs.copy(captureMetaPath, path.join(metaDir, 'capture.meta.json'));
  }

  if (input.captureDir && await fs.pathExists(sourceHtmlPath)) {
    await fs.copy(sourceHtmlPath, path.join(metaDir, 'source.original.html'));
  }

  if (input.captureDir && await fs.pathExists(referenceImagePath)) {
    await fs.copy(referenceImagePath, path.join(metaDir, 'reference_full.png'));
  }
}

function buildPagesRegistry(pageIR, outputPaths, readyState, existingRegistry = {}) {
  const rootPageDir = path.join(PAGES_ROOT, pageIR.baseRouteId || pageIR.routeId);
  const currentEntryPath = path.relative(rootPageDir, outputPaths.entryFilePath).split(path.sep).join('/');
  const currentHandoffPath = path.relative(rootPageDir, path.join(outputPaths.pageDir, 'handoff.md')).split(path.sep).join('/');
  const existingViews = Array.isArray(existingRegistry?.views) ? existingRegistry.views : [];
  const expectedRegistryPageId = sanitizeSegment(String(pageIR.baseRouteId || pageIR.routeId).replace(/[\\/]+/g, '-'))
    || pageIR.pageSlug;
  const defaultViewTitle = existingViews.find((view) => view?.id === pageIR.view.defaultViewId)?.title;
  const registryPageId = existingRegistry?.pageId && !/-subviews-/.test(String(existingRegistry.pageId))
    ? existingRegistry.pageId
    : expectedRegistryPageId;
  const registryTitle = pageIR.view.viewId === pageIR.view.defaultViewId
    ? pageIR.pageTitle
    : (defaultViewTitle || existingRegistry?.title || pageIR.pageTitle);
  const nextView = {
    id: pageIR.view.viewId,
    label: pageIR.view.viewLabel,
    kind: pageIR.view.viewKind,
    order: pageIR.view.viewOrder,
    routeId: pageIR.routeId,
    entryPath: currentEntryPath,
    handoffPath: currentHandoffPath,
    readyState,
    qaStatus: pageIR?.qa?.status || 'unknown',
    releaseDecision: pageIR?.qa?.releaseDecision || 'unknown',
    qaSummary: pageIR?.qa?.summary?.label || '',
    editabilityScore: Number(pageIR?.editability?.score) || 0,
    editabilityStatus: pageIR?.editability?.status || 'unknown',
    title: pageIR.pageTitle,
    isDefault: pageIR.view.viewId === pageIR.view.defaultViewId
  };

  const mergedViews = existingViews
    .filter((view) => view && view.id !== nextView.id)
    .concat(nextView)
    .sort((left, right) => {
      if ((left.order || 0) !== (right.order || 0)) {
        return (left.order || 0) - (right.order || 0);
      }

      return String(left.id || '').localeCompare(String(right.id || ''));
    });

  return {
    protocolVersion: pageIR.protocolVersion,
    pageId: registryPageId,
    baseRouteId: pageIR.baseRouteId || pageIR.routeId,
    defaultViewId: pageIR.view.defaultViewId,
    currentViewId: pageIR.view.viewId,
    title: registryTitle,
    sourceUrl: existingRegistry?.sourceUrl || pageIR.sourceUrl,
    readyState,
    qaStatus: pageIR?.qa?.status || 'unknown',
    releaseDecision: pageIR?.qa?.releaseDecision || 'unknown',
    qaSummary: pageIR?.qa?.summary?.label || '',
    editabilityScore: Number(pageIR?.editability?.score) || 0,
    editabilityStatus: pageIR?.editability?.status || 'unknown',
    generatedAt: new Date().toISOString(),
    views: mergedViews
  };
}

async function writePagesRegistry(pageIR, outputPaths, readyState) {
  const rootPageDir = path.join(PAGES_ROOT, pageIR.baseRouteId || pageIR.routeId);
  const registryPath = path.join(rootPageDir, 'pages.json');
  await fs.ensureDir(rootPageDir);

  let existingRegistry = {};
  if (await fs.pathExists(registryPath)) {
    try {
      existingRegistry = await fs.readJson(registryPath);
    } catch (_error) {
      existingRegistry = {};
    }
  }

  const nextRegistry = buildPagesRegistry(pageIR, outputPaths, readyState, existingRegistry);
  await fs.writeJson(registryPath, nextRegistry, { spaces: 2 });
  return registryPath;
}

async function generatePagePackage(input = {}) {
  await ensureGeneratorRoots();

  const pageIR = await buildPageIR(input);
  const pageDir = path.join(PAGES_ROOT, pageIR.routeId);
  const metaDir = path.join(META_ROOT, pageIR.routeId);
  const readyState = pageIR.readyState || resolveReadyState(pageIR.confidence.page, pageIR.degradedSections, pageIR.editability);

  await fs.ensureDir(pageDir);
  const copiedAssets = await copyPageAssets(pageIR);
  const styleBundle = emitPageStyles(pageIR);
  pageIR.previewHead = String(pageIR.previewHeadTemplate || '').replace(
    '__PROTOREC_GENERATED_STYLE__',
    `<style data-protorec-generated-style>${styleBundle.previewCss}</style>`
  );

  const filesToWrite = [
    ['index.tsx', emitPageEntry(pageIR)],
    ['model.ts', emitPageModel(pageIR)],
    ['interactions.ts', emitPageInteractions(pageIR)],
    ['assets.ts', emitPageAssets(pageIR)],
    ['handoff.md', emitHandoff(pageIR)]
  ]
    .concat(styleBundle.files)
    .concat(emitPageSections(pageIR));

  for (const [fileName, fileContent] of filesToWrite) {
    const targetPath = path.join(pageDir, fileName);
    await fs.ensureDir(path.dirname(targetPath));
    await fs.writeFile(targetPath, `${String(fileContent).replace(/\s+$/, '')}\n`, 'utf8');
  }

  const outputPaths = {
    pageDir,
    entryFilePath: path.join(pageDir, 'index.tsx'),
    metaDir,
    qaReportPath: path.join(metaDir, 'qa-report.json'),
    imagesDir: copiedAssets.imagesDir,
    fontsDir: copiedAssets.fontsDir,
    sectionsDir: path.join(pageDir, 'sections'),
    stylesDir: path.join(pageDir, 'styles')
  };
  outputPaths.pagesJsonPath = await writePagesRegistry(pageIR, outputPaths, readyState);

  await writeEvidencePackage(pageIR, outputPaths, input);

  return {
    ...outputPaths,
    pageIR,
    readyState
  };
}

module.exports = {
  generatePagePackage
};
