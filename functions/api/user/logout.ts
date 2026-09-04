import { ok } from '../../lib/http';
import type { Env } from '../../lib/http';

export async function onRequestGet(_context: { request: Request; env: Env }) {
  return ok(null);
}
