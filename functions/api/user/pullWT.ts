import { ok, fail } from '../../lib/http';
import { getUserData } from '../../lib/db';
import { authUser } from '../../lib/auth';
import type { Env } from '../../lib/http';

export async function onRequestGet(context: { request: Request; env: Env }) {
  const user = await authUser(context.env, context.request);
  if (!user) return fail(401, '登录已失效');
  const row = await getUserData(context.env, user.id);
  if (!row) return ok({ timestamp: 0, data: null });
  try {
    return ok({ timestamp: Number(row.timestamp), data: JSON.parse(row.data) });
  } catch {
    return ok({ timestamp: Number(row.timestamp), data: null });
  }
}
