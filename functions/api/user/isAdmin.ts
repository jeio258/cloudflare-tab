import { defineHandler } from '../../lib/handler';
import { ApiError } from '../../lib/http';

// /console 仅管理员可进：userType===1 返回 200，否则 403（避免触发 401 登出逻辑）
export const onRequestGet = defineHandler({
  auth: 'user',
  run: async ({ user }) => {
    if (Number(user!.user_type) === 1 && Number(user!.status) !== 0) return true;
    throw new ApiError(403, '无权限');
  },
});
