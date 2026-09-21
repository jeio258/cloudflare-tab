import { syncCurrent } from '../../lib/defaultData';
import { defineHandler } from '../../lib/handler';
import { ApiError } from '../../lib/http';

export const onRequestPost = defineHandler({
  auth: 'admin',
  body: true,
  msg: '已删除',
  run: async ({ env, body }) => {
    const id = String(body.id || '');
    if (!id) throw new ApiError(400, '参数错误');
    await env.DB.prepare('delete from default_data_history where id = ?').bind(id).run();
    await syncCurrent(env);
    return null;
  },
});
