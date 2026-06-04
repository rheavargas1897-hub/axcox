function classifyPage({ $, metadata = {} }) {
  const viewportWidth = Number(metadata?.viewport?.width) || 0;
  const titleText = String($('title').first().text() || '').toLowerCase();
  const bodyText = String($('body').text() || '').toLowerCase();
  const tableCount = $('table, [role="table"], .ant-table, .el-table').length;
  const formFieldCount = $('input, select, textarea, [role="textbox"], [contenteditable="true"]').length;
  const tabCount = $('[role="tab"], .ant-tabs-tab, .el-tabs__item, .hammer-tabs-tab').length;
  const chartCount = $('canvas, svg').length;
  const navCount = $('header, nav, [role="navigation"], [class*="nav"], [class*="header"]').length;

  if (viewportWidth > 0 && viewportWidth <= 480) {
    return 'mobile-home';
  }

  if (/login|sign in|注册|登录/.test(titleText) || /login|sign in|注册|登录/.test(bodyText)) {
    return 'auth';
  }

  if (formFieldCount >= 8 && tableCount === 0) {
    return 'form';
  }

  if (tableCount >= 1 && (chartCount >= 1 || tabCount >= 2)) {
    return 'workbench';
  }

  if (tableCount >= 1 && navCount >= 1) {
    return 'dashboard';
  }

  if (formFieldCount >= 3) {
    return 'settings';
  }

  if (chartCount >= 2) {
    return 'dashboard';
  }

  if (navCount >= 1 && tabCount >= 1) {
    return 'detail';
  }

  return 'mixed';
}

module.exports = {
  classifyPage
};
