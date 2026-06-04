const cheerio = require('cheerio');

function mergeClassNames(...classNames) {
  return classNames
    .flatMap((className) => String(className || '').split(/\s+/))
    .map((className) => className.trim())
    .filter(Boolean)
    .filter((className, index, list) => list.indexOf(className) === index)
    .join(' ');
}

function decorateMarkupRoots(markup, attributes = {}) {
  const html = String(markup || '');
  if (!html.trim()) {
    return html;
  }

  const $ = cheerio.load(`<div id="__protorec-root">${html}</div>`, { decodeEntities: false });
  const roots = $('#__protorec-root')
    .contents()
    .filter((_, node) => node.type === 'tag');

  if (!roots.length) {
    return html;
  }

  roots.each((_, element) => {
    const $element = $(element);

    Object.entries(attributes).forEach(([name, value]) => {
      if (value === null || value === undefined || value === '') {
        return;
      }

      if (name === 'class') {
        $element.attr('class', mergeClassNames($element.attr('class'), String(value)));
        return;
      }

      $element.attr(name, String(value));
    });
  });

  return $('#__protorec-root').html() || html;
}

function decorateBlockMarkup(pageClassName, block) {
  return decorateMarkupRoots(block.markup, {
    class: `${pageClassName}__block ${pageClassName}__block--${block.id}`,
    'data-block-id': block.id,
    'data-block-kind': block.kind,
    'data-block-confidence': block.confidence
  });
}

function emitSharedSectionRuntime() {
  return `import React from 'react';

export type ContextWrapper = {
  tagName: string;
  attrs: Record<string, string>;
  selectorHint?: string;
  reason?: string;
};

export type SectionMeta = {
  id: string;
  title: string;
  kind: string;
  confidence: number;
  summary: string;
  renderMode: string;
  shellTag: string;
  componentName: string;
  interactionIds: string[];
  pageClassName: string;
  blockCount: number;
  contextWrappers: ContextWrapper[];
  diagnostics: Record<string, unknown> | null;
};

export type SectionBlockMeta = {
  id: string;
  sectionId: string;
  title: string;
  kind: string;
  confidence: number;
  summary: string;
  renderMode: string;
  interactionIds: string[];
  diagnostics: Record<string, unknown> | null;
};

function styleTextToObject(styleText: string) {
  return String(styleText || '')
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((result, declaration) => {
      const separatorIndex = declaration.indexOf(':');
      if (separatorIndex < 0) {
        return result;
      }

      const property = declaration.slice(0, separatorIndex).trim();
      const value = declaration.slice(separatorIndex + 1).trim();
      if (!property || !value) {
        return result;
      }

      if (property.startsWith('--')) {
        result[property] = value;
        return result;
      }

      const reactProperty = property.replace(/-([a-z])/g, (_, character) => character.toUpperCase());
      result[reactProperty] = value;
      return result;
    }, {});
}

function buildContextProps(attrs: Record<string, string> = {}) {
  const props: Record<string, unknown> = {};

  Object.entries(attrs).forEach(([name, value]) => {
    if (name === 'class') {
      props.className = value;
      return;
    }

    if (name === 'style') {
      props.style = styleTextToObject(value);
      return;
    }

    if (name === 'tabindex') {
      const numericTabIndex = Number(value);
      props.tabIndex = Number.isFinite(numericTabIndex) ? numericTabIndex : value;
      return;
    }

    props[name] = value;
  });

  return props;
}

function getSectionTag(section: SectionMeta) {
  switch (section.shellTag) {
    case 'header':
      return 'header';
    case 'footer':
      return 'footer';
    case 'aside':
      return 'aside';
    default:
      return 'section';
  }
}

export function ContextShell({
  wrappers,
  children
}: {
  wrappers: ContextWrapper[];
  children: React.ReactNode;
}) {
  if (!Array.isArray(wrappers) || !wrappers.length) {
    return <>{children}</>;
  }

  return wrappers.reduceRight<React.ReactNode>((inner, wrapper, index) => {
    const Tag = (wrapper.tagName || 'div') as keyof React.JSX.IntrinsicElements;
    return React.createElement(
      Tag,
      {
        key: \`\${wrapper.tagName || 'div'}-\${index}\`,
        ...buildContextProps(wrapper.attrs || {})
      },
      inner
    );
  }, children);
}

export function SectionFrame({
  section,
  html,
  children
}: {
  section: SectionMeta;
  html?: string | null;
  children?: React.ReactNode;
}) {
  const Tag = getSectionTag(section);
  const frameProps = {
    className: \`\${section.pageClassName}__section \${section.pageClassName}__section--\${section.id}\`,
    'data-section-id': section.id,
    'data-section-kind': section.kind,
    'data-section-confidence': section.confidence
  } as const;

  if (typeof html === 'string') {
    return (
      <Tag
        {...frameProps}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <Tag {...frameProps}>{children}</Tag>
  );
}

export function ContextShellHtml({
  wrappers,
  html,
  pageClassName
}: {
  wrappers: ContextWrapper[];
  html: string;
  pageClassName: string;
}) {
  if (!String(html || '').trim()) {
    return null;
  }

  if (!Array.isArray(wrappers) || !wrappers.length) {
    return (
      <div
        className={\`\${pageClassName}__section-shell\`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  const lastWrapperIndex = wrappers.length - 1;

  return wrappers.reduceRight<React.ReactNode>((inner, wrapper, index) => {
    const Tag = (wrapper.tagName || 'div') as keyof React.JSX.IntrinsicElements;
    const props = {
      key: \`\${wrapper.tagName || 'div'}-\${index}\`,
      ...buildContextProps(wrapper.attrs || {})
    };

    if (index === lastWrapperIndex) {
      return React.createElement(Tag, {
        ...props,
        dangerouslySetInnerHTML: { __html: html }
      });
    }

    return React.createElement(Tag, props, inner);
  }, null);
}

export function RawHtmlBlock({
  html,
  pageClassName
}: {
  html: string;
  pageClassName: string;
}) {
  return (
    <div
      className={\`\${pageClassName}__section-content\`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function SectionBlockFrame({
  block,
  pageClassName,
  children
}: {
  block: SectionBlockMeta;
  pageClassName: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={\`\${pageClassName}__block \${pageClassName}__block--\${block.id}\`}
      data-block-id={block.id}
      data-block-kind={block.kind}
      data-block-confidence={block.confidence}
    >
      {children}
    </div>
  );
}
`;
}

