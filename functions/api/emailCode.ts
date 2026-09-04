import { ok, fail } from '../lib/http';
import { EMAIL_RE, inviteCode } from '../lib/account';
import type { Env } from '../lib/http';

// 不发邮件：仅提示用户填写固定邀请码
export async function onRequestPost(context: { request: Request; env: Env }) {
  let body: Record<string, unknown>;
  try {
    body = (await context.request.json()) as Record<string, unknown>;
  } catch {
    return fail(400, '参数错误');
  }
  const email = String(body.email || '').trim();
  if (!EMAIL_RE.test(email)) return fail(400, '邮箱格式不正确');
  if (!inviteCode(context.env)) return fail(400, '注册功能未开启');
  return ok(null, '请输入邀请码完成验证');
}
