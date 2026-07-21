<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';

  const dispatch = createEventDispatcher<{
    capture: { blob: Blob };
    cancel: Record<string, never>;
  }>();

  let videoEl: HTMLVideoElement;
  let canvasEl: HTMLCanvasElement;
  let stream: MediaStream | null = null;
  let error: string | null = null;
  let facingMode: 'environment' | 'user' = 'environment';

  onMount(async () => {
    await startCamera();
  });

  onDestroy(() => {
    stopCamera();
  });

  async function startCamera() {
    try {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      if (videoEl) {
        videoEl.srcObject = stream;
      }
      error = null;
    } catch (err) {
      error = 'Camera access denied or unavailable';
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
  }

  function capture() {
    if (!videoEl || !canvasEl) return;
    const w = videoEl.videoWidth || 1280;
    const h = videoEl.videoHeight || 720;
    canvasEl.width = w;
    canvasEl.height = h;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoEl, 0, 0, w, h);
    canvasEl.toBlob((blob) => {
      if (blob) {
        dispatch('capture', { blob });
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  }

  function switchCamera() {
    facingMode = facingMode === 'environment' ? 'user' : 'environment';
    startCamera();
  }
</script>

<div class="relative w-full aspect-[3/4] max-h-[70vh] rounded-2xl overflow-hidden bg-black">
  {#if error}
    <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6" transition:fade>
      <div class="w-14 h-14 rounded-full bg-docufill-red/10 flex items-center justify-center">
        <svg class="w-6 h-6 text-docufill-red" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
        </svg>
      </div>
      <p class="text-text-secondary text-sm text-center">{error}</p>
      <button class="text-docufill-orange text-sm font-medium" on:click={() => dispatch('cancel', {})}>
        Go back
      </button>
    </div>
  {:else}
    <video bind:this={videoEl} autoplay playsinline muted class="w-full h-full object-cover"></video>

    <!-- Scan overlay -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute inset-8 border-2 border-white/30 rounded-xl">
        <!-- Corner markers -->
        <div class="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-2 border-l-2 border-docufill-orange rounded-tl-lg"></div>
        <div class="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-2 border-r-2 border-docufill-orange rounded-tr-lg"></div>
        <div class="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-2 border-l-2 border-docufill-orange rounded-bl-lg"></div>
        <div class="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-2 border-r-2 border-docufill-orange rounded-br-lg"></div>
        <!-- Scan line animation -->
        <div class="scan-line"></div>
      </div>
    </div>

    <!-- Controls -->
    <div class="absolute bottom-0 left-0 right-0 p-4 pb-6 flex items-center justify-center gap-6 bg-gradient-to-t from-black/60">
      <button
        class="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center touchable"
        on:click={() => dispatch('cancel', {})}
      >
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>

      <button
        class="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center touchable active:scale-90 transition-transform"
        on:click={capture}
      >
        <div class="w-12 h-12 rounded-full bg-white"></div>
      </button>

      <button
        class="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center touchable"
        on:click={switchCamera}
      >
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
        </svg>
      </button>
    </div>
  {/if}

  <canvas bind:this={canvasEl} class="hidden"></canvas>
</div>
