<script lang="ts">
  import { page } from '$app/stores';
  import { fade } from 'svelte/transition';

  export let isDesktop = false;

  $: path = $page.url.pathname;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Documents',
      href: '/',
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
    },
    {
      id: 'upload',
      label: 'Upload',
      href: '/upload',
      icon: 'M9 13.5l3-3m0 0l3 3m-3-3v9M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ];

  function isActive(href: string): boolean {
    if (href === '/') return path === '/' || path.startsWith('/document/');
    return path.startsWith(href);
  }
</script>

{#if isDesktop}
  <!-- Desktop Sidebar -->
  <nav class="w-60 h-full bg-bg-elevated/50 border-r border-white/[0.06] flex flex-col">
    <!-- Logo area -->
    <div class="p-5 border-b border-white/[0.06]">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-docufill-orange to-docufill-yellow flex items-center justify-center">
          <svg class="w-4 h-4 text-black" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <div>
          <h1 class="text-base font-display font-bold text-text-primary">DocuFill</h1>
          <p class="text-[10px] text-text-tertiary">AI Document Extractor</p>
        </div>
      </div>
    </div>

    <!-- Nav items -->
    <div class="p-3 flex-1">
      <div class="space-y-1">
        {#each navItems as item}
          <a
            href={item.href}
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors touchable"
            class:bg-docufill-orange/10={isActive(item.href)}
            class:text-docufill-orange={isActive(item.href)}
            class:text-text-secondary={!isActive(item.href)}
            class:hover:bg-white/[0.04]={!isActive(item.href)}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d={item.icon}/>
            </svg>
            {item.label}
          </a>
        {/each}
      </div>
    </div>

    <!-- Footer -->
    <div class="p-4 border-t border-white/[0.06]">
      <div class="text-[10px] text-text-tertiary font-mono">
        v0.1.0 · AI Powered
      </div>
    </div>
  </nav>
{:else}
  <!-- Mobile Bottom Nav -->
  <nav class="tab-bar bg-bg-primary/80 backdrop-blur-2xl border-t border-white/[0.06] flex items-center justify-around px-2 pt-2 z-50">
    {#each navItems as item}
      <a
        href={item.href}
        class="flex flex-col items-center justify-center w-16 h-14 rounded-xl touchable"
        class:text-text-primary={isActive(item.href)}
        class:text-text-tertiary={!isActive(item.href)}
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d={item.icon}/>
        </svg>
        <span class="text-[10px] mt-0.5 font-medium">{item.label}</span>
        {#if isActive(item.href)}
          <div class="absolute -bottom-1 w-1 h-1 rounded-full bg-docufill-orange"></div>
        {/if}
      </a>
    {/each}
  </nav>
{/if}
