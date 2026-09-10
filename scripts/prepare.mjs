import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'web');
const dist = join(root, 'dist');

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(src, dist, { recursive: true });

// 部署瘦身：剔除 Chrome 扩展专属文件与未使用的 install 向导（Pages 运行时不加载）
const EXT_ONLY = [
  'manifest.json',
  'background.js',
  'popup.html',
  'newtab.html',
  '_locales',
  '_metadata',
  'hash-manifest.json',
  'install',
];
for (const f of EXT_ONLY) rmSync(join(dist, f), { recursive: true, force: true });

// 替换 index.html 的 Go 模板占位符
const indexPath = join(dist, 'index.html');
let html = readFileSync(indexPath, 'utf8');
html = html
  .replace('{{ .Title }}', 'Gotab')
  .replace('{{ .Description }}', 'Gotab 新标签页')
  .replace('{{ .Keywords }}', 'gotab,新标签页,导航,起始页');

// siteConfig 单一数据源（functions/lib/siteConfig.json），生成前端 siteConfig.js
const SITE_CONFIG = JSON.parse(readFileSync(join(root, 'functions', 'lib', 'siteConfig.json'), 'utf8'));
const siteConfigJs =
  'globalThis.siteConfig = {\n' +
  Object.entries(SITE_CONFIG)
    .map(([k, v]) => `\t${k}: \`${v}\`,`)
    .join('\n') +
  '\n};\n';
writeFileSync(join(dist, 'siteConfig.js'), siteConfigJs);

// 死入口清理：注入补丁 CSS/JS
cpSync(join(root, 'scripts', 'overrides.css'), join(dist, 'overrides.css'));
cpSync(join(root, 'scripts', 'overrides.js'), join(dist, 'overrides.js'));
html = html.replace(
  '</head>',
  '  <link rel="stylesheet" href="/overrides.css" />\n' + '  <script defer src="/overrides.js"></script>\n</head>'
);
writeFileSync(indexPath, html);

// 静态资源长缓存（哈希文件名，内容不变）
writeFileSync(join(dist, '_headers'), '/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n');

// 搜索联想同源化：替换前端直连百度 sugrec 的 URL 为 /api/search-suggest
const SUG_SRC = 'https://www.baidu.com/sugrec?prod=pc&from=pc_web&wd=';
const SUG_DST = '/api/search-suggest?wd=';
const mainFiles = readdirSync(join(dist, 'assets')).filter((f) => f.startsWith('main-') && f.endsWith('.js'));
let patched = 0;
for (const f of mainFiles) {
  const p = join(dist, 'assets', f);
  const content = readFileSync(p, 'utf8');
  if (content.includes(SUG_SRC)) {
    writeFileSync(p, content.split(SUG_SRC).join(SUG_DST));
    patched++;
  }
}
if (patched === 0) console.warn('[prepare] 未命中百度联想 URL，请检查前端产物');

// 品牌替换：作者标识（doxwant/dengxiwang）-> 本仓库地址与 GitHub 图标
const REPO_URL = 'https://github.com/jeio258/cloudflare-tab';
const GH_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style="vertical-align:middle" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>';
const BRAND_MAP = [
  ['https://github.com/dengxiwang/gotab-personal', REPO_URL],
  ['https://github.com/dengxiwang', REPO_URL],
  ['dengxiwang@aliyun.com', REPO_URL],
  ['>@doxwant</a>', `>${GH_ICON}</a>`],
];
let brandPatched = 0;
for (const f of readdirSync(join(dist, 'assets')).filter((x) => x.endsWith('.js'))) {
  const p = join(dist, 'assets', f);
  let c = readFileSync(p, 'utf8');
  let changed = false;
  for (const [from, to] of BRAND_MAP) {
    if (c.includes(from)) {
      c = c.split(from).join(to);
      changed = true;
    }
  }
  if (changed) {
    writeFileSync(p, c);
    brandPatched++;
  }
}
if (brandPatched === 0) console.warn('[prepare] 未命中作者品牌字符串，请检查前端产物');

// 拷贝 Pages Functions
cpSync(join(root, 'functions'), join(dist, 'functions'), { recursive: true });

// SPA 回退：未知路径一律落到 index.html
writeFileSync(join(dist, '_redirects'), '/* /index.html 200\n');

console.log(`prepared -> ${dist}`);
