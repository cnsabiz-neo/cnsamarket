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

  uploadItem: async ({ request, cookies }) => {
    if (!isAuthed(cookies)) return fail(401, { uploadError: '인증이 필요합니다.' });

    const formData = await request.formData();
    const title       = formData.get('title')?.toString().trim();
    const description = formData.get('description')?.toString().trim() ?? '';
    const classNum    = parseInt(formData.get('class_num') ?? '0');
    const groupNum    = parseInt(formData.get('group_num') ?? '0');
    const domain      = parseInt(formData.get('domain')    ?? '0');
    const priceRaw    = parseInt(formData.get('price')     ?? '0');
    const imageUrl    = formData.get('image_url')?.toString() || null;

    if (!title)
      return fail(400, { uploadError: '물품 이름을 입력해주세요.' });
    if (!classNum || classNum < 1 || classNum > 12)
      return fail(400, { uploadError: '올바른 반을 선택해주세요.' });
    if (!groupNum || groupNum < 1 || groupNum > 5)
      return fail(400, { uploadError: '올바른 모둠을 선택해주세요.' });
    if (!domain || domain < 1 || domain > 3)
      return fail(400, { uploadError: '영역을 선택해주세요.' });
    if (isNaN(priceRaw) || priceRaw < 1000 || priceRaw > 20000)
      return fail(400, { uploadError: '가격은 1,000 ~ 20,000 비즈쿨 머니 사이여야 합니다.' });

    const { error: insertError } = await supabaseAdmin.from('items').insert({
      title, description,
      class_num:   classNum,
      group_num:   groupNum,
      domain,
      price:       priceRaw,
      image_url:   imageUrl,
      is_reserved: false
    });

    if (insertError) {
      console.error('Upload error:', insertError);
      return fail(500, { uploadError: `등록 실패: ${insertError.message}` });
    }

    return { uploadSuccess: true };
  },

  resetItem: async ({ request, cookies }) => {
    if (!isAuthed(cookies)) return fail(401, { error: '인증이 필요합니다.' });

    const formData = await request.formData();
    const id = formData.get('id')?.toString();
    if (!id) return fail(400, { error: '물품 ID가 없습니다.' });

    const { error } = await supabaseAdmin
      .from('items')
      .update({ is_reserved: false, reserved_by: null, user_id: null, user_email: null })
      .eq('id', id);

    if (error) return fail(500, { error: '초기화에 실패했습니다.' });

    return { success: true };
  }
};
