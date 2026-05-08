import { supabaseAdmin } from '$lib/supabaseAdmin.js';

export async function load() {
  const { data: items, error } = await supabaseAdmin
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load items:', error);
    return { items: [], classCounts: [] };
  }

  const all = items ?? [];

  const classCounts = Array.from({ length: 12 }, (_, i) => {
    const classItems = all.filter((item) => item.class_num === i + 1);
    return {
      class_num: i + 1,
      total: classItems.length,
      reserved: classItems.filter((item) => item.is_reserved).length
    };
  });

  return { items: all, classCounts };
}
