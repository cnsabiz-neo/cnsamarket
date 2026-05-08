<script>
  import { createEventDispatcher } from 'svelte';
  import { X, CheckCircle, ImageOff, Loader2 } from 'lucide-svelte';

  export let item;

  const dispatch = createEventDispatcher();
  const fmt = (n) => new Intl.NumberFormat('ko-KR').format(n);

  let studentId = '';
  let loading = false;
  let error = '';
  let success = false;
  let toast = false;

  let currentItem = { ...item };
  $: currentItem = { ...item };

  $: canReserve = /^\d{5}$/.test(studentId.trim());

  function close() { dispatch('close'); }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) close();
  }

  function handleKey(e) {
    if (e.key === 'Escape') close();
  }

  function handleInput(e) {
    studentId = e.target.value.replace(/\D/g, '').slice(0, 5);
  }

  function showToast() {
    toast = true;
    setTimeout(() => { toast = false; }, 3500);
  }

  async function handleReserve() {
    if (!canReserve) return;
    const id = studentId.trim();
    error = '';
    loading = true;

    try {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: currentItem.id, studentId: id })
      });
      const data = await res.json();

      if (!res.ok) {
        error = data.error ?? '예약에 실패했습니다.';
      } else {
        success = true;
        currentItem = { ...currentItem, is_reserved: true, reserved_by: id };
        dispatch('reserved', { item: currentItem });
        showToast();
      }
    } catch {
      error = '네트워크 오류가 발생했습니다.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:window on:keydown={handleKey} />

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div
  class="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm"
  on:click={handleBackdrop}
>
  <div
    class="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
    role="dialog"
    aria-modal="true"
  >
    <!-- Mobile handle -->
    <div class="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
      <div class="w-10 h-1 bg-gray-200 rounded-full"></div>
    </div>

    <div class="overflow-y-auto flex-1">
      <!-- Image -->
      <div class="aspect-[4/3] bg-gray-50 overflow-hidden relative">
        {#if currentItem.image_url}
          <img src={currentItem.image_url} alt={currentItem.title} class="w-full h-full object-cover" />
        {:else}
          <div class="w-full h-full flex items-center justify-center text-gray-200">
            <ImageOff size={56} strokeWidth={1} />
          </div>
        {/if}
        <button
          class="absolute top-3 right-3 bg-white/90 rounded-full p-1.5 shadow-sm hover:bg-white transition-colors hidden sm:flex items-center justify-center"
          on:click={close}
        >
          <X size={16} class="text-gray-500" />
        </button>
      </div>

      <!-- Details -->
      <div class="p-6">
        <!-- Badges -->
        <div class="flex items-center gap-2 mb-3">
          <span class="bg-primary-light text-primary text-xs font-medium px-2.5 py-1 rounded-full">
            {currentItem.class_num}반
          </span>
          <span class="bg-gray-100 text-gray-500 text-xs font-medium px-2.5 py-1 rounded-full">
            {currentItem.group_num}모둠
          </span>
          {#if currentItem.domain}
            <span class="bg-orange-50 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
              {currentItem.domain}영역
            </span>
          {/if}
          <span class="ml-auto {currentItem.is_reserved ? 'badge-reserved' : 'badge-available'} text-xs">
            {currentItem.is_reserved ? '예약완료' : '예약가능'}
          </span>
        </div>

        <h2 class="text-xl font-bold text-ink mb-1 leading-snug">{currentItem.title}</h2>

        <!-- Price -->
        <p class="text-2xl font-bold {currentItem.is_reserved ? 'text-gray-300' : 'text-primary'} mb-4">
          ₩{fmt(currentItem.price)}
          <span class="text-xs font-normal text-gray-400 ml-1">비즈쿨 머니</span>
        </p>

        {#if currentItem.description}
          <p class="text-sm text-gray-500 leading-relaxed mb-6">{currentItem.description}</p>
        {:else}
          <p class="text-sm text-gray-300 mb-6">설명이 없습니다.</p>
        {/if}

        <!-- Reservation -->
        {#if currentItem.is_reserved}
          <div class="bg-primary-light border border-primary/20 rounded-xl p-5 flex flex-col items-center gap-2">
            <CheckCircle size={28} class="text-primary" />
            <p class="font-bold text-primary text-sm">예약완료된 물품입니다</p>
          </div>
        {:else if success}
          <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-5 flex flex-col items-center gap-2">
            <CheckCircle size={28} class="text-emerald-500" />
            <p class="font-bold text-emerald-700">예약이 완료되었습니다!</p>
            <p class="text-xs text-emerald-600 text-center mt-0.5">행사 당일 해당 모둠 부스를 방문해주세요.</p>
          </div>
        {:else}
          <div class="border border-gray-100 rounded-xl p-4 space-y-3">
            <div>
              <label for="student-id-input" class="block text-sm font-semibold text-ink mb-1.5">
                학번 입력 <span class="text-red-400 font-normal text-xs">(5자리 필수)</span>
              </label>
              <input
                id="student-id-input"
                class="input-field text-base tracking-widest font-mono"
                type="text"
                placeholder="예: 21001"
                value={studentId}
                on:input={handleInput}
                maxlength="5"
                inputmode="numeric"
                on:keydown={(e) => e.key === 'Enter' && canReserve && handleReserve()}
              />
              <!-- 5-segment progress -->
              <div class="flex gap-1.5 mt-2">
                {#each [0,1,2,3,4] as i}
                  <div class="h-1 flex-1 rounded-full transition-colors duration-200
                    {studentId.length > i ? 'bg-primary' : 'bg-gray-100'}"></div>
                {/each}
              </div>
              {#if error}
                <p class="text-red-500 text-xs mt-2">{error}</p>
              {/if}
            </div>

            <button
              class="w-full py-2.5 rounded-[10px] font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200
                     {canReserve
                       ? 'bg-primary text-white hover:bg-primary-dark active:scale-95 shadow-sm shadow-primary/20'
                       : 'bg-gray-100 text-gray-300 cursor-not-allowed'}"
              on:click={handleReserve}
              disabled={!canReserve || loading}
            >
              {#if loading}
                <Loader2 size={15} class="animate-spin" /> 예약 중...
              {:else if canReserve}
                <CheckCircle size={15} /> 예약하기
              {:else}
                학번 5자리를 입력해주세요
              {/if}
            </button>
          </div>
        {/if}
      </div>
    </div>

    <div class="flex-shrink-0 px-6 py-4 border-t border-gray-100">
      <button class="btn-ghost w-full text-center" on:click={close}>닫기</button>
    </div>
  </div>
</div>

<!-- Toast -->
{#if toast}
  <div
    class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]
           flex items-center gap-3 bg-ink text-white text-sm font-medium
           px-5 py-3 rounded-2xl shadow-xl shadow-black/20
           animate-[slideUp_0.25s_ease-out]"
    role="status"
  >
    <CheckCircle size={16} class="text-emerald-400 flex-shrink-0" />
    예약이 완료되었습니다!
  </div>
{/if}

<style>
  @keyframes slideUp {
    from { opacity: 0; transform: translateX(-50%) translateY(12px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
</style>
