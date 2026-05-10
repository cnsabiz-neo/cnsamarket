import { redirect } from '@sveltejs/kit';
import { GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { PUBLIC_GOOGLE_CLIENT_ID } from '$env/static/public';

export const GET = async ({ url, locals: { supabase } }) => {
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
      redirect_uri: `${url.origin}/auth/callback`,
      grant_type: 'authorization_code'
    })
  });

  const tokens = await tokenRes.json();

  if (!tokens.id_token) throw redirect(303, '/');

  // Sign in to Supabase using the Google ID token
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: tokens.id_token
  });

  if (error) throw redirect(303, '/');

  throw redirect(303, next);
};
