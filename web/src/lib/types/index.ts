// DocuFill Web — TypeScript Types
// Mirror of Worker backend types (user-facing)

// MARK: - Document

export interface Document {
  id: string;
  user_id: string;
  filename: string;
  r2_key: string;
  mime_type: string;
  file_size: number;
  status: 'uploaded' | 'processing' | 'extracted' | 'error';
  document_type: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// MARK: - Extracted Field

export interface ExtractedField {
  id: string;
  document_id: string;
  field_name: string;
  field_value: string | null;
  confidence: number | null;
  created_at: string;
}

// MARK: - Extraction Result

export interface ExtractionResult {
  document_id: string;
  document_type: string;
  processing_time_ms: number;
  total_time_ms: number;
  fields: Array<{
    name: string;
    value: string | null;
    confidence: number | null;
  }>;
  raw: Record<string, unknown>;
}

// MARK: - Document Detail (with fields)

export interface DocumentDetail extends Document {
  extracted_fields: ExtractedField[];
}

// MARK: - Form Template

export interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  fields_schema: string;
  template_html: string | null;
  is_active: number;
  created_at: string;
}

// MARK: - Upload Response

export interface UploadResponse {
  id: string;
  filename: string;
  status: string;
  message: string;
}

// MARK: - API Response

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// MARK: - Upload State

export type UploadPhase = 'idle' | 'selecting' | 'uploading' | 'processing' | 'done' | 'error';

export interface UploadState {
  phase: UploadPhase;
  progress: number;
  documentId: string | null;
  error: string | null;
}

// MARK: - Field Edit

export interface EditableField {
  name: string;
  label: string;
  value: string;
  confidence: number | null;
  originalValue: string;
  isEdited: boolean;
}
