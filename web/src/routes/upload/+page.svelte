<script lang="ts">
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { fade, fly } from 'svelte/transition';
  import { docufillApi } from '$lib/api/client';
  import { upload } from '$lib/stores';
  import Dropzone from '$components/upload/Dropzone.svelte';
  import CameraCapture from '$components/upload/CameraCapture.svelte';
  import FilePreview from '$components/upload/FilePreview.svelte';
  import Button from '$components/ui/Button.svelte';
  import Card from '$components/ui/Card.svelte';
  import Badge from '$components/ui/Badge.svelte';
  import Spinner from '$components/ui/Spinner.svelte';

  let selectedFile: File | null = null;
  let capturedImage: Blob | null = null;
  let capturedPreview: string | null = null;
  let showCamera = false;
  let isUploading = false;
  let extractionDocId: string | null = null;
  let uploadError: string | null = null;

  // Document type selection
  const docTypes = [
    { id: 'receipt', label: 'Receipt', icon: '🧾' },
    { id: 'invoice', label: 'Invoice', icon: '📄' },
    { id: 't4', label: 'T4', icon: '🏦' },
    { id: 't5', label: 'T5', icon: '📊' },
    { id: 'generic', label: 'Other', icon: '📁' },
  ];
  let selectedDocType: string | undefined = undefined;

  function handleFiles(event: CustomEvent<{ files: File[] }>) {
    const file = event.detail.files[0];
    if (!file) return;

    selectedFile = file;
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview);
      capturedPreview = null;
      capturedImage = null;
    }
    uploadError = null;
  }

  function handleCapture(event: CustomEvent<{ blob: Blob }>) {
    const blob = event.detail.blob;
    capturedImage = blob;
    capturedPreview = URL.createObjectURL(blob);
    // Create a File from the blob for upload
    selectedFile = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
    showCamera = false;
    uploadError = null;
  }

  function handleCameraCancel() {
    showCamera = false;
  }

  function removeFile() {
    selectedFile = null;
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview);
      capturedPreview = null;
      capturedImage = null;
    }
    uploadError = null;
  }

  async function startProcessing() {
    if (!selectedFile || isUploading) return;

    isUploading = true;
    uploadError = null;

    try {
      // Step 1: Upload
      upload.setPhase('uploading');
      upload.setProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        upload.update(s => ({
          ...s,
          progress: Math.min(s.progress + Math.random() * 15, 90)
        }));
      }, 200);

      const response = await docufillApi.uploadDocument(selectedFile);
      extractionDocId = response.id;

      clearInterval(progressInterval);
      upload.setProgress(95);

      // Step 2: Extract
      upload.setPhase('processing');
      upload.setProgress(0);

      const extractInterval = setInterval(() => {
        upload.update(s => ({
          ...s,
          progress: Math.min(s.progress + Math.random() * 20, 95)
        }));
      }, 150);

      await docufillApi.extractDocument(response.id, selectedDocType);

      clearInterval(extractInterval);
      upload.setProgress(100);
      upload.setPhase('done');

      // Navigate to review page
      setTimeout(() => {
        goto(`/document/${response.id}`);
      }, 500);
    } catch (err: any) {
      uploadError = err.message || 'Upload failed. Please try again.';
      upload.setPhase('error');
      upload.setError(uploadError);
    }

    isUploading = false;
  }

  onDestroy(() => {
    if (capturedPreview) URL.revokeObjectURL(capturedPreview);
  });
</script>

