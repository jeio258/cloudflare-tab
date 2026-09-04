import { ok, fail } from '../../lib/http';
import { requireAdmin } from '../../lib/admin';
import { syncCurrent } from '../../lib/defaultData';
import type { Env } from '../../lib/http';

export async function onRequestPost(context: { request: Request; env: Env }) {
  const admin = await requireAdmin(context.env, context.request);
  if (!admin) return fail(403, '无权限');
  // 只保留最新 10 条快照
  await context.env.DB.prepare(
    `delete from default_data_history where id not in
     (select id from default_data_history order by created_at desc, id desc limit 10)`
  ).run();
  await syncCurrent(context.env);
  return ok(null, '已清理');
}
