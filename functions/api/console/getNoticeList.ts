import { defineHandler } from '../../lib/handler';
import type { RouteContext } from '../../lib/handler';
import { readPaging } from '../../lib/paging';

async function list(ctx: RouteContext) {
  const { page, pageSize } = await readPaging(ctx.request);
  const totalRow = await ctx.env.DB.prepare('select count(*) as n from notices').first<{ n: number }>();
  const total = Number(totalRow?.n || 0);
  const rows = await ctx.env.DB.prepare(
    'select id, title, content, status, time_code as timeCode, created_by as username, created_at from notices order by created_at desc, id desc limit ? offset ?'
  )
    .bind(pageSize, (page - 1) * pageSize)
    .all<Record<string, unknown>>();
  return { list: rows.results || [], total };
}

const handler = defineHandler({ auth: 'admin', run: list });

export const onRequestGet = handler;
export const onRequestPost = handler;
