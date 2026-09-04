const enc = new TextEncoder();

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

export async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const resp = await fetch(url, {
      ...init,
      headers: { 'user-agent': UA, accept: 'application/json,text/plain,*/*', ...(init?.headers || {}) },
      signal: ctrl.signal,
      redirect: 'follow',
    });
    if (!resp.ok) throw new Error(`http ${resp.status}`);
    return await resp.json();
  } finally {
    clearTimeout(timer);
  }
}

// Cache API + 应用层 TTL 的 JSON 缓存
export async function cachedJson<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const req = new Request(`https://gotab-cache.local/${encodeURIComponent(key)}`);
  try {
    const hit = await caches.default.match(req);
    if (hit) {
      const j = (await hit.json()) as { t: number; data: T };
      if (Date.now() - j.t < ttlMs) return j.data;
    }
  } catch {
    /* 忽略缓存异常 */
  }
  const data = await fetcher();
  try {
    const body = enc.encode(JSON.stringify({ t: Date.now(), data }));
    await caches.default.put(req, new Response(body, { headers: { 'content-type': 'application/json' } }));
  } catch {
    /* 忽略缓存写入失败 */
  }
  return data;
}
