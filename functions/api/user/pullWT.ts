import { getUserData } from '../../lib/db';
import { defineHandler } from '../../lib/handler';

export const onRequestGet = defineHandler({
  auth: 'user',
  run: async ({ env, user }) => {
    const row = await getUserData(env, user!.id);
    if (!row) return { timestamp: 0, data: null };
    try {
      return { timestamp: Number(row.timestamp), data: JSON.parse(row.data) };
    } catch {
      return { timestamp: Number(row.timestamp), data: null };
    }
  },
});
