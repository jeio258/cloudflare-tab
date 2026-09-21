import { defineHandler } from '../../lib/handler';
import { ApiError } from '../../lib/http';

export const onRequestPost = defineHandler({
  auth: 'admin',
  body: true,
  msg: '公告已删除',
  run: async ({ env, body }) => {
    const id = String(body.id || '');
    if (!id) throw new ApiError(400, '参数错误');
    await env.DB.prepare('delete from notices where id = ?').bind(id).run();
    return null;
  },
});
