import { fail, redirect } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin.js';

export const actions = {
  default: async ({ request }) => {
    const formData = await request.formData();

    const title       = formData.get('title')?.toString().trim();
    const description = formData.get('description')?.toString().trim() ?? '';
    const classNum    = parseInt(formData.get('class_num') ?? '0');
    const groupNum    = parseInt(formData.get('group_num') ?? '0');
    const priceRaw    = parseInt(formData.get('price') ?? '0');
    const imageFile   = formData.get('image');

    // Validation
    if (!title)
      return fail(400, { error: '물품 이름을 입력해주세요.' });
    if (!classNum || classNum < 1 || classNum > 12)
      return fail(400, { error: '올바른 반을 선택해주세요.' });
    if (!groupNum || groupNum < 1 || groupNum > 5)
      return fail(400, { error: '올바른 모둠을 선택해주세요.' });
    if (isNaN(priceRaw) || priceRaw < 1000 || priceRaw > 20000)
      return fail(400, { error: '가격은 1,000 ~ 20,000 비즈쿨 머니 사이여야 합니다.' });

    let imageUrl = null;

    if (imageFile && imageFile.size > 0) {
      if (imageFile.size > 5 * 1024 * 1024)
        return fail(400, { error: '이미지 크기는 5MB 이하여야 합니다.' });

      const ext = imageFile.name.split('.').pop()?.toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext ?? ''))
        return fail(400, { error: '지원하지 않는 이미지 형식입니다. (jpg, png, webp, gif)' });

      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const buffer   = new Uint8Array(await imageFile.arrayBuffer());

      const { error: uploadError } = await supabaseAdmin.storage
        .from('items')
        .upload(fileName, buffer, { contentType: imageFile.type });

      if (uploadError) {
        console.error('Image upload error:', uploadError);
        return fail(500, { error: `이미지 업로드 실패: ${uploadError.message}` });
      }

      const { data: urlData } = supabaseAdmin.storage.from('items').getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }

    const { error: insertError } = await supabaseAdmin.from('items').insert({
      title,
      description,
      class_num:   classNum,
      group_num:   groupNum,
      price:       priceRaw,
      image_url:   imageUrl,
      is_reserved: false
    });

    if (insertError) {
      console.error('Insert error:', insertError);
      return fail(500, { error: `물품 등록 실패: ${insertError.message} (code: ${insertError.code})` });
    }

    throw redirect(303, '/?uploaded=1');
  }
};
