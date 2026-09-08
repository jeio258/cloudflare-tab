// 端到端 API + UI 测试（headless）。需要本地 wrangler pages dev 已起在 baseUrl。
import { chromium, request as playwrightRequest } from 'playwright';

const base = process.env.GOTAB_BASE_URL || 'http://127.0.0.1:8799';
const USER = process.env.GOTAB_USER || 'test@gotab.local';
const PASS = process.env.GOTAB_PASS || 'test123456';
const CODE = process.env.GOTAB_REGISTER_CODE || '123456';
const failures = [];
const log = (...a) => console.log(...a);
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  log(`${ok ? '✓' : '✗'} ${name}: ${ok ? 'pass' : `got=${JSON.stringify(got)} want=${JSON.stringify(want)}`}`);
  if (!ok) failures.push(name);
};

const api = await playwrightRequest.newContext();
const okJson = async (resp) => ({ status: resp.status(), body: await resp.json().catch(() => null) });
const cleanupUsers = [];

// 1. 静态与兜底
{
  const r = await api.get(`${base}/`);
  const html = await r.text();
  eq('home <title>', html.match(/<title>([^<]*)<\/title>/)?.[1], 'Gotab');
  eq('home http 200', r.status(), 200);
  const m = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
  if (m) {
    const rr = await api.get(base + m[1]);
    eq('asset 200', rr.status(), 200);
  } else failures.push('asset ref not found');
  const r404 = await api.get(`${base}/api/does-not-exist`);
  const { status, body } = await okJson(r404);
  eq('catch-all 200', status, 200);
  eq('catch-all code 404', body?.code, 404);
}

// 2. 登录错误
{
  const r = await api.post(`${base}/api/login`, { data: { username: USER, password: 'wrong' } });
  const { body } = await okJson(r);
  eq('wrong pwd code', body?.code, 400);
}

// 2.5 注册(B方案固定邀请码)/找回/资料编辑
{
  const uname = `u${Date.now() % 1000000}`;
  cleanupUsers.push(uname);
  const email = `${uname}@test.local`;
  // 错误邀请码注册
  const r0 = await api.post(`${base}/api/register`, {
    data: { username: uname, password: 'pass123', email, emailCode: '000' },
  });
  const { body: b0 } = await okJson(r0);
  eq('register 错码拒绝', b0?.code, 400);
  // 正确注册
  const r1 = await api.post(`${base}/api/register`, {
    data: { username: uname, password: 'pass123', email, emailCode: CODE },
  });
  const { body: b1 } = await okJson(r1);
  eq('register 成功', b1?.code, 200);
  // 重复用户名
  const r2 = await api.post(`${base}/api/register`, {
    data: { username: uname, password: 'pass123', email: `x${email}`, emailCode: CODE },
  });
  const { body: b2 } = await okJson(r2);
  eq('register 重复用户名', b2?.code, 400);
  // 新用户登录(userType=0)
  const r3 = await api.post(`${base}/api/login`, { data: { username: uname, password: 'pass123' } });
  const { body: b3 } = await okJson(r3);
  eq('新用户登录 code', b3?.code, 200);
  eq('新用户 userType=0', b3?.data?.userInfo?.userType, 0);
  const ntoken = b3?.data?.token;
  // 资料编辑
  const r4 = await api.post(`${base}/api/user/editUserInfo`, {
    headers: { authorization: ntoken },
    data: { username: uname, nickname: '昵称', sex: 1, phone: '13800138000' },
  });
  const { body: b4 } = await okJson(r4);
  eq('editUserInfo code', b4?.code, 200);
  eq('editUserInfo nickname', b4?.data?.nickname, '昵称');
  eq('editUserInfo sex', b4?.data?.sex, 1);
  // emailCode/找回
  const r5 = await api.post(`${base}/api/findPasswordEmailCode`, {
    data: { username: uname, email: `bad@test.local` },
  });
  const { body: b5 } = await okJson(r5);
  eq('findPwdEmailCode 不匹配', b5?.code, 400);
  const r6 = await api.post(`${base}/api/findPassword`, {
    data: { username: uname, email, emailCode: CODE, newPassword: 'newpass1', confirmPassword: 'newpass1' },
  });
  const { body: b6 } = await okJson(r6);
  eq('findPassword 重置成功', b6?.code, 200);
  const r7 = await api.post(`${base}/api/login`, { data: { username: uname, password: 'newpass1' } });
  const { body: b7 } = await okJson(r7);
  eq('重置后新密码可登录', b7?.code, 200);
}