function emitSectionComponent(pageIR, section) {
  const pageClassName = `page-${pageIR.pageSlug}`;
  const sectionMeta = {
    id: section.id,
    title: section.title,
    kind: section.kind,
    confidence: section.confidence,
    summary: section.summary,
    renderMode: section.renderMode,
    shellTag: section.shellTag,
    componentName: section.componentName,
    interactionIds: section.interactionIds,
    pageClassName,
    blockCount: Array.isArray(section.blocks) ? section.blocks.length : 0,
    contextWrappers: Array.isArray(section.contextWrappers) ? section.contextWrappers : [],
    diagnostics: section.diagnostics || null
  };
  const blockPayload = Array.isArray(section.blocks)
    ? section.blocks.map((block) => ({
      id: block.id,
      sectionId: block.sectionId || section.id,
      title: block.title,
      kind: block.kind,
      confidence: block.confidence,
      summary: block.summary,
      renderMode: block.renderMode,
      interactionIds: block.interactionIds,
      diagnostics: block.diagnostics || null,
      markup: block.markup
    }))
    : [];
  const renderedHtml = blockPayload.length
    ? blockPayload.map((block) => decorateBlockMarkup(pageClassName, block)).join('')
    : String(section.markup || '');
  const contextWrappers = Array.isArray(section.contextWrappers) ? section.contextWrappers : [];

  return `import React from 'react';
import { ContextShellHtml, SectionFrame, type SectionMeta } from './_shared';

const renderedHtml = ${JSON.stringify(renderedHtml)};
const contextWrappers = ${JSON.stringify(contextWrappers, null, 2)};

export const sectionMeta: SectionMeta = ${JSON.stringify(sectionMeta, null, 2)};

const ${section.componentName}: React.FC = () => {
  return (
    <SectionFrame
      section={sectionMeta}
      html={contextWrappers.length ? null : renderedHtml}
    >
      {contextWrappers.length ? (
        <ContextShellHtml
          wrappers={contextWrappers}
          html={renderedHtml}
          pageClassName={sectionMeta.pageClassName}
        />
      ) : null}
    </SectionFrame>
  );
};

${section.componentName}.displayName = ${JSON.stringify(section.componentName)};

export default ${section.componentName};
`;
}

function emitSectionsIndex(pageIR) {
  const imports = pageIR.sections.map((section) => {
    return `import ${section.componentName}, { sectionMeta as ${section.id.replace(/[^a-zA-Z0-9]/g, '')}Meta } from './${section.componentName}';`;
  }).join('\n');

  const sectionEntries = pageIR.sections.map((section) => {
    return `  { meta: ${section.id.replace(/[^a-zA-Z0-9]/g, '')}Meta, Component: ${section.componentName} }`;
  }).join(',\n');

  return `import React from 'react';
import { type SectionMeta } from './_shared';
${imports}

export type GeneratedSectionModule = {
  meta: SectionMeta;
  Component: React.FC;
};

export const pageSections: GeneratedSectionModule[] = [
${sectionEntries}
];
`;
}

function emitPageSections(pageIR) {
  const files = [
    ['sections/_shared.tsx', emitSharedSectionRuntime()],
    ['sections/index.ts', emitSectionsIndex(pageIR)]
  ];

  pageIR.sections.forEach((section) => {
    files.push([`sections/${section.componentName}.tsx`, emitSectionComponent(pageIR, section)]);
  });

  return files;
}

module.exports = {
  emitPageSections
};
