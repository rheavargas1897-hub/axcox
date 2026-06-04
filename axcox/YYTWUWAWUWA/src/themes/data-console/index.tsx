/**
 * @name 营运通 — Operations Console Theme
 * 表格驱动型后台管理系统
 * 绿色主色 #11a983 + 橙色辅助 #faa732 · 直角按钮 · 54px 行高
 */

import './style.css';
import React from 'react';
import { DesignMdBatchShowcase, type BatchShowcaseConfig } from '../../common/DesignMdBatchShowcase';
import themeData from './theme.json';

type ThemeDisplayData = Omit<BatchShowcaseConfig, 'previewImages'> & {
  previewImages: Array<{ type: string; path: string }>;
};

const display = themeData.display as ThemeDisplayData;

const config: BatchShowcaseConfig = {
  brand: display.brand,
  brandAlias: display.brandAlias,
  source: themeData.source,
  description: display.description,
  descriptionEn: display.descriptionEn,
  variant: display.variant,
  distributionTags: display.distributionTags,
  fontStylesheets: display.fontStylesheets,
  palette: display.palette,
  radius: display.radius,
  spacing: display.spacing,
  typography: display.typography,
  previewImages: [],
  usageGuidance: display.usageGuidance,
  shadows: display.shadows,
  borders: display.borders,
  panels: display.panels,
};

const Component: React.FC = () => <DesignMdBatchShowcase config={config} />;

export default Component;
