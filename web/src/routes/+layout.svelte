<script lang="ts">
  import '../app.css';
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { fade } from 'svelte/transition';
  import Sidebar from '$components/layout/Sidebar.svelte';
  import TopBar from '$components/layout/TopBar.svelte';
  import Spinner from '$components/ui/Spinner.svelte';
  import {
    initClerk,
    isClerkEnabled,
    clerkLoaded,
    isSignedIn,
    authReady,
  } from '$lib/clerk';

  let isDesktop = false;
  let resizeHandler: () => void;

  onMount(async () => {
    resizeHandler = () => {
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
      isDesktop = window.innerWidth >= 768;
    };
    resizeHandler();
    window.addEventListener('resize', resizeHandler);

    // Initialize Clerk (dev mode: skips)
    if (isClerkEnabled) {
      await initClerk();
    }
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

{#if isClerkEnabled && !$authReady}
  <!-- Loading Clerk -->
  <div class="h-screen w-screen flex flex-col items-center justify-center bg-bg-primary" transition:fade>
    <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-docufill-orange to-docufill-yellow flex items-center justify-center mb-5 shadow-lg shadow-docufill-orange/20">
      <span class="text-2xl">📄</span>
    </div>
    <Spinner size="md" />
    <span class="text-text-tertiary text-sm mt-4">Loading DocuFill...</span>
  </div>
{:else if isClerkEnabled && !$isSignedIn}
  <!-- Clerk Sign-In Page -->
  <div class="h-screen w-screen flex flex-col items-center justify-center bg-bg-primary p-6" transition:fade>
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-docufill-orange to-docufill-yellow flex items-center justify-center mb-4 shadow-lg shadow-docufill-orange/20">
          <span class="text-3xl">📄</span>
        </div>
        <h1 class="text-2xl font-display font-bold bg-gradient-to-r from-docufill-orange to-docufill-yellow bg-clip-text text-transparent">
          DocuFill
        </h1>
        <p class="text-text-tertiary text-sm mt-2">AI-Powered Document Extraction</p>
      </div>

      <!-- Sign In Button — triggers Clerk -->
      <button
        on:click={() => {
          import('@clerk/clerk-js').then(({ default: Clerk }) => {
            const clerk = new Clerk(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
            clerk.load().then(() => clerk.openSignIn());
          });
        }}
        class="w-full py-3 px-4 bg-gradient-to-r from-docufill-orange to-docufill-yellow text-black font-semibold rounded-xl touchable shadow-lg shadow-docufill-orange/20 hover:shadow-docufill-orange/30 transition-shadow"
      >
        Sign In to Continue
      </button>

      <p class="text-text-tertiary text-xs text-center mt-4">
        By signing in, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  </div>
{:else}
  <!-- App Shell -->
  <div class="flex overflow-hidden" style="height: var(--app-height);">
    <!-- Desktop Sidebar -->
    {#if isDesktop}
      <Sidebar {isDesktop} />
    {/if}

    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Top Bar -->
      <TopBar />

      <!-- Main Content -->
      <main class="flex-1 overflow-hidden">
        <slot />
      </main>

      <!-- Mobile Bottom Nav -->
      {#if !isDesktop}
        <div class="safe-bottom">
          <Sidebar {isDesktop} />
        </div>
      {/if}
    </div>
  </div>
{/if}
