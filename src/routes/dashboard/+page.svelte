<script>
  import { browser } from '$app/environment';
  import { Trophy, TrendingUp, Package, CheckCircle } from 'lucide-svelte';
  import SalesChart from '$lib/components/SalesChart.svelte';

  export let data;

  const { classCounts, ranking, totals } = data;

  const MEDAL = ['🥇', '🥈', '🥉'];

  // Reservation rate as a percentage for the progress bars
  const maxReserved = Math.max(...classCounts.map((c) => c.reserved), 1);
</script>

<svelte:head>
  <title>판매 현황 — 큰사마켓</title>
</svelte:head>

<div class="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">

  <!-- Header -->
  <section>
    <h1 class="text-2xl sm:text-3xl font-bold text-ink">판매 현황</h1>
    <p class="text-gray-400 text-sm mt-1">반별 예약 현황과 순위를 실시간으로 확인하세요.</p>
  </section>

  <!-- Summary cards -->
  <section class="grid grid-cols-3 gap-4">
    <div class="bg-white border border-gray-100 rounded-xl p-5">
      <div class="flex items-center gap-2 text-gray-400 mb-2">
        <Package size={14} />
        <span class="text-xs font-medium uppercase tracking-wider">전체 물품</span>
      </div>
      <p class="text-3xl font-bold text-ink">{totals.total}</p>
    </div>
    <div class="bg-white border border-gray-100 rounded-xl p-5">
      <div class="flex items-center gap-2 text-emerald-500 mb-2">
        <CheckCircle size={14} />
        <span class="text-xs font-medium uppercase tracking-wider">예약됨</span>
      </div>
      <p class="text-3xl font-bold text-emerald-500">{totals.reserved}</p>
    </div>
    <div class="bg-white border border-gray-100 rounded-xl p-5">
      <div class="flex items-center gap-2 text-primary mb-2">
        <TrendingUp size={14} />
        <span class="text-xs font-medium uppercase tracking-wider">예약률</span>
      </div>
      <p class="text-3xl font-bold text-primary">
        {totals.total > 0 ? Math.round((totals.reserved / totals.total) * 100) : 0}%
      </p>
    </div>
  </section>

  <!-- Bar Chart -->
  {#if totals.total > 0}
    <section>
      <h2 class="section-title">반별 예약 현황</h2>
      <div class="bg-white border border-gray-100 rounded-xl p-6">
        {#if browser}
          <SalesChart {classCounts} />
        {:else}
          <div class="h-52 flex items-center justify-center text-gray-200">
            <span class="text-sm">차트 로딩 중...</span>
          </div>
        {/if}
      </div>
    </section>
  {/if}

  <!-- Two-column: ranking + progress bars -->
  <section class="grid sm:grid-cols-2 gap-6">

    <!-- Ranking (medal list) -->
    <div>
      <h2 class="section-title flex items-center gap-2">
        <Trophy size={16} class="text-amber-400" />
        반별 순위
      </h2>
      <div class="space-y-2">
        {#if ranking.length === 0}
          <p class="text-gray-300 text-sm py-8 text-center">아직 데이터가 없습니다.</p>
        {:else}
          {#each ranking as item, idx}
            <div class="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3
                        {idx === 0 ? 'border-amber-200 bg-amber-50/40' : ''}">
              <!-- Rank -->
              <span class="text-lg w-7 text-center flex-shrink-0">
                {#if idx < 3}
                  {MEDAL[idx]}
                {:else}
                  <span class="text-sm font-semibold text-gray-300">{idx + 1}</span>
                {/if}
              </span>

              <!-- Class info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-ink">{item.class_num}반</span>
                  <span class="text-sm font-medium text-primary">{item.reserved}개</span>
                </div>
                <!-- Progress bar -->
                <div class="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-primary rounded-full transition-all duration-500"
                    style="width: {maxReserved > 0 ? (item.reserved / maxReserved) * 100 : 0}%"
                  ></div>
                </div>
              </div>

              <!-- Total -->
              <span class="text-xs text-gray-400 flex-shrink-0">/ {item.total}개</span>
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <!-- All classes grid (including zeros) -->
    <div>
      <h2 class="section-title">전체 반 현황</h2>
      <div class="grid grid-cols-3 gap-2">
        {#each classCounts as cls}
          <div class="bg-white border border-gray-100 rounded-xl p-3 text-center
                      {cls.reserved > 0 ? 'border-primary/20' : ''}">
            <p class="text-xs text-gray-400 mb-1">{cls.class_num}반</p>
            <p class="text-lg font-bold {cls.reserved > 0 ? 'text-primary' : 'text-gray-200'}">
              {cls.reserved}
            </p>
            {#if cls.total > 0}
              <p class="text-[10px] text-gray-300 mt-0.5">/ {cls.total}개</p>
            {:else}
              <p class="text-[10px] text-gray-200 mt-0.5">—</p>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </section>
</div>
