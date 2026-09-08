import { ok } from '../lib/http';

// 与前端 siteConfig.js 保持一致，供后台「站点配置/功能开关」页加载
const SITE_CONFIG = {
  bottomLinks: '',
  title: '',
  server_url: '',
  about_us: '',
  donate: '',
  cardPush: 'close',
  offlineToUse: '',
  sourceStoreFrom: '',
  homePageLimit: '',
  userRegister: '',
  loginBackground: '',
  loginBackgroundBlur: '',
  loginBackgroundBrightness: '',
  uploadWallpaper: 'close',
  uploadWallpaperMaxSize: '',
};

export async function onRequestGet() {
  return ok({ siteConfig: SITE_CONFIG });
}
