import { EMAIL_RE, inviteCode } from '../lib/account';
import { defineHandler } from '../lib/handler';
import { ApiError } from '../lib/http';

// 不发邮件：仅提示用户填写固定邀请码
export const onRequestPost = defineHandler({
  body: true,
  msg: '请输入邀请码完成验证',
  run: async ({ env, body }) => {
    const email = String(body.email || '').trim();
    if (!EMAIL_RE.test(email)) throw new ApiError(400, '邮箱格式不正确');
    if (!inviteCode(env)) throw new ApiError(400, '注册功能未开启');
    return null;
  },
});
