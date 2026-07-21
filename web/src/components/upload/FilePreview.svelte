<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import { formatFileSize, getFileIcon } from '$lib/utils';
  import Badge from '$components/ui/Badge.svelte';

  export let file: File;
  export let showRemove = true;

  const dispatch = createEventDispatcher<{
    remove: Record<string, never>;
  }>();

  $: isImage = file.type.startsWith('image/');
  $: icon = getFileIcon(file.type);
  $: preview = isImage ? URL.createObjectURL(file) : null;
</script>

<div class="glass p-4 flex items-center gap-4 animate-fade-in" transition:fade>
  <!-- Preview -->
  <div class="w-16 h-16 rounded-xl overflow-hidden bg-bg-elevated flex-shrink-0 flex items-center justify-center">
    {#if preview}
      <img src={preview} alt={file.name} class="w-full h-full object-cover" />
    {:else}
      <span class="text-[10px] font-mono text-text-tertiary font-bold">{icon}</span>
    {/if}
  </div>

  <!-- Info -->
  <div class="flex-1 min-w-0">
    <p class="text-sm font-medium text-text-primary truncate">{file.name}</p>
    <div class="flex items-center gap-2 mt-1">
      <span class="text-xs text-text-tertiary">{formatFileSize(file.size)}</span>
      <Badge variant="default" size="sm">{file.type.split('/')[1]?.toUpperCase() || 'FILE'}</Badge>
    </div>
  </div>

  <!-- Remove -->
  {#if showRemove}
    <button
      class="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center touchable hover:bg-docufill-red/10 group"
      on:click={() => dispatch('remove', {})}
    >
      <svg class="w-4 h-4 text-text-tertiary group-hover:text-docufill-red transition-colors" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
  {/if}
</div>
