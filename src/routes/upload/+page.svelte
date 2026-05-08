<script>
  import { enhance } from '$app/forms';
  import { ImagePlus, X, Loader2, Info } from 'lucide-svelte';
  import { supabase } from '$lib/supabase.js';

  export let form;

  let imagePreview = null;
  let imageFile    = null;
  let clientError  = '';
  let loading      = false;
  let priceValue   = '';

  const fmt = (v) => {
    const n = parseInt(v.replace(/\D/g, ''), 10);
    return isNaN(n) ? '' : new Intl.NumberFormat('ko-KR').format(n);
  };

  $: priceNum = parseInt(priceValue.replace(/\D/g, '') || '0');
  $: priceError =
    priceValue && (priceNum < 1000 || priceNum > 20000)
      ? '가격은 1,000 ~ 20,000 비즈쿨 머니 사이여야 합니다.'
      : '';

  function handlePriceInput(e) {
    const digits = e.target.value.replace(/\D/g, '');
    priceValue = digits;
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
    imagePreview = null;
    imageFile    = null;
    const input  = document.getElementById('image-input');
    if (input) input.value = '';
  }
</script>

<svelte:head>
  <title>물품 등록 — 아나바다 장터</title>
</svelte:head>

<div class="max-w-lg mx-auto px-4 sm:px-6 py-10">
  <div class="mb-8">
    <h1 class="text-2xl font-bold text-ink">물품 등록</h1>
    <p class="text-gray-400 text-sm mt-1">우리 모둠에서 판매할 물품을 등록해주세요.</p>
  </div>

  {#if clientError}
    <div class="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-6">
      {clientError}
    </div>
  {:else if form?.error}
    <div class="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-6">
      {form.error}
    </div>
  {/if}

  <form
    method="POST"
    use:enhance={async ({ formData, cancel }) => {
      loading = true;
      clientError = '';

      // Upload image directly from browser to Supabase Storage
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()?.toLowerCase();
        if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext ?? '')) {
          clientError = '지원하지 않는 이미지 형식입니다. (jpg, png, webp, gif)';
          loading = false;
          cancel();
          return;
        }
        if (imageFile.size > 10 * 1024 * 1024) {
          clientError = '이미지 크기는 10MB 이하여야 합니다.';
          loading = false;
          cancel();
          return;
        }

        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('items')
          .upload(fileName, imageFile, { contentType: imageFile.type });

        if (upErr) {
          clientError = `이미지 업로드 실패: ${upErr.message}`;
          loading = false;
          cancel();
          return;
        }

        const { data } = supabase.storage.from('items').getPublicUrl(fileName);
        formData.set('image_url', data.publicUrl);
      }

      return async ({ update }) => {
        loading = false;
        await update();
      };
    }}
    class="space-y-5"
  >
    <!-- Image (file input — NOT sent to server, uploaded from browser) -->
    <div>
      <label class="block text-sm font-medium text-ink mb-2">물품 사진</label>

      {#if imagePreview}
        <div class="relative rounded-xl overflow-hidden aspect-square bg-gray-50">
          <img src={imagePreview} alt="미리보기" class="w-full h-full object-cover" />
          <button type="button" on:click={clearImage}
            class="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 hover:bg-white shadow-sm transition-colors">
            <X size={15} class="text-gray-500" />
          </button>
        </div>
      {:else}
        <label for="image-input"
          class="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed
                 border-gray-200 cursor-pointer hover:border-primary hover:bg-primary-light/20 transition-colors">
          <ImagePlus size={28} class="text-gray-300 mb-2" />
          <span class="text-sm text-gray-400">클릭하여 사진 선택</span>
          <span class="text-xs text-gray-300 mt-1">JPG, PNG, WebP · 최대 10MB</span>
        </label>
      {/if}

      <!-- No name attribute — file is NOT sent to the server -->
      <input id="image-input" type="file" accept="image/*" class="hidden" on:change={handleImageChange} />

      <div class="flex items-start gap-1.5 mt-2">
        <Info size={13} class="text-primary flex-shrink-0 mt-px" />
        <p class="text-xs text-gray-400 leading-relaxed">
          되도록 <span class="font-medium text-ink">1:1 비율(정사각형)</span> 사진을 올려주세요!
          카드에서 가장 깔끔하게 보입니다.
        </p>
      </div>
    </div>

    <!-- Title -->
    <div>
      <label for="title" class="block text-sm font-medium text-ink mb-2">
        물품 이름 <span class="text-red-400">*</span>
      </label>
      <input id="title" name="title" type="text" class="input-field"
        placeholder="예: 거의 새것 수학 문제집" required maxlength="100" />
    </div>

    <!-- Description -->
    <div>
      <label for="description" class="block text-sm font-medium text-ink mb-2">물품 설명</label>
      <textarea id="description" name="description" class="input-field resize-none" rows="3"
        placeholder="상태, 구매 시기, 특이사항 등을 적어주세요." maxlength="500"></textarea>
    </div>

    <!-- Price -->
    <div>
      <label for="price" class="block text-sm font-medium text-ink mb-2">
        가격 (비즈쿨 머니) <span class="text-red-400">*</span>
      </label>
      <div class="relative">
        <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm pointer-events-none">₩</span>
        <input
          id="price"
          name="price"
          type="text"
          inputmode="numeric"
          class="input-field pl-7 font-mono {priceError ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : ''}"
          placeholder="예: 5000"
          value={priceValue}
          on:input={handlePriceInput}
          required
        />
      </div>
      {#if priceError}
        <p class="text-red-500 text-xs mt-1.5">{priceError}</p>
      {:else if priceValue && !priceError}
        <p class="text-primary text-xs mt-1.5 font-medium">₩{fmt(priceValue)} 비즈쿨 머니</p>
      {:else}
        <p class="text-gray-400 text-xs mt-1.5">1,000 ~ 20,000 비즈쿨 머니 범위 내로 입력하세요.</p>
      {/if}
    </div>

    <!-- Class & Group -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="class_num" class="block text-sm font-medium text-ink mb-2">
          반 <span class="text-red-400">*</span>
        </label>
        <select id="class_num" name="class_num" class="input-field" required>
          <option value="">선택하세요</option>
          {#each Array.from({ length: 12 }, (_, i) => i + 1) as c}
            <option value={c}>{c}반</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="group_num" class="block text-sm font-medium text-ink mb-2">
          모둠 <span class="text-red-400">*</span>
        </label>
        <select id="group_num" name="group_num" class="input-field" required>
          <option value="">선택하세요</option>
          {#each [1, 2, 3, 4, 5] as g}
            <option value={g}>{g}모둠</option>
          {/each}
        </select>
      </div>
    </div>

    <button type="submit"
      class="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
      disabled={loading || !!priceError || !priceValue}>
      {#if loading}
        <Loader2 size={16} class="animate-spin" />
        {imageFile ? '사진 업로드 중...' : '등록 중...'}
      {:else}
        물품 등록하기
      {/if}
    </button>
  </form>
</div>
