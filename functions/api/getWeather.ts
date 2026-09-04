import { ok, fail } from '../lib/http';
import { cityCoord } from '../lib/cities';
import { weatherOf } from '../lib/weather';

interface CfLocation {
  latitude?: unknown;
  longitude?: unknown;
  city?: string;
}

export async function onRequestGet(context: { request: Request }) {
  const url = new URL(context.request.url);
  const city = (url.searchParams.get('city') || '').trim();

  let lat: number | null = null;
  let lon: number | null = null;
  let name = '';

  if (city) {
    const c = cityCoord(city);
    if (!c) return fail(400, '未收录该城市');
    lat = c.lat;
    lon = c.lon;
    name = c.label;
  } else {
    // 无 city 参数：按客户端 IP 定位（Cloudflare 请求信息）
    const cf = (context.request as unknown as { cf?: CfLocation }).cf;
    const clat = Number(cf?.latitude);
    const clon = Number(cf?.longitude);
    if (Number.isFinite(clat) && Number.isFinite(clon)) {
      lat = clat;
      lon = clon;
      name = String(cf?.city || '当前位置');
    }
  }
  if (lat === null) {
    const c = cityCoord('beijing')!;
    lat = c.lat;
    lon = c.lon;
    name = c.label;
  }

  try {
    const payload = await weatherOf(lat, lon, name || '未知');
    return ok({ data: payload });
  } catch {
    return fail(500, '天气服务暂不可用');
  }
}
