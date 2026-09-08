import { ok } from '../../lib/http';
import { fetchJson } from '../../lib/widgets';

export async function onRequestPost(context: { request: Request }) {
  let body: Record<string, unknown>;
  try {
    body = (await context.request.json()) as Record<string, unknown>;
  } catch {
    return ok({ title: '', icon: '', description: '' });
  }
  const raw = String(body.url || '').trim();
  if (!raw) return ok({ title: '', icon: '', description: '' });

  try {
    const j = (await fetchJson(
      `https://uapis.cn/api/v1/webparse/metadata?url=${encodeURIComponent(raw)}`
    )) as { title?: string; description?: string; favicon_url?: string };
    return ok({
      title: String(j.title || '').trim(),
      icon: String(j.favicon_url || '').trim(),
      description: String(j.description || '').trim(),
    });
  } catch {
    return ok({ title: '', icon: '', description: '' });
  }
}
