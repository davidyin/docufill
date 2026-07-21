<script lang="ts">
  import { confidenceColor, confidenceBgColor, confidenceLevel } from '$lib/utils';

  export let confidence: number | null = null;
  export let size: 'sm' | 'md' | 'lg' = 'md';

  $: level = confidenceLevel(confidence);
  $: colorClass = confidenceColor(confidence);
  $: barColor = confidenceBgColor(confidence);
  $: displayValue = confidence !== null ? Math.round(confidence * 100) : null;

  $: classes = getSizeClasses(size);

  function getSizeClasses(size: string): string {
    const sizes: Record<string, string> = {
      sm: 'text-[10px] gap-1',
      md: 'text-xs gap-1.5',
      lg: 'text-sm gap-2',
    };
    return sizes[size];
  }
</script>

<div class="inline-flex items-center {classes} {colorClass}">
  <div class="relative w-1.5 h-1.5">
    <span class="absolute inline-flex h-full w-full rounded-full {barColor} opacity-75 animate-ping"></span>
    <span class="relative inline-flex rounded-full h-1.5 w-1.5 {barColor}"></span>
  </div>
  {#if displayValue !== null}
    <span class="num font-medium">{displayValue}%</span>
    <span class="opacity-60">{level}</span>
  {:else}
    <span class="num font-medium">—</span>
  {/if}
</div>
