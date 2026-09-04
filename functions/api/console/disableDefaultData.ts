import { ok, fail } from '../../lib/http';
import { requireAdmin } from '../../lib/admin';
import { syncCurrent } from '../../lib/defaultData';
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
  const id = String(body.id || '');
  if (!id) return fail(400, '参数错误');
  await context.env.DB.prepare('update default_data_history set enabled = 0 where id = ?').bind(id).run();
  await syncCurrent(context.env);
  return ok(null, '已停用');
}
