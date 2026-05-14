import { PUBLIC_GOOGLE_CLIENT_ID, PUBLIC_SITE_URL } from '$env/static/public';

function base64UrlEncode(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Google OAuth 로그인 시작 (PKCE).
 * code_verifier는 state 파라미터로 전달되어 콜백에서 토큰 교환에 사용됨.
 * 클라이언트(브라우저)에서만 호출 가능.
 */
export async function signInWithGoogle() {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  const params = new URLSearchParams({
    client_id: PUBLIC_GOOGLE_CLIENT_ID,
    redirect_uri: `${PUBLIC_SITE_URL}/auth/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state: verifier
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}
