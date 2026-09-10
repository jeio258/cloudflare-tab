import { ok, fail } from '../../lib/http';
import { requireAdmin } from '../../lib/admin';
import type { Env } from '../../lib/http';

// 二次确认发布：仅保留最新一条启用的公告
export async function onRequestPost(context: { request: Request; env: Env }) {
  const admin = await requireAdmin(context.env, context.request);
  if (!admin) return fail(403, '无权限');
  let body: Record<string, unknown>;
  try {
    body = (await context.request.json()) as Record<string, unknown>;
  } catch {
    return fail(400, '参数错误');
  }
  const id = String(body.id || '');
  if (!id) return fail(400, '参数错误');
  const row = await context.env.DB.prepare('select id from notices where id = ?').bind(id).first<{ id: string }>();
  if (!row) return fail(400, '公告不存在');
  const db = context.env.DB;
  await db.batch([
    db.prepare('update notices set status = 0'),
    db.prepare('update notices set status = 1 where id = ?').bind(id),
  ]);
  return ok(null, '公告已发布');
}
