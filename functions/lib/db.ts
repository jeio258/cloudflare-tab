import type { Env } from './http';

export interface UserRow {
  id: string;
  username: string;
  password: string;
  nickname: string;
  email: string;
  phone: string;
  avatar: string;
  sex: number;
  birthday: string;
  user_type: number;
  created_at: string;
  status: number;
  share_id: string | null;
  share_enabled: number;
}

export const getUserByUsername = (env: Env, username: string) =>
  env.DB.prepare('select * from users where username = ?')
    .bind(username)
    .first<UserRow>();

export const getUserById = (env: Env, id: string) =>
  env.DB.prepare('select * from users where id = ?').bind(id).first<UserRow>();

export const insertUser = (env: Env, u: Omit<UserRow, 'created_at'>) =>
  env.DB.prepare(
    `insert into users (id, username, password, nickname, email, phone, avatar, sex, birthday, user_type, status, share_id, share_enabled)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      u.id,
      u.username,
      u.password,
      u.nickname,
      u.email,
      u.phone,
      u.avatar,
      u.sex,
      u.birthday,
      u.user_type,
      u.status,
      u.share_id,
      u.share_enabled
    )
    .run();

export const updatePassword = (env: Env, id: string, password: string) =>
  env.DB.prepare('update users set password = ? where id = ?').bind(password, id).run();

export const updateProfile = (
  env: Env,
  id: string,
  p: { username?: string; nickname?: string; sex?: number; phone?: string; birthday?: string | null }
) =>
  env.DB.prepare(
    `update users set
       username = coalesce(?, username),
       nickname = coalesce(?, nickname),
       sex = coalesce(?, sex),
       phone = coalesce(?, phone),
       birthday = coalesce(?, birthday)
     where id = ?`
  )
    .bind(p.username ?? null, p.nickname ?? null, p.sex ?? null, p.phone ?? null, p.birthday ?? null, id)
    .run();

export interface UserDataRow {
  user_id: string;
  data: string;
  timestamp: number;
}

export const getUserData = (env: Env, userId: string) =>
  env.DB.prepare('select * from user_data where user_id = ?').bind(userId).first<UserDataRow>();

export const upsertUserData = (env: Env, userId: string, data: string, timestamp: number) =>
  env.DB.prepare(
    `insert into user_data (user_id, data, timestamp) values (?, ?, ?)
     on conflict(user_id) do update set data = excluded.data, timestamp = excluded.timestamp`
  )
    .bind(userId, data, timestamp)
    .run();

// userInfo 对象字段按前端读取口径
export function toUserInfo(u: UserRow) {
  return {
    userId: u.id,
    username: u.username,
    nickname: u.nickname || '',
    sex: Number(u.sex) || 0,
    phone: u.phone || '',
    birthday: u.birthday || '',
    email: u.email || '',
    avatar: u.avatar || '',
    userType: Number(u.user_type) || 0,
    appellation: '',
    appellationStatus: 0,
    registerTime: u.created_at || '',
  };
}
