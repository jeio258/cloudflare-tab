import { ok, fail } from '../../lib/http';
import { requireAdmin } from '../../lib/admin';
import type { Env } from '../../lib/http';

export async function onRequestPost(context: { request: Request; env: Env }) {
  const admin = await requireAdmin(context.env, context.request);
  if (!admin) return fail(403, '无权限');

  let body: Record<string, unknown>;
  try {
    body = (await context.request.json()) as Record<string, unknown>;
  } catch {
    return fail(400, '参数错误');
  }
  const userId = String(body.userId || '');
  const type = Number(body.type ?? -1);
  if (!userId || (type !== 0 && type !== 1)) return fail(400, '参数错误');
  if (userId === admin.id) return fail(400, '不能修改自己的管理员身份');

  await context.env.DB.prepare('update users set user_type = ? where id = ?').bind(type, userId).run();
  return ok(null, '已更新');
}
