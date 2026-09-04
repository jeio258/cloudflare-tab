import { ok, fail } from '../../lib/http';
import { requireAdmin } from '../../lib/admin';
import { readPaging } from '../../lib/console';
import type { Env } from '../../lib/http';

// 用户管理列表（端点沿用官方命名，返回全部用户；支持 GET/POST）
async function list(context: { request: Request; env: Env }) {
  const admin = await requireAdmin(context.env, context.request);
  if (!admin) return fail(403, '无权限');
  const { page, pageSize, keyword } = await readPaging(context.request);
  const totalRow = await context.env.DB.prepare(
    keyword ? 'select count(*) as n from users where username like ? or nickname like ?' : 'select count(*) as n from users'
  )
    .bind(...(keyword ? [`%${keyword}%`, `%${keyword}%`] : []))
    .first<{ n: number }>();
  const total = Number(totalRow?.n || 0);
  const rows = await context.env.DB.prepare(
    `select id, username, user_type as userType, status, nickname, sex, email, phone, avatar, birthday,
            '' as appellation, 0 as appellationStatus,
            created_at as registerTime, created_at as updatedAt
     from users
     ${keyword ? 'where username like ? or nickname like ?' : ''}
     order by created_at desc limit ? offset ?`
  )
    .bind(...(keyword ? [`%${keyword}%`, `%${keyword}%`] : []), pageSize, (page - 1) * pageSize)
    .all<Record<string, unknown>>();
  return ok({ list: rows.results || [], total });
}

export const onRequestGet = list;
export const onRequestPost = list;
