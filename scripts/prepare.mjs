import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, '..', 'gotab-personal', 'web');
const dist = join(root, 'dist');

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(src, dist, { recursive: true });

// 替换 index.html 的 Go 模板占位符
const indexPath = join(dist, 'index.html');
let html = readFileSync(indexPath, 'utf8');
html = html
  .replace('{{ .Title }}', 'Gotab')
  .replace('{{ .Description }}', 'Gotab 新标签页')
  .replace('{{ .Keywords }}', 'gotab,新标签页,导航,起始页');

// 死入口清理：siteConfig 官方开关（cardPush/uploadWallpaper 置 close；注册已开放）
const siteConfig = `globalThis.siteConfig = {
\tbottomLinks: \`\`,
\ttitle: \`\`,
\tserver_url: \`\`,
\tabout_us: \`\`,
\tdonate: \`\`,
\tcardPush: \`close\`,
\tofflineToUse: \`\`,
\tsourceStoreFrom: \`\`,
\thomePageLimit: \`\`,
\tuserRegister: \`\`,
\tloginBackground: \`\`,
\tloginBackgroundBlur: \`\`,
\tloginBackgroundBrightness: \`\`,
\tuploadWallpaper: \`close\`,
\tuploadWallpaperMaxSize: \`\`,
};
`;
writeFileSync(join(dist, 'siteConfig.js'), siteConfig);

// 死入口清理：注入补丁 CSS/JS
cpSync(join(root, 'scripts', 'overrides.css'), join(dist, 'overrides.css'));
cpSync(join(root, 'scripts', 'overrides.js'), join(dist, 'overrides.js'));
html = html.replace(
  '</head>',
  '  <link rel="stylesheet" href="/overrides.css" />\n' + '  <script defer src="/overrides.js"></script>\n</head>'
);
writeFileSync(indexPath, html);

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
