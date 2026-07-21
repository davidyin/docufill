<script lang="ts">
  import { page } from '$app/stores';

  $: path = $page.url.pathname;
  $: title = getPageTitle(path);

  function getPageTitle(p: string): string {
    if (p.startsWith('/document/')) return 'Document Review';
    if (p === '/upload') return 'Upload Document';
    return 'DocuFill';
  }
</script>

<!-- Standard Top Bar -->
<div class="h-14 flex items-center justify-between px-4 bg-bg-primary/80 backdrop-blur-2xl border-b border-white/[0.06] safe-top z-50">
  <div class="flex items-center gap-3">
    <a href="/" class="glass px-2.5 py-1 rounded-full flex items-center gap-1.5 touchable">
      <div class="w-2 h-2 rounded-full bg-docufill-orange animate-pulse"></div>
      <span class="text-sm font-display font-bold bg-gradient-to-r from-docufill-orange to-docufill-yellow bg-clip-text text-transparent">
        DocuFill
      </span>
    </a>
  </div>

  <span class="text-base font-display font-semibold">{title}</span>

  <div class="w-10">
    {#if path !== '/upload'}
      <a href="/upload" class="w-10 h-10 rounded-full bg-gradient-to-br from-docufill-orange to-docufill-yellow flex items-center justify-center touchable shadow-lg shadow-docufill-orange/20">
        <svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
      </a>
    {/if}
  </div>
</div>
