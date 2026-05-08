<script>
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import {
    LogIn, Search, Trash2, RotateCcw, ImageOff,
    ShieldCheck, ShieldAlert, Wallet, Plus,
    Download, Loader2, Info, X, ChevronUp
  } from 'lucide-svelte';
  import { supabase } from '$lib/supabase.js';

  export let data;
  export let form;

  $: ({ authed, items, stats } = data);
  $: user = data.user;   // comes from layout load

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  }

  const fmt = (n) => new Intl.NumberFormat('ko-KR').format(n);

  const DOMAIN_LABELS = { 1: '1영역', 2: '2영역', 3: '3영역' };
  const DOMAIN_FULL   = {
    1: '1영역 · 책/학습/문구',
    2: '2영역 · 의류/액세서리',
    3: '3영역 · 취미/굿즈'
  };

  // ── Management filters ──────────────────────────────────────
  let searchQuery   = '';
  let filterStatus  = 'all';
  let filterClass   = 0;
  let filterDomain  = 0;
  let confirmDeleteId = null;
  let submitting    = false;

  $: filteredItems = (items ?? []).filter((item) => {
    if (filterClass  !== 0 && item.class_num !== filterClass)  return false;
    if (filterDomain !== 0 && item.domain    !== filterDomain) return false;
    if (filterStatus === 'available' && item.is_reserved)  return false;
    if (filterStatus === 'reserved'  && !item.is_reserved) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.reserved_by?.includes(q);
    }
    return true;
  });

  // ── Upload form ─────────────────────────────────────────────
  let showUpload   = false;
  let imagePreview = null;
  let imageFile    = null;
  let clientError  = '';
  let uploading    = false;
  let priceValue   = '';

  $: priceNum   = parseInt(priceValue.replace(/\D/g, '') || '0');
  $: priceError = priceValue && (priceNum < 1000 || priceNum > 20000)
    ? '1,000 ~ 20,000 비즈쿨 머니 사이여야 합니다.'
    : '';

  function handlePriceInput(e) {
    priceValue = e.target.value.replace(/\D/g, '');
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) { imagePreview = null; imageFile = null; return; }
    imageFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => { imagePreview = ev.target.result; };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    imagePreview = null; imageFile = null;
    const inp = document.getElementById('upload-image-input');
    if (inp) inp.value = '';
  }

  function resetUploadForm() {
    priceValue = ''; imagePreview = null; imageFile = null; clientError = '';
  }

  // ── Enhance helpers ─────────────────────────────────────────
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

  // ── Excel download ───────────────────────────────────────────
  function downloadExcel(type) {
    window.location.href = `/api/export?type=${type}`;
  }
</script>

<svelte:head>
  <title>관리자 — 아나바다 장터</title>
</svelte:head>

