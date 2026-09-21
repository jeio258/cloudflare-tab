import { toUserInfo } from '../../lib/contract';
import { defineHandler } from '../../lib/handler';

export const onRequestGet = defineHandler({
  auth: 'user',
  run: async ({ user }) => toUserInfo(user!),
});
