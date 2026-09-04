import { ok, fail } from '../lib/http';
import { EMAIL_RE, USERNAME_RE, validPassword, codeMatches, inviteCode } from '../lib/account';
import { getUserByUsername, insertUser } from '../lib/db';
import { newId, hashPassword } from '../lib/auth';
import type { Env } from '../lib/http';

export async function onRequestPost(context: { request: Request; env: Env }) {
  let body: Record<string, unknown>;
  try {
    body = (await context.request.json()) as Record<string, unknown>;
  } catch {
    return fail(400, '参数错误');
  }
  if (!inviteCode(context.env)) return fail(400, '注册功能未开启');
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  const email = String(body.email || '').trim();
  if (!USERNAME_RE.test(username)) return fail(400, '用户名需字母开头、3-20 位字母数字_-');
  if (!validPassword(password)) return fail(400, '密码长度需在 6-32 位之间');
  if (!EMAIL_RE.test(email)) return fail(400, '邮箱格式不正确');
  if (!codeMatches(context.env, body.emailCode)) return fail(400, '邀请码不正确');

  if (await getUserByUsername(context.env, username)) return fail(400, '用户名已存在');

  const hash = await hashPassword(password);
  await insertUser(context.env, {
    id: newId(),
    username,
    password: hash,
    nickname: username,
    email,
    phone: '',
    avatar: '',
    sex: 0,
    birthday: '',
    user_type: 0,
    created_at: '',
    status: 1,
    share_id: newId(),
    share_enabled: 0,
  });
  return ok(null, '注册成功，请登录');
}
