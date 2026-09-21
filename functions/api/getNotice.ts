import { defineHandler } from '../lib/handler';

interface NoticeRow {
  title: string;
  content: string;
  time_code: string;
}

export const onRequestGet = defineHandler({
  run: async ({ env }) => {
    const row = await env.DB.prepare(
      'select title, content, time_code from notices where status = 1 order by created_at desc, id desc limit 1'
    ).first<NoticeRow>();
    if (!row) return null;
    return { title: row.title, content: row.content, timeCode: row.time_code };
  },
});
