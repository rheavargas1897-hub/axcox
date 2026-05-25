/**
 * @name 客运通用售票系统页面
 *
 * 参考资料：
 * - /rules/development-standards.md
 * - /assets/libraries/tailwind-css.md
 */

import './style.css';
import React, { forwardRef, useImperativeHandle } from 'react';
import type { AxureProps, AxureHandle } from '../../common/axure-types';
import DashboardPage from './app/page';

const Component = forwardRef<AxureHandle, AxureProps>(function B5tnmw9yquon1772012777660(_innerProps, ref) {
  useImperativeHandle(ref, function () {
    return {
      getVar: function () { return undefined; },
      fireAction: function () {},
      eventList: [],
      actionList: [],
      varList: [],
      configList: [],
      dataList: []
    };
  }, []);

  return <DashboardPage />;
});

export default Component;
