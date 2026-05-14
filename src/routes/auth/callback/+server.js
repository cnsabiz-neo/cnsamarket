import { redirect } from '@sveltejs/kit';
import { GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { PUBLIC_GOOGLE_CLIENT_ID, PUBLIC_SITE_URL } from '$env/static/public';
import { supabaseAdmin } from '$lib/supabaseAdmin.js';

export const GET = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';

  if (!code) throw redirect(303, '/');

  // Google 토큰 교환
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: PUBLIC_GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: `${PUBLIC_SITE_URL}/auth/callback`,
      grant_type: 'authorization_code',
      code_verifier: url.searchParams.get('state') ?? ''
    })
  });

  const tokens = await tokenRes.json();

  if (!tokens.id_token) throw redirect(303, '/?error=login_failed');

  // JWT에서 이메일 추출
  const payload = JSON.parse(atob(tokens.id_token.split('.')[1]));
  const email = payload.email ?? '';

  // @cnsa.hs.kr 계정만 허용
  if (!email.endsWith('@cnsa.hs.kr')) {
    throw redirect(303, '/?error=unauthorized_domain');
  }

  // Supabase에 유저 생성 (이미 있으면 무시)
  await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: payload.name ?? '',
      avatar_url: payload.picture ?? '',
      provider: 'google'
    }
  });

  // 매직링크 토큰 생성 (이메일 발송 없이 토큰만 반환)
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    throw redirect(303, '/?error=login_failed');
  }

  // 토큰으로 세션 생성 (SSR 클라이언트가 쿠키 자동 설정)
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'email'
  });

  if (verifyError) throw redirect(303, '/?error=login_failed');

  throw redirect(303, next);
};
