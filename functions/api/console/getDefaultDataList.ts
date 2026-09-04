import { ok, fail } from '../../lib/http';
import { requireAdmin } from '../../lib/admin';
import { readPaging } from '../../lib/console';
import type { Env } from '../../lib/http';

async function list(context: { request: Request; env: Env }) {
  const admin = await requireAdmin(context.env, context.request);
  if (!admin) return fail(403, '无权限');
  const { page, pageSize } = await readPaging(context.request);
  const totalRow = await context.env.DB.prepare('select count(*) as n from default_data_history').first<{ n: number }>();
  const total = Number(totalRow?.n || 0);
  const rows = await context.env.DB.prepare(
    `select id, enabled, created_by as username, created_at as timeCode, created_at
     from default_data_history order by created_at desc, id desc limit ? offset ?`
  )
    .bind(pageSize, (page - 1) * pageSize)
    .all<Record<string, unknown>>();
  return ok({ list: rows.results || [], total });
}

export const onRequestGet = list;
export const onRequestPost = list;
