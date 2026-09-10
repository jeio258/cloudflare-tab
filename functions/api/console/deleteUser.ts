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
  const userId = String(body.userId || body.id || '');
  if (!userId) return fail(400, '参数错误');
  if (userId === admin.id) return fail(400, '不能删除自己的账号');
  // 原子级联清理该用户的云数据与账号
  const db = context.env.DB;
  await db.batch([
    db.prepare('delete from user_data where user_id = ?').bind(userId),
    db.prepare('delete from users where id = ?').bind(userId),
  ]);
  return ok(null, '用户已删除');
}
