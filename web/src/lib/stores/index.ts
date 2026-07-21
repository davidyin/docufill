// DocuFill Web — Svelte Stores

import { writable, derived, type Writable } from 'svelte/store';
import type { Document, UploadState, EditableField } from '$lib/types';

// MARK: - Upload Store

const initialUploadState: UploadState = {
  phase: 'idle',
  progress: 0,
  documentId: null,
  error: null,
};

function createUploadStore() {
  const { subscribe, set, update } = writable<UploadState>(initialUploadState);

  return {
    subscribe,
    set,
    update,
    reset() {
      set(initialUploadState);
    },
    setPhase(phase: UploadState['phase']) {
      update(s => ({ ...s, phase }));
    },
    setProgress(progress: number) {
      update(s => ({ ...s, progress }));
    },
    setDocumentId(id: string) {
      update(s => ({ ...s, documentId: id }));
    },
    setError(error: string | null) {
      update(s => ({ ...s, error, phase: 'error' }));
    },
  };
}

export const upload = createUploadStore();

// MARK: - Documents Store

function createDocumentsStore() {
  const { subscribe, set, update } = writable<Document[]>([]);

  return {
    subscribe,
    set,
    update,
    add(doc: Document) {
      update(docs => [doc, ...docs]);
    },
    remove(id: string) {
      update(docs => docs.filter(d => d.id !== id));
    },
    updateOne(id: string, changes: Partial<Document>) {
      update(docs => docs.map(d => d.id === id ? { ...d, ...changes } : d));
    },
  };
}

export const documents = createDocumentsStore();

// MARK: - Current Document Fields (editable)

function createFieldsStore() {
  const { subscribe, set, update } = writable<EditableField[]>([]);

  return {
    subscribe,
    set,
    update,
    updateField(name: string, value: string) {
      update(fields =>
        fields.map(f =>
          f.name === name ? { ...f, value, isEdited: value !== f.originalValue } : f
        )
      );
    },
    resetField(name: string) {
      update(fields =>
        fields.map(f =>
          f.name === name ? { ...f, value: f.originalValue, isEdited: false } : f
        )
      );
    },
    hasEdits(): boolean {
      let result = false;
      subscribe(fields => {
        result = fields.some(f => f.isEdited);
      })();
      return result;
    },
  };
}

export const editableFields = createFieldsStore();

// MARK: - Processing State

export const isProcessing = writable(false);
export const processingProgress = writable(0);

// MARK: - Sidebar (desktop)

export const sidebarOpen = writable(true);
