import { cityOptions } from '../lib/cities';
import { defineHandler } from '../lib/handler';

export const onRequestGet = defineHandler({
  run: async () => cityOptions,
});
