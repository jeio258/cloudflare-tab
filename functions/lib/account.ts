import type { Env } from './http';

export const USERNAME_RE = /^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^1[3-9]\d{9}$/;

export const validPassword = (p: string) => p.length >= 6 && p.length <= 32;

// 注册/找回的"验证码"即为固定邀请码（无邮件服务，B 方案）
export const inviteCode = (env: Env): string | null => (env.REGISTER_CODE ? String(env.REGISTER_CODE) : null);

export const codeMatches = (env: Env, code: unknown): boolean => {
  const want = inviteCode(env);
  if (!want) return false;
  return String(code ?? '').trim() === want;
};