// 3. 正确登录 + getUserInfo + 同步 round-trip（对 D1 残留状态鲁棒）
let token = '';
{
  const r = await api.post(`${base}/api/login`, { data: { username: USER, password: PASS } });
  const { body } = await okJson(r);
  eq('login code', body?.code, 200);
  token = body?.data?.token;
  eq('login token', typeof token === 'string' && token.length > 20, true);
  eq('userInfo username', body?.data?.userInfo?.username, USER);
}
const authHdr = { authorization: token };
{
  const r1 = await api.get(`${base}/api/user/pullWT`, { headers: authHdr });
  const { body: b1 } = await okJson(r1);
  const baseTs = Number(b1?.data?.timestamp) || 0;
  const stored = b1?.data?.data || null;

  const ts1 = Math.max(Date.now(), baseTs + 1);
  const data1 = { home: { a: 1 }, card: { items: [] } };
  const r2 = await api.post(`${base}/api/user/push`, {
    headers: authHdr,
    data: { data: data1, timestamp: ts1, baseTimestamp: baseTs },
  });
  const { body: b2 } = await okJson(r2);
  eq('push first ts >= ts1', typeof b2?.data?.timestamp === 'number' && b2.data.timestamp >= ts1, true);

  // 冲突：baseTimestamp 取一个肯定小于已存的数
  const r3 = await api.post(`${base}/api/user/push`, {
    headers: authHdr,
    data: { data: { ...data1, home: { a: 2 } }, timestamp: ts1 - 10, baseTimestamp: 1 },
  });
  eq('conflict http', r3.status(), 409);
  const b3 = await r3.json();
  eq('conflict code', b3?.code, 409);
  eq('conflict msg', b3?.msg, '云端数据已更新');

  const r4 = await api.get(`${base}/api/user/pullWT`, { headers: authHdr });
  const { body: b4 } = await okJson(r4);
  eq('pull data matches', b4?.data?.data, data1);
  eq('pull ts >= ts1', typeof b4?.data?.timestamp === 'number' && b4.data.timestamp >= ts1, true);

  // 仅打印残留信息便于排查
  if (stored) log(`(注：首次 pullWT 有残留数据 ${JSON.stringify(stored).slice(0, 80)})`);
}

// 4. isAdmin（管理员放行）
{
  const r = await api.get(`${base}/api/user/isAdmin`, { headers: authHdr });
  const { body } = await okJson(r);
  eq('isAdmin code', body?.code, 200);
  eq('isAdmin data', body?.data, true);
}

// 5. 改密码 round-trip
{
  const r1 = await api.post(`${base}/api/user/changePassword`, {
    headers: authHdr,
    data: { oldPassword: PASS, newPassword: 'tmp654321', confirmPassword: 'tmp654321' },
  });
  const { body: b1 } = await okJson(r1);
  eq('changePwd ok', b1?.code, 200);
  const r2 = await api.post(`${base}/api/login`, { data: { username: USER, password: 'tmp654321' } });
  const { body: b2 } = await okJson(r2);
  eq('login new pwd', b2?.code, 200);
  const token2 = b2?.data?.token;
  await api.post(`${base}/api/user/changePassword`, {
    headers: { authorization: token2 },
    data: { oldPassword: 'tmp654321', newPassword: PASS, confirmPassword: PASS },
  });
}

// 6. getWebsiteInfo
{
  const r = await api.post(`${base}/api/tools/getWebsiteInfo`, { data: { url: 'https://example.com' } });
  const { body } = await okJson(r);
  eq('getWebsiteInfo code', body?.code, 200);
  eq('getWebsiteInfo title', body?.data?.title, 'Example Domain');
  eq('getWebsiteInfo icon=faviconsnap', body?.data?.icon, 'https://faviconsnap.com/api/favicon?url=example.com');
}

