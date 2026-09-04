(() => {
  'use strict';

  // 抽屉菜单：无后端能力的菜单项
  const MENU_HIDE = ['个性分享', '版本说明', '捐赠打赏', '关于我们'];
  // 个人面板：无邮件服务/无审核流的按钮
  const BUTTON_HIDE = ['绑定邮箱', '申请称号', '称号管理', '变更称号', '重新申请'];

  const hide = (el) => {
    if (el && el.style) el.style.display = 'none';
  };
  const visible = (el) => el.offsetParent !== null && el.style.display !== 'none';
  const txt = (el) => (el.textContent || '').trim();

  function scan() {
    // 抽屉/菜单项
    document
      .querySelectorAll('.ant-menu-item, .ant-menu-submenu-title, li[role="menuitem"]')
      .forEach((el) => {
        const t = txt(el);
        if (t && MENU_HIDE.some((h) => t.includes(h))) hide(el);
      });

    // 按钮级隐藏（按文案精确匹配，避免误伤）
    document.querySelectorAll('button').forEach((b) => {
      const t = txt(b);
      if (!t) return;
      if (BUTTON_HIDE.some((h) => t === h)) hide(b);
      // 纯"上传"按钮：后端未实现上传
      if (t === '上传') hide(b);
    });

    // 空分组头清理
    document.querySelectorAll('.ant-menu-item-group').forEach((g) => {
      const items = g.querySelectorAll('.ant-menu-item, .ant-menu-submenu-title, li[role="menuitem"]');
      if (items.length && [...items].every((i) => !visible(i))) hide(g);
    });
  }

  let pending = false;
  const requestScan = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      scan();
    });
  };

  scan();
  new MutationObserver(requestScan).observe(document.documentElement, { childList: true, subtree: true });
})();
