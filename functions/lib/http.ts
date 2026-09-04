export type Env = { DB: D1Database; JWT_SECRET?: string; REGISTER_CODE?: string };

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json;charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export const ok = (data: unknown, msg = 'ok') => json(200, { code: 200, msg, data });
export const fail = (code: number, msg: string) => json(200, { code, msg, data: null });