// 6.5 挂件接口（游客可调，公共数据）
{
  const r1 = await api.get(`${base}/api/getCityList`);
  const { body: b1 } = await okJson(r1);
  eq('cityList code', b1?.code, 200);
  const hasBeijing = Array.isArray(b1?.data) && b1.data.some((c) => c?.label === '北京' && c?.value === 'beijing');
  eq('cityList 含北京{label,value}', hasBeijing, true);

  const r2 = await api.get(`${base}/api/getWeather?city=beijing`);
  const { body: b2 } = await okJson(r2);
  const w = b2?.data?.data?.weather;
  eq('weather 双层 data.data', b2?.code === 200 && !!w, true);
  eq('weather city', b2?.data?.data?.city, '北京');
  eq('weather temp 为字符串', typeof w?.current_temperature === 'string', true);
  eq('weather icon 为字符串(防0丢失)', typeof w?.weather_icon_id === 'string', true);
  eq('weather forecast>=1', Array.isArray(w?.forecast_list) && w.forecast_list.length >= 1, true);
  eq('weather hourly>=1', Array.isArray(w?.hourly_forecast) && w.hourly_forecast.length >= 1, true);

  for (const type of ['weibo', 'douyin']) {
    const r = await api.get(`${base}/api/getHotEvents?type=${type}`);
    const { body } = await okJson(r);
    eq(`hot[${type}] code200+数组`, body?.code === 200 && Array.isArray(body?.data), true);
    if (Array.isArray(body?.data) && body.data.length) {
      const item = body.data[0];
      eq(`hot[${type}] 条目含 title/url`, typeof item?.title === 'string' && !!item?.url, true);
    } else log(`(注：hot[${type}] 为空，源可能不可达，容忍)`);
  }

  const r3 = await api.get(`${base}/api/yiyan?types=a,b`);
  const { body: b3 } = await okJson(r3);
  eq('yiyan code200', b3?.code, 200);
  eq('yiyan content 非空', typeof b3?.data?.content === 'string' && b3.data.content.length > 0, true);

  const r4 = await api.get(`${base}/api/exchange-rate`);
  const { body: b4 } = await okJson(r4);
  const rates = b4?.data?.rates || {};
  eq('fx CNY=1', rates.CNY, 1);
  const need = ['USD', 'EUR', 'GBP', 'JPY', 'HKD', 'AUD', 'CAD', 'CHF', 'NZD'];
  eq('fx 币种齐全', need.every((c) => typeof rates[c] === 'number' && rates[c] > 0), true);
}

// 7. UI 登录流程
{
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const consoleErrs = [];
  page.on('pageerror', (e) => consoleErrs.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrs.push(m.text()); });

  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
  // 关闭可能出现的公告通知弹层，避免遮挡头像
  const notifClose = page.locator('.ant-notification-notice-close, .ant-notification-close-icon').first();
  if (await notifClose.count()) {
    await notifClose.click({ force: true }).catch(() => {});
    await page.waitForTimeout(500);
  }
  await page.locator('.ant-avatar').first().click();
  await page.waitForTimeout(1200);
  await page.getByText('登录/注册').first().click();
  await page.waitForTimeout(1500);
  await page.locator('#login-form_username').fill(USER);
  await page.locator('#login-form_password').fill(PASS);
  const [loginResp] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith('/api/login') && r.request().method() === 'POST', { timeout: 10000 }),
    page.getByRole('button', { name: '登 录' }).click(),
  ]);
  eq('UI login http', loginResp.status(), 200);
  await page.waitForTimeout(1500);
  const stored = await page.evaluate(() => {
    const raw = localStorage.getItem('persist:user');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return raw; }
  });
  const tok = JSON.parse(stored?.token || '""');
  eq('UI token persisted', typeof tok === 'string' && tok.length > 20, true);
  eq('UI no console errors', consoleErrs.length, 0);
  await page.screenshot({ path: '/tmp/gotab-after-login.png' });
  await browser.close();
}

