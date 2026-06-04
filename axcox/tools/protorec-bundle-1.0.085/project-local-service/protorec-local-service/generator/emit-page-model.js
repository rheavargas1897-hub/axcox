function emitPageModel(pageIR) {
  const serializedSections = pageIR.sections.map((section) => ({
    id: section.id,
    title: section.title,
    kind: section.kind,
    confidence: Number(section.confidence || 0),
    summary: section.summary,
    renderMode: section.renderMode,
    shellTag: section.shellTag,
    componentName: section.componentName,
    interactionIds: section.interactionIds,
    blockCount: Array.isArray(section.blocks) ? section.blocks.length : 0
  }));

  return `export type GeneratedPageSectionMeta = {
  id: string;
  title: string;
  kind: string;
  confidence: number;
  summary: string;
  renderMode: string;
  shellTag: string;
  componentName: string;
  interactionIds: string[];
  blockCount: number;
};

export type GeneratedViewMeta = {
  baseRouteId: string;
  assetSlug?: string;
  currentRouteId: string;
  viewId: string;
  viewKind: string;
  viewLabel: string;
  viewOrder: number;
  isSubview: boolean;
  defaultViewId: string;
};

export type GeneratedEditabilityReport = {
  score: number;
  normalizedScore: number;
  status: string;
  editableHotspotCount: number;
  hotspots: string[];
  blockers: string[];
  warnings: string[];
  suggestedNextActions: string[];
  locationDimensions: Array<{
    key: string;
    label: string;
    description: string;
  }>;
  problemAreas: GeneratedEditabilityTarget[];
  recommendedFirstEdits: GeneratedEditabilityTarget[];
  lowRiskTargets: GeneratedEditabilityTarget[];
  avoidForNow: GeneratedEditabilityTarget[];
  scoreDrivers: {
    positive: Array<{
      key: string;
      weight: string;
      summary: string;
    }>;
    negative: Array<{
      key: string;
      weight: string;
      summary: string;
    }>;
  };
  breakdown: {
    structure: number;
    decomposition: number;
    maintainability: number;
    stability: number;
  };
  metrics: {
    totalSections: number;
    structuredSectionCount: number;
    blockSectionCount: number;
    totalBlocks: number;
    fallbackSectionCount: number;
    oversizedSectionCount: number;
    oversizedUnsplitSectionCount: number;
    lowConfidenceSectionCount: number;
    interactionCount: number;
    interactiveSurfaceCount: number;
    sectionNameQualityCount: number;
    blockNameQualityCount: number;
    recommendedFirstEditCount: number;
    lowRiskTargetCount: number;
    avoidForNowCount: number;
    problemAreaCount: number;
  };
};

export type GeneratedEditabilityTarget = {
  targetType: string;
  sectionId: string;
  sectionTitle: string;
  sectionKind: string;
  componentName: string;
  sectionComponentName: string;
  targetId: string;
  title: string;
  kind: string;
  summary: string;
  renderMode: string;
  confidence: number;
  interactionIds: string[];
  interactionCount: number;
  htmlLength: number;
  changeRisk: string;
  suitabilityScore: number;
  reasons: string[];
  issues: string[];
  severity: string;
  recommendedAction: string;
  location: {
    sectionId: string;
    blockId: string | null;
    componentName: string;
    selectorHint: string;
    matchedRules: string[];
    renderMode: string;
    targetKind: string;
    interactionIds: string[];
  };
};

export type GeneratedContextWrapper = {
  tagName: string;
  attrs: Record<string, string>;
  selectorHint?: string;
  reason?: string;
};

export const pageMeta = ${JSON.stringify(pageIR.pageMeta, null, 2)} as const;

export const readyState = ${JSON.stringify(pageIR.readyState || 'flagged')} as const;

export const viewMeta: GeneratedViewMeta = ${JSON.stringify(pageIR.view, null, 2)};

export const editability: GeneratedEditabilityReport = ${JSON.stringify(pageIR.editability, null, 2)};

export const sectionOrder = ${JSON.stringify(pageIR.sectionOrder, null, 2)} as const;

export const sectionCatalog: GeneratedPageSectionMeta[] = ${JSON.stringify(serializedSections, null, 2)};

export const degradedSections = ${JSON.stringify(pageIR.degradedSections, null, 2)} as const;

export const pageContextWrappers: GeneratedContextWrapper[] = ${JSON.stringify(pageIR.pageContextWrappers || [], null, 2)};

export const previewHead = ${JSON.stringify(pageIR.previewHead || pageIR.previewHeadTemplate || '')};

export const previewBodyMarkup = "";

export const previewBodyClassName = ${JSON.stringify(pageIR.bodyAttributes.className || '')};

export const previewBodyStyle = ${JSON.stringify(pageIR.bodyAttributes.style || '')};

export const previewBodyDataAttributes = ${JSON.stringify(pageIR.bodyAttributes.dataAttributes || '')};
`;
}

module.exports = {
  emitPageModel
};
