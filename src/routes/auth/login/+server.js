import { redirect } from '@sveltejs/kit';
import { PUBLIC_GOOGLE_CLIENT_ID, PUBLIC_SITE_URL } from '$env/static/public';

function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export const GET = async ({ cookies }) => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  cookies.set('pkce_verifier', codeVerifier, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    maxAge: 300
  });

  const params = new URLSearchParams({
    client_id: PUBLIC_GOOGLE_CLIENT_ID,
    redirect_uri: `${PUBLIC_SITE_URL}/auth/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });

  throw redirect(303, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};
