<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  let status = 'loading'; // loading | redirecting | error
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
      status = 'redirecting';
      // Redirect to Clerk-hosted sign-in, then back here after auth
      clerk.redirectToSignIn({
        redirectUrl: window.location.origin,
        initialValues: {},
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

    {#if status === 'loading'}
      <div class="flex flex-col items-center py-8 gap-3">
        <div class="w-8 h-8 border-2 border-docufill-orange border-t-transparent rounded-full animate-spin"></div>
        <span class="text-text-tertiary text-sm">Loading…</span>
      </div>
    {:else if status === 'redirecting'}
      <div class="flex flex-col items-center py-8 gap-3">
        <div class="w-8 h-8 border-2 border-docufill-orange border-t-transparent rounded-full animate-spin"></div>
        <span class="text-text-tertiary text-sm">Redirecting to sign-in…</span>
      </div>
    {:else if status === 'error'}
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
  </div>
</div>
