<script>
  import { PartyPopper, Search, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-svelte';
  import ItemCard from '$lib/components/ItemCard.svelte';
  import ItemModal from '$lib/components/ItemModal.svelte';
  import { CLASS_NUMBERS, GROUP_NUMBERS } from '$lib/constants.js';

  export let data;

  let { items, classCounts } = data;
  $: user = data.user;  // from layout load

  // Filters
  let selectedClass = 0;
  let selectedGroup = 0;
  let domainFilter  = 0;   // 0=all 1=책/학습 2=의류 3=취미
  let searchQuery   = '';
  let onlyAvailable = false;
  let priceFilter   = 'all'; // 'all' | 'under5' | '5to10' | 'over10'

  const DOMAINS = [
    { key: 0, label: '전체' },
    { key: 1, label: '1영역 · 책/학습' },
    { key: 2, label: '2영역 · 의류/액세서리' },
    { key: 3, label: '3영역 · 취미/굿즈' }
  ];

  // Modal
  let selectedItem = null;

  // Stats
  $: totalItems    = items.length;
  $: reservedItems = items.filter((i) => i.is_reserved).length;
  $: availableItems = totalItems - reservedItems;

  const PRICE_RANGES = [
    { key: 'all',    label: '전체' },
    { key: 'under5', label: '5,000 미만' },
    { key: '5to10',  label: '5,000 ~ 10,000' },
    { key: 'over10', label: '10,000 초과' }
  ];

  // Sort
  let sortKey = null;  // 'price' | 'class' | 'date'
  let sortDir = 'asc';

  const SORT_OPTIONS = [
    { key: 'price', label: '가격' },
    { key: 'class', label: '반' },
    { key: 'date',  label: '등록일' }
  ];

  function handleSort(key) {
    if (sortKey === key) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = key;
      sortDir = 'asc';
    }
  }

  $: filteredItems = items.filter((item) => {
    if (onlyAvailable && item.is_reserved) return false;
    if (selectedClass !== 0 && item.class_num !== selectedClass) return false;
    if (selectedGroup !== 0 && item.group_num !== selectedGroup) return false;
    if (domainFilter  !== 0 && item.domain    !== domainFilter)  return false;
    if (priceFilter === 'under5'  && item.price >= 5000) return false;
    if (priceFilter === '5to10'   && (item.price < 5000 || item.price > 10000)) return false;
    if (priceFilter === 'over10'  && item.price <= 10000) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
    }
    return true;
  });

  $: sortedItems = (() => {
    if (!sortKey) return filteredItems;
    return [...filteredItems].sort((a, b) => {
      let av, bv;
      if (sortKey === 'price') {
        av = a.price ?? 0; bv = b.price ?? 0;
      } else if (sortKey === 'class') {
        av = a.class_num * 10 + (a.group_num ?? 0);
        bv = b.class_num * 10 + (b.group_num ?? 0);
      } else {
        av = new Date(a.created_at).getTime();
        bv = new Date(b.created_at).getTime();
      }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  })();

  function handleReserved(e) {
    const updated = e.detail.item;
    items = items.map((i) => (i.id === updated.id ? updated : i));
    classCounts = classCounts.map((c) =>
      c.class_num === updated.class_num ? { ...c, reserved: c.reserved + 1 } : c
    );
  }
</script>

<svelte:head>
  <title>큰사마켓</title>
</svelte:head>

<div class="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

  <!-- Header -->
  <section>
    <div class="flex items-end justify-between mb-5">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-ink">물품 목록</h1>
        <p class="text-gray-400 text-sm mt-1">원하는 물품을 찾아 학번으로 예약하세요.</p>
      </div>
      <a href="/dashboard" class="text-xs text-primary font-medium hover:underline hidden sm:block">
        판매 현황 보기 →
      </a>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-3">
      <div class="bg-white border border-gray-100 rounded-xl px-4 py-3 text-center">
        <p class="text-2xl font-bold text-ink">{totalItems}</p>
        <p class="text-xs text-gray-400 mt-0.5">전체</p>
      </div>
      <div class="bg-white border border-gray-100 rounded-xl px-4 py-3 text-center">
        <p class="text-2xl font-bold text-emerald-500">{availableItems}</p>
        <p class="text-xs text-gray-400 mt-0.5">예약 가능</p>
      </div>
      <div class="bg-white border border-gray-100 rounded-xl px-4 py-3 text-center">
        <p class="text-2xl font-bold text-primary">{reservedItems}</p>
        <p class="text-xs text-gray-400 mt-0.5">예약됨</p>
      </div>
    </div>
  </section>

  <!-- Search -->
  <section>
    <div class="relative">
      <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
        <Search size={16} />
      </span>
      <input
        type="text"
        class="input-field pl-10"
        placeholder="물품 이름으로 검색..."
        bind:value={searchQuery}
      />
    </div>
  </section>

  <!-- Filters -->
  <section class="space-y-4">

    <!-- Class & Group dropdowns -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="filter-class" class="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">반</label>
        <select
          id="filter-class"
          class="input-field"
          bind:value={selectedClass}
          on:change={() => (selectedGroup = 0)}
        >
          <option value={0}>전체 반</option>
          {#each CLASS_NUMBERS as c}
            <option value={c}>{c}반</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="filter-group" class="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">조</label>
        <select id="filter-group" class="input-field" bind:value={selectedGroup}>
          <option value={0}>전체 조</option>
          {#each GROUP_NUMBERS as g}
            <option value={g}>{g}조</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Domain filter chips -->
    <div>
      <p class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">영역</p>
      <div class="flex flex-wrap gap-1.5">
        {#each DOMAINS as d}
          <button
            class="filter-btn {domainFilter === d.key ? 'filter-btn-active' : 'filter-btn-inactive'}"
            on:click={() => (domainFilter = d.key)}
          >{d.label}</button>
        {/each}
      </div>
    </div>

    <!-- Price range chips -->
    <div>
      <p class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">가격대</p>
      <div class="flex flex-wrap gap-1.5">
        {#each PRICE_RANGES as range}
          <button
            class="filter-btn {priceFilter === range.key ? 'filter-btn-active' : 'filter-btn-inactive'}"
            on:click={() => (priceFilter = range.key)}
          >{range.label}</button>
        {/each}
      </div>
    </div>

    <!-- Sort -->
    <div>
      <p class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">정렬</p>
      <div class="flex flex-wrap gap-1.5">
        {#each SORT_OPTIONS as opt}
          <button
            class="filter-btn flex items-center gap-1 {sortKey === opt.key ? 'filter-btn-active' : 'filter-btn-inactive'}"
            on:click={() => handleSort(opt.key)}
          >
            {opt.label}
            {#if sortKey === opt.key}
              {#if sortDir === 'asc'}<ArrowUp size={12} />{:else}<ArrowDown size={12} />{/if}
            {:else}
              <ChevronsUpDown size={12} class="opacity-30" />
            {/if}
          </button>
        {/each}
        {#if sortKey}
          <button
            class="filter-btn filter-btn-inactive text-gray-300 hover:text-gray-500"
            on:click={() => { sortKey = null; sortDir = 'asc'; }}
          >초기화</button>
        {/if}
      </div>
    </div>

    <!-- Available-only toggle -->
    <button
      type="button"
      role="switch"
      aria-checked={onlyAvailable}
      on:click={() => (onlyAvailable = !onlyAvailable)}
      class="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3
             px-4 py-3 sm:px-3 sm:py-2 rounded-xl border transition-colors duration-150
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1
             {onlyAvailable ? 'bg-primary-light border-primary/30' : 'bg-white border-gray-100 hover:border-gray-200'}"
    >
      <span class="text-sm font-medium {onlyAvailable ? 'text-primary' : 'text-gray-500'} transition-colors">
        판매되지 않은 상품만 보기
      </span>
      <span class="relative flex-shrink-0 w-10 h-[22px] rounded-full transition-colors duration-200
                   {onlyAvailable ? 'bg-primary' : 'bg-gray-200'}">
        <span class="absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200
                     {onlyAvailable ? 'translate-x-[18px]' : 'translate-x-0'}"></span>
      </span>
    </button>

  </section>

  <!-- Grid -->
  <section>
    {#if sortedItems.length === 0}
      {#if onlyAvailable && !searchQuery}
        <div class="flex flex-col items-center text-center py-20 px-6">
          <div class="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mb-5">
            <PartyPopper size={30} class="text-primary" />
          </div>
          <h3 class="text-lg font-bold text-ink mb-2">전부 예약되었어요! 🎉</h3>
          <p class="text-sm text-gray-400 max-w-xs leading-relaxed">
            선택한 조건의 물품이 모두 예약됐습니다.<br />
            나중에 다시 확인하거나, 토글을 꺼서 전체 목록을 보세요.
          </p>
          <button type="button" class="mt-5 btn-outline text-sm" on:click={() => (onlyAvailable = false)}>
            전체 목록 보기
          </button>
        </div>
      {:else}
        <div class="text-center py-24 text-gray-300">
          <Search size={44} class="mx-auto mb-3 opacity-40" />
          <p class="font-medium text-gray-400">물품이 없습니다</p>
          <p class="text-sm text-gray-300 mt-1">
            {searchQuery ? '다른 검색어를 입력해보세요.' : '다른 조건을 선택해보세요.'}
          </p>
        </div>
      {/if}
    {:else}
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {#each sortedItems as item (item.id)}
          <ItemCard {item} onSelect={(i) => (selectedItem = i)} />
        {/each}
      </div>
    {/if}
  </section>
</div>

{#if selectedItem}
  <ItemModal
    item={selectedItem}
    {user}
    on:close={() => (selectedItem = null)}
    on:reserved={handleReserved}
  />
{/if}
