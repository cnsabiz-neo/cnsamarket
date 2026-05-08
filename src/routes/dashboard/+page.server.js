import { supabaseAdmin } from '$lib/supabaseAdmin.js';

export async function load() {
  const { data: items, error } = await supabaseAdmin
    .from('items')
    .select('id, class_num, group_num, is_reserved, price');

  if (error) {
    console.error('Dashboard load error:', error);
    return { classCounts: [], ranking: [], totals: { total: 0, reserved: 0, available: 0, revenue: 0 } };
  }

  const all = items ?? [];

  const classCounts = Array.from({ length: 12 }, (_, i) => {
    const classItems = all.filter((item) => item.class_num === i + 1);
    const reserved = classItems.filter((item) => item.is_reserved).length;
    return {
      class_num: i + 1,
      total: classItems.length,
      reserved,
      rate: classItems.length > 0 ? Math.round((reserved / classItems.length) * 100) : 0
    };
  });

  const ranking = [...classCounts]
    .filter((c) => c.total > 0)
    .sort((a, b) => b.reserved - a.reserved || b.rate - a.rate);

  const reservedItems = all.filter((i) => i.is_reserved);

  return {
    classCounts,
    ranking,
    totals: {
      total: all.length,
      reserved: reservedItems.length,
      available: all.length - reservedItems.length,
      revenue: reservedItems.reduce((sum, i) => sum + (i.price ?? 0), 0)
    }
  };
}