// 7.5 公告与默认主页（token=admin）
{
  // 普通用户无权限
  const uname = `n${Date.now() % 1000000}`;
  cleanupUsers.push(uname);
  await api.post(`${base}/api/register`, {
    data: { username: uname, password: 'pass123', email: `${uname}@test.local`, emailCode: CODE },
  });
  const lr = await api.post(`${base}/api/login`, { data: { username: uname, password: 'pass123' } });
  const lj = (await okJson(lr)).body;
  const rn = await api.post(`${base}/api/console/addNotice`, {
    headers: { authorization: lj?.data?.token },
    data: { title: 'x', content: 'y' },
  });
  eq('console 普通用户拒绝', (await okJson(rn)).body?.code, 403);
  const ia = await api.get(`${base}/api/user/isAdmin`, { headers: { authorization: lj?.data?.token } });
  eq('isAdmin 普通用户拒绝', (await okJson(ia)).body?.code, 403);

  // 发布公告（待确认）→ 确认 → 首页可见 → 编辑 → 删除
  const a1 = await api.post(`${base}/api/console/addNotice`, {
    headers: { authorization: token },
    data: { title: '公告标题', content: '公告内容' },
  });
  eq('addNotice code', (await okJson(a1)).body?.code, 200);
  const l1 = await api.get(`${base}/api/console/getNoticeList`, { headers: { authorization: token } });
  const l1b = (await okJson(l1)).body;
  const noticeId = l1b?.data?.list?.[0]?.id;
  eq('getNoticeList 有记录且带 id', typeof noticeId === 'string', true);
  const c1 = await api.post(`${base}/api/console/confirmNotice`, {
    headers: { authorization: token },
    data: { id: noticeId },
  });
  eq('confirmNotice code', (await okJson(c1)).body?.code, 200);
  const g1 = await api.get(`${base}/api/getNotice`);
  const g1b = (await okJson(g1)).body;
  eq('getNotice 返回最新公告', !!g1b?.data?.title && !!g1b?.data?.content, true);
  const e1 = await api.post(`${base}/api/console/editNotice`, {
    headers: { authorization: token },
    data: { id: noticeId, title: '公告标题2', content: '内容2' },
  });
  eq('editNotice code', (await okJson(e1)).body?.code, 200);
  const d1 = await api.post(`${base}/api/console/deleteNotice`, {
    headers: { authorization: token },
    data: { id: noticeId },
  });
  eq('deleteNotice code', (await okJson(d1)).body?.code, 200);

  // 默认主页
  const payload = { home: { showMode: 'wallpaper' }, card: { listData: [] } };
  const s1 = await api.post(`${base}/api/console/setDefaultData`, {
    headers: { authorization: token },
    data: { data: payload },
  });
  eq('setDefaultData code', (await okJson(s1)).body?.code, 200);
  const t1 = await api.get(`${base}/api/getDefaultDataTime`);
  const t1b = (await okJson(t1)).body;
  eq('getDefaultDataTime 非空 ISO', typeof t1b?.data === 'string' && t1b.data.length > 0, true);
  const gd = await api.get(`${base}/api/getDefaultData`);
  const gdb = (await okJson(gd)).body;
  eq('getDefaultData 回读一致', JSON.stringify(gdb?.data?.data), JSON.stringify(payload));
  eq('getDefaultData 含 created_at', typeof gdb?.data?.created_at === 'string', true);

  // 用户管理（列表/新增/删除）
  const ul = await api.get(`${base}/api/console/getAwaitingApprovalUserAppellationList`, {
    headers: { authorization: token },
  });
  const ulb = (await okJson(ul)).body;
  eq('用户列表非空且含字段', Array.isArray(ulb?.data?.list) && ulb.data.list.length >= 1 && typeof ulb.data.list[0]?.username === 'string', true);
  const cu = `cu${Date.now() % 1000000}`;
  const cu1 = await api.post(`${base}/api/console/addUser`, {
    headers: { authorization: token },
    data: { username: cu, password: 'pass123', nickname: '后台创建', sex: 0 },
  });
  eq('addUser code', (await okJson(cu1)).body?.code, 200);
  const cuList = await api.get(`${base}/api/console/getAwaitingApprovalUserAppellationList?username=${cu}`, {
    headers: { authorization: token },
  });
  const cuRow = (await okJson(cuList)).body?.data?.list?.[0];
  eq('addUser 列表可见', cuRow?.username === cu && cuRow?.userType === 0, true);
  const st = await api.post(`${base}/api/console/setUserType`, {
    headers: { authorization: token },
    data: { userId: cuRow?.id, type: 1 },
  });
  eq('setUserType 设管理员', (await okJson(st)).body?.code, 200);
  const du = await api.post(`${base}/api/console/deleteUser`, {
    headers: { authorization: token },
    data: { userId: cuRow?.id },
  });
  eq('deleteUser code', (await okJson(du)).body?.code, 200);
  // 默认主页历史列表
  const dhl = await api.get(`${base}/api/console/getDefaultDataList`, { headers: { authorization: token } });
  const dhlb = (await okJson(dhl)).body;
  eq('默认主页历史列表≥1', Array.isArray(dhlb?.data?.list) && dhlb.data.list.length >= 1, true);
}

