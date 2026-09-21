import { defineHandler } from '../../lib/handler';
import type { RouteContext } from '../../lib/handler';
import { readPaging } from '../../lib/paging';

// 用户管理列表（端点沿用官方命名，返回全部用户；支持 GET/POST）
async function list(ctx: RouteContext) {
  const { page, pageSize, keyword } = await readPaging(ctx.request);
  const totalRow = await ctx.env.DB.prepare(
    keyword ? 'select count(*) as n from users where username like ? or nickname like ?' : 'select count(*) as n from users'
  )
    .bind(...(keyword ? [`%${keyword}%`, `%${keyword}%`] : []))
    .first<{ n: number }>();
  const total = Number(totalRow?.n || 0);
  const rows = await ctx.env.DB.prepare(
    `select id, username, user_type as userType, status, nickname, sex, email, phone, avatar, birthday,
            '' as appellation, 0 as appellationStatus,
            created_at as registerTime, created_at as updatedAt
     from users
     ${keyword ? 'where username like ? or nickname like ?' : ''}
     order by created_at desc limit ? offset ?`
  )
    .bind(...(keyword ? [`%${keyword}%`, `%${keyword}%`] : []), pageSize, (page - 1) * pageSize)
    .all<Record<string, unknown>>();
  return { list: rows.results || [], total };
}

const handler = defineHandler({ auth: 'admin', run: list });

export const onRequestGet = handler;
export const onRequestPost = handler;
