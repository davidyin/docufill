-- DocuFill D1 Database Schema
-- Execute each statement separately via D1 API

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK(status IN ('uploaded', 'processing', 'extracted', 'error')),
  document_type TEXT CHECK(document_type IN ('receipt', 'invoice', 't4', 't5', 't3', 'rrsp', 'generic', NULL)),
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT '2024-01-01T00:00:00.000Z',
  updated_at TEXT NOT NULL DEFAULT '2024-01-01T00:00:00.000Z'
);

CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

CREATE TABLE IF NOT EXISTS extracted_fields (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_value TEXT,
  confidence REAL CHECK(confidence >= 0 AND confidence <= 1),
  created_at TEXT NOT NULL DEFAULT '2024-01-01T00:00:00.000Z',
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_extracted_fields_doc ON extracted_fields(document_id);

CREATE TABLE IF NOT EXISTS extraction_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  model_used TEXT NOT NULL,
  processing_time_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT '2024-01-01T00:00:00.000Z',
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS form_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'generic' CHECK(category IN ('tax', 'immigration', 'receipt', 'invoice', 'generic')),
  fields_schema TEXT NOT NULL,
  template_html TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT '2024-01-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO form_templates (id, name, description, category, fields_schema) VALUES
('tmpl_receipt', 'Receipt / Invoice', 'Standard receipt or invoice extraction', 'receipt',
  '[{"name":"vendor","label":"Vendor Name","type":"text","required":true},{"name":"date","label":"Date","type":"date","required":true},{"name":"total","label":"Total Amount","type":"number","required":true},{"name":"tax","label":"Tax","type":"number","required":false},{"name":"currency","label":"Currency","type":"text","required":false,"default":"CAD"},{"name":"payment_method","label":"Payment Method","type":"text","required":false},{"name":"items","label":"Line Items","type":"array","required":false}]'),

('tmpl_t4', 'T4 Statement of Remuneration', 'Canadian T4 tax slip', 'tax',
  '[{"name":"employer","label":"Employer Name","type":"text","required":true},{"name":"year","label":"Tax Year","type":"number","required":true},{"name":"box_14","label":"Box 14 - Employment Income","type":"number","required":true},{"name":"box_16","label":"Box 16 - Employee CPP","type":"number","required":false},{"name":"box_18","label":"Box 18 - Employee EI","type":"number","required":false},{"name":"box_22","label":"Box 22 - Income Tax Deducted","type":"number","required":false},{"name":"box_44","label":"Box 44 - Union Dues","type":"number","required":false}]'),

('tmpl_t5', 'T5 Statement of Investment Income', 'Canadian T5 investment slip', 'tax',
  '[{"name":"issuer","label":"Issuer Name","type":"text","required":true},{"name":"year","label":"Tax Year","type":"number","required":true},{"name":"box_13","label":"Box 13 - Dividends","type":"number","required":false},{"name":"box_14","label":"Box 14 - Capital Gains","type":"number","required":false},{"name":"box_15","label":"Box 15 - Return of Capital","type":"number","required":false},{"name":"box_25","label":"Box 25 - Foreign Income","type":"number","required":false}]'),

('tmpl_generic', 'Generic Document', 'Catch-all document extraction', 'generic',
  '[{"name":"title","label":"Document Title","type":"text","required":false},{"name":"date","label":"Date","type":"date","required":false},{"name":"amount","label":"Amount","type":"number","required":false},{"name":"notes","label":"Notes","type":"textarea","required":false}]');
