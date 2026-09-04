import { ok } from '../lib/http';
import { cachedJson, fetchJson } from '../lib/widgets';

interface HotItem {
  title: string;
  url: string;
  hot?: string;
}

async function weibo(): Promise<HotItem[]> {
  const j = (await fetchJson('https://weibo.com/ajax/side/hotSearch', {
    headers: { referer: 'https://weibo.com/' },
  })) as { data?: { realtime?: Array<{ word?: string; num?: number; url?: string }> } };
  const list = j?.data?.realtime;
  if (!Array.isArray(list)) return [];
  return list
    .slice(0, 50)
    .map((it) => ({
      title: String(it.word || ''),
      url: it.url
        ? `https://weibo.com${it.url}`
        : `https://s.weibo.com/weibo?q=${encodeURIComponent(`#${it.word || ''}#`)}`,
      hot: it.num != null ? String(it.num) : '',
    }))
    .filter((x) => x.title);
}

async function bilibili(): Promise<HotItem[]> {
  const j = (await fetchJson('https://api.bilibili.com/x/web-interface/ranking/v2?rid=0&type=all', {
    headers: { referer: 'https://www.bilibili.com/' },
  })) as {
    code?: number;
    data?: { list?: Array<{ title?: string; bvid?: string }> };
  };
  const list = j?.code === 0 ? j?.data?.list : undefined;
  if (!Array.isArray(list)) return [];
  return list
    .slice(0, 30)
    .map((it) => ({ title: String(it.title || ''), url: `https://www.bilibili.com/video/${it.bvid || ''}`, hot: '' }))
    .filter((x) => x.title);
}

async function baidu(): Promise<HotItem[]> {
  const j = (await fetchJson('https://top.baidu.com/api/board?platform=wise&tab=realtime')) as {
    data?: { cards?: Array<{ content?: Array<{ content?: Array<{ word?: string; hotScore?: string; url?: string }> }> }> };
  };
  const cards = j?.data?.cards;
  if (!Array.isArray(cards)) return [];
  // cards[0].content 可能再包一层 content 数组
  const content0 = cards[0]?.content || [];
  const groups = content0.length === 1 && Array.isArray(content0[0]?.content) ? content0[0].content : content0;
  const list = Array.isArray(groups) ? (groups as Array<{ word?: string; hotScore?: string; url?: string }>) : [];
  return list
    .map((it) => ({
      title: String(it?.word || ''),
      url: it?.url || `https://www.baidu.com/s?wd=${encodeURIComponent(it?.word || '')}`,
      hot: it?.hotScore != null ? String(it.hotScore) : '',
    }))
    .filter((x) => x.title);
}

const SOURCES: Record<string, () => Promise<HotItem[]>> = { weibo, bilibili, baidu };

export async function hotEvents(type: string): Promise<HotItem[]> {
  const fn = SOURCES[type];
  if (!fn) return [];
  try {
    return await cachedJson(`hot:${type}`, 5 * 60_000, fn);
  } catch {
    return [];
  }
}
