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
  const id = String(body.id || '');
  const title = String(body.title || '').trim();
  const content = String(body.content || '');
  if (!id || !title) return fail(400, '参数错误');

  await context.env.DB.prepare('update notices set title = ?, content = ? where id = ?')
    .bind(title, content, id)
    .run();
  return ok(null, '公告已更新');
}
