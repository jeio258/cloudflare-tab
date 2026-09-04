import { ok } from '../lib/http';
import type { Env } from '../lib/http';

interface NoticeRow {
  title: string;
  content: string;
  time_code: string;
}

export async function onRequestGet(context: { env: Env }) {
  const row = await context.env.DB.prepare(
    'select title, content, time_code from notices where status = 1 order by created_at desc, id desc limit 1'
  ).first<NoticeRow>();
  if (!row) return ok(null);
  return ok({ title: row.title, content: row.content, timeCode: row.time_code });
}
