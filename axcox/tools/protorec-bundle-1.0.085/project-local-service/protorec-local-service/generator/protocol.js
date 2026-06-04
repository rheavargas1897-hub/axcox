const {
  CONFIDENCE_THRESHOLDS,
  EDITABILITY_THRESHOLDS,
  GENERATION_MODE,
  PROTOCOL_VERSION
} = require('./config');

function uniqueStrings(values = []) {
  return Array.from(new Set(
    values
      .map((value) => String(value || '').trim())
      .filter(Boolean)
  ));
}

function clampNonNegativeInt(value) {
  return Math.max(0, Math.round(Number(value) || 0));
}

function mapAggregateStatusToReadyState(status = 'flagged') {
  if (status === 'pass') {
    return 'ready';
  }
  if (status === 'blocked') {
    return 'blocked';
  }
  return 'flagged';
}

function createGateCheck({
  key,
  label,
  status,
  actual,
  expected,
  message,
  severity = 'medium'
}) {
  return {
    key,
    label,
    status,
    severity,
    actual,
    expected,
    message
  };
}

function evaluateQAGate({
  pageConfidence = 0,
  degradedSections = [],
  editability = {},
  interactions = []
} = {}) {
  const numericPageConfidence = Number(pageConfidence) || 0;
  const editabilityScore = Number(editability?.score) || 0;
  const editabilityStatus = String(editability?.status || 'unknown');
  const editabilityBlockers = Array.isArray(editability?.blockers) ? editability.blockers : [];
  const editabilityWarnings = Array.isArray(editability?.warnings) ? editability.warnings : [];
  const recommendedFirstEdits = Array.isArray(editability?.recommendedFirstEdits) ? editability.recommendedFirstEdits : [];
  const lowRiskTargets = Array.isArray(editability?.lowRiskTargets) ? editability.lowRiskTargets : [];
  const avoidForNow = Array.isArray(editability?.avoidForNow) ? editability.avoidForNow : [];
  const problemAreas = Array.isArray(editability?.problemAreas) ? editability.problemAreas : [];
  const highSeverityProblemCount = problemAreas.filter((item) => item?.severity === 'high').length;
  const mediumSeverityProblemCount = problemAreas.filter((item) => item?.severity === 'medium').length;
  const degradedSectionCount = Array.isArray(degradedSections) ? degradedSections.length : 0;
  const interactionCount = Array.isArray(interactions) ? interactions.length : 0;
  const missingInteractionProtocol = editabilityWarnings.some((warning) => /未提取到稳定基础交互协议/.test(String(warning || '')));

  const pageConfidenceCheck = createGateCheck({
    key: 'page-confidence',
    label: 'Page Confidence',
    status: numericPageConfidence >= CONFIDENCE_THRESHOLDS.ready
      ? 'pass'
      : numericPageConfidence >= CONFIDENCE_THRESHOLDS.flagged
        ? 'flagged'
        : 'blocked',
    actual: Number(numericPageConfidence.toFixed(4)),
    expected: {
      readyAt: CONFIDENCE_THRESHOLDS.ready,
      workableAt: CONFIDENCE_THRESHOLDS.flagged
    },
    message: numericPageConfidence >= CONFIDENCE_THRESHOLDS.ready
      ? '页面置信度已达到可直接交付门槛'
      : numericPageConfidence >= CONFIDENCE_THRESHOLDS.flagged
        ? '页面置信度可用，但仍建议人工复核关键区域'
        : '页面置信度偏低，暂不建议直接交付给 PM + AI'
  });

  const editabilityScoreCheck = createGateCheck({
    key: 'editability-score',
    label: 'Editability Score',
    status: editabilityScore >= EDITABILITY_THRESHOLDS.ready
      ? 'pass'
      : editabilityScore >= EDITABILITY_THRESHOLDS.workable
        ? 'flagged'
        : 'blocked',
    actual: Number(editabilityScore.toFixed(2)),
    expected: {
      readyAt: EDITABILITY_THRESHOLDS.ready,
      workableAt: EDITABILITY_THRESHOLDS.workable,
      status: editabilityStatus
    },
    message: editabilityScore >= EDITABILITY_THRESHOLDS.ready
      ? '页面已具备较强的 AI 二次编辑适配性'
      : editabilityScore >= EDITABILITY_THRESHOLDS.workable
        ? '页面具备继续编辑基础，但结构和风险提示仍需关注'
        : '页面可编辑性不足，建议先补结构化拆分后再交付'
  });

  const degradedSectionsCheck = createGateCheck({
    key: 'degraded-sections',
    label: 'Degraded Sections',
    status: degradedSectionCount === 0
      ? 'pass'
      : degradedSectionCount <= 1
        ? 'flagged'
        : 'blocked',
    actual: degradedSectionCount,
    expected: {
      maxReady: 0,
      maxWorkable: 1
    },
    message: degradedSectionCount === 0
      ? '当前没有降级 section'
      : degradedSectionCount <= 1
        ? '存在少量降级 section，交付前建议优先复核'
        : '降级 section 过多，当前页面还不适合作为稳定起点'
  });

  const blockersCheck = createGateCheck({
    key: 'editability-blockers',
    label: 'Editability Blockers',
    status: editabilityBlockers.length ? 'blocked' : 'pass',
    actual: clampNonNegativeInt(editabilityBlockers.length),
    expected: {
      max: 0
    },
    message: editabilityBlockers.length
      ? `存在 ${editabilityBlockers.length} 个阻塞项，需先处理后再交付`
      : '当前没有记录到编辑性阻塞项'
  });

  const firstEditCheck = createGateCheck({
    key: 'recommended-first-edit',
    label: 'Recommended First Edit',
    status: recommendedFirstEdits.length ? 'pass' : 'blocked',
    actual: clampNonNegativeInt(recommendedFirstEdits.length),
    expected: {
      min: 1
    },
    message: recommendedFirstEdits.length
      ? '已能给出明确的一阶段 AI 起改目标'
      : '当前无法给出稳定的起改目标，不建议直接交付给 PM + AI'
  });

  const lowRiskTargetsCheck = createGateCheck({
    key: 'low-risk-targets',
    label: 'Low Risk Targets',
    status: lowRiskTargets.length >= 2
      ? 'pass'
      : lowRiskTargets.length === 1
        ? 'flagged'
        : 'blocked',
    actual: clampNonNegativeInt(lowRiskTargets.length),
    expected: {
      preferred: 2,
      minimum: 1
    },
    message: lowRiskTargets.length >= 2
      ? '已识别出多个低风险二次 vibecoding 入口'
      : lowRiskTargets.length === 1
        ? '仅识别出一个低风险入口，建议继续扩充可安全编辑区块'
        : '当前没有低风险编辑入口，交付风险偏高'
  });

  const problemAreasCheck = createGateCheck({
    key: 'problem-areas',
    label: 'Problem Areas',
    status: highSeverityProblemCount > 0
      ? 'blocked'
      : mediumSeverityProblemCount > 2
        ? 'flagged'
        : 'pass',
    actual: {
      total: clampNonNegativeInt(problemAreas.length),
      highSeverity: clampNonNegativeInt(highSeverityProblemCount),
      mediumSeverity: clampNonNegativeInt(mediumSeverityProblemCount),
      avoidForNow: clampNonNegativeInt(avoidForNow.length)
    },
    expected: {
      highSeverity: 0,
      mediumSeverityAtReady: 2
    },
    message: highSeverityProblemCount > 0
      ? '存在高风险问题区块，建议先处理再交付'
      : mediumSeverityProblemCount > 2
        ? '中风险问题区块偏多，建议带着诊断说明谨慎交付'
        : '当前问题区块数量处于可控范围'
  });

  const interactionProtocolCheck = createGateCheck({
    key: 'interaction-protocol',
    label: 'Interaction Protocol',
    status: interactionCount > 0
      ? 'pass'
      : missingInteractionProtocol
        ? 'flagged'
        : 'pass',
    actual: clampNonNegativeInt(interactionCount),
    expected: {
      preferred: 1
    },
    message: interactionCount > 0
      ? '已提取到基础交互协议'
      : missingInteractionProtocol
        ? '当前未提取到稳定基础交互协议，交付时需提醒 AI 谨慎改动交互区块'
        : '当前页面未检测到必须保留的稳定交互协议'
  });

  const checks = [
    pageConfidenceCheck,
    editabilityScoreCheck,
    degradedSectionsCheck,
    blockersCheck,
    firstEditCheck,
    lowRiskTargetsCheck,
    problemAreasCheck,
    interactionProtocolCheck
  ];

  const status = checks.some((check) => check.status === 'blocked')
    ? 'blocked'
    : checks.some((check) => check.status === 'flagged')
      ? 'flagged'
      : 'pass';
  const readyState = mapAggregateStatusToReadyState(status);
  const releaseDecision = status === 'pass'
    ? 'publishable'
    : status === 'flagged'
      ? 'review-before-publish'
      : 'do-not-publish';

  const derivedBlockers = checks
    .filter((check) => check.status === 'blocked')
    .map((check) => check.message);
  const derivedWarnings = checks
    .filter((check) => check.status === 'flagged')
    .map((check) => check.message);

  const blockers = uniqueStrings(editabilityBlockers.concat(derivedBlockers));
  const warnings = uniqueStrings(editabilityWarnings.concat(derivedWarnings));
  const primaryReason = blockers[0] || warnings[0] || '当前页面满足交付门槛';
  const summary = {
    label: status === 'pass'
      ? '可直接交付'
      : status === 'flagged'
        ? '可交付但需带诊断说明'
        : '暂不建议直接交付',
    description: primaryReason,
    recommendedAction: status === 'pass'
      ? '可将当前页面直接交给 PM 与 AI 继续二次 vibecoding'
      : status === 'flagged'
        ? '建议带着 handoff 与 qa-report 一起交付，并优先修改低风险 block'
        : '建议先处理 blockers / degraded sections / 无低风险入口等问题，再进入二次设计'
  };

  return {
    version: 1,
    status,
    readyState,
    releaseDecision,
    primaryReason,
    summary,
    checks,
    blockers,
    warnings,
    evidence: {
      pageConfidence: Number(numericPageConfidence.toFixed(4)),
      editabilityScore: Number(editabilityScore.toFixed(2)),
      editabilityStatus,
      degradedSectionCount,
      interactionCount,
      recommendedFirstEditCount: clampNonNegativeInt(recommendedFirstEdits.length),
      lowRiskTargetCount: clampNonNegativeInt(lowRiskTargets.length),
      avoidForNowCount: clampNonNegativeInt(avoidForNow.length),
      problemAreaCount: clampNonNegativeInt(problemAreas.length),
      highSeverityProblemCount: clampNonNegativeInt(highSeverityProblemCount),
      mediumSeverityProblemCount: clampNonNegativeInt(mediumSeverityProblemCount)
    },
    recommendations: {
      firstEdit: recommendedFirstEdits[0] || null,
      lowRiskTargets: lowRiskTargets.slice(0, 5),
      avoidForNow: avoidForNow.slice(0, 5),
      nextActions: Array.isArray(editability?.suggestedNextActions)
        ? editability.suggestedNextActions.slice(0, 5)
        : []
    }
  };
}

