import type { Env, Document, ExtractedField } from '../types';

// ─── Documents ───

export async function insertDocument(
  env: Env,
  doc: { id: string; filename: string; r2_key: string; mime_type: string; file_size: number; user_id?: string }
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO documents (id, user_id, filename, r2_key, mime_type, file_size)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(doc.id, doc.user_id || 'anonymous', doc.filename, doc.r2_key, doc.mime_type, doc.file_size).run();
}

export async function getDocument(env: Env, id: string): Promise<Document | null> {
  const result = await env.DB.prepare(
    `SELECT * FROM documents WHERE id = ?`
  ).bind(id).first<Document>();
  return result;
}

export async function listDocuments(env: Env, userId: string, limit = 50): Promise<Document[]> {
  const result = await env.DB.prepare(
    `SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`
  ).bind(userId, limit).all<Document>();
  return result.results || [];
}

export async function updateDocumentStatus(
  env: Env,
  id: string,
  status: Document['status'],
  extra?: { document_type?: string; error_message?: string }
): Promise<void> {
  const clauses: string[] = ["status = ?", "updated_at = datetime('now')"];
  const params: (string)[] = [status];
  if (extra?.document_type) { clauses.push("document_type = ?"); params.push(extra.document_type); }
  if (extra?.error_message) { clauses.push("error_message = ?"); params.push(extra.error_message); }
  params.push(id);
  await env.DB.prepare(
    `UPDATE documents SET ${clauses.join(", ")} WHERE id = ?`
  ).bind(...params).run();
}

// ─── Extracted Fields ───

export async function insertExtractedField(
  env: Env,
  field: { id: string; document_id: string; field_name: string; field_value: string | null; confidence: number | null }
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO extracted_fields (id, document_id, field_name, field_value, confidence)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(field.id, field.document_id, field.field_name, field.field_value, field.confidence).run();
}

export async function insertExtractedFields(
  env: Env,
  documentId: string,
  fields: Record<string, { value: string; confidence: number }>
): Promise<void> {
  const stmt = env.DB.prepare(
    `INSERT INTO extracted_fields (id, document_id, field_name, field_value, confidence)
     VALUES (?, ?, ?, ?, ?)`
  );
  const batch = Object.entries(fields).map(([name, data]) =>
    stmt.bind(crypto.randomUUID(), documentId, name, data.value, data.confidence)
  );
  if (batch.length > 0) {
    await env.DB.batch(batch);
  }
}

export async function getExtractedFields(env: Env, documentId: string): Promise<ExtractedField[]> {
  const result = await env.DB.prepare(
    `SELECT * FROM extracted_fields WHERE document_id = ? ORDER BY field_name`
  ).bind(documentId).all<ExtractedField>();
  return result.results || [];
}

// ─── Extraction Results ───

export async function insertExtractionResult(
  env: Env,
  result: { document_id: string; raw_json: string; model_used: string; processing_time_ms: number }
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO extraction_results (document_id, raw_json, model_used, processing_time_ms)
     VALUES (?, ?, ?, ?)`
  ).bind(result.document_id, result.raw_json, result.model_used, result.processing_time_ms).run();
}

// ─── Form Templates ───

export async function getFormTemplates(env: Env, category?: string): Promise<any[]> {
  const query = category
    ? `SELECT * FROM form_templates WHERE is_active = 1 AND category = ? ORDER BY name`
    : `SELECT * FROM form_templates WHERE is_active = 1 ORDER BY name`;
  const result = category
    ? await env.DB.prepare(query).bind(category).all()
    : await env.DB.prepare(query).all();
  return (result.results || []).map((t: any) => ({
    ...t,
    fields_schema: JSON.parse(t.fields_schema),
  }));
}

export async function getFormTemplate(env: Env, id: string): Promise<any | null> {
  const result = await env.DB.prepare(
    `SELECT * FROM form_templates WHERE id = ? AND is_active = 1`
  ).bind(id).first();
  if (!result) return null;
  return {
    ...(result as any),
    fields_schema: JSON.parse((result as any).fields_schema),
  };
}
