<script>
  import { ImageOff } from 'lucide-svelte';

  export let item;
  export let onSelect;

  const fmt = (n) => new Intl.NumberFormat('ko-KR').format(n);
</script>

<button
  class="card w-full text-left group"
  on:click={() => onSelect(item)}
  type="button"
>
  <!-- Image -->
  <div class="aspect-square bg-gray-50 overflow-hidden relative">
    {#if item.image_url}
      <img
        src={item.image_url}
        alt={item.title}
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
    {:else}
      <div class="w-full h-full flex flex-col items-center justify-center text-gray-200 gap-2">
        <ImageOff size={36} strokeWidth={1.25} />
        <span class="text-xs">사진 없음</span>
      </div>
    {/if}

    <!-- Reserved overlay -->
    {#if item.is_reserved}
      <div class="absolute inset-0 bg-primary/10 flex items-center justify-center">
        <span class="bg-white text-primary text-xs font-bold px-3 py-1.5 rounded-full border border-primary/30 shadow-sm tracking-wide">
          예약완료
        </span>
      </div>
    {/if}
  </div>

  <!-- Info -->
  <div class="p-3.5">
    <div class="flex items-start justify-between gap-1.5 mb-1">
      <h3 class="font-medium text-ink leading-snug line-clamp-2 text-sm flex-1">
        {item.title}
      </h3>
      <span
        class="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full
               {item.is_reserved ? 'bg-primary-light text-primary' : 'bg-emerald-50 text-emerald-600'}"
      >
        {item.is_reserved ? '예약됨' : '가능'}
      </span>
    </div>
    <p class="text-xs text-gray-400 mb-1">{item.class_num}반 {item.group_num}조</p>
    {#if item.domain}
      <p class="text-[10px] text-gray-300 mb-1.5">{item.domain}영역</p>
    {/if}
    <!-- Price -->
    <p class="text-sm font-bold {item.is_reserved ? 'text-gray-300' : 'text-primary'}">
      ₩{fmt(item.price)}
    </p>
  </div>
</button>
