<script lang="ts">
  import { fade, fly, slide } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import type { ExtractionResult } from '$lib/types';
  import { confidenceColor, confidenceBgColor, formatFileSize } from '$lib/utils';
  import FieldEditor from '$components/document/FieldEditor.svelte';
  import ConfidenceBadge from '$components/document/ConfidenceBadge.svelte';
  import Badge from '$components/ui/Badge.svelte';

  export let result: ExtractionResult;
  export let editable = true;
  export let disabled = false;

  export let onFieldChange: ((name: string, value: string) => void) | undefined = undefined;
  export let onFieldReset: ((name: string) => void) | undefined = undefined;

  let editedFields: Record<string, string> = {};

  function handleFieldChange(name: string, value: string) {
    editedFields[name] = value;
    onFieldChange?.(name, value);
  }

  function handleFieldReset(name: string) {
    delete editedFields[name];
    onFieldReset?.(name);
  }

  function formatFieldName(name: string): string {
    return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
</script>

<div class="space-y-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <Badge variant="success" dot>
        Extraction Complete
      </Badge>
      {#if result.document_type}
        <Badge variant="default">{result.document_type}</Badge>
      {/if}
    </div>
    <div class="num text-xs text-text-tertiary">
      {result.processing_time_ms}ms
    </div>
  </div>

  <!-- Fields -->
  <div class="space-y-2">
    {#each result.fields as field (field.name)}
      <div transition:fly={{ y: 10, duration: 200 }}>
        <FieldEditor
          name={field.name}
          label={formatFieldName(field.name)}
          value={editedFields[field.name] ?? field.value ?? ''}
          confidence={field.confidence}
          isEdited={editedFields[field.name] !== undefined}
          {disabled}
          on:change={(e) => handleFieldChange(e.detail.name, e.detail.value)}
          on:reset={(e) => handleFieldReset(e.detail.name)}
        />
      </div>
    {/each}
  </div>

  {#if editable}
    <p class="text-[10px] text-text-tertiary text-center">
      Tap any field to edit its value
    </p>
  {/if}
</div>
