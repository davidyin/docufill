<script lang="ts">
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let color: 'orange' | 'white' = 'orange';

  $: sizes = getSize(size);
  $: colors = color === 'orange' ? 'border-docufill-orange border-t-transparent' : 'border-white border-t-transparent';

  function getSize(size: string): string {
    const sizes: Record<string, string> = {
      sm: 'w-4 h-4 border-2',
      md: 'w-6 h-6 border-2',
      lg: 'w-10 h-10 border-4',
    };
    return sizes[size];
  }
</script>

<div class="{sizes} {colors} rounded-full animate-spin" role="status" aria-label="Loading"></div>
