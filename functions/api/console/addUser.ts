import { ok, fail } from '../../lib/http';
import { requireAdmin } from '../../lib/admin';
import { EMAIL_RE, PHONE_RE, USERNAME_RE, validPassword } from '../../lib/account';
import { getUserByUsername, insertUser } from '../../lib/db';
import { newId, hashPassword } from '../../lib/auth';
import type { Env } from '../../lib/http';

export async function onRequestPost(context: { request: Request; env: Env }) {
  const admin = await requireAdmin(context.env, context.request);
  if (!admin) return fail(403, '无权限');

  let body: Record<string, unknown>;
  try {
    body = (await context.request.json()) as Record<string, unknown>;
  } catch {
    return fail(400, '参数错误');
  }
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  const nickname = String(body.nickname || '').trim() || username;
  const email = String(body.email || '').trim();
  const phone = String(body.phone || '').trim();
  const sex = Number(body.sex ?? 0);
  const userType = Number(body.userType ?? body.user_type ?? 0) === 1 ? 1 : 0;

  if (!USERNAME_RE.test(username)) return fail(400, '用户名需字母开头、3-20 位字母数字_-');
  if (!validPassword(password)) return fail(400, '密码长度需在 6-32 位之间');
  if (email && !EMAIL_RE.test(email)) return fail(400, '邮箱格式不正确');
  if (phone && !PHONE_RE.test(phone)) return fail(400, '手机号格式不正确');
  if (await getUserByUsername(context.env, username)) return fail(400, '用户名已存在');

  await insertUser(context.env, {
    id: newId(),
    username,
    password: await hashPassword(password),
    nickname,
    email,
    phone,
    avatar: '',
    sex,
    birthday: '',
    user_type: userType,
    status: 1,
    share_id: newId(),
    share_enabled: 0,
  });
  return ok(null, '用户已创建');
}
