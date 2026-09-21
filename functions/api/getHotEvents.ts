import { defineHandler } from '../lib/handler';
import { hotEvents } from '../lib/hot';

export const onRequestGet = defineHandler({
  run: async ({ request }) => {
    const url = new URL(request.url);
    const type = (url.searchParams.get('type') || 'weibo').trim();
    return await hotEvents(type);
  },
});
