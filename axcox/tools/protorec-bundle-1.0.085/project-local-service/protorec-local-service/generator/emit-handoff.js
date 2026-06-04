const { resolveReadyState } = require('./protocol');

function formatTargetPath(target) {
  if (!target) {
    return 'main-content';
  }

  return target.targetType === 'block'
    ? `${target.sectionId}.${target.targetId}`
    : target.targetId;
}

function formatTargetBullet(target) {
  const targetPath = formatTargetPath(target);
  const componentName = target?.location?.componentName || target?.sectionComponentName || '';
  const selectorHint = target?.location?.selectorHint || '';
  const reasons = Array.isArray(target?.reasons) ? target.reasons.slice(0, 2).join('；') : '';
  const issues = Array.isArray(target?.issues) && target.issues.length
    ? `问题: ${target.issues.slice(0, 2).join('；')}`
    : '';

  return `- \`${targetPath}\` (${target.kind}, risk=${target.changeRisk}, suit=${target.suitabilityScore})${componentName ? ` component=\`${componentName}\`` : ''}${selectorHint ? ` selector=\`${selectorHint}\`` : ''}${reasons ? `: ${reasons}` : ''}${issues ? `；${issues}` : ''}`;
}

function emitHandoff(pageIR) {
  const readyState = pageIR.readyState || resolveReadyState(pageIR.confidence.page, pageIR.degradedSections, pageIR.editability);
  const editableHotspots = pageIR.sections
    .map((section) => section.id)
    .slice(0, 4);
  const primarySectionWithBlocks = pageIR.sections.find((section) => Array.isArray(section.blocks) && section.blocks.length);
  const primaryBlock = primarySectionWithBlocks?.blocks?.[0];
  const degradedSectionIds = pageIR.degradedSections.map((section) => section.id);
  const interactionKinds = Array.isArray(pageIR.interactions)
    ? Array.from(new Set(pageIR.interactions.map((interaction) => interaction.kind)))
    : [];
  const editability = pageIR.editability || {};
  const qa = pageIR.qa || {};
  const recommendedFirstEdit = Array.isArray(editability.recommendedFirstEdits)
    ? editability.recommendedFirstEdits[0]
    : null;
  const lowRiskTargets = Array.isArray(editability.lowRiskTargets)
    ? editability.lowRiskTargets.slice(0, 4)
    : [];
  const avoidForNow = Array.isArray(editability.avoidForNow)
    ? editability.avoidForNow.slice(0, 4)
    : [];
  const diagnosticFocusAreas = Array.isArray(editability.problemAreas)
    ? editability.problemAreas.slice(0, 6)
    : [];
  const negativeDrivers = Array.isArray(editability?.scoreDrivers?.negative)
    ? editability.scoreDrivers.negative
    : [];

  const sectionLines = pageIR.sections.map((section) => {
    const blockSuffix = Array.isArray(section.blocks) && section.blocks.length
      ? ` blocks=${section.blocks.length}`
      : '';
    return `- \`${section.id}\` (${section.kind}) confidence=${section.confidence.toFixed(2)} render=${section.renderMode}${blockSuffix}: ${section.summary || section.title}`;
  });
  const interactionLines = interactionKinds.length
    ? interactionKinds.map((kind) => `- 已生成 \`${kind}\` 基础交互协议，可在 \`interactions.ts\` 继续增强`)
    : ['- 默认保留了页面静态结构、链接语义与原始样式表现'];
  const degradedLines = degradedSectionIds.length
    ? degradedSectionIds.map((sectionId) => `- \`${sectionId}\` 当前仍以 fragment 方式承载，建议优先继续拆成语义化子组件`)
    : ['- 当前页面没有记录到降级区块'];
  const editabilityLines = [
    `- Editability Score: \`${Number(editability.score || 0).toFixed(2)}\` / 100`,
    `- Editability Status: \`${editability.status || 'unknown'}\``,
    `- QA Status: \`${qa.status || 'unknown'}\``,
    `- Release Decision: \`${qa.releaseDecision || 'unknown'}\``,
    `- Editable Hotspots: \`${editability.editableHotspotCount || 0}\``
  ]
    .concat((editability.warnings || []).map((warning) => `- Warning: ${warning}`))
    .concat((editability.blockers || []).map((blocker) => `- Blocker: \`${blocker}\``));
  const recommendedFirstEditLines = recommendedFirstEdit
    ? [
      `- 推荐起点: \`${formatTargetPath(recommendedFirstEdit)}\` (${recommendedFirstEdit.kind})`,
      `- 风险等级: \`${recommendedFirstEdit.changeRisk}\`，适合度: \`${recommendedFirstEdit.suitabilityScore}\``,
      `- 原因: ${(recommendedFirstEdit.reasons || []).slice(0, 3).join('；') || '已结构化、便于局部编辑'}`,
      `- 建议动作: ${recommendedFirstEdit.recommendedAction || '优先做局部 vibecoding'}`
    ]
    : ['- 当前没有稳定的一阶段推荐编辑目标，建议先补结构拆分与命名'];
  const lowRiskLines = lowRiskTargets.length
    ? lowRiskTargets.map(formatTargetBullet)
    : ['- 当前暂无明确低风险区块，建议先提升结构化输出质量'];
  const avoidLines = avoidForNow.length
    ? avoidForNow.map(formatTargetBullet)
    : ['- 当前没有明确标记为暂缓修改的区块'];
  const diagnosticFocusLines = diagnosticFocusAreas.length
    ? diagnosticFocusAreas.map((target) => {
      const targetPath = formatTargetPath(target);
      const issues = Array.isArray(target.issues) && target.issues.length
        ? target.issues.join('；')
        : '当前为重点复核目标';
      return `- \`${targetPath}\` (${target.kind}, severity=${target.severity}, risk=${target.changeRisk})：${issues}`;
    })
    : ['- 当前没有额外的高优先诊断焦点'];
  const scoreDriverLines = negativeDrivers.length
    ? negativeDrivers.map((driver) => `- ${driver.summary}`)
    : ['- 当前没有明显的结构性负向因子'];
  const promptLines = [
    recommendedFirstEdit
      ? `- “请先优化 \`${formatTargetPath(recommendedFirstEdit)}\`，优先保持当前视觉表现和交互语义，只做局部结构清理与样式增强。”`
      : primarySectionWithBlocks && primaryBlock
        ? `- “请先优化 \`${primarySectionWithBlocks.id}\` 下的 \`${primaryBlock.id}\` block，把当前结构继续抽成更清晰的 React 子组件，并保留现有视觉表现。”`
        : `- “请先优化 \`${editableHotspots[0] || 'main-content'}\`，把当前 fragment 内容继续拆成更清晰的 React 子组件，并保留现有视觉表现。”`,
    '- “请基于 \`sections/\` 目录，把相邻的重复结构抽成可复用片段，减少硬编码 HTML。”',
    '- “请在不改变页面主布局的前提下，继续完善 \`interactions.ts\` 中的基础交互行为。”',
    avoidForNow.length
      ? `- “暂时不要直接改动 ${avoidForNow.slice(0, 2).map((target) => `\`${formatTargetPath(target)}\``).join('、')}，这些区块当前风险偏高，应先确认结构与行为边界。”`
      : '- “优先选择 low risk block 进行二次 vibecoding，再逐步处理复杂区块。”'
  ];

  return `---
