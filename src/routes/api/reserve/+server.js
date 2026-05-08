import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin.js';

export async function POST({ request, locals: { safeGetSession } }) {
  // Require Google login
  const { user } = await safeGetSession();
  if (!user) {
    return json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const { itemId, studentId } = body;

  if (!itemId || !studentId?.trim()) {
    return json({ error: '물품 ID와 학번을 입력해주세요.' }, { status: 400 });
  }

  const id = studentId.trim();
  if (!/^\d{5}$/.test(id)) {
    return json({ error: '학번은 5자리 숫자여야 합니다.' }, { status: 400 });
  }

  // Atomic update: only succeeds when is_reserved is currently false
  const { data, error } = await supabaseAdmin
    .from('items')
    .update({
      is_reserved: true,
      reserved_by: id,
      user_id: user.id,
      user_email: user.email
    })
    .eq('id', itemId)
    .eq('is_reserved', false)
    .select()
    .single();

  if (error || !data) {
    return json(
      { error: '이미 예약된 물품이거나 존재하지 않는 물품입니다.' },
      { status: 409 }
    );
  }

  return json({ success: true, item: data });
}
