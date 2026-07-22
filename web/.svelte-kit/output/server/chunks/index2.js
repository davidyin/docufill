import { w as writable } from "./index.js";
const initialUploadState = {
  phase: "idle",
  progress: 0,
  documentId: null,
  error: null
};
function createUploadStore() {
  const { subscribe, set, update } = writable(initialUploadState);
  return {
    subscribe,
    set,
    update,
    reset() {
      set(initialUploadState);
    },
    setPhase(phase) {
      update((s) => ({ ...s, phase }));
    },
    setProgress(progress) {
      update((s) => ({ ...s, progress }));
    },
    setDocumentId(id) {
      update((s) => ({ ...s, documentId: id }));
    },
    setError(error) {
      update((s) => ({ ...s, error, phase: "error" }));
    }
  };
}
const upload = createUploadStore();
function createDocumentsStore() {
  const { subscribe, set, update } = writable([]);
  return {
    subscribe,
    set,
    update,
    add(doc) {
      update((docs) => [doc, ...docs]);
    },
    remove(id) {
      update((docs) => docs.filter((d) => d.id !== id));
    },
    updateOne(id, changes) {
      update((docs) => docs.map((d) => d.id === id ? { ...d, ...changes } : d));
    }
  };
}
createDocumentsStore();
function createFieldsStore() {
  const { subscribe, set, update } = writable([]);
  return {
    subscribe,
    set,
    update,
    updateField(name, value) {
      update(
        (fields) => fields.map(
          (f) => f.name === name ? { ...f, value, isEdited: value !== f.originalValue } : f
        )
      );
    },
    resetField(name) {
      update(
        (fields) => fields.map(
          (f) => f.name === name ? { ...f, value: f.originalValue, isEdited: false } : f
        )
      );
    },
    hasEdits() {
      let result = false;
      subscribe((fields) => {
        result = fields.some((f) => f.isEdited);
      })();
      return result;
    }
  };
}
const editableFields = createFieldsStore();
export {
  editableFields as e,
  upload as u
};
