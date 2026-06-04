/**
 * Self-contained design system preview for Make theme-library imports.
 */

import React from 'react';
import './globals.css';
import themeData from './theme.json';
import previewImage from './assets/official-homepage.webp?url';

type PaletteItem = {
  color?: string;
  labelZh?: string;
  labelEn?: string;
  textColor?: string;
};

type UsageGuidance = {
  do?: string[];
  dont?: string[];
};

function fontStack(fontName: string | undefined, fallback: string): string {
  const name = String(fontName || '').trim();
  if (!name || name === 'ui-monospace') return fallback;
  return `"${name.replace(/"/g, '')}", ${fallback}`;
}

function cssVars(): React.CSSProperties {
  const palette = themeData.tokens.palette || [];
  const typography = themeData.tokens.typography || {};
  const radius = themeData.tokens.radius || {};
  const spacingScale = (themeData.tokens.spacing || {}) as Record<string, string | undefined>;
  return {
    '--theme-accent': palette[0] || '#111827',
    '--theme-accent-2': palette[1] || palette[0] || '#111827',
    '--theme-bg': palette.find((color) => color === '#ffffff' || color === '#f9f9f7' || color === '#f7f7f7') || palette[4] || '#ffffff',
    '--theme-surface': palette.find((color) => color === '#ffffff') || '#ffffff',
    '--theme-text': palette.find((color) => color === '#000000' || color === '#111827' || color === '#1a1a1a') || '#111827',
    '--theme-muted': palette[2] || '#6b7280',
    '--theme-border': palette[9] || palette[5] || '#e5e7eb',
    '--theme-radius-card': radius.card || '12px',
    '--theme-radius-control': radius.control || '8px',
    '--theme-spacing-section': spacingScale.section || spacingScale.xxl || spacingScale.xl || '64px',
    '--theme-font-display': fontStack(typography.display, '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'),
    '--theme-font-body': fontStack(typography.body, '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'),
    '--theme-font-mono': fontStack(typography.mono, 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'),
  } as React.CSSProperties;
}

const display = themeData.display;
const tokens = themeData.tokens;
const usage = (display.usageGuidance || {}) as UsageGuidance;
const palette = (display.palette || tokens.palette.map((color) => ({ color }))) as PaletteItem[];
const spacing = Object.entries(tokens.spacing || {}).filter(([key]) => key !== 'source');

const Component: React.FC = () => (
  <main className="theme-import-page" style={cssVars()}>
    <section className="theme-import-hero">
      <div className="theme-import-copy">
        <p className="theme-import-eyebrow">{themeData.source.sourceName}</p>
        <h1>{display.brandAlias || themeData.identity.titleEn}</h1>
        <p className="theme-import-description">{display.descriptionEn || display.description}</p>
        <div className="theme-import-tags">
          {display.distributionTags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
      </div>
      <figure className="theme-import-preview">
        <img src={previewImage} alt={`${display.brandAlias || themeData.identity.titleEn} preview`} />
      </figure>
    </section>

    <section className="theme-import-section">
      <div>
        <p className="theme-import-eyebrow">Palette</p>
        <h2>Color Tokens</h2>
      </div>
      <div className="theme-import-palette">
        {palette.map((item, index) => (
          <div className="theme-import-swatch" key={`${item.color}-${index}`}>
            <span style={{ background: item.color || '#ffffff' }} />
            <strong>{item.labelEn || item.labelZh || `Color ${index + 1}`}</strong>
            <code>{item.color}</code>
          </div>
        ))}
      </div>
    </section>

    <section className="theme-import-grid">
      <article>
        <p className="theme-import-eyebrow">Typography</p>
        <h2>Type System</h2>
        <dl>
          <div><dt>Display</dt><dd>{tokens.typography.display}</dd></div>
          <div><dt>Body</dt><dd>{tokens.typography.body}</dd></div>
          <div><dt>Mono</dt><dd>{tokens.typography.mono}</dd></div>
        </dl>
      </article>
      <article>
        <p className="theme-import-eyebrow">Spacing</p>
        <h2>Layout Rhythm</h2>
        <dl>
          {spacing.slice(0, 8).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}
        </dl>
      </article>
    </section>

    <section className="theme-import-grid">
      <article>
        <p className="theme-import-eyebrow">Recommended</p>
        <h2>Do</h2>
        <ul>{(usage.do || []).slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul>
      </article>
      <article>
        <p className="theme-import-eyebrow">Avoid</p>
        <h2>Don't</h2>
        <ul>{(usage.dont || []).slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul>
      </article>
    </section>
  </main>
);

export default Component;
