<script>
  import '../app.css';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { supabase } from '$lib/supabase.js';
  import { PUBLIC_GOOGLE_CLIENT_ID } from '$env/static/public';
  import { BarChart2, Settings, Package, LogIn, LogOut } from 'lucide-svelte';

  export let data;
  $: user = data.user;

  // Re-run load functions whenever auth state changes
  onMount(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        invalidateAll();
      }
    });
    return () => subscription.unsubscribe();
  });

  function signIn() {
    const params = new URLSearchParams({
      client_id: PUBLIC_GOOGLE_CLIENT_ID,
      redirect_uri: `${window.location.origin}/auth/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account'
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async function signOut() {
    await supabase.auth.signOut();
    await invalidateAll();
  }

  // Display name: first letter of email
  $: initial = user?.email?.[0]?.toUpperCase() ?? '?';
  $: displayEmail = user?.email ? user.email.split('@')[0] : '';
</script>

<div class="min-h-screen flex flex-col bg-white">
  <!-- Nav -->
  <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
      <!-- Logo -->
      <a href="/" class="flex items-center gap-2.5 group flex-shrink-0">
        <img src="/logo.png" alt="아나바다 장터 로고" class="h-9 w-auto object-contain" />
        <span class="font-extrabold tracking-tight hidden sm:block" style="color: #00AC97;">큰사마켓</span>
      </a>

      <!-- Nav links -->
      <nav class="flex items-center gap-0.5 flex-1 justify-center sm:justify-end">
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
      <div class="flex-shrink-0">
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
          <button on:click={signIn}
            class="flex items-center gap-1.5 btn-primary text-xs px-3.5 py-2">
            <LogIn size={13} />
            <span>Google 로그인</span>
          </button>
        {/if}
      </div>
    </div>
  </header>

  <!-- Page content -->
  <main class="flex-1">
    <slot />
  </main>

  <!-- Footer -->
  <footer class="border-t border-gray-100 py-5 text-center text-xs text-gray-300">
    &copy; 2026 큰사마켓 &nbsp;|&nbsp; Web by 차유근 &nbsp;·&nbsp; Security by 김윤서
  </footer>
</div>
