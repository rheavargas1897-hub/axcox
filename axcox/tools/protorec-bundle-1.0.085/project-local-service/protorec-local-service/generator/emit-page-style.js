function buildTokensCss(pageIR) {
  const pageClassName = `page-${pageIR.pageSlug}`;

  return [
    `.${pageClassName} {`,
    '  --protorec-page-bg: var(--yzw-color-bg-normal, var(--proxima-background-color, #f5f5f5));',
    '  --protorec-page-surface: var(--yzw-color-bg-pure, #ffffff);',
    '  --protorec-page-text: #111827;',
    '  --protorec-page-muted: rgba(17, 24, 39, 0.6);',
    '  --protorec-page-border: rgba(17, 24, 39, 0.08);',
    '  --protorec-page-radius: 16px;',
    '  --protorec-page-gap: 24px;',
    '  min-height: 100vh;',
    '  color: var(--protorec-page-text);',
    '  background: var(--protorec-page-bg);',
    '}',
    '',
    `.${pageClassName}, .${pageClassName} * {`,
    '  box-sizing: border-box;',
    '}',
    '',
    `.${pageClassName} a {`,
    '  color: inherit;',
    '}',
    '',
    `.${pageClassName} [hidden] {`,
    '  display: none !important;',
    '}',
    ''
  ].join('\n');
}

function buildSectionsCss(pageIR) {
  const pageClassName = `page-${pageIR.pageSlug}`;
  const kindRules = pageIR.sections.map((section) => {
    const lines = [
      `.${pageClassName}__section--${section.id} {`
    ];

    if (section.kind === 'floating-layer') {
      lines.push('  z-index: 12;');
    } else if (section.kind === 'top-bar') {
      lines.push('  z-index: 8;');
    }

    if (section.kind === 'footer') {
      lines.push('  border-top: 1px solid var(--protorec-page-border);');
    }

    lines.push('}');
    return lines.join('\n');
  }).join('\n\n');

  return [
    `.${pageClassName} {`,
    '  position: relative;',
    '}',
    '',
    `.${pageClassName}__section {`,
    '  position: relative;',
    '}',
    '',
    `.${pageClassName}__section-shell {`,
    '  position: relative;',
    '}',
    '',
    `.${pageClassName} [data-protorec-interaction-kind="tabs"] [data-protorec-panel-index][data-protorec-panel-active="false"] {`,
    '  display: none;',
    '}',
    '',
    `.${pageClassName} [data-protorec-interaction-kind="dropdown"][data-protorec-open="false"] [data-protorec-dropdown-menu] {`,
    '  display: none;',
    '}',
    '',
    `.${pageClassName} [data-protorec-interaction-kind="dismissible"][data-protorec-closed="true"] {`,
    '  display: none !important;',
    '}',
    '',
    kindRules,
    ''
  ].join('\n');
}

function buildSourceCss(pageIR, cssText) {
  const normalizedCssText = String(cssText || '').trim();
  return normalizedCssText
    ? ['/* ProtoRec extracted source styles */', normalizedCssText, ''].join('\n')
    : '/* ProtoRec extracted source styles: none */\n';
}

function emitPageStyles(pageIR) {
  const tokensCss = buildTokensCss(pageIR);
  const sectionsCss = buildSectionsCss(pageIR);
  const sourceCss = buildSourceCss(pageIR, pageIR.sourceCssText);
  const previewCss = [
    tokensCss,
    sectionsCss,
    buildSourceCss(pageIR, pageIR.previewCssText)
  ].join('\n');

  return {
    files: [
      [
        'style.css',
        [
          "@import './styles/tokens.css';",
          "@import './styles/sections.css';",
          "@import './styles/source.css';",
          ''
        ].join('\n')
      ],
      ['styles/tokens.css', tokensCss],
      ['styles/sections.css', sectionsCss],
      ['styles/source.css', sourceCss]
    ],
    previewCss
  };
}

module.exports = {
  emitPageStyles
};
