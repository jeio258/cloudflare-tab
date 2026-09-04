import { json, ok, fail } from '../lib/http';
import { getUserByUsername, toUserInfo } from '../lib/db';
import { createToken, verifyPassword } from '../lib/auth';
import type { Env } from '../lib/http';

export async function onRequestPost(context: { request: Request; env: Env }) {
  let body: Record<string, unknown>;
  try {
    body = (await context.request.json()) as Record<string, unknown>;
  } catch {
    return fail(400, '参数错误');
  }
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  if (!username || !password) return fail(400, '用户名和密码不能为空');

  const user = await getUserByUsername(context.env, username);
  if (!user || !(await verifyPassword(password, user.password))) {
    return fail(400, '用户名或密码错误');
  }
  if (Number(user.status) === 0) return fail(403, '账号已被禁用');
  const token = await createToken(context.env, user.id);
  return ok({ token, userInfo: toUserInfo(user) });
}

export function onRequestOptions() {
  return json(204, null);
}
