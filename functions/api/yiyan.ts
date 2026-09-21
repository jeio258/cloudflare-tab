import { defineHandler } from '../lib/handler';
import { fetchJson } from '../lib/upstream';

const FALLBACK = [
  '花有重开日，人无再少年。',
  '纸上得来终觉浅，绝知此事要躬行。',
  '长风破浪会有时，直挂云帆济沧海。',
  '念念不忘，必有回响。',
  '路虽远，行则将至；事虽难，做则必成。',
];

const pick = () => FALLBACK[Math.floor(Math.random() * FALLBACK.length)];

async function say(): Promise<string> {
  try {
    const j = (await fetchJson('https://uapis.cn/api/v1/saying/random')) as {
      content?: string;
      item?: { content?: string };
    };
    return j?.content || j?.item?.content || pick();
  } catch {
    return pick();
  }
}

const handler = defineHandler({
  run: async () => ({ content: await say() }),
});

export const onRequestGet = handler;
export const onRequestPost = handler;
