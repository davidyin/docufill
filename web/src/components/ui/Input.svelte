<script lang="ts">
  export let type: 'text' | 'password' | 'email' | 'number' | 'date' | 'tel' | 'url' = 'text';
  export let value = '';
  export let placeholder = '';
  export let label = '';
  export let disabled = false;
  export let error = '';
  export let autocomplete = '';

  let id = 'input_' + Math.random().toString(36).slice(2, 9);
</script>

<div class="flex flex-col gap-1.5">
  {#if label}
    <label for={id} class="text-xs font-medium text-text-tertiary uppercase tracking-wider">{label}</label>
  {/if}
  <input
    {id}
    {type}
    {placeholder}
    {disabled}
    {autocomplete}
    bind:value
    class="w-full bg-bg-elevated rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-docufill-orange/50 border transition-colors"
    class:border-white/[0.06]={!error}
    class:border-docufill-red/50={error}
    class:bg-bg-elevated={!disabled}
    class:opacity-50={disabled}
  />
  {#if error}
    <span class="text-docufill-red text-xs">{error}</span>
  {/if}
</div>
