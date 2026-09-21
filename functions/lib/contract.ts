import type { UserRow } from './db';

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
