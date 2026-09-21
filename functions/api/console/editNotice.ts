import { defineHandler } from '../../lib/handler';
import { ApiError } from '../../lib/http';

export const onRequestPost = defineHandler({
  auth: 'admin',
  body: true,
  msg: '公告已更新',
  run: async ({ env, body }) => {
    const id = String(body.id || '');
    const title = String(body.title || '').trim();
    const content = String(body.content || '');
    if (!id || !title) throw new ApiError(400, '参数错误');

    await env.DB.prepare('update notices set title = ?, content = ? where id = ?')
      .bind(title, content, id)
      .run();
    return null;
  },
});
