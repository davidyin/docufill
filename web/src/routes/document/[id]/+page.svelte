<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { get } from 'svelte/store';
  import { fade, fly, slide } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { docufillApi } from '$lib/api/client';
  import { editableFields, isProcessing } from '$lib/stores';
  import { timeAgo, formatFileSize, confidenceColor, downloadText } from '$lib/utils';
  import type { DocumentDetail, ExtractionResult, EditableField } from '$lib/types';
  import Card from '$components/ui/Card.svelte';
  import Badge from '$components/ui/Badge.svelte';
  import Button from '$components/ui/Button.svelte';
  import Spinner from '$components/ui/Spinner.svelte';
  import ConfidenceBadge from '$components/document/ConfidenceBadge.svelte';

  let docId: string;
  let doc: DocumentDetail | null = null;
  let loading = true;
  let error: string | null = null;
  let editMode = false;
  let exportSuccess = false;

  $: docId = $page.params.id;

  onMount(async () => {
    if (!docId) return;
    try {
      doc = await docufillApi.getDocument(docId);

      // Initialize editable fields
      if (doc.extracted_fields) {
        const fields: EditableField[] = doc.extracted_fields.map(f => ({
          name: f.field_name,
          label: formatFieldName(f.field_name),
          value: f.field_value || '',
          confidence: f.confidence,
          originalValue: f.field_value || '',
          isEdited: false,
        }));
        editableFields.set(fields);
      }
    } catch (err: any) {
      error = err.message || 'Failed to load document';
    }
    loading = false;
  });

  function formatFieldName(name: string): string {
    return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function handleFieldChange(name: string, value: string) {
    editableFields.updateField(name, value);
  }

  function handleFieldReset(name: string) {
    editableFields.resetField(name);
  }

  function onInput(fieldName: string) {
    return function(e: Event) {
      handleFieldChange(fieldName, (e.target as HTMLInputElement).value);
    };
  }

  function toggleEditMode() {
    editMode = !editMode;
  }

  function getFieldEditCount(): number {
    return get(editableFields).filter(f => f.isEdited).length;
  }

  function exportAsText() {
    if (!doc) return;
    let content = `DocuFill Export\n`;
    content += `${'='.repeat(40)}\n`;
    content += `Document: ${doc.filename}\n`;
    content += `Type: ${doc.document_type || 'unknown'}\n`;
    content += `Date: ${new Date().toLocaleDateString()}\n`;
    content += `${'='.repeat(40)}\n\n`;

    const fields = get(editableFields);
    fields.forEach(f => {
      const conf = f.confidence ? ` (${Math.round(f.confidence * 100)}%)` : '';
      const edited = f.isEdited ? ' [edited]' : '';
      if (f.name === 'line_items' || f.name === 'line_item') {
        content += `${f.label}:${conf}${edited}\n`;
        try {
          const items = JSON.parse(f.value);
          if (Array.isArray(items)) {
            items.forEach((item: any, i: number) => {
              content += `  ${i + 1}. ${item.description || ''} x${item.quantity || 1} @ ${item.unit_price || 0} = ${item.total || 0}\n`;
            });
          }
        } catch {
          content += `  ${f.value}\n`;
        }
      } else {
        content += `${f.label}: ${f.value || '—'}${conf}${edited}\n`;
      }
    });

    downloadText(`docufill_${docId}_${Date.now()}.txt`, content);
    exportSuccess = true;
    setTimeout(() => exportSuccess = false, 2000);
  }

  function getTypeEmoji(docType: string | null): string {
    if (docType === 'receipt') return '🧾';
    if (docType === 'invoice') return '📄';
    if (docType === 't4') return '🏦';
    if (docType === 't5') return '📊';
    return '📁';
  }

  function isLineItems(fieldName: string): boolean {
    return fieldName === 'line_items' || fieldName === 'line_item';
  }

  function parseLineItems(value: string): Array<{ description: string; quantity: number; unit_price: number; total: number }> {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* not valid JSON */ }
    return [];
  }

  function formatPrice(value: number | string): string {
    if (value === null || value === undefined || value === '') return '—';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '—';
    return num.toFixed(2);
  }

  function getAverageConfidence(): number {
    if (!doc?.extracted_fields?.length) return 0;
    const fields = doc.extracted_fields.filter(f => f.confidence !== null);
    if (!fields.length) return 0;
    const sum = fields.reduce((acc, f) => acc + (f.confidence || 0), 0);
    return sum / fields.length;
  }
