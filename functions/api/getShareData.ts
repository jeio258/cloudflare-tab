import { ok } from '../lib/http';
import { getUserData } from '../lib/db';
import type { UserRow } from '../lib/db';
import type { Env } from '../lib/http';

// 分享页契约：data=对象{shareData} 正常；data=数字2 已停止分享；data=数字3 无权限；data=null 视为无效
async function resolve(env: Env, path: string) {
  if (!path) return ok(null);
  const user = await env.DB.prepare('select * from users where share_id = ? or username = ? limit 1')
    .bind(path, path)
    .first<UserRow>();
  if (!user) return ok(null);
  if (Number(user.status) === 0) return ok(3);
  const row = await getUserData(env, user.id);
  if (!row) return ok(null);
  try {
    return ok({ shareData: JSON.parse(row.data) });
  } catch {
    return ok(null);
  }
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const url = new URL(context.request.url);
  return resolve(context.env, (url.searchParams.get('path') || '').trim());
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  let path = '';
  try {
    const body = (await context.request.json()) as Record<string, unknown>;
    path = String(body?.path || '').trim();
  } catch {
    path = '';
  }
  return resolve(context.env, path);
}
