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

// 拷贝 Pages Functions
cpSync(join(root, 'functions'), join(dist, 'functions'), { recursive: true });

// SPA 回退：未知路径一律落到 index.html
writeFileSync(join(dist, '_redirects'), '/* /index.html 200\n');

console.log(`prepared -> ${dist}`);
