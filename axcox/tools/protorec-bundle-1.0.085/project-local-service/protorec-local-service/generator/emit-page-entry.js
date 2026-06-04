const { toPascalCase } = require('./naming');

function emitPageEntry(pageIR) {
  const pageClassName = `page-${pageIR.pageSlug}`;
  const componentName = `${toPascalCase(pageIR.pageSlug)}Page`;

  return `import React from 'react';
import './style.css';

import { pageInteractions, useProtoPageInteractions } from './interactions';
import {
  editability,
  pageMeta,
  pageContextWrappers,
  previewBodyClassName,
  previewBodyDataAttributes,
  previewBodyMarkup,
  readyState,
  previewBodyStyle,
  previewHead
} from './model';
import { pageSections } from './sections';
import { ContextShell } from './sections/_shared';

type GeneratedPageComponent = React.FC & {
  previewHead?: string;
  previewBodyMarkup?: string;
  previewBodyClassName?: string;
  previewBodyStyle?: string;
  previewBodyDataAttributes?: string;
  restoreSlug?: string;
  protocolVersion?: string;
};

const pageClassName = ${JSON.stringify(pageClassName)};

function usePreviewBodyEnvironment(
  className: string,
  styleText: string,
  dataAttributes: string
) {
  React.useEffect(() => {
    if (typeof document === 'undefined' || !document.body) {
      return undefined;
    }

    const body = document.body;
    const previousClassName = body.getAttribute('class') || '';
    const previousStyle = body.getAttribute('style') || '';
    const previousDataAttributes = Array.from(body.attributes)
      .filter((attribute) => attribute.name.startsWith('data-'))
      .map((attribute) => [attribute.name, attribute.value] as const);

    Array.from(body.attributes)
      .filter((attribute) => attribute.name.startsWith('data-'))
      .forEach((attribute) => body.removeAttribute(attribute.name));

    if (dataAttributes.trim()) {
      const parser = document.createElement('div');
      parser.innerHTML = '<body ' + dataAttributes + '></body>';
      const desiredBody = parser.firstElementChild;
      if (desiredBody) {
        Array.from(desiredBody.attributes).forEach((attribute) => {
          body.setAttribute(attribute.name, attribute.value);
        });
      }
    }

    if (className.trim()) {
      body.setAttribute('class', className);
    } else {
      body.removeAttribute('class');
    }

    if (styleText.trim()) {
      body.setAttribute('style', styleText);
    } else {
      body.removeAttribute('style');
    }

    return () => {
      previousDataAttributes.forEach(([name, value]) => {
        body.setAttribute(name, value);
      });

      Array.from(body.attributes)
        .filter((attribute) => attribute.name.startsWith('data-') && !previousDataAttributes.find(([name]) => name === attribute.name))
        .forEach((attribute) => body.removeAttribute(attribute.name));

      if (previousClassName) {
        body.setAttribute('class', previousClassName);
      } else {
        body.removeAttribute('class');
      }

      if (previousStyle) {
        body.setAttribute('style', previousStyle);
      } else {
        body.removeAttribute('style');
      }
    };
  }, [className, styleText, dataAttributes]);
}

const ${componentName}: GeneratedPageComponent = () => {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  useProtoPageInteractions(rootRef, pageInteractions);
  usePreviewBodyEnvironment(previewBodyClassName, previewBodyStyle, previewBodyDataAttributes);

  return (
    <div
      ref={rootRef}
      className={pageClassName}
      data-page-id={pageMeta.id}
      data-route-id={pageMeta.routeId}
      data-view-id={pageMeta.viewId}
      data-archetype={pageMeta.archetype}
      data-generation-mode={pageMeta.generationMode}
      data-ready-state={readyState}
      data-editability-status={editability.status}
      data-editability-score={editability.score}
    >
      {pageContextWrappers.length ? (
        <ContextShell wrappers={pageContextWrappers}>
          {pageSections.map(({ meta, Component }) => (
            <Component key={meta.id} />
          ))}
        </ContextShell>
      ) : (
        pageSections.map(({ meta, Component }) => (
          <Component key={meta.id} />
        ))
      )}
    </div>
  );
};

${componentName}.previewHead = previewHead;
${componentName}.previewBodyMarkup = previewBodyMarkup;
${componentName}.previewBodyClassName = previewBodyClassName;
${componentName}.previewBodyStyle = previewBodyStyle;
${componentName}.previewBodyDataAttributes = previewBodyDataAttributes;
${componentName}.restoreSlug = pageMeta.routeId;
${componentName}.protocolVersion = pageMeta.protocolVersion;
${componentName}.displayName = ${JSON.stringify(componentName)};

export default ${componentName};
`;
}

module.exports = {
  emitPageEntry
};
