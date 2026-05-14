import { ADMIN_PASSWORD } from '$env/static/private';

export const ADMIN_SESSION_COOKIE = 'admin_session';

/** 관리자 세션 쿠키 검증 */
export function isAdmin(cookies) {
  return cookies.get(ADMIN_SESSION_COOKIE) === ADMIN_PASSWORD;
}
