import { ok, fail } from '../lib/http';
import { EMAIL_RE, validPassword, codeMatches, inviteCode } from '../lib/account';
import { getUserByUsername, updatePassword } from '../lib/db';
import { hashPassword } from '../lib/auth';
import type { Env } from '../lib/http';

export async function onRequestPost(context: { request: Request; env: Env }) {
  let body: Record<string, unknown>;
  try {
    body = (await context.request.json()) as Record<string, unknown>;
  } catch {
    return fail(400, '参数错误');
  }
  if (!inviteCode(context.env)) return fail(400, '找回密码功能未开启');
  const username = String(body.username || '').trim();
  const email = String(body.email || '').trim();
  const newPassword = String(body.newPassword || '');
  const confirmPassword = String(body.confirmPassword || '');
  if (!username) return fail(400, '请输入用户名');
  if (!EMAIL_RE.test(email)) return fail(400, '邮箱格式不正确');
  if (!validPassword(newPassword)) return fail(400, '新密码长度需在 6-32 位之间');
  if (newPassword !== confirmPassword) return fail(400, '两次输入的新密码不一致');
  if (!codeMatches(context.env, body.emailCode)) return fail(400, '邀请码不正确');

  const user = await getUserByUsername(context.env, username);
  if (!user || user.email !== email) return fail(400, '用户名与邮箱不匹配');

  await updatePassword(context.env, user.id, await hashPassword(newPassword));
  return ok(null, '密码已重置，请登录');
}
