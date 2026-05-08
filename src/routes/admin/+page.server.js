import { fail, redirect } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin.js';
import { ADMIN_PASSWORD } from '$env/static/private';

const SESSION_COOKIE = 'admin_session';

function isAuthed(cookies) {
  return cookies.get(SESSION_COOKIE) === ADMIN_PASSWORD;
}

export async function load({ cookies }) {
  if (!isAuthed(cookies)) {
    return { authed: false, items: [], stats: null };
  }

  const { data: items, error } = await supabaseAdmin
    .from('items')
    .select('*')
    .order('class_num')
    .order('group_num')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Admin load error:', error);
    return { authed: true, items: [], stats: null };
  }

  const all = items ?? [];
  const reservedItems = all.filter((i) => i.is_reserved);

  const stats = {
    total: all.length,
    reserved: reservedItems.length,
    available: all.length - reservedItems.length,
    revenue: reservedItems.reduce((sum, i) => sum + (i.price ?? 0), 0)
  };

  return { authed: true, items: all, stats };
}

export const actions = {
  login: async ({ request, cookies }) => {
    const formData = await request.formData();
    const password = formData.get('password')?.toString() ?? '';

    if (password !== ADMIN_PASSWORD) {
      return fail(401, { loginError: '비밀번호가 올바르지 않습니다.' });
    }

    cookies.set(SESSION_COOKIE, ADMIN_PASSWORD, {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 8,
      sameSite: 'strict'
    });

    throw redirect(303, '/admin');
  },

  logout: async ({ cookies }) => {
    cookies.delete(SESSION_COOKIE, { path: '/' });
    throw redirect(303, '/admin');
  },

  deleteItem: async ({ request, cookies }) => {
    if (!isAuthed(cookies)) return fail(401, { error: '인증이 필요합니다.' });

    const formData = await request.formData();
    const id = formData.get('id')?.toString();
    if (!id) return fail(400, { error: '물품 ID가 없습니다.' });

    const { data: item } = await supabaseAdmin
      .from('items')
      .select('image_url')
      .eq('id', id)
      .single();

    if (item?.image_url) {
      const path = item.image_url.split('/storage/v1/object/public/items/')[1];
      if (path) await supabaseAdmin.storage.from('items').remove([path]);
    }

    const { error } = await supabaseAdmin.from('items').delete().eq('id', id);
    if (error) return fail(500, { error: '삭제에 실패했습니다.' });

    return { success: true };
  },

  resetItem: async ({ request, cookies }) => {
    if (!isAuthed(cookies)) return fail(401, { error: '인증이 필요합니다.' });

    const formData = await request.formData();
    const id = formData.get('id')?.toString();
    if (!id) return fail(400, { error: '물품 ID가 없습니다.' });

    const { error } = await supabaseAdmin
      .from('items')
      .update({ is_reserved: false, reserved_by: null })
      .eq('id', id);

    if (error) return fail(500, { error: '초기화에 실패했습니다.' });

    return { success: true };
  }
};
