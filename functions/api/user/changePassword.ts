import { ok, fail } from '../../lib/http';
import { updatePassword } from '../../lib/db';
import { authUser, hashPassword, verifyPassword } from '../../lib/auth';
import type { Env } from '../../lib/http';

export async function onRequestPost(context: { request: Request; env: Env }) {
  const user = await authUser(context.env, context.request);
  if (!user) return fail(401, '登录已失效');

  let body: Record<string, unknown>;
  try {
    body = (await context.request.json()) as Record<string, unknown>;
  } catch {
    return fail(400, '参数错误');
  }
  const oldPassword = String(body.oldPassword || '');
  const newPassword = String(body.newPassword || '');
  const confirmPassword = String(body.confirmPassword || '');
  if (!oldPassword || !newPassword) return fail(400, '密码不能为空');
  if (newPassword !== confirmPassword) return fail(400, '两次输入的新密码不一致');
  if (newPassword.length < 6 || newPassword.length > 32) return fail(400, '新密码长度需在 6-32 位之间');
  if (!(await verifyPassword(oldPassword, user.password))) return fail(400, '原密码错误');

  const hash = await hashPassword(newPassword);
  await updatePassword(context.env, user.id, hash);
  return ok(null);
}
