<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { docufillApi } from '$lib/api/client';
  import { documents } from '$lib/stores';
  import { timeAgo, formatFileSize, getFileIcon } from '$lib/utils';
  import type { Document } from '$lib/types';
  import Badge from '$components/ui/Badge.svelte';
  import Card from '$components/ui/Card.svelte';
  import Spinner from '$components/ui/Spinner.svelte';

  let loading = true;
  let exporting = false;
  let recentDocs: Document[] = [];
  let statsLoaded = false;
  let totalSpending = 0;
  let monthSpending = 0;
  let avgConfidence = 0;
  let docTypeCounts: Record<string, number> = {};

  // ─── Search & Filter State ───
  let searchQuery = '';
  let filterType: string | null = null;
  let filterDate: 'all' | 'month' | '3months' | 'year' = 'all';
  let docDetailsCache: Record<string, any> = {};

  $: filteredDocs = getFilteredDocs();

  function getFilteredDocs(): Document[] {
    let docs = recentDocs;

    // Filter by document type
    if (filterType) {
      docs = docs.filter(d => d.document_type === filterType || (!d.document_type && filterType === 'unknown'));
    }

    // Filter by date range
    if (filterDate !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (filterDate === 'month') {
        cutoff.setMonth(now.getMonth() - 1);
      } else if (filterDate === '3months') {
        cutoff.setMonth(now.getMonth() - 3);
      } else if (filterDate === 'year') {
        cutoff.setFullYear(now.getFullYear() - 1);
      }
      docs = docs.filter(d => new Date(d.created_at) >= cutoff);
    }

    // Search by vendor name or filename
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      docs = docs.filter(d => {
        if (d.filename.toLowerCase().includes(q)) return true;
        if (d.document_type?.toLowerCase().includes(q)) return true;
        // Search in extracted fields (vendor_name, total_amount)
        const details = docDetailsCache[d.id];
        if (details?.extracted_fields) {
          return details.extracted_fields.some((f: any) =>
            f.field_value?.toLowerCase().includes(q)
          );
        }
        return false;
      });
    }

    return docs;
  }

  async function loadStats() {
    const extracted = recentDocs.filter(d => d.status === 'extracted');
    if (extracted.length === 0) {
      statsLoaded = true;
      return;
    }
    const details = await Promise.all(
      extracted.map(d => docufillApi.getDocument(d.id).catch(() => null))
    );

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    let total = 0;
    let monthTotal = 0;
    let confSum = 0;
    let confCount = 0;
    const typeCounts: Record<string, number> = {};

    details.forEach(doc => {
      if (!doc) return;
      const docType = doc.document_type || 'unknown';
      typeCounts[docType] = (typeCounts[docType] || 0) + 1;

      doc.extracted_fields?.forEach(f => {
        if (f.field_name === 'total_amount' && f.field_value) {
          const amount = parseFloat(f.field_value);
          if (!isNaN(amount)) {
            total += amount;
            const docDate = new Date(doc.created_at);
            if (docDate.getMonth() === thisMonth && docDate.getFullYear() === thisYear) {
              monthTotal += amount;
            }
          }
        }
        if (f.confidence !== null) {
          confSum += f.confidence;
          confCount++;
        }
      });
    });

    totalSpending = total;
    monthSpending = monthTotal;
    avgConfidence = confCount > 0 ? confSum / confCount : 0;
    docTypeCounts = typeCounts;

    // Cache document details for search
    details.forEach(doc => {
      if (doc) docDetailsCache[doc.id] = doc;
    });

    statsLoaded = true;
  }

  async function exportAllCsv() {
    if (exporting) return;
    exporting = true;
    try {
      // Fetch details for all extracted documents
      const extracted = recentDocs.filter(d => d.status === 'extracted');
      const details = await Promise.all(
        extracted.map(d => docufillApi.getDocument(d.id))
      );

      // Collect all unique field names across documents
      const allFields = new Set<string>();
      details.forEach(doc => {
        doc.extracted_fields?.forEach(f => allFields.add(f.field_name));
      });
      const fieldNames = Array.from(allFields).sort();

      // Build CSV header
      const headers = ['Filename', 'Type', 'Date', 'File Size', ...fieldNames];
      const rows = details.map(doc => {
        const fieldMap: Record<string, string> = {};
        doc.extracted_fields?.forEach(f => {
          fieldMap[f.field_name] = f.field_value || '';
        });
        return [
          doc.filename,
          doc.document_type || '',
          doc.created_at,
          String(doc.file_size),
          ...fieldNames.map(fn => fieldMap[fn] || ''),
        ];
      });

      // Escape CSV values
      const csvRows = [headers, ...rows].map(row =>
        row.map(v => {
          const s = String(v ?? '');
          return s.includes(',') || s.includes('"') || s.includes('\n')
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        }).join(',')
      );

      const csv = csvRows.join('\n');
      const bom = '\uFEFF';
      const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `docufill_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
    exporting = false;
  }

  onMount(async () => {
    try {
      recentDocs = await docufillApi.listDocuments();
      documents.set(recentDocs);
      await loadStats();
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
    loading = false;
  });

  function getStatusVariant(status: string) {
    if (status === 'extracted') return 'success';
    if (status === 'processing') return 'processing';
    if (status === 'error') return 'error';
    return 'default';
  }

  function getTypeEmoji(docType: string | null): string {
    if (docType === 'receipt') return '🧾';
    if (docType === 'invoice') return '📄';
    if (docType === 't4') return '🏦';
    if (docType === 't5') return '📊';
    return '📁';
  }
</script>

<div class="h-full overflow-y-auto scroll-container">
  <div class="max-w-4xl mx-auto p-4 lg:p-6">
    <!-- Hero / Quick Upload -->
    <div class="mb-8 animate-fade-in">
      <div class="glass-strong p-6 lg:p-8 relative overflow-hidden">
        <!-- Decorative gradient -->
        <div class="absolute -top-20 -right-20 w-60 h-60 bg-docufill-orange/10 rounded-full blur-3xl"></div>

        <div class="relative">
          <h1 class="text-2xl lg:text-3xl font-display font-bold mb-2">
            Hi there 👋
          </h1>
          <p class="text-text-secondary text-sm lg:text-base mb-5 max-w-lg">
            Upload any document — receipt, invoice, tax slip — and let AI extract the key fields instantly.
          </p>
          <div class="flex flex-wrap gap-3">
            <a
              href="/upload"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-docufill-orange to-docufill-yellow text-black font-semibold text-sm rounded-xl touchable shadow-lg shadow-docufill-orange/20"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              Upload Document
            </a>
            <a
              href="/upload"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-bg-elevated border border-white/[0.08] text-text-primary font-medium text-sm rounded-xl touchable"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>
              </svg>
              Scan with Camera
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Analytics Stats -->
    {#if statsLoaded && recentDocs.some(d => d.status === 'extracted')}
      <div class="mb-8" transition:fly={{ y: 10, duration: 200 }}>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card variant="default" padding="md">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-docufill-orange/10 flex items-center justify-center text-lg">📄</div>
              <div>
                <p class="text-xs text-text-tertiary">Documents</p>
                <p class="text-lg font-display font-bold text-text-primary num">{recentDocs.filter(d => d.status === 'extracted').length}</p>
              </div>
            </div>
          </Card>
          <Card variant="default" padding="md">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-docufill-orange/10 flex items-center justify-center text-lg">💰</div>
              <div>
                <p class="text-xs text-text-tertiary">Total Spent</p>
                <p class="text-lg font-display font-bold text-text-primary num">${totalSpending.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          <Card variant="default" padding="md">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-docufill-yellow/10 flex items-center justify-center text-lg">📅</div>
              <div>
                <p class="text-xs text-text-tertiary">This Month</p>
                <p class="text-lg font-display font-bold text-text-primary num">${monthSpending.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          <Card variant="default" padding="md">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-confidence-high/10 flex items-center justify-center text-lg">🎯</div>
              <div>
                <p class="text-xs text-text-tertiary">Avg Confidence</p>
                <p class="text-lg font-display font-bold text-text-primary num">{Math.round(avgConfidence * 100)}%</p>
              </div>
            </div>
          </Card>
        </div>
        {#if Object.keys(docTypeCounts).length > 1}
          <div class="flex flex-wrap gap-2 mt-3">
            {#each Object.entries(docTypeCounts) as [type, count]}
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-bg-elevated border border-white/[0.08] text-text-secondary">
                {getTypeEmoji(type)} {type} <span class="text-text-tertiary">×{count}</span>
              </span>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Recent Documents -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-display font-semibold">Recent Documents</h2>
        <div class="flex items-center gap-2">
          {#if recentDocs.some(d => d.status === 'extracted')}
            <button
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-white/[0.08] text-text-secondary hover:border-docufill-orange/30 hover:text-docufill-orange transition-all touchable"
              on:click={exportAllCsv}
              disabled={exporting}
            >
              {#if exporting}
                <span class="w-3 h-3 border-2 border-docufill-orange/30 border-t-docufill-orange rounded-full animate-spin"></span>
              {:else}
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                </svg>
              {/if}
              {exporting ? 'Exporting...' : 'Export All'}
            </button>
          {/if}
          {#if recentDocs.length > 0}
            <span class="text-xs text-text-tertiary">
              {filteredDocs.length === recentDocs.length ? `${recentDocs.length} total` : `${filteredDocs.length} of ${recentDocs.length}`}
            </span>
          {/if}
        </div>
      </div>

      {#if recentDocs.length > 0}
        <!-- Search & Filter Bar -->
        <div class="space-y-3 mb-4">
          <!-- Search Input -->
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>
            <input
              type="text"
              bind:value={searchQuery}
              placeholder="Search by vendor, amount, type..."
              class="w-full pl-10 pr-4 py-2.5 bg-bg-elevated border border-white/[0.08] rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-docufill-orange/40 transition-colors"
            />
            {#if searchQuery}
              <button
                class="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary touchable"
                on:click={() => searchQuery = ''}
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            {/if}
          </div>

          <!-- Filter Row -->
          <div class="flex items-center gap-2 flex-wrap">
            <!-- Type Filters -->
            <button
              class="px-2.5 py-1 rounded-full text-xs font-medium border transition-all touchable {filterType === null ? 'bg-docufill-orange/10 border-docufill-orange/30 text-docufill-orange' : 'border-white/[0.08] text-text-secondary hover:border-white/[0.15]'}"
              on:click={() => filterType = null}
            >
              All
            </button>
            {#each Object.entries(docTypeCounts) as [type, count]}
              <button
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all touchable {filterType === type ? 'bg-docufill-orange/10 border-docufill-orange/30 text-docufill-orange' : 'border-white/[0.08] text-text-secondary hover:border-white/[0.15]'}"
                on:click={() => filterType = filterType === type ? null : type}
              >
                {getTypeEmoji(type)} {type} <span class="opacity-60">×{count}</span>
              </button>
            {/each}

            <div class="flex-1"></div>

            <!-- Date Filter -->
            <select
              bind:value={filterDate}
              class="px-2.5 py-1 rounded-lg text-xs font-medium border border-white/[0.08] bg-bg-elevated text-text-secondary focus:outline-none focus:border-docufill-orange/30 cursor-pointer"
            >
              <option value="all">All time</option>
              <option value="month">Last month</option>
              <option value="3months">Last 3 months</option>
              <option value="year">Last year</option>
            </select>
          </div>

          <!-- Results count -->
          {#if filteredDocs.length !== recentDocs.length}
            <p class="text-xs text-text-tertiary">
              Showing {filteredDocs.length} of {recentDocs.length} documents
            </p>
          {/if}
        </div>
      {/if}

      {#if loading}
        <div class="flex flex-col items-center justify-center py-16 gap-4">
          <Spinner size="lg" />
          <span class="text-text-tertiary text-sm">Loading documents...</span>
        </div>
      {:else if recentDocs.length === 0}
        <p class="text-xs text-text-tertiary mb-3">DEBUG: recentDocs={recentDocs.length}, loading={loading}</p>
        <Card variant="default" padding="lg">
          <div class="flex flex-col items-center py-8 text-center">
            <div class="w-16 h-16 rounded-full bg-bg-elevated flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
              </svg>
            </div>
            <h3 class="font-semibold text-text-primary mb-1">No documents yet</h3>
            <p class="text-text-tertiary text-sm mb-4">Upload your first document to get started</p>
            <a href="/upload" class="text-docufill-orange text-sm font-medium">Upload now →</a>
          </div>
        </Card>
      {:else}
        <p class="text-xs text-text-tertiary mb-3">DEBUG: recentDocs={recentDocs.length}, filteredDocs={filteredDocs.length}, search=&quot;{searchQuery}&quot;, type={filterType}, date={filterDate}</p>
        <div class="grid gap-3">
          {#each filteredDocs as doc (doc.id)}
            <a
              href="/document/{doc.id}"
              class="block animate-fade-in"
              in:fly={{ y: 10, duration: 200 }}
            >
              <Card variant="interactive" padding="md">
                <div class="flex items-center gap-4">
                  <!-- Icon -->
                  <div class="w-12 h-12 rounded-xl bg-bg-elevated flex items-center justify-center text-xl flex-shrink-0">
                    {getTypeEmoji(doc.document_type)}
                  </div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-sm font-medium text-text-primary truncate">{doc.filename}</span>
                      <Badge variant={getStatusVariant(doc.status)} size="sm" dot>
                        {doc.status}
                      </Badge>
                    </div>
                    <div class="flex items-center gap-3 text-xs text-text-tertiary">
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>·</span>
                      <span>{timeAgo(doc.created_at)}</span>
                      {#if doc.document_type}
                        <span>·</span>
                        <span class="capitalize">{doc.document_type}</span>
                      {/if}
                    </div>
                  </div>

                  <!-- Arrow -->
                  <svg class="w-5 h-5 text-text-tertiary flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                  </svg>
                </div>
              </Card>
            </a>
          {/each}
        </div>
      {/if}
    </div>

    <!-- How it Works -->
    <div class="mb-8">
      <h2 class="text-lg font-display font-semibold mb-4">How it works</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card padding="lg" variant="default">
          <div class="text-2xl mb-3">📤</div>
          <h3 class="font-medium text-sm text-text-primary mb-1">1. Upload</h3>
          <p class="text-xs text-text-tertiary leading-relaxed">Snap a photo or upload any document — receipt, invoice, tax slip</p>
        </Card>
        <Card padding="lg" variant="default">
          <div class="text-2xl mb-3">🤖</div>
          <h3 class="font-medium text-sm text-text-primary mb-1">2. AI Extracts</h3>
          <p class="text-xs text-text-tertiary leading-relaxed">Our AI identifies and extracts all key fields with confidence scores</p>
        </Card>
        <Card padding="lg" variant="default">
          <div class="text-2xl mb-3">✅</div>
          <h3 class="font-medium text-sm text-text-primary mb-1">3. Review & Export</h3>
          <p class="text-xs text-text-tertiary leading-relaxed">Edit any field, then export as text or use the data for forms</p>
        </Card>
      </div>
    </div>
  </div>
</div>
