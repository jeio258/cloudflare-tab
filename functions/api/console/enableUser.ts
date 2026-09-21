import { defineHandler } from '../../lib/handler';
import { ApiError } from '../../lib/http';

export const onRequestPost = defineHandler({
  auth: 'admin',
  body: true,
  msg: '已启用',
  run: async ({ env, admin, body }) => {
    const userId = String(body.userId || '');
    if (!userId) throw new ApiError(400, '参数错误');
    if (userId === admin!.id) throw new ApiError(400, '不能操作自己的账号');
    await env.DB.prepare('update users set status = 1 where id = ?').bind(userId).run();
    return null;
  },
});
