export interface Env {
  DB: D1Database;
  DOCUMENTS: R2Bucket;
  GEMINI_API_KEY: string;
  ENVIRONMENT: string;
  MAX_FILE_SIZE_MB: string;
  GEMINI_MODEL: string;
  // Clerk Auth
  CLERK_JWT_ISSUER: string;       // e.g. "https://your-app.clerk.accounts.dev"
  CLERK_JWT_PUBLIC_KEY: string;   // Optional: PEM public key (skips JWKS fetch)
}

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

export interface ExtractedField {
  id: string;
  document_id: string;
  field_name: string;
  field_value: string | null;
  confidence: number | null;
  created_at: string;
}

export interface ExtractionResult {
  id?: number;
  document_id: string;
  raw_json: string;
  model_used: string;
  processing_time_ms: number;
}

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
