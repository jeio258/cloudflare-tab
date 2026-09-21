import { defineHandler } from '../../lib/handler';
import { fetchJson } from '../../lib/upstream';

export const onRequestPost = defineHandler({
  body: 'optional',
  run: async ({ body }) => {
    const raw = String(body.url || '').trim();
    if (!raw) return { title: '', icon: '', description: '' };

    try {
      const j = (await fetchJson(
        `https://uapis.cn/api/v1/webparse/metadata?url=${encodeURIComponent(raw)}`
      )) as { title?: string; description?: string; favicon_url?: string };
      return {
        title: String(j.title || '').trim(),
        icon: String(j.favicon_url || '').trim(),
        description: String(j.description || '').trim(),
      };
    } catch {
      return { title: '', icon: '', description: '' };
    }
  },
});
