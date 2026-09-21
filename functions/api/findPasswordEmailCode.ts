import { EMAIL_RE, inviteCode } from '../lib/account';
import { getUserByUsername } from '../lib/db';
import { defineHandler } from '../lib/handler';
import { ApiError } from '../lib/http';

// 不发邮件：校验账号邮箱后提示填写固定邀请码
export const onRequestPost = defineHandler({
  body: true,
  msg: '请输入邀请码完成验证',
  run: async ({ env, body }) => {
    const username = String(body.username || '').trim();
    const email = String(body.email || '').trim();
    if (!username) throw new ApiError(400, '请输入用户名');
    if (!EMAIL_RE.test(email)) throw new ApiError(400, '邮箱格式不正确');
    const user = await getUserByUsername(env, username);
    if (!user || user.email !== email) throw new ApiError(400, '用户名与邮箱不匹配');
    if (!inviteCode(env)) throw new ApiError(400, '找回密码功能未开启');
    return null;
  },
});
