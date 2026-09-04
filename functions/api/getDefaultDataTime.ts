import { ok } from '../lib/http';
import type { Env } from '../lib/http';

export async function onRequestGet(context: { env: Env }) {
  const row = await context.env.DB.prepare('select created_at from default_data where id = 1').first<{ created_at: string }>();
  return ok(row ? row.created_at : '');
}
