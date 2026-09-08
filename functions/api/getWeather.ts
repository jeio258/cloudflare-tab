import { ok, fail } from '../lib/http';
import { weatherOf } from '../lib/weather';

interface CfLocation {
  city?: string;
}

export async function onRequestGet(context: { request: Request }) {
  const url = new URL(context.request.url);
  const city = (url.searchParams.get('city') || '').trim();

  let name = city;
  if (!name) {
    const cf = (context.request as unknown as { cf?: CfLocation }).cf;
    name = String(cf?.city || '北京');
  }

  try {
    const payload = await weatherOf(name);
    return ok({ data: payload });
  } catch {
    return fail(500, '天气服务暂不可用');
  }
}
