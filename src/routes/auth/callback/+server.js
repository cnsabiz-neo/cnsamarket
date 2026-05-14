import { redirect } from '@sveltejs/kit';
import { GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { PUBLIC_GOOGLE_CLIENT_ID, PUBLIC_SITE_URL } from '$env/static/public';

export const GET = async ({ url, cookies, locals: { supabase } }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';

  if (!code) throw redirect(303, '/');

  // Exchange authorization code for tokens directly with Google
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: PUBLIC_GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: `${PUBLIC_SITE_URL}/auth/callback`,
      grant_type: 'authorization_code',
      code_verifier: cookies.get('pkce_verifier') ?? ''
    })
  });

  const tokens = await tokenRes.json();

  if (!tokens.id_token) {
    const msg = encodeURIComponent(tokens.error_description ?? tokens.error ?? 'no_id_token');
    throw redirect(303, `/?error=token_failed&msg=${msg}`);
  }

  // JWT payload에서 이메일 추출 (검증 전 확인용)
  const payload = JSON.parse(atob(tokens.id_token.split('.')[1]));
  const email = payload.email ?? '';

  // @cnsa.hs.kr 계정만 허용
  if (!email.endsWith('@cnsa.hs.kr')) {
    throw redirect(303, '/?error=unauthorized_domain');
  }

  // Sign in to Supabase using the Google ID token
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: tokens.id_token
  });

  if (error) {
    const msg = encodeURIComponent(error.message ?? 'supabase_error');
    throw redirect(303, `/?error=supabase_failed&msg=${msg}`);
  }

  throw redirect(303, next);
};
