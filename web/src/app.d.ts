// SvelteKit type declarations
/// <reference types="@sveltejs/kit" />

declare namespace App {
  interface Locals {
    user?: {
      uid: string;
      role: string;
    };
  }
  interface PageData {
    showTabBar?: boolean;
  }
  interface Platform {}
}

declare module '$components/ui/Button.svelte';
declare module '$components/ui/Card.svelte';
declare module '$components/ui/Badge.svelte';
declare module '$components/ui/Input.svelte';
declare module '$components/ui/Spinner.svelte';
declare module '$components/upload/Dropzone.svelte';
declare module '$components/upload/CameraCapture.svelte';
declare module '$components/upload/FilePreview.svelte';
declare module '$components/document/FieldEditor.svelte';
declare module '$components/document/ConfidenceBadge.svelte';
declare module '$components/document/ExtractionResult.svelte';
