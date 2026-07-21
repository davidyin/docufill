<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';

  export let accept = 'image/jpeg,image/png,image/webp,application/pdf';
  export let disabled = false;

  const dispatch = createEventDispatcher<{
    files: { files: File[] };
  }>();

  let isDragging = false;
  let dragCounter = 0;
  let inputEl: HTMLInputElement;

  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter++;
    if (!disabled) isDragging = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter--;
    if (dragCounter === 0) isDragging = false;
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    isDragging = false;
    dragCounter = 0;
    if (disabled) return;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      dispatch('files', { files: Array.from(files) });
    }
  }

  function handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      dispatch('files', { files: Array.from(files) });
    }
    // Reset input so same file can be selected again
    input.value = '';
  }

  function openFilePicker() {
    if (!disabled) inputEl?.click();
  }

  onMount(() => {
    // Prevent default drag behaviors on the whole document
    const prevent = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    document.addEventListener('dragenter', prevent);
    document.addEventListener('dragover', prevent);
    document.addEventListener('dragleave', prevent);
    document.addEventListener('drop', prevent);

    onDestroy(() => {
      document.removeEventListener('dragenter', prevent);
      document.removeEventListener('dragover', prevent);
      document.removeEventListener('dragleave', prevent);
      document.removeEventListener('drop', prevent);
    });
  });
</script>

<div
  class="relative w-full"
  class:opacity-50={disabled}
>
  <!-- Dropzone area -->
  <button
    type="button"
    class="w-full min-h-[200px] rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-4 p-8 touchable"
    class:border-docufill-orange={isDragging}
    class:bg-docufill-orange/5={isDragging}
    class:border-border-default={!isDragging}
    class:bg-bg-card={!isDragging}
    class:hover:border-border-active={!disabled}
    {disabled}
    on:click={openFilePicker}
    on:dragenter={handleDragEnter}
    on:dragleave={handleDragLeave}
    on:dragover={handleDragOver}
    on:drop={handleDrop}
  >
    {#if isDragging}
      <div transition:fade={{ duration: 150 }} class="flex flex-col items-center gap-3">
        <div class="w-16 h-16 rounded-full bg-docufill-orange/20 flex items-center justify-center">
          <svg class="w-8 h-8 text-docufill-orange" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
          </svg>
        </div>
        <span class="text-docufill-orange font-medium">Drop files here</span>
      </div>
    {:else}
      <div class="flex flex-col items-center gap-3">
        <div class="w-16 h-16 rounded-full bg-bg-elevated flex items-center justify-center">
          <svg class="w-7 h-7 text-text-secondary" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 13.5l3-3m0 0l3 3m-3-3v9M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div class="text-center">
          <p class="text-text-primary font-medium mb-1">Drag & drop your document</p>
          <p class="text-text-tertiary text-sm">or click to browse files</p>
        </div>
        <div class="flex flex-wrap gap-1.5 mt-1">
          <span class="px-2 py-0.5 bg-bg-elevated rounded text-[10px] text-text-tertiary font-mono">JPG</span>
          <span class="px-2 py-0.5 bg-bg-elevated rounded text-[10px] text-text-tertiary font-mono">PNG</span>
          <span class="px-2 py-0.5 bg-bg-elevated rounded text-[10px] text-text-tertiary font-mono">WEBP</span>
          <span class="px-2 py-0.5 bg-bg-elevated rounded text-[10px] text-text-tertiary font-mono">PDF</span>
        </div>
      </div>
    {/if}
  </button>

  <!-- Hidden file input -->
  <input
    bind:this={inputEl}
    type="file"
    {accept}
    class="hidden"
    on:change={handleFileInput}
  />
</div>
