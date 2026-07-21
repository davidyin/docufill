<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled = false;
  export let loading = false;
  export let fullWidth = false;
  export let href: string | undefined = undefined;
  export let type: 'button' | 'submit' = 'button';

  $: classes = getClasses(variant, size, disabled, loading, fullWidth);

  function getClasses(
    variant: string,
    size: string,
    disabled: boolean,
    loading: boolean,
    fullWidth: boolean
  ): string {
    const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 touchable relative overflow-hidden';
    const sizes: Record<string, string> = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2.5 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2.5',
    };
    const variants: Record<string, string> = {
      primary: 'bg-gradient-to-r from-docufill-orange to-docufill-yellow text-black font-semibold shadow-lg shadow-docufill-orange/20',
      secondary: 'bg-bg-card border border-white/[0.08] text-text-primary hover:bg-bg-elevated',
      ghost: 'text-text-secondary hover:text-text-primary hover:bg-white/[0.06]',
      danger: 'bg-docufill-red/15 text-docufill-red border border-docufill-red/30 hover:bg-docufill-red/25',
    };
    const extras = [
      disabled || loading ? 'opacity-50 pointer-events-none' : '',
      fullWidth ? 'w-full' : '',
    ];

    return `${base} ${sizes[size]} ${variants[variant]} ${extras.join(' ')}`;
  }
</script>

{#if href}
  <a {href} class={classes} class:pointer-events-none={disabled}>
    {#if loading}
      <span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
    {/if}
    <slot />
  </a>
{:else}
  <button {type} class={classes} {disabled} on:click>
    {#if loading}
      <span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
    {/if}
    <slot />
  </button>
{/if}
