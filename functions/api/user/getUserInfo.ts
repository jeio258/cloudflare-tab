import { ok, fail } from '../../lib/http';
import { toUserInfo } from '../../lib/db';
import { authUser } from '../../lib/auth';
import type { Env } from '../../lib/http';

export async function onRequestGet(context: { request: Request; env: Env }) {
  const user = await authUser(context.env, context.request);
  if (!user) return fail(401, '登录已失效');
  return ok(toUserInfo(user));
}
