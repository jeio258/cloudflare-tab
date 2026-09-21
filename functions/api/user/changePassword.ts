import { hashPassword, verifyPassword } from '../../lib/auth';
import { updatePassword } from '../../lib/db';
import { defineHandler } from '../../lib/handler';
import { ApiError } from '../../lib/http';

export const onRequestPost = defineHandler({
  auth: 'user',
  body: true,
  run: async ({ env, user, body }) => {
    const oldPassword = String(body.oldPassword || '');
    const newPassword = String(body.newPassword || '');
    const confirmPassword = String(body.confirmPassword || '');
    if (!oldPassword || !newPassword) throw new ApiError(400, '密码不能为空');
    if (newPassword !== confirmPassword) throw new ApiError(400, '两次输入的新密码不一致');
    if (newPassword.length < 6 || newPassword.length > 32) throw new ApiError(400, '新密码长度需在 6-32 位之间');
    if (!(await verifyPassword(oldPassword, user!.password))) throw new ApiError(400, '原密码错误');

    await updatePassword(env, user!.id, await hashPassword(newPassword));
    return null;
  },
});
