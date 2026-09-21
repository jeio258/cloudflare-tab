import { defineHandler } from '../lib/handler';

interface DefaultRow {
  data: string;
  created_at: string;
}

export const onRequestGet = defineHandler({
  run: async ({ env }) => {
    const row = await env.DB.prepare('select data, created_at from default_data where id = 1').first<DefaultRow>();
    if (!row) return { data: null, created_at: '' };
    try {
      return { data: JSON.parse(row.data), created_at: row.created_at };
    } catch {
      return { data: null, created_at: row.created_at };
    }
  },
});
