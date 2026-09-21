import { syncCurrent } from '../../lib/defaultData';
import { defineHandler } from '../../lib/handler';

export const onRequestPost = defineHandler({
  auth: 'admin',
  msg: '已清理',
  run: async ({ env }) => {
    // 只保留最新 10 条快照
    await env.DB.prepare(
      `delete from default_data_history where id not in
       (select id from default_data_history order by created_at desc, id desc limit 10)`
    ).run();
    await syncCurrent(env);
    return null;
  },
});
