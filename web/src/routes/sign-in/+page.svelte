<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  let mountEl: HTMLDivElement;
  let status = 'loading'; // loading | ready | error
  let errorMsg = '';

  onMount(async () => {
    if (!publishableKey) {
      status = 'error';
      errorMsg = 'Clerk not configured';
      return;
    }
    try {
      const { Clerk } = await import('@clerk/clerk-js');
      const clerk = new Clerk(publishableKey);
      await clerk.load();
      status = 'ready';

      // Mount the SignIn component into the page
      clerk.mountSignIn(mountEl, {
        redirectUrl: window.location.origin,
      });
    } catch (err: any) {
      console.error('[Clerk] Init error:', err);
      status = 'error';
      errorMsg = err.message || 'Failed to load Clerk';
    }
  });
</script>

<svelte:head>
  <title>Sign In — DocuFill</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-bg-primary p-6">
  <div class="w-full max-w-md">
    <!-- Header -->
    <div class="text-center mb-8">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-docufill-orange to-docufill-yellow flex items-center justify-center mb-4 shadow-lg shadow-docufill-orange/20">
        <span class="text-3xl">📄</span>
      </div>
      <h1 class="text-2xl font-display font-bold bg-gradient-to-r from-docufill-orange to-docufill-yellow bg-clip-text text-transparent">
        DocuFill
      </h1>
      <p class="text-text-tertiary text-sm mt-2">Sign in to continue</p>
    </div>

    <!-- Loading -->
    {#if status === 'loading'}
      <div class="flex flex-col items-center py-8 gap-3">
        <div class="w-8 h-8 border-2 border-docufill-orange border-t-transparent rounded-full animate-spin"></div>
        <span class="text-text-tertiary text-sm">Loading sign-in…</span>
      </div>
    {/if}

    <!-- Error -->
    {#if status === 'error'}
      <div class="glass rounded-2xl p-6 text-center">
        <p class="text-docufill-red text-sm mb-3">{errorMsg}</p>
        <button
          on:click={() => window.location.reload()}
          class="px-4 py-2 bg-docufill-orange text-black text-sm font-medium rounded-xl touchable"
        >
          Try again
        </button>
      </div>
    {/if}

    <!-- Clerk SignIn mount point -->
    {#if status === 'ready'}
      <div bind:this={mountEl} class="clerk-mount"></div>
    {/if}
  </div>
</div>

<style>
  /* Ensure Clerk card is visible and styled */
  :global(.cl-card) {
    background: transparent !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
  :global(.cl-headerTitle) {
    color: #fff !important;
  }
  :global(.cl-headerSubtitle),
  :global(.cl-formFieldLabel) {
    color: rgba(255,255,255,0.6) !important;
  }
  :global(.cl-formFieldInput) {
    background: rgba(255,255,255,0.05) !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    color: #fff !important;
  }
  :global(.cl-formFieldInput:focus) {
    border-color: #FF6A1A !important;
    box-shadow: 0 0 0 2px rgba(255,106,26,0.3) !important;
  }
  :global(.cl-formButtonPrimary) {
    background: linear-gradient(135deg, #FF6A1A, #FFB000) !important;
    color: #000 !important;
    font-weight: 600 !important;
  }
  :global(.cl-footerActionText),
  :global(.cl-footerActionLink) {
    color: rgba(255,255,255,0.6) !important;
  }
  :global(.cl-footerActionLink) {
    color: #FF6A1A !important;
  }
</style>
