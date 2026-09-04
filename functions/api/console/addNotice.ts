import { ok, fail } from '../../lib/http';
import { requireAdmin } from '../../lib/admin';
import { newId } from '../../lib/auth';
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
  const title = String(body.title || '').trim();
  const content = String(body.content || '');
  if (!title) return fail(400, '标题不能为空');

  await context.env.DB.prepare(
    'insert into notices (id, title, content, status, time_code, created_by) values (?, ?, ?, 0, ?, ?)'
  )
    .bind(newId(), title, content, String(Date.now()), admin.username)
    .run();
  return ok(null, '公告已创建，请确认发布');
}
