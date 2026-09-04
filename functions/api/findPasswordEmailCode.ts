import { ok, fail } from '../lib/http';
import { EMAIL_RE, inviteCode } from '../lib/account';
import { getUserByUsername } from '../lib/db';
import type { Env } from '../lib/http';

// 不发邮件：校验账号邮箱后提示填写固定邀请码
export async function onRequestPost(context: { request: Request; env: Env }) {
  let body: Record<string, unknown>;
  try {
    body = (await context.request.json()) as Record<string, unknown>;
  } catch {
    return fail(400, '参数错误');
  }
  const username = String(body.username || '').trim();
  const email = String(body.email || '').trim();
  if (!username) return fail(400, '请输入用户名');
  if (!EMAIL_RE.test(email)) return fail(400, '邮箱格式不正确');
  const user = await getUserByUsername(context.env, username);
  if (!user || user.email !== email) return fail(400, '用户名与邮箱不匹配');
  if (!inviteCode(context.env)) return fail(400, '找回密码功能未开启');
  return ok(null, '请输入邀请码完成验证');
}