</script>

<div class="h-full overflow-y-auto scroll-container">
  <div class="max-w-3xl mx-auto p-4 lg:p-6">
    {#if loading}
      <!-- Loading -->
      <div class="flex flex-col items-center justify-center py-20 gap-4">
        <Spinner size="lg" />
        <span class="text-text-tertiary text-sm">Loading document...</span>
      </div>
    {:else if error}
      <!-- Error -->
      <div class="flex flex-col items-center justify-center py-20 gap-4" transition:fade>
        <div class="w-16 h-16 rounded-full bg-docufill-red/10 flex items-center justify-center">
          <svg class="w-8 h-8 text-docufill-red" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
          </svg>
        </div>
        <p class="text-text-secondary">{error}</p>
        <a href="/" class="text-docufill-orange text-sm font-medium">← Back to dashboard</a>
      </div>
    {:else if doc}
      <!-- Document Header -->
      <div class="mb-6 animate-fade-in">
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 rounded-xl bg-bg-elevated flex items-center justify-center text-2xl flex-shrink-0">
            {getTypeEmoji(doc.document_type)}
          </div>
          <div class="flex-1 min-w-0">
            <h1 class="text-xl font-display font-bold text-text-primary truncate">{doc.filename}</h1>
            <div class="flex items-center gap-2 mt-1 flex-wrap">
              {#if doc.document_type}
                <Badge variant="default">{doc.document_type}</Badge>
              {/if}
              {#if doc.status === 'extracted'}
                <Badge variant="success" dot>extracted</Badge>
              {:else if doc.status === 'processing'}
                <Badge variant="processing" dot>processing</Badge>
              {:else if doc.status === 'error'}
                <Badge variant="error" dot>error</Badge>
              {/if}
              <span class="text-xs text-text-tertiary">{formatFileSize(doc.file_size)}</span>
              <span class="text-xs text-text-tertiary">·</span>
              <span class="text-xs text-text-tertiary">{timeAgo(doc.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Summary -->
      {#if doc.status === 'extracted' && doc.extracted_fields?.length}
        <div class="grid grid-cols-3 gap-3 mb-6" transition:fly={{ y: 10, duration: 200 }}>
          <Card variant="default" padding="md" class="text-center">
            <p class="text-2xl font-display font-bold text-text-primary num">{doc.extracted_fields.length}</p>
            <p class="text-[10px] text-text-tertiary uppercase tracking-wider mt-1">Fields</p>
          </Card>
          <Card variant="default" padding="md" class="text-center">
            <p class="text-2xl font-display font-bold num {confidenceColor(getAverageConfidence())}">{Math.round(getAverageConfidence() * 100)}%</p>
            <p class="text-[10px] text-text-tertiary uppercase tracking-wider mt-1">Avg Confidence</p>
          </Card>
          <Card variant="default" padding="md" class="text-center">
            <p class="text-2xl font-display font-bold text-docufill-orange num">{getFieldEditCount()}</p>
            <p class="text-[10px] text-text-tertiary uppercase tracking-wider mt-1">Edited</p>
          </Card>
        </div>
      {/if}

      <!-- Extracted Fields -->
      {#if doc.status === 'extracted' && $editableFields.length > 0}
        <div class="mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-display font-semibold">Extracted Fields</h2>
            <button
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border touchable transition-all {editMode ? 'bg-docufill-orange/10 text-docufill-orange border-docufill-orange/30' : 'text-text-secondary border-white/[0.08]'}"
              on:click={toggleEditMode}
            >
              {#if editMode}
                ✓ Done
              {:else}
                ✏️ Edit
              {/if}
            </button>
          </div>

          <div class="space-y-2">
            {#each $editableFields as field (field.name)}
              <div transition:fly={{ y: 10, duration: 200 }}>
                <div class="group p-4 rounded-xl border transition-all duration-200 {field.isEdited ? 'bg-docufill-orange/5 border-docufill-orange/20' : 'bg-bg-elevated border-white/10'}">
                  <div class="flex items-start justify-between gap-3 mb-2">
                    <div class="flex items-center gap-2">
                      <label class="text-xs font-medium text-text-tertiary uppercase tracking-wider">{field.label}</label>
                      {#if field.isEdited}
                        <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-docufill-orange/15 text-docufill-orange uppercase">edited</span>
                      {/if}
                    </div>
                    {#if field.confidence !== null}
                      <ConfidenceBadge confidence={field.confidence} size="sm" />
                    {/if}
                  </div>

                  {#if isLineItems(field.name)}
                    <!-- Line Items Table -->
                    <div class="overflow-x-auto">
                      <table class="w-full text-xs">
                        <thead>
                          <tr class="text-text-tertiary uppercase tracking-wider">
                            <th class="text-left py-1 pr-2">#</th>
                            <th class="text-left py-1 pr-2">Description</th>
                            <th class="text-right py-1 pr-2">Qty</th>
                            <th class="text-right py-1 pr-2">Price</th>
                            <th class="text-right py-1">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {#each parseLineItems(field.value) as item, i}
                            <tr class="border-t border-white/5">
                              <td class="py-1 pr-2 text-text-tertiary">{i + 1}</td>
                              <td class="py-1 pr-2 text-text-primary">{item.description}</td>
                              <td class="py-1 pr-2 text-text-secondary text-right">{item.quantity}</td>
                              <td class="py-1 pr-2 text-text-secondary text-right num">{formatPrice(item.unit_price)}</td>
                              <td class="py-1 text-text-primary text-right num">{formatPrice(item.total)}</td>
                            </tr>
                          {/each}
                        </tbody>
                      </table>
                    </div>
                  {:else if editMode}
                    <div class="flex items-center gap-2">
                      <input
                        type="text"
                        value={field.value}
                        on:input={onInput(field.name)}
                        class="flex-1 bg-bg-card border border-orange-500 rounded-lg px-3 py-2 text-sm text-text-primary"
                      />
                      {#if field.isEdited}
                        <button
                          class="text-[10px] text-docufill-orange/70 hover:text-docufill-orange touchable whitespace-nowrap"
                          on:click={() => handleFieldReset(field.name)}
                        >
                          Reset
                        </button>
                      {/if}
                    </div>
                  {:else}
                    <p class="text-sm {field.value ? 'text-text-primary' : 'text-text-tertiary italic'}">
                      {field.value || 'No value extracted'}
                    </p>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Export Actions -->
        <div class="space-y-3 mb-8">
          <h2 class="text-lg font-display font-semibold mb-3">Export</h2>
          <div class="flex flex-wrap gap-3">
            <Button variant="secondary" on:click={exportAsText}>
              {#if exportSuccess}
                ✓ Exported!
              {:else}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Export as Text
              {/if}
            </Button>
            <Button variant="ghost" href="/upload">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              Upload Another
            </Button>
          </div>
        </div>
      {:else if doc.status === 'processing'}
        <Card variant="default" padding="lg">
          <div class="flex flex-col items-center py-8 text-center">
            <Spinner size="lg" />
            <h3 class="font-semibold text-text-primary mt-4 mb-1">Processing document...</h3>
            <p class="text-text-tertiary text-sm">AI is extracting fields from your document</p>
          </div>
        </Card>
      {:else if doc.status === 'error'}
        <Card variant="default" padding="lg">
          <div class="flex flex-col items-center py-8 text-center">
            <div class="w-14 h-14 rounded-full bg-docufill-red/10 flex items-center justify-center mb-3">
              <svg class="w-7 h-7 text-docufill-red" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
            </div>
            <h3 class="font-semibold text-text-primary mb-1">Extraction failed</h3>
            <p class="text-text-tertiary text-sm">{doc.error_message || 'An error occurred during processing'}</p>
            <a href="/upload" class="text-docufill-orange text-sm font-medium mt-4">Try again →</a>
          </div>
        </Card>
      {:else if doc.status === 'uploaded'}
        <Card variant="default" padding="lg">
          <div class="flex flex-col items-center py-8 text-center">
            <div class="w-14 h-14 rounded-full bg-docufill-orange/10 flex items-center justify-center mb-3">
              <svg class="w-7 h-7 text-docufill-orange" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <h3 class="font-semibold text-text-primary mb-1">Document uploaded</h3>
            <p class="text-text-tertiary text-sm mb-4">Ready for extraction</p>
            <a href="/upload" class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-docufill-orange to-docufill-yellow text-black font-semibold text-sm rounded-xl touchable">
              Process Now
            </a>
          </div>
        </Card>
      {/if}

      <!-- Back link -->
      <div class="mb-8">
        <a href="/" class="inline-flex items-center gap-2 text-text-tertiary text-sm hover:text-text-primary transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
          </svg>
          Back to Documents
        </a>
      </div>
    {/if}
  </div>
</div>
