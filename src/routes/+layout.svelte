<script>
  import '../app.css';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { supabase } from '$lib/supabase.js';
  import { signInWithGoogle } from '$lib/auth.js';
  import { BarChart2, Settings, Package, LogOut, Menu, X } from 'lucide-svelte';

  export let data;
  $: user = data.user;
  $: errorParam = $page.url.searchParams.get('error');

  let menuOpen = false;

  // Close menu on route change
  $: $page.url.pathname, menuOpen = false;

  onMount(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        invalidateAll();
      }
    });
    return () => subscription.unsubscribe();
  });

  async function signOut() {
    await supabase.auth.signOut();
    await invalidateAll();
  }

  $: initial = user?.email?.[0]?.toUpperCase() ?? '?';
  $: displayEmail = user?.email ? user.email.split('@')[0] : '';
</script>

<div class="min-h-screen flex flex-col bg-white">
  <!-- Nav -->
  <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
      <!-- Logo -->
      <a href="/" class="flex items-center gap-3 group flex-shrink-0">
        <img src="/logo.png" alt="큰사마켓 로고" class="h-11 w-auto object-contain" />
        <span class="text-xl font-extrabold tracking-tight hidden sm:block" style="color: #00AC97;">큰사마켓</span>
      </a>

      <!-- Desktop nav links -->
      <nav class="hidden sm:flex items-center gap-0.5 flex-1 justify-end">
        <a href="/"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                 {$page.url.pathname === '/' ? 'text-primary bg-primary-light' : 'text-gray-500 hover:text-ink hover:bg-gray-50'}">
          <Package size={14} /><span>물품</span>
        </a>
        <a href="/dashboard"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                 {$page.url.pathname === '/dashboard' ? 'text-primary bg-primary-light' : 'text-gray-500 hover:text-ink hover:bg-gray-50'}">
          <BarChart2 size={14} /><span>현황</span>
        </a>
        <a href="/admin"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                 {$page.url.pathname.startsWith('/admin') ? 'text-primary bg-primary-light' : 'text-gray-500 hover:text-ink hover:bg-gray-50'}">
          <Settings size={14} /><span>관리</span>
        </a>
      </nav>

      <!-- Auth -->
      <div class="flex-shrink-0 flex items-center gap-2">
        {#if user}
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-primary-light">
              <span class="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {initial}
              </span>
              <span class="text-xs font-medium text-primary hidden sm:block max-w-[100px] truncate">
                {displayEmail}
              </span>
            </div>
            <button on:click={signOut}
              class="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
              <LogOut size={13} />
              <span class="hidden sm:block">로그아웃</span>
            </button>
          </div>
        {:else}
          <div class="relative">
            <button on:click={signInWithGoogle}
              class="flex items-center gap-1.5 btn-primary text-xs px-3.5 py-2">
              <span class="flex items-center justify-center w-5 h-5 bg-white rounded-full flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="w-3.5 h-3.5">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
              </span>
              <span>Google 로그인</span>
            </button>
          </div>
        {/if}

        <!-- Mobile hamburger -->
        <button
          class="sm:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
          on:click={() => (menuOpen = !menuOpen)}
          aria-label="메뉴"
        >
          {#if menuOpen}
            <X size={20} />
          {:else}
            <Menu size={20} />
          {/if}
        </button>
      </div>
    </div>

    <!-- Mobile dropdown menu -->
    {#if menuOpen}
      <nav class="sm:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1">
        <a href="/"
          class="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                 {$page.url.pathname === '/' ? 'text-primary bg-primary-light' : 'text-gray-600 hover:bg-gray-50'}">
          <Package size={16} /> 물품
        </a>
        <a href="/dashboard"
          class="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                 {$page.url.pathname === '/dashboard' ? 'text-primary bg-primary-light' : 'text-gray-600 hover:bg-gray-50'}">
          <BarChart2 size={16} /> 현황
        </a>
        <a href="/admin"
          class="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                 {$page.url.pathname.startsWith('/admin') ? 'text-primary bg-primary-light' : 'text-gray-600 hover:bg-gray-50'}">
          <Settings size={16} /> 관리
        </a>
      </nav>
    {/if}
  </header>

  <!-- 로그인 에러 메시지 -->
  {#if errorParam === 'unauthorized_domain'}
    <div class="bg-red-50 border-b border-red-100 px-4 py-2.5 text-center text-sm text-red-600">
      @cnsa.hs.kr 학교 계정으로만 로그인할 수 있습니다.
    </div>
  {/if}

  <!-- Page content -->
  <main class="flex-1">
    <slot />
  </main>

  <!-- Footer -->
  <footer class="border-t border-gray-100 py-5 text-center text-xs text-gray-300">
    &copy; 2026 큰사마켓 &nbsp;|&nbsp; Web by 차유근 &nbsp;·&nbsp; Security by 김윤서
  </footer>
</div>
