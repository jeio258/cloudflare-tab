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
  const data = body.data;
  if (data === undefined || data === null) return fail(400, '参数错误');

  const now = new Date().toISOString();
  const dataJson = JSON.stringify(data);
  // 当前默认主页（游客读取）
  await context.env.DB.prepare(
    `insert into default_data (id, data, created_at) values (1, ?, ?)
     on conflict(id) do update set data = excluded.data, created_at = excluded.created_at`
  )
    .bind(dataJson, now)
    .run();
  // 历史快照：仅最新一条启用
  await context.env.DB.prepare('update default_data_history set enabled = 0').run();
  await context.env.DB.prepare(
    'insert into default_data_history (id, data, enabled, created_by, created_at) values (?, ?, 1, ?, ?)'
  )
    .bind(newId(), dataJson, admin.username, now)
    .run();
  return ok(null, '已保存为默认主页');
}
