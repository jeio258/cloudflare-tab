import { ok } from '../lib/http';
import { fetchJson } from '../lib/widgets';

const FALLBACK = [
  '花有重开日，人无再少年。',
  '纸上得来终觉浅，绝知此事要躬行。',
  '长风破浪会有时，直挂云帆济沧海。',
  '念念不忘，必有回响。',
  '路虽远，行则将至；事虽难，做则必成。',
];

const pick = () => FALLBACK[Math.floor(Math.random() * FALLBACK.length)];

export async function onRequestGet(context: { request: Request }) {
  const url = new URL(context.request.url);
  const types = (url.searchParams.get('types') || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^[a-l]$/.test(s));

  let content = '';
  try {
    const q = types.length ? types.map((t) => `c=${t}`).join('&') : '';
    const j = (await fetchJson(`https://v1.hitokoto.cn/?encode=json${q ? `&${q}` : ''}`)) as {
      hitokoto?: string;
    };
    content = j?.hitokoto || pick();
  } catch {
    content = pick();
  }
  return ok({ content });
}
