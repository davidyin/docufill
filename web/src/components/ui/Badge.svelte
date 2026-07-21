<script lang="ts">
  export let variant: 'default' | 'success' | 'warning' | 'error' | 'processing' = 'default';
  export let size: 'sm' | 'md' = 'md';
  export let dot = false;

  $: classes = getClasses(variant, size);

  function getClasses(variant: string, size: string): string {
    const base = 'inline-flex items-center gap-1 font-medium rounded-full border';
    const sizes: Record<string, string> = {
      sm: 'px-2 py-0.5 text-[10px]',
      md: 'px-2.5 py-1 text-xs',
    };
    const variants: Record<string, string> = {
      default: 'bg-white/[0.06] text-text-secondary border-white/[0.08]',
      success: 'bg-confidence-high/10 text-confidence-high border-confidence-high/20',
      warning: 'bg-docufill-yellow/10 text-docufill-yellow border-docufill-yellow/20',
      error: 'bg-docufill-red/10 text-docufill-red border-docufill-red/20',
      processing: 'bg-docufill-orange/10 text-docufill-orange border-docufill-orange/20',
    };
    return `${base} ${sizes[size]} ${variants[variant]}`;
  }
</script>

<span class={classes}>
  {#if dot}
    <span class="w-1.5 h-1.5 rounded-full {variant === 'processing' ? 'bg-docufill-orange animate-pulse' : variant === 'success' ? 'bg-confidence-high' : variant === 'error' ? 'bg-docufill-red' : 'bg-white/40'}"></span>
  {/if}
  <slot />
</span>
