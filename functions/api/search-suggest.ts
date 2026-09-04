import { fetchJson } from '../lib/widgets';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

// JSONP 同源代理：搜索联想转百度 sugrec，返回 cb({g:[{q}]})
export async function onRequestGet(context: { request: Request }) {
  const url = new URL(context.request.url);
  const wd = (url.searchParams.get('wd') || '').trim();
  const cb = (url.searchParams.get('cb') || 'cb').replace(/[^A-Za-z0-9_$.]/g, '');

  let g: Array<{ q: string }> = [];
  if (wd) {
    try {
      const j = (await fetchJson(`https://www.baidu.com/sugrec?prod=pc&from=pc_web&wd=${encodeURIComponent(wd)}`, {
        headers: { 'user-agent': UA, referer: 'https://www.baidu.com/' },
      })) as { g?: Array<{ q?: string }> };
      if (Array.isArray(j?.g)) {
        g = j.g.map((x) => ({ q: String(x?.q || '') })).filter((x) => x.q);
      }
    } catch {
      /* 联想失败返回空 */
    }
  }
  return new Response(`${cb}(${JSON.stringify({ g })})`, {
    headers: { 'content-type': 'application/javascript;charset=utf-8', 'cache-control': 'no-store' },
  });
}
