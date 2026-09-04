import { ok, fail } from '../../lib/http';
import { requireAdmin } from '../../lib/admin';
import { applySnapshot } from '../../lib/defaultData';
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
  if (!id || !(await applySnapshot(context.env, id))) return fail(400, '快照不存在');
  return ok(null, '已启用');
}
