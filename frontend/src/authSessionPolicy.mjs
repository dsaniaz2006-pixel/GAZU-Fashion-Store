/**
 * A 401 invalidates a logged-in session only when it belongs to the active
 * token and comes from an authenticated operation. Authentication forms and
 * the startup /auth/me restore path handle their errors locally.
 */
const publicAuthenticationRoutes = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/google/challenge',
  '/auth/verify-email',
  '/auth/resend-otp',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/check-email',
]);

export function shouldExpireSession({ status, path, requestToken, currentToken, code }) {
  if (status !== 401 || !requestToken || requestToken !== currentToken) return false;
  if (code === 'EMAIL_NOT_VERIFIED') return false;
  const pathname = String(path || '').split('?')[0];
  if (pathname === '/auth/me' || publicAuthenticationRoutes.has(pathname)) return false;
  return true;
}
