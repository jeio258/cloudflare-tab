import { defineHandler } from '../lib/handler';

export const onRequestGet = defineHandler({
  run: async ({ env }) => {
    const row = await env.DB.prepare('select created_at from default_data where id = 1').first<{ created_at: string }>();
    return row ? row.created_at : '';
  },
});
