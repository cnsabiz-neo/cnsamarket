import { redirect } from '@sveltejs/kit';

export const GET = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Verify school email domain
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email?.endsWith('@cnsa.hs.kr')) {
        await supabase.auth.signOut();
        throw redirect(303, '/?error=school_only');
      }
      throw redirect(303, next);
    }
  }

  throw redirect(303, '/');
};