pageSlug: ${pageIR.pageSlug}
pageTitle: ${pageIR.pageTitle}
archetype: ${pageIR.archetype}
generationMode: ${pageIR.generationMode}
pageConfidence: ${pageIR.confidence.page.toFixed(2)}
editabilityScore: ${Number(pageIR.editability?.score || 0).toFixed(2)}
editabilityStatus: ${pageIR.editability?.status || 'unknown'}
qaStatus: ${qa.status || 'unknown'}
releaseDecision: ${qa.releaseDecision || 'unknown'}
readyState: ${readyState}
viewId: ${pageIR.view.viewId}
viewLabel: ${pageIR.view.viewLabel}
recommendedFirstEdit: ${recommendedFirstEdit ? formatTargetPath(recommendedFirstEdit) : 'none'}
editableHotspots:
${editableHotspots.map((item) => `  - ${item}`).join('\n') || '  - main-content'}
degradedSections:
${degradedSectionIds.map((item) => `  - ${item}`).join('\n') || '  - none'}
---

## Page Goal
该页面由 ProtoRec 基于真实抓取结果生成，目标是提供一个保留原页面视觉和基础结构的源码起点，便于产品经理继续使用 AI 做二次原型设计。

## View Context
- 当前视图: \`${pageIR.view.viewId}\` (${pageIR.view.viewLabel})
- 基础路由: \`${pageIR.view.baseRouteId}\`
- 多视图模式: ${pageIR.view.isSubview || pageIR.view.viewId !== 'default' ? '是' : '否'}

## Section Map
${sectionLines.join('\n') || '- 暂未识别到稳定区块，当前页面使用回退结构输出'}

## Preserved Interactions
${interactionLines.join('\n')}

## Low Confidence Areas
${degradedLines.join('\n')}

## Editability Gate
${editabilityLines.join('\n')}

## Recommended First Edit
${recommendedFirstEditLines.join('\n')}

## Low Risk Targets
${lowRiskLines.join('\n')}

## Avoid For Now
${avoidLines.join('\n')}

## Diagnostic Focus Areas
${diagnosticFocusLines.join('\n')}

## Score Drivers
${scoreDriverLines.join('\n')}

## Suggested AI Prompts
${promptLines.join('\n')}
`;
}

module.exports = {
  emitHandoff
};
