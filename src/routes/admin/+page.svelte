<script>
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Lock, LogOut, Search, Trash2, RotateCcw, ImageOff, ShieldCheck, Wallet } from 'lucide-svelte';

  export let data;
  export let form;

  $: ({ authed, items, stats } = data);

  const fmt = (n) => new Intl.NumberFormat('ko-KR').format(n);

  let searchQuery  = '';
  let filterStatus = 'all';
  let filterClass  = 0;
  let confirmDeleteId = null;
  let submitting = false;

  $: filteredItems = (items ?? []).filter((item) => {
    if (filterClass !== 0 && item.class_num !== filterClass) return false;
    if (filterStatus === 'available' && item.is_reserved) return false;
    if (filterStatus === 'reserved'  && !item.is_reserved) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.reserved_by?.includes(q);
    }
    return true;
  });

  function makeEnhance(afterSuccess) {
    return ({ update }) => {
      submitting = true;
      return update({ reset: false }).then(() => {
        submitting = false;
        invalidateAll();
        afterSuccess?.();
      });
    };
  }
</script>

<svelte:head>
  <title>관리자 — 아나바다 장터</title>
</svelte:head>

<div class="max-w-5xl mx-auto px-4 sm:px-6 py-10">

  {#if !authed}
    <!-- Login -->
    <div class="max-w-sm mx-auto mt-8">
      <div class="text-center mb-8">
        <div class="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
          <Lock size={24} color="white" />
        </div>
        <h1 class="text-2xl font-bold text-ink">관리자 로그인</h1>
        <p class="text-gray-400 text-sm mt-1.5">선생님 전용 관리 페이지입니다.</p>
      </div>

      {#if form?.loginError}
        <div class="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
          {form.loginError}
        </div>
      {/if}

      <form method="POST" action="?/login" class="space-y-4">
        <div>
          <label for="password" class="block text-sm font-medium text-ink mb-2">비밀번호</label>
          <input id="password" name="password" type="password" class="input-field"
            placeholder="관리자 비밀번호" autofocus required />
        </div>
        <button type="submit" class="btn-primary w-full py-3">로그인</button>
      </form>
    </div>

  {:else}
    <!-- Dashboard header -->
    <div class="flex items-start justify-between mb-8">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <ShieldCheck size={18} class="text-primary" />
          <h1 class="text-2xl font-bold text-ink">관리자 대시보드</h1>
        </div>
        <p class="text-gray-400 text-sm">전체 물품 및 예약 현황을 관리합니다.</p>
      </div>
      <form method="POST" action="?/logout">
        <button type="submit" class="btn-ghost flex items-center gap-1.5 text-sm">
          <LogOut size={14} /> 로그아웃
        </button>
      </form>
    </div>

    <!-- Stats widgets (4 cards including revenue) -->
    {#if stats}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div class="bg-white border border-gray-100 rounded-xl p-5 text-center">
          <p class="text-3xl font-bold text-ink">{stats.total}</p>
          <p class="text-xs text-gray-400 mt-1">전체 물품</p>
        </div>
        <div class="bg-white border border-gray-100 rounded-xl p-5 text-center">
          <p class="text-3xl font-bold text-emerald-500">{stats.available}</p>
          <p class="text-xs text-gray-400 mt-1">예약 가능</p>
        </div>
        <div class="bg-white border border-gray-100 rounded-xl p-5 text-center">
          <p class="text-3xl font-bold text-primary">{stats.reserved}</p>
          <p class="text-xs text-gray-400 mt-1">예약됨</p>
        </div>
        <!-- Revenue tracker -->
        <div class="bg-primary-light border border-primary/20 rounded-xl p-5 text-center">
          <div class="flex items-center justify-center gap-1.5 mb-1">
            <Wallet size={14} class="text-primary" />
            <p class="text-xs text-primary font-medium">예상 총 수익</p>
          </div>
          <p class="text-2xl font-bold text-primary leading-tight">
            ₩{fmt(stats.revenue)}
          </p>
          <p class="text-[10px] text-primary/60 mt-0.5">비즈쿨 머니</p>
        </div>
      </div>
    {/if}

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-5">
      <div class="relative flex-1 min-w-[180px]">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
          <Search size={14} />
        </span>
        <input type="text" class="input-field pl-8 text-sm" placeholder="물품명, 학번 검색..."
          bind:value={searchQuery} />
      </div>
      <select class="input-field w-auto text-sm" bind:value={filterClass}>
        <option value={0}>전체 반</option>
        {#each Array.from({ length: 12 }, (_, i) => i + 1) as c}
          <option value={c}>{c}반</option>
        {/each}
      </select>
      <select class="input-field w-auto text-sm" bind:value={filterStatus}>
        <option value="all">전체 상태</option>
        <option value="available">예약 가능</option>
        <option value="reserved">예약됨</option>
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50/60">
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">물품</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">반/모둠</th>
              <th class="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">가격</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">상태</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">예약 학번</th>
              <th class="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">관리</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            {#if filteredItems.length === 0}
              <tr>
                <td colspan="6" class="text-center py-14 text-gray-300">
                  <Search size={28} class="mx-auto mb-2 opacity-40" />
                  <p>결과가 없습니다</p>
                </td>
              </tr>
            {:else}
              {#each filteredItems as item (item.id)}
                <tr class="hover:bg-gray-50/40 transition-colors">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      {#if item.image_url}
                        <img src={item.image_url} alt={item.title}
                          class="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
                      {:else}
                        <div class="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <ImageOff size={14} class="text-gray-300" />
                        </div>
                      {/if}
                      <div class="min-w-0">
                        <p class="font-medium text-ink truncate max-w-[160px]">{item.title}</p>
                        {#if item.description}
                          <p class="text-xs text-gray-400 truncate max-w-[160px]">{item.description}</p>
                        {/if}
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-gray-500 text-xs">
                    {item.class_num}반 {item.group_num}모둠
                  </td>
                  <td class="px-4 py-3 text-right font-mono text-xs font-semibold
                             {item.is_reserved ? 'text-primary' : 'text-gray-500'}">
                    ₩{fmt(item.price)}
                  </td>
                  <td class="px-4 py-3">
                    <span class={item.is_reserved ? 'badge-reserved' : 'badge-available'}>
                      {item.is_reserved ? '예약됨' : '가능'}
                    </span>
                  </td>
                  <td class="px-4 py-3 font-mono text-xs text-gray-500">
                    {item.reserved_by ?? '—'}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-end gap-1">
                      {#if item.is_reserved}
                        <form method="POST" action="?/resetItem" use:enhance={makeEnhance()}>
                          <input type="hidden" name="id" value={item.id} />
                          <button type="submit" title="예약 초기화"
                            class="p-1.5 rounded-lg text-primary hover:bg-primary-light transition-colors"
                            disabled={submitting}>
                            <RotateCcw size={14} />
                          </button>
                        </form>
                      {/if}

                      {#if confirmDeleteId === item.id}
                        <form method="POST" action="?/deleteItem"
                          use:enhance={makeEnhance(() => (confirmDeleteId = null))}>
                          <input type="hidden" name="id" value={item.id} />
                          <button type="submit"
                            class="text-xs text-white bg-red-500 hover:bg-red-600 px-2.5 py-1.5 rounded-lg transition-colors font-medium"
                            disabled={submitting}>
                            확인
                          </button>
                        </form>
                        <button type="button"
                          class="text-xs text-gray-400 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors"
                          on:click={() => (confirmDeleteId = null)}>
                          취소
                        </button>
                      {:else}
                        <button type="button" title="삭제"
                          class="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                          on:click={() => (confirmDeleteId = item.id)}>
                          <Trash2 size={14} />
                        </button>
                      {/if}
                    </div>
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>

      {#if filteredItems.length > 0}
        <div class="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>{filteredItems.length}개 항목 표시</span>
          {#if filterStatus === 'reserved'}
            <span class="font-semibold text-primary">
              합계: ₩{fmt(filteredItems.reduce((s, i) => s + (i.price ?? 0), 0))}
            </span>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>
