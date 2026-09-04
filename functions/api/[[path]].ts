import { json } from '../lib/http';
import type { Env } from '../lib/http';

// 未实现接口统一兜底：HTTP 200 + code 404，前端按业务错误静默降级
export async function onRequestGet(_context: { request: Request; env: Env }) {
  return json(200, { code: 404, msg: '接口不存在', data: null });
}

export const onRequestPost = onRequestGet;
export const onRequestPut = onRequestGet;
export const onRequestDelete = onRequestGet;
export const onRequestOptions = onRequestGet;
