import type { Env } from './http';
import type { UserRow } from './db';
import { authUser } from './auth';

// 校验管理员：返回用户行或 null
export const requireAdmin = async (env: Env, request: Request): Promise<UserRow | null> => {
  const user = await authUser(env, request);
  return user && Number(user.user_type) === 1 ? user : null;
};
