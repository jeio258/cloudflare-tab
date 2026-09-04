import { ok } from '../lib/http';
import type { Env } from '../lib/http';

interface DefaultRow {
  data: string;
  created_at: string;
}

export async function onRequestGet(context: { env: Env }) {
  const row = await context.env.DB.prepare('select data, created_at from default_data where id = 1').first<DefaultRow>();
  if (!row) return ok({ data: null, created_at: '' });
  try {
    return ok({ data: JSON.parse(row.data), created_at: row.created_at });
  } catch {
    return ok({ data: null, created_at: row.created_at });
  }
}
