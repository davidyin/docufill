// DocuFill Web — API Client
// Uses JWT from Clerk (production) or X-User-ID header (dev mode)

import type {
  ApiResponse,
  Document,
  DocumentDetail,
  ExtractionResult,
  FormTemplate,
  UploadResponse,
} from '$lib/types';
import { getAuthToken, isClerkEnabled } from '$lib/clerk';

export const PUBLIC_API_URL = import.meta.env.VITE_API_URL || '';

// Base fetch wrapper
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  // ─── Auth: Clerk JWT (prod) or dev header ───
  if (isClerkEnabled) {
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } else {
    // Dev mode — use X-User-ID header
    headers['X-Dev-User'] = getDevUserId();
  }

  // Only set Content-Type for JSON bodies; FormData needs browser to set boundary
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${PUBLIC_API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const json: ApiResponse<T> = await response.json();
  if (!json.success) {
    throw new Error(json.error || 'Unknown API error');
  }

  return json.data as T;
}

// Dev user ID for anonymous dev mode
function getDevUserId(): string {
  let uid = localStorage.getItem('docufill_user_id');
  if (!uid) {
    uid = 'dev_' + Date.now().toString(36);
    localStorage.setItem('docufill_user_id', uid);
  }
  return uid;
}

// HTTP methods
export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  postForm: <T>(path: string, formData: FormData) =>
    apiFetch<T>(path, { method: 'POST', body: formData }),
  put: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) =>
    apiFetch<T>(path, { method: 'DELETE' })
};

// MARK: - API Functions

export const docufillApi = {
  // Documents
  async uploadDocument(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return api.postForm<UploadResponse>('/documents', formData);
  },
  async listDocuments(): Promise<Document[]> {
    return api.get<Document[]>('/documents');
  },
  async getDocument(id: string): Promise<DocumentDetail> {
    return api.get<DocumentDetail>(`/documents/${id}`);
  },

  // Extraction
  async extractDocument(id: string, documentType?: string): Promise<ExtractionResult> {
    return api.post<ExtractionResult>(`/documents/${id}/extract`, {
      document_type: documentType,
    });
  },

  // Form Templates
  async getFormTemplates(): Promise<FormTemplate[]> {
    return api.get<FormTemplate[]>('/forms/templates');
  },
  async getFormTemplate(id: string): Promise<FormTemplate> {
    return api.get<FormTemplate>(`/forms/templates/${id}`);
  },
};
