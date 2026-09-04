import { ok, fail } from '../../lib/http';
import { USERNAME_RE, PHONE_RE } from '../../lib/account';
import { getUserById, getUserByUsername, updateProfile, toUserInfo } from '../../lib/db';
import { authUser } from '../../lib/auth';
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
  const username = String(body.username ?? user.username).trim();
  const nickname = String(body.nickname ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  const sex = Number(body.sex ?? 0);
  const birthdayRaw = body.birthday;
  const birthday = birthdayRaw === undefined || birthdayRaw === null ? null : String(birthdayRaw);

  if (!USERNAME_RE.test(username)) return fail(400, '用户名需字母开头、3-20 位字母数字_-');
  if (nickname.length > 20) return fail(400, '昵称不能超过 20 个字符');
  if (phone && !PHONE_RE.test(phone)) return fail(400, '手机号格式不正确');
  if (sex !== 0 && sex !== 1) return fail(400, '性别参数不正确');

  if (username !== user.username) {
    const exists = await getUserByUsername(context.env, username);
    if (exists && exists.id !== user.id) return fail(400, '用户名已存在');
  }

  await updateProfile(context.env, user.id, { username, nickname, sex, phone, birthday });
  const fresh = await getUserById(context.env, user.id);
  return ok(toUserInfo(fresh || user));
}
