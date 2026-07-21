// DocuFill Web — API Client
// Switch between Mock and Worker API via environment variable
// Set VITE_API_URL to Worker URL to use real API; leave empty for mock

import type {
  ApiResponse,
  Document,
  DocumentDetail,
  ExtractionResult,
  FormTemplate,
  UploadResponse,
} from '$lib/types';
import { mockDocuments, mockExtractionResult, mockTemplates } from '$lib/mock/data';

export const PUBLIC_API_URL = import.meta.env.VITE_API_URL || '';

// Base fetch wrapper
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // If no API URL configured, use mock
  if (!PUBLIC_API_URL) {
    return mockFetch<T>(path, options);
  }

  const headers: Record<string, string> = {
    'X-Dev-User': getDevUserId(),
    ...(options.headers as Record<string, string> || {})
  };
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

// Mock fetch handler
let mockDelay = 200;
async function mockFetch<T>(path: string, options?: RequestInit): Promise<T> {
  await new Promise(r => setTimeout(r, mockDelay));
  const method = options?.method || 'GET';
  return mockHandler<T>(path, method, options?.body ? JSON.parse(options.body as string) : undefined);
}

function mockHandler<T>(path: string, method: string = 'GET', body?: unknown): T {
  // --- Upload ---
  if (method === 'POST' && path === '/documents/upload') {
    const newId = 'doc_' + Date.now().toString(36);
    return {
      id: newId,
      filename: 'document.pdf',
      status: 'uploaded',
      message: 'Document uploaded successfully.',
    } as T;
  }

  // --- Extract ---
  if (method === 'POST' && path.match(/^\\/documents\\/[^\\/]+\\/extract$/)) {
    return mockExtractionResult as T;
  }

  // --- List Documents ---
  if (method === 'GET' && path === '/documents') {
    return mockDocuments as T;
  }

  // --- Get Document ---
  if (method === 'GET' && path.match(/^\\/documents\\/[^\\/]+$/)) {
    const id = path.split('/')[2];
    const doc = mockDocuments.find(d => d.id === id);
    if (doc) {
      return {
        ...doc,
        status: 'extracted',
        document_type: 'receipt',
        extracted_fields: [
          { id: 'f1', document_id: id, field_name: 'vendor', field_value: 'Shoppers Drug Mart', confidence: 0.97, created_at: new Date().toISOString() },
          { id: 'f2', document_id: id, field_name: 'date', field_value: '2024-03-15', confidence: 0.92, created_at: new Date().toISOString() },
          { id: 'f3', document_id: id, field_name: 'total', field_value: '47.83', confidence: 0.99, created_at: new Date().toISOString() },
          { id: 'f4', document_id: id, field_name: 'tax', field_value: '6.22', confidence: 0.88, created_at: new Date().toISOString() },
          { id: 'f5', document_id: id, field_name: 'payment_method', field_value: 'Visa ****4242', confidence: 0.95, created_at: new Date().toISOString() },
          { id: 'f6', document_id: id, field_name: 'currency', field_value: 'CAD', confidence: 0.99, created_at: new Date().toISOString() },
        ],
      } as T;
    }
  }

  // --- Form Templates ---
  if (method === 'GET' && path === '/forms/templates') {
    return mockTemplates as T;
  }
  if (method === 'GET' && path.match(/^\\/forms\\/templates\\/[^\\/]+$/)) {
    const id = path.split('/')[2];
    return mockTemplates.find(t => t.id === id) as T;
  }

  // --- Health ---
  if (method === 'GET' && path === '/health') {
    return { status: 'ok', service: 'docufill-api', version: '0.1.0' } as T;
  }

  return { success: true } as T;
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
    return api.postForm<UploadResponse>('/documents/upload', formData);
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
