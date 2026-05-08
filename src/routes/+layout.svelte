<script>
  import '../app.css';
  import { page } from '$app/stores';
  import { BarChart2, Settings, Package, PlusCircle } from 'lucide-svelte';
</script>

<div class="min-h-screen flex flex-col bg-white">
  <!-- Nav -->
  <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
      <!-- Logo -->
      <a href="/" class="flex items-center gap-2.5 group">
        <img src="/logo.png" alt="아나바다 장터 로고" class="h-9 w-auto object-contain" />
        <span class="font-semibold text-ink tracking-tight">아나바다 장터</span>
      </a>

      <!-- Nav links -->
      <nav class="flex items-center gap-0.5">
        <a
          href="/"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                 {$page.url.pathname === '/'
                   ? 'text-primary bg-primary-light'
                   : 'text-gray-500 hover:text-ink hover:bg-gray-50'}"
        >
          <Package size={14} />
          <span>물품</span>
        </a>
        <a
          href="/dashboard"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                 {$page.url.pathname === '/dashboard'
                   ? 'text-primary bg-primary-light'
                   : 'text-gray-500 hover:text-ink hover:bg-gray-50'}"
        >
          <BarChart2 size={14} />
          <span>현황</span>
        </a>
        <a
          href="/admin"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                 {$page.url.pathname.startsWith('/admin')
                   ? 'text-primary bg-primary-light'
                   : 'text-gray-500 hover:text-ink hover:bg-gray-50'}"
        >
          <Settings size={14} />
          <span>관리</span>
        </a>

        <!-- Upload CTA -->
        <a
          href="/upload"
          class="ml-2 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-colors
                 {$page.url.pathname === '/upload'
                   ? 'bg-primary text-white border-primary'
                   : 'bg-white text-primary border-primary hover:bg-primary hover:text-white'}"
        >
          <PlusCircle size={14} />
          <span>물품 등록</span>
        </a>
      </nav>
    </div>
  </header>

  <!-- Page content -->
  <main class="flex-1">
    <slot />
  </main>

  <!-- Footer -->
  <footer class="border-t border-gray-100 py-5 text-center text-xs text-gray-300">
    &copy; 2026 아나바다 장터 &nbsp;|&nbsp; Developed by 20529 차유근
  </footer>
</div>
