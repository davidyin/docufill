<script lang="ts">
  export let variant: 'default' | 'elevated' | 'interactive' = 'default';
  export let padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  export let onClick: (() => void) | undefined = undefined;

  $: classes = getClasses(variant, padding, !!onClick);

  function getClasses(variant: string, padding: string, clickable: boolean): string {
    const paddings: Record<string, string> = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };
    const variants: Record<string, string> = {
      default: 'bg-bg-card border border-white/[0.06] rounded-2xl',
      elevated: 'glass',
      interactive: 'glass touchable cursor-pointer hover:border-docufill-orange/20',
    };
    return `${variants[variant]} ${paddings[padding]}`;
  }
</script>

<div class={classes} on:click={onClick} role={onClick ? 'button' : undefined} tabindex={onClick ? 0 : undefined}>
  <slot />
</div>