<div class="max-w-5xl mx-auto px-4 sm:px-6 py-10">

  {#if !authed}
    <!-- ── Not authed ───────────────────────────────────────── -->
    <div class="max-w-sm mx-auto mt-16 text-center">
      {#if !user}
        <!-- Not logged in at all -->
        <div class="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/20">
          <ShieldCheck size={24} color="white" />
        </div>
        <h1 class="text-2xl font-bold text-ink mb-2">관리자 전용 페이지</h1>
        <p class="text-gray-400 text-sm mb-8">관리 기능을 사용하려면 Google 계정으로 로그인하세요.</p>
        <button on:click={signIn}
          class="inline-flex items-center gap-2 btn-primary px-6 py-3 text-sm">
          <LogIn size={16} /> Google로 로그인
        </button>
      {:else}
        <!-- Logged in but not admin -->
        <div class="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <ShieldAlert size={24} class="text-red-400" />
        </div>
        <h1 class="text-2xl font-bold text-ink mb-2">접근 권한 없음</h1>
        <p class="text-gray-400 text-sm mb-1">
          <span class="font-medium text-ink">{user.email}</span> 계정은<br />
          관리자 권한이 없습니다.
        </p>
        <p class="text-xs text-gray-300 mt-4">담당 선생님께 권한 추가를 요청하세요.</p>
      {/if}
    </div>

  {:else}
    <!-- ── Dashboard ─────────────────────────────────────────── -->
    <div class="flex items-start justify-between mb-8">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <ShieldCheck size={18} class="text-primary" />
          <h1 class="text-2xl font-bold text-ink">관리자 대시보드</h1>
        </div>
        <p class="text-gray-400 text-sm">물품 등록, 예약 현황, 수익을 관리합니다.</p>
      </div>
      <p class="text-xs text-gray-400 hidden sm:block">{user?.email ?? ''}</p>
    </div>

    <!-- ── Stats ─────────────────────────────────────────────── -->
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
        <div class="bg-primary-light border border-primary/20 rounded-xl p-5 text-center">
          <div class="flex items-center justify-center gap-1 mb-1">
            <Wallet size={13} class="text-primary" />
            <p class="text-xs text-primary font-medium">예상 수익</p>
          </div>
          <p class="text-2xl font-bold text-primary leading-tight">₩{fmt(stats.revenue)}</p>
          <p class="text-[10px] text-primary/60 mt-0.5">비즈쿨 머니</p>
        </div>
      </div>
    {/if}

    <!-- ── Action bar ─────────────────────────────────────────── -->
    <div class="flex flex-wrap items-center gap-2 mb-6">
      <button
        type="button"
        on:click={() => { showUpload = !showUpload; if (!showUpload) resetUploadForm(); }}
        class="flex items-center gap-1.5 btn-primary text-sm px-4 py-2"
      >
        {#if showUpload}
          <ChevronUp size={14} /> 등록 닫기
        {:else}
          <Plus size={14} /> 물품 등록
        {/if}
      </button>

      <div class="flex items-center gap-1.5 ml-auto">
        <span class="text-xs text-gray-400 hidden sm:block">Excel 다운로드:</span>
        <button type="button" on:click={() => downloadExcel('class')}
          class="flex items-center gap-1 btn-outline text-xs px-3 py-1.5">
          <Download size={12} /> 반별
        </button>
        <button type="button" on:click={() => downloadExcel('domain')}
          class="flex items-center gap-1 btn-outline text-xs px-3 py-1.5">
          <Download size={12} /> 영역별
        </button>
        <button type="button" on:click={() => downloadExcel('all')}
          class="flex items-center gap-1 btn-outline text-xs px-3 py-1.5">
          <Download size={12} /> 전체
        </button>
      </div>
    </div>

    <!-- ── Upload form (collapsible) ─────────────────────────── -->
    {#if showUpload}
      <div class="bg-white border border-gray-100 rounded-xl p-6 mb-6">
        <h2 class="text-base font-semibold text-ink mb-5">새 물품 등록</h2>

        {#if clientError}
          <div class="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
            {clientError}
          </div>
        {:else if form?.uploadError}
          <div class="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
            {form.uploadError}
          </div>
        {:else if form?.uploadSuccess}
          <div class="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
            ✓ 물품이 등록되었습니다!
          </div>
        {/if}

        <form
          method="POST"
          action="?/uploadItem"
          use:enhance={async ({ formData, cancel }) => {
            uploading = true; clientError = '';
            if (imageFile) {
              const ext = imageFile.name.split('.').pop()?.toLowerCase();
              if (!['jpg','jpeg','png','webp','gif'].includes(ext ?? '')) {
                clientError = '지원하지 않는 이미지 형식입니다.';
                uploading = false; cancel(); return;
              }
              const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
              const { error: upErr } = await supabase.storage
                .from('items').upload(fileName, imageFile, { contentType: imageFile.type });
              if (upErr) {
                clientError = `이미지 업로드 실패: ${upErr.message}`;
                uploading = false; cancel(); return;
              }
              const { data } = supabase.storage.from('items').getPublicUrl(fileName);
              formData.set('image_url', data.publicUrl);
            }
            return async ({ update }) => {
              uploading = false;
              await update({ reset: true });
              resetUploadForm();
              invalidateAll();
            };
          }}
          class="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <!-- Image -->
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-ink mb-2">물품 사진</label>
            {#if imagePreview}
              <div class="relative w-32 h-32 rounded-xl overflow-hidden bg-gray-50">
                <img src={imagePreview} alt="미리보기" class="w-full h-full object-cover" />
                <button type="button" on:click={clearImage}
                  class="absolute top-1.5 right-1.5 bg-white/90 rounded-full p-1 shadow-sm hover:bg-white">
                  <X size={12} class="text-gray-500" />
                </button>
              </div>
            {:else}
              <label for="upload-image-input"
                class="flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-dashed
                       border-gray-200 cursor-pointer hover:border-primary hover:bg-primary-light/20 transition-colors">
                <ImageOff size={20} class="text-gray-300" />
                <span class="text-sm text-gray-400">클릭하여 사진 선택 (JPG, PNG, WebP)</span>
              </label>
            {/if}
            <input id="upload-image-input" type="file" accept="image/*" class="hidden" on:change={handleImageChange} />
            <div class="flex items-center gap-1.5 mt-2">
              <Info size={12} class="text-primary flex-shrink-0" />
              <p class="text-xs text-gray-400">되도록 <span class="font-medium text-ink">1:1 비율(정사각형)</span> 사진을 올려주세요!</p>
            </div>
          </div>

          <!-- Title -->
          <div class="sm:col-span-2">
            <label for="up-title" class="block text-sm font-medium text-ink mb-1.5">
              물품 이름 <span class="text-red-400">*</span>
            </label>
            <input id="up-title" name="title" type="text" class="input-field"
              placeholder="예: 거의 새것 수학 문제집" required maxlength="100" />
          </div>

          <!-- Domain -->
          <div>
            <label for="up-domain" class="block text-sm font-medium text-ink mb-1.5">
              영역 <span class="text-red-400">*</span>
            </label>
            <select id="up-domain" name="domain" class="input-field" required>
              <option value="">선택하세요</option>
              {#each Object.entries(DOMAIN_FULL) as [k, v]}
                <option value={k}>{v}</option>
              {/each}
            </select>
          </div>

          <!-- Price -->
          <div>
            <label for="up-price" class="block text-sm font-medium text-ink mb-1.5">
              가격 (비즈쿨 머니) <span class="text-red-400">*</span>
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">₩</span>
              <input id="up-price" name="price" type="text" inputmode="numeric"
                class="input-field pl-7 font-mono {priceError ? 'border-red-300' : ''}"
                placeholder="예: 5000" value={priceValue} on:input={handlePriceInput} required />
            </div>
            {#if priceError}
              <p class="text-red-500 text-xs mt-1">{priceError}</p>
            {:else if priceValue && !priceError}
              <p class="text-primary text-xs mt-1">₩{fmt(priceValue)} 비즈쿨 머니</p>
            {/if}
          </div>

          <!-- Class & Group -->
          <div>
            <label for="up-class" class="block text-sm font-medium text-ink mb-1.5">
              반 <span class="text-red-400">*</span>
            </label>
            <select id="up-class" name="class_num" class="input-field" required>
              <option value="">선택하세요</option>
              {#each Array.from({ length: 12 }, (_, i) => i + 1) as c}
                <option value={c}>{c}반</option>
              {/each}
            </select>
          </div>
          <div>
            <label for="up-group" class="block text-sm font-medium text-ink mb-1.5">
              모둠 <span class="text-red-400">*</span>
            </label>
            <select id="up-group" name="group_num" class="input-field" required>
              <option value="">선택하세요</option>
              {#each [1,2,3,4,5] as g}
                <option value={g}>{g}모둠</option>
              {/each}
            </select>
          </div>

          <!-- Description -->
          <div class="sm:col-span-2">
            <label for="up-desc" class="block text-sm font-medium text-ink mb-1.5">설명</label>
            <textarea id="up-desc" name="description" class="input-field resize-none" rows="2"
              placeholder="상태, 특이사항 등을 적어주세요." maxlength="500"></textarea>
          </div>

          <div class="sm:col-span-2">
            <button type="submit"
              class="btn-primary w-full py-3 flex items-center justify-center gap-2"
              disabled={uploading || !!priceError || !priceValue}>
              {#if uploading}
                <Loader2 size={15} class="animate-spin" /> 등록 중...
              {:else}
                <Plus size={15} /> 물품 등록하기
              {/if}
            </button>
          </div>
        </form>
      </div>
    {/if}

    <!-- ── Filters ────────────────────────────────────────────── -->
    <div class="flex flex-wrap gap-3 mb-5">
      <div class="relative flex-1 min-w-[160px]">
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
      <select class="input-field w-auto text-sm" bind:value={filterDomain}>
        <option value={0}>전체 영역</option>
        {#each Object.entries(DOMAIN_LABELS) as [k, v]}
          <option value={parseInt(k)}>{v}</option>
        {/each}
      </select>
      <select class="input-field w-auto text-sm" bind:value={filterStatus}>
        <option value="all">전체 상태</option>
        <option value="available">예약 가능</option>
        <option value="reserved">예약됨</option>
      </select>
    </div>

    <!-- ── Table ──────────────────────────────────────────────── -->
    <div class="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50/60">
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">물품</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">반/모둠</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">영역</th>
              <th class="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">가격</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">상태</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">예약 학번</th>
              <th class="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">관리</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            {#if filteredItems.length === 0}
              <tr>
                <td colspan="7" class="text-center py-14 text-gray-300">
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
                  <td class="px-4 py-3">
                    {#if item.domain}
                      <span class="inline-block bg-orange-50 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                        {DOMAIN_LABELS[item.domain] ?? item.domain}
                      </span>
                    {:else}
                      <span class="text-gray-300 text-xs">—</span>
                    {/if}
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
                            class="text-xs text-white bg-red-500 hover:bg-red-600 px-2.5 py-1.5 rounded-lg font-medium"
                            disabled={submitting}>확인</button>
                        </form>
                        <button type="button"
                          class="text-xs text-gray-400 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg"
                          on:click={() => (confirmDeleteId = null)}>취소</button>
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
          <span>{filteredItems.length}개 항목</span>
          <span class="font-semibold text-primary">
            합계: ₩{fmt(filteredItems.reduce((s, i) => s + (i.price ?? 0), 0))}
          </span>
        </div>
      {/if}
    </div>
  {/if}
</div>
