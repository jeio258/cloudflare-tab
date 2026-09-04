import { ok } from '../../lib/http';
import type { Env } from '../../lib/http';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

// 图标统一走 faviconsnap，保证任何站点都能拿到图标
const faviconOf = (host: string) => `https://faviconsnap.com/api/favicon?url=${host}`;

function pickMeta(html: string, name: string): string {
  const re = new RegExp(
    `<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["'][^>]*>|<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${name}["'][^>]*>`,
    'i'
  );
  const m = html.match(re);
  if (!m) return '';
  return (m[1] || m[2] || '').trim();
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  let body: Record<string, unknown>;
  try {
    body = (await context.request.json()) as Record<string, unknown>;
  } catch {
    return ok({ title: '', icon: '', description: '' });
  }
  let raw = String(body.url || '').trim();
  if (!raw) return ok({ title: '', icon: '', description: '' });
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return ok({ title: '', icon: faviconOf(raw.split('/')[0]), description: '' });
  }
  const host = url.hostname;
  const fallback = { title: '', icon: faviconOf(host), description: '' };

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    const resp = await fetch(url.href, {
      headers: { 'user-agent': UA, 'accept-language': 'zh-CN,zh;q=0.9', accept: 'text/html,application/xhtml+xml,*/*' },
      redirect: 'follow',
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) return ok(fallback);
    const buf = await resp.arrayBuffer();
    const html = new TextDecoder().decode(buf.slice(0, 1024 * 1024));
    const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const description = pickMeta(html, 'description');
    return ok({ title, icon: faviconOf(host), description });
  } catch {
    return ok(fallback);
  }
}
