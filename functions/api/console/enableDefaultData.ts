import { applySnapshot } from '../../lib/defaultData';
import { defineHandler } from '../../lib/handler';
import { ApiError } from '../../lib/http';

export const onRequestPost = defineHandler({
  auth: 'admin',
  body: true,
  msg: '已启用',
  run: async ({ env, body }) => {
    const id = String(body.id || '');
    if (!id || !(await applySnapshot(env, id))) throw new ApiError(400, '快照不存在');
    return null;
  },
});
