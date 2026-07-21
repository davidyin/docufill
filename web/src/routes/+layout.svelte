<script lang="ts">
  import '../app.css';
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import Sidebar from '$components/layout/Sidebar.svelte';
  import TopBar from '$components/layout/TopBar.svelte';

  let isDesktop = false;
  let resizeHandler: () => void;

  onMount(() => {
    resizeHandler = () => {
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
      isDesktop = window.innerWidth >= 768;
    };
    resizeHandler();
    window.addEventListener('resize', resizeHandler);
  });

  onDestroy(() => {
    if (browser) {
      window.removeEventListener('resize', resizeHandler);
    }
  });
</script>

<svelte:head>
  <title>DocuFill — AI Document Extraction</title>
</svelte:head>

<div class="flex overflow-hidden" style="height: var(--app-height);">
  <!-- Desktop Sidebar -->
  {#if isDesktop}
    <Sidebar {isDesktop} />
  {/if}

  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Top Bar -->
    <TopBar />

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden relative">
      <slot />
    </main>

    <!-- Mobile Bottom Nav -->
    {#if !isDesktop}
      <Sidebar {isDesktop} />
    {/if}
  </div>
</div>
