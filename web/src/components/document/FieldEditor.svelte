<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  import { confidenceColor, confidenceBgColor, confidenceLevel } from '$lib/utils';

  export let name: string;
  export let label: string;
  export let value: string;
  export let confidence: number | null = null;
  export let isEdited = false;
  export let disabled = false;

  const dispatch = createEventDispatcher<{
    change: { name: string; value: string };
    reset: { name: string };
  }>();

  let editing = false;
  let editValue = value;

  $: level = confidenceLevel(confidence);
  $: colorClass = confidenceColor(confidence);
  $: barColor = confidenceBgColor(confidence);
  $: displayConfidence = confidence !== null ? Math.round(confidence * 100) : null;

  function startEdit() {
    if (disabled) return;
    editValue = value;
    editing = true;
  }

  function save() {
    editing = false;
    if (editValue !== value) {
      dispatch('change', { name, value: editValue });
    }
  }

  function cancel() {
    editing = false;
    editValue = value;
  }

  function handleReset() {
    dispatch('reset', { name });
  }
</script>

<div class="group p-4 rounded-xl border transition-all duration-200 hover:border-white/[0.12] {isEdited ? 'bg-docufill-orange/5 border-docufill-orange/20' : 'bg-bg-elevated border-white/[0.06]'}">
  <div class="flex items-start justify-between gap-3 mb-2">
    <!-- Label -->
    <div class="flex items-center gap-2">
      <label class="text-xs font-medium text-text-tertiary uppercase tracking-wider">{label}</label>
      {#if isEdited}
        <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-docufill-orange/15 text-docufill-orange uppercase">edited</span>
      {/if}
    </div>

    <!-- Confidence -->
    {#if confidence !== null}
      <div class="flex items-center gap-1.5">
        <span class="num text-[10px] {colorClass}">{displayConfidence}%</span>
        <div class="w-12 h-1 bg-bg-slate rounded-full overflow-hidden">
          <div class="confidence-bar {barColor}" style="width: {displayConfidence}%"></div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Value -->
  {#if editing}
    <div transition:fade={{ duration: 150 }} class="flex items-center gap-2">
      <input
        type="text"
        bind:value={editValue}
        class="flex-1 bg-bg-card border border-docufill-orange/30 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-docufill-orange/50"
        on:keydown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
        autofocus
      />
      <button class="text-xs text-text-tertiary hover:text-text-primary touchable px-2" on:click={cancel}>✕</button>
      <button class="text-xs text-docufill-orange font-medium touchable px-2" on:click={save}>Save</button>
    </div>
  {:else}
    <div class="flex items-center gap-2">
      <span
        class="flex-1 text-sm cursor-pointer {value ? 'text-text-primary' : 'text-text-tertiary italic'}"
        class:hover:text-docufill-orange={!disabled}
        on:click={startEdit}
        role="button"
        tabindex="0"
      >
        {value || 'No value extracted'}
      </span>
      {#if isEdited}
        <button
          class="text-[10px] text-docufill-orange/70 hover:text-docufill-orange touchable"
          on:click={handleReset}
        >
          Reset
        </button>
      {/if}
    </div>
  {/if}
</div>