<div class="h-full overflow-y-auto scroll-container">
  <div class="max-w-2xl mx-auto p-4 lg:p-6">
    {#if showCamera}
      <!-- Camera View -->
      <div class="space-y-4" transition:fade>
        <CameraCapture on:capture={handleCapture} on:cancel={handleCameraCancel} />
        <p class="text-xs text-text-tertiary text-center">
          Position the document within the frame
        </p>
      </div>
    {:else if isUploading}
      <!-- Processing State -->
      <div class="flex flex-col items-center justify-center py-20 gap-6" transition:fade>
        <div class="relative">
          <div class="w-24 h-24 rounded-full bg-gradient-to-br from-docufill-orange/20 to-docufill-yellow/20 flex items-center justify-center">
            {#if $upload.phase === 'uploading'}
              <Spinner size="lg" />
            {:else}
              <div class="w-16 h-16 rounded-full border-2 border-docufill-orange flex items-center justify-center animate-pulse">
                <svg class="w-8 h-8 text-docufill-orange" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"/>
                </svg>
              </div>
            {/if}
          </div>
          <!-- Progress ring -->
          <svg class="absolute inset-0 w-24 h-24 -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="46" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="2"/>
            <circle
              cx="48" cy="48" r="46"
              fill="none"
              stroke="url(#gradient)"
              stroke-width="2"
              stroke-linecap="round"
              stroke-dasharray={289}
              stroke-dashoffset={289 - (289 * $upload.progress / 100)}
              class="transition-all duration-300"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#FF6A1A"/>
                <stop offset="100%" stop-color="#FFB000"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div class="text-center">
          <p class="font-semibold text-text-primary mb-1">
            {$upload.phase === 'uploading' ? 'Uploading document...' : 'AI is extracting fields...'}
          </p>
          <p class="text-text-tertiary text-sm">
            {$upload.phase === 'uploading' ? 'Sending your document to our AI' : 'This usually takes a few seconds'}
          </p>
        </div>

        <div class="w-full max-w-xs">
          <div class="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-docufill-orange to-docufill-yellow rounded-full transition-all duration-300"
              style="width: {$upload.progress}%"
            ></div>
          </div>
          <p class="text-xs text-text-tertiary text-center mt-2 num">{Math.round($upload.progress)}%</p>
        </div>
      </div>
    {:else}
      <!-- Upload Flow -->
      <div class="space-y-6" transition:fade>
        <!-- File Selection -->
        {#if selectedFile}
          <div transition:fly={{ y: -10, duration: 200 }}>
            <FilePreview file={selectedFile} on:remove={removeFile} />
          </div>
        {:else}
          <div class="space-y-4">
            <!-- Dropzone -->
            <Dropzone on:files={handleFiles} />

            <!-- Or divider -->
            <div class="flex items-center gap-4">
              <div class="flex-1 h-px bg-white/[0.06]"></div>
              <span class="text-xs text-text-tertiary">or</span>
              <div class="flex-1 h-px bg-white/[0.06]"></div>
            </div>

            <!-- Camera button -->
            <Button variant="secondary" fullWidth on:click={() => showCamera = true}>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>
              </svg>
              Scan with Camera
            </Button>
          </div>
        {/if}

        <!-- Document Type Selection (optional) -->
        {#if selectedFile}
          <Card variant="default" padding="md">
            <h3 class="text-sm font-medium text-text-primary mb-3">Document type (optional)</h3>
            <div class="flex flex-wrap gap-2">
              {#each docTypes as type}
                <button
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all touchable {selectedDocType === type.id ? 'bg-docufill-orange/10' : ''} {selectedDocType === type.id ? 'border-docufill-orange/30' : ''} {selectedDocType !== type.id ? 'border-white/[0.08]' : ''}"
                  class:text-docufill-orange={selectedDocType === type.id}
                  class:bg-transparent={selectedDocType !== type.id}
                  class:text-text-secondary={selectedDocType !== type.id}
                  on:click={() => selectedDocType = selectedDocType === type.id ? undefined : type.id}
                >
                  <span>{type.icon}</span>
                  {type.label}
                </button>
              {/each}
            </div>
            <p class="text-[10px] text-text-tertiary mt-2">Leave empty for auto-detection</p>
          </Card>

          <!-- Error -->
          {#if uploadError}
            <Card variant="default" padding="md" >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-docufill-red/10 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-docufill-red" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-sm text-docufill-red font-medium">{uploadError}</p>
                </div>
              </div>
            </Card>
          {/if}

          <!-- Process Button -->
          <Button variant="primary" fullWidth size="lg" on:click={startProcessing}>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
            </svg>
            Extract Fields with AI
          </Button>
        {/if}
      </div>
    {/if}
  </div>
</div>