function resolveReadyState(pageConfidence = 0, degradedSections = [], editability = null) {
  const qa = evaluateQAGate({
    pageConfidence,
    degradedSections,
    editability
  });
  return qa.readyState;
}

function createProtocolManifest(pageIR, outputs = {}) {
  const pageConfidence = Number(pageIR?.confidence?.page) || 0;
  const degradedSections = Array.isArray(pageIR?.degradedSections) ? pageIR.degradedSections : [];
  const interactions = Array.isArray(pageIR?.interactions) ? pageIR.interactions : [];
  const editability = pageIR?.editability || null;
  const qa = pageIR?.qa || evaluateQAGate({
    pageConfidence,
    degradedSections,
    editability,
    interactions
  });
  const readyState = pageIR?.readyState || qa.readyState || resolveReadyState(pageConfidence, degradedSections, editability);

  return {
    protocolVersion: PROTOCOL_VERSION,
    pageSlug: pageIR.pageSlug,
    pageTitle: pageIR.pageTitle,
    source: {
      url: pageIR.sourceUrl,
      capturedAt: pageIR.capturedAt,
      viewport: pageIR.viewport
    },
    classification: {
      archetype: pageIR.archetype,
      sectionCount: Array.isArray(pageIR.sections) ? pageIR.sections.length : 0,
      interactionCount: interactions.length
    },
    generation: {
      mode: pageIR.generationMode || GENERATION_MODE,
      readyState,
      qaStatus: qa.status,
      releaseDecision: qa.releaseDecision,
      editabilityScore: Number(editability?.score) || 0,
      editabilityStatus: editability?.status || 'unknown',
      generatedAt: new Date().toISOString()
    },
    view: pageIR.view,
    confidence: pageIR.confidence,
    editability,
    qa,
    outputs,
    interactions,
    degradedSections
  };
}

module.exports = {
  createProtocolManifest,
  evaluateQAGate,
  resolveReadyState
};
