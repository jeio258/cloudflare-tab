import { ok, fail } from '../../lib/http';
import { authUser } from '../../lib/auth';
import type { Env } from '../../lib/http';

// /console 仅管理员可进：userType===1 返回 200，否则 403（避免触发 401 登出逻辑）
export async function onRequestGet(context: { request: Request; env: Env }) {
  const user = await authUser(context.env, context.request);
  if (!user) return fail(401, '登录已失效');
  if (Number(user.user_type) === 1 && Number(user.status) !== 0) return ok(true);
  return fail(403, '无权限');
}