// 7.6 搜索联想(同源 JSONP)与只读分享页
{
  // API：搜索联想
  const sg = await api.get(`${base}/api/search-suggest?wd=react&cb=cb123`);
  const sgText = await sg.text();
  const sgOk = sg.status() === 200 && sgText.startsWith('cb123(') && sgText.includes('"q"');
  eq('search-suggest JSONP', sgOk, true);
  // 产物已同源化：main 包内不再直连百度 sugrec
  {
    const r = await api.get(`${base}/`);
    const html = await r.text();
    const m = html.match(/src="(\/assets\/main-[^"]+\.js)"/) || html.match(/href="(\/assets\/main-[^"]+\.js)"/);
    if (!m) failures.push('main asset not found');
    else {
      const js = await (await api.get(base + m[1])).text();
      eq('main 已改用 /api/search-suggest', js.includes('/api/search-suggest?wd='), true);
      eq('main 不含百度直连', !js.includes('baidu.com/sugrec'), true);
    }
  }
  // 分享页：getShareData(管理员 username 或 share_id) 返回其云数据
  const sh1 = await api.get(`${base}/api/getShareData?path=${encodeURIComponent(USER)}`);
  const sh1b = (await okJson(sh1)).body;
  eq('getShareData 命中返回 shareData', !!sh1b?.data?.shareData, true);
  const sh2 = await api.get(`${base}/api/getShareData?path=ghost_not_exist`);
  const sh2b = (await okJson(sh2)).body;
  eq('getShareData 未知返回 null', sh2b?.data === null, true);
}

// 7.7 站点配置端点（后台功能开关页依赖，原缺失返回 404）
{
  const r = await api.get(`${base}/api/getSiteConfig`);
  const { status, body } = await okJson(r);
  eq('getSiteConfig http 200', status, 200);
  eq('getSiteConfig code', body?.code, 200);
  eq('getSiteConfig 含 siteConfig', !!body?.data?.siteConfig, true);
  eq('getSiteConfig uploadWallpaper=close', body?.data?.siteConfig?.uploadWallpaper, 'close');
  eq('getSiteConfig cardPush=close', body?.data?.siteConfig?.cardPush, 'close');
}

// 8. 清理测试注册的普通用户（管理员删除）
for (const uname of cleanupUsers) {
  try {
    const r = await api.get(`${base}/api/console/getAwaitingApprovalUserAppellationList?username=${uname}`, {
      headers: { authorization: token },
    });
    const row = (await okJson(r)).body?.data?.list?.[0];
    if (row?.id) {
      await api.post(`${base}/api/console/deleteUser`, {
        headers: { authorization: token },
        data: { userId: row.id },
      });
      log(`cleanup user ${uname}`);
    }
  } catch {
    /* 忽略清理失败 */
  }
}

await api.dispose();
console.log(failures.length === 0 ? '\nALL PASSED' : `\nFAILURES: ${failures.length} ${failures.join(', ')}`);
process.exit(failures.length === 0 ? 0 : 1);
