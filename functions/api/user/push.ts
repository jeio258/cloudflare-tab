import { ok, fail, json } from '../../lib/http';
import { getUserData, upsertUserData } from '../../lib/db';
import { authUser } from '../../lib/auth';
import type { Env } from '../../lib/http';

// 每账号云快照上限（字节，UTF-16 长度近似），防超大 JSON 滥用存储
const MAX_DATA_BYTES = 262144;

export async function onRequestPost(context: { request: Request; env: Env }) {
  const user = await authUser(context.env, context.request);
  if (!user) return fail(401, '登录已失效');

  let body: Record<string, unknown>;
  try {
    body = (await context.request.json()) as Record<string, unknown>;
  } catch {
    return fail(400, '参数错误');
  }
  const data = body.data;
  const timestamp = Number(body.timestamp);
  const baseTimestamp = typeof body.baseTimestamp === 'number' ? body.baseTimestamp : undefined;
  if (data === undefined || data === null || !Number.isFinite(timestamp)) {
    return fail(400, '参数错误');
  }
  const payload = JSON.stringify(data);
  if (payload.length > MAX_DATA_BYTES) return fail(400, '数据过大，无法保存');

  const row = await getUserData(context.env, user.id);
  const stored = row ? Number(row.timestamp) : 0;
  // 冲突：客户端基于更旧版本推送
  if (row && typeof baseTimestamp === 'number' && baseTimestamp < stored) {
    return json(409, { code: 409, msg: '云端数据已更新', data: null });
  }
  // 单调递增：新时间戳必须严格大于已存值
  const newTs = Math.max(timestamp, stored + 1);
  await upsertUserData(context.env, user.id, payload, newTs);
  return ok({ timestamp: newTs });
}
