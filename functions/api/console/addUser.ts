import { EMAIL_RE, PHONE_RE, USERNAME_RE, validPassword } from '../../lib/account';
import { hashPassword, newId } from '../../lib/auth';
import { getUserByUsername, insertUser } from '../../lib/db';
import { defineHandler } from '../../lib/handler';
import { ApiError } from '../../lib/http';

export const onRequestPost = defineHandler({
  auth: 'admin',
  body: true,
  msg: '用户已创建',
  run: async ({ env, body }) => {
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    const nickname = String(body.nickname || '').trim() || username;
    const email = String(body.email || '').trim();
    const phone = String(body.phone || '').trim();
    const sex = Number(body.sex ?? 0);
    const userType = Number(body.userType ?? body.user_type ?? 0) === 1 ? 1 : 0;

    if (!USERNAME_RE.test(username)) throw new ApiError(400, '用户名需字母开头、3-20 位字母数字_-');
    if (!validPassword(password)) throw new ApiError(400, '密码长度需在 6-32 位之间');
    if (email && !EMAIL_RE.test(email)) throw new ApiError(400, '邮箱格式不正确');
    if (phone && !PHONE_RE.test(phone)) throw new ApiError(400, '手机号格式不正确');
    if (await getUserByUsername(env, username)) throw new ApiError(400, '用户名已存在');

    await insertUser(env, {
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
    return null;
  },
});
