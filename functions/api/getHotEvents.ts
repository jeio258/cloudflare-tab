import { ok } from '../lib/http';
import { hotEvents } from '../lib/hot';

export async function onRequestGet(context: { request: Request }) {
  const url = new URL(context.request.url);
  const type = (url.searchParams.get('type') || 'weibo').trim();
  const list = await hotEvents(type);
  return ok(list);
}
