/**
 * @name 库存统计
 *
 * 参考资料：
 * - /rules/development-standards.md
 * - /assets/libraries/tailwind-css.md
 */

import './style.css';
import React, { forwardRef, useImperativeHandle } from 'react';
import type { AxureProps, AxureHandle } from '../../common/axure-types';
import App from './src/App';

const Component = forwardRef<AxureHandle, AxureProps>(function Zip(_innerProps, ref) {
  useImperativeHandle(
    ref,
    () => ({
      getVar: () => undefined,
      fireAction: () => {},
      eventList: [],
      actionList: [],
      varList: [],
      configList: [],
      dataList: []
    }),
    []
  );

  return <App />;
});

export default Component;
