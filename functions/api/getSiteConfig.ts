import { defineHandler } from '../lib/handler';
import SITE_CONFIG from '../lib/siteConfig.json';

// 站点配置单一数据源：functions/lib/siteConfig.json（prepare 生成的 siteConfig.js 同源）
export const onRequestGet = defineHandler({
  run: async () => ({ siteConfig: SITE_CONFIG }),
});
