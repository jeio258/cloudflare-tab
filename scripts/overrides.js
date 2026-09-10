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

  // ===== 找回密码表单适配：后端要求原密码，前端表单未含该字段 =====
  const OLD_PW_ID = 'gotab-oldPassword';
  const FIND_PW_PATH = '/api/findPassword';

  function injectOldPwField() {
    const form = document.getElementById('findPassword-form');
    if (!form || form.querySelector('#' + OLD_PW_ID)) return;
    const anchor = form.querySelector('#findPassword-form_newPassword');
    const anchorItem = anchor ? anchor.closest('.ant-form-item') : null;

    const item = document.createElement('div');
    item.className = 'ant-form-item';
    item.style.marginBottom = '12px';

    const label = document.createElement('div');
    label.className = 'ant-form-item-label';
    const lab = document.createElement('label');
    lab.textContent = '原密码';
    lab.setAttribute('for', OLD_PW_ID);
    label.appendChild(lab);

    const wrap = document.createElement('div');
    wrap.className = 'ant-form-item-control';
    const ctrl = document.createElement('div');
    ctrl.className = 'ant-form-item-control-input';
    const input = document.createElement('input');
    input.id = OLD_PW_ID;
    input.type = 'password';
    input.autocomplete = 'current-password';
    input.placeholder = '请输入原密码';
    input.maxLength = 32;
    input.className = 'ant-input';
    ctrl.appendChild(input);
    wrap.appendChild(ctrl);
    item.appendChild(label);
    item.appendChild(wrap);

    if (anchorItem && anchorItem.parentNode) anchorItem.parentNode.insertBefore(item, anchorItem);
    else form.appendChild(item);
  }

  const readOldPw = () => {
    const el = document.getElementById(OLD_PW_ID);
    return el && el.value ? el.value : '';
  };

  function withOldPw(body) {
    if (typeof body !== 'string') return body;
    const v = readOldPw();
    if (!v) return body;
    try {
      const j = JSON.parse(body);
      if (j && typeof j === 'object' && !j.oldPassword) {
        j.oldPassword = v;
        return JSON.stringify(j);
      }
    } catch {
      /* 非 JSON 不动 */
    }
    return body;
  }

  // 拦截 XHR（axios 默认适配器）为 /api/findPassword 注入 oldPassword
  try {
    const proto = window.XMLHttpRequest && window.XMLHttpRequest.prototype;
    if (proto && !proto.__gotabPatched) {
      const origOpen = proto.open;
      const origSend = proto.send;
      proto.open = function (method, url, ...rest) {
        this.__gotabUrl = String(url || '');
        return origOpen.call(this, method, url, ...rest);
      };
      proto.send = function (body) {
        if (String(this.__gotabUrl || '').indexOf(FIND_PW_PATH) >= 0) body = withOldPw(body);
        return origSend.call(this, body);
      };
      proto.__gotabPatched = true;
    }
  } catch {
    /* noop */
  }

  // fetch 兜底（若改用 fetch）
  try {
    const origFetch = window.fetch;
    if (origFetch && !origFetch.__gotabPatched) {
      const patched = function (input, init) {
        try {
          const url = typeof input === 'string' ? input : input && input.url ? input.url : '';
          if (url.indexOf(FIND_PW_PATH) >= 0 && init && typeof init.body === 'string') {
            init = Object.assign({}, init, { body: withOldPw(init.body) });
          }
        } catch {
          /* noop */
        }
        return origFetch.call(this, input, init);
      };
      patched.__gotabPatched = true;
      window.fetch = patched;
    }
  } catch {
    /* noop */
  }

  function scanImpl() {
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

    // 找回密码表单：注入原密码输入
    injectOldPwField();
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

  // 页面结构变化时静默降级，避免影响应用
  function scan() {
    try {
      scanImpl();
    } catch {
      /* noop */
    }
  }

  scan();
  new MutationObserver(requestScan).observe(document.documentElement, { childList: true, subtree: true });
})();
