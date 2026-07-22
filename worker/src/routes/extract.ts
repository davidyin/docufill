import type { Env } from '../types';
import { jsonResponse, errorResponse } from '../middleware/cors';
import { getDocument, updateDocumentStatus, getExtractedFields } from '../db/queries';
import { requireAuth, AuthError } from '../middleware/auth';
import { extractFromImage } from '../ai/gemini';
import { getPromptForDocType } from '../ai/prompts';

// POST /documents/:id/extract — Run AI extraction on a document
export async function extractDocument(request: Request, env: Env, docId: string): Promise<Response> {
  const startTime = Date.now();

  try {
    const auth = await requireAuth(request, env);
    const doc = await getDocument(env, docId);
    if (!doc) return errorResponse('Document not found', 404);
    if (env.ENVIRONMENT === 'production' && doc.user_id !== auth.uid) {
      return errorResponse('Not authorized', 403);
    }

    // Determine doc type to use appropriate prompt
    const body = request.body ? await request.json().catch(() => ({})) as any : {};
    const docType = body.document_type || doc.document_type || 'generic';
    const prompt = getPromptForDocType(docType);

    // Mark as processing
    const now = new Date().toISOString();
    await env.DB.prepare(
      "UPDATE documents SET status = 'processing', updated_at = ? WHERE id = ?"
    ).bind(now, docId).run();

    // Fetch image from R2
    const r2Object = await env.DOCUMENTS.get(doc.r2_key);
    if (!r2Object) {
      const errMsg = 'File not found in storage';
      await env.DB.prepare(
        "UPDATE documents SET status = 'error', error_message = ?, updated_at = ? WHERE id = ?"
      ).bind(errMsg, new Date().toISOString(), docId).run();
      return errorResponse(errMsg, 500);
    }

    const imageBuffer = await r2Object.arrayBuffer();

    // Call Gemini for extraction
    const { text, processingTimeMs } = await extractFromImage(
      env,
      imageBuffer,
      doc.mime_type,
      prompt
    );

    // Parse JSON response from Gemini
    let parsed: any;
    try {
      console.log('[Extract] Raw AI response (first 300 chars):', text.slice(0, 300));

      // Strip markdown code blocks if present
      let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();

      // Find the outermost JSON object — find first { and its matching }
      const firstBrace = cleaned.indexOf('{');
      if (firstBrace === -1) throw new Error('No JSON object found in response');

      // Find matching closing brace by counting depth
      let depth = 0;
      let lastBrace = -1;
      for (let i = firstBrace; i < cleaned.length; i++) {
        if (cleaned[i] === '{') depth++;
        if (cleaned[i] === '}') depth--;
        if (depth === 0) { lastBrace = i; break; }
      }
      if (lastBrace === -1) throw new Error('Unclosed JSON object in response');

      const jsonStr = cleaned.slice(firstBrace, lastBrace + 1);
      console.log('[Extract] Parsing JSON, length:', jsonStr.length);
      parsed = JSON.parse(jsonStr);
    } catch (parseErr: any) {
      const errMsg = `Failed to parse AI response: ${text.slice(0, 200)}`;
      await env.DB.prepare(
        "UPDATE documents SET status = 'error', error_message = ?, updated_at = ? WHERE id = ?"
      ).bind(errMsg, new Date().toISOString(), docId).run();
      return errorResponse(errMsg, 500);
    }

    // Store raw result
    await env.DB.prepare(
      "INSERT INTO extraction_results (document_id, raw_json, model_used, processing_time_ms) VALUES (?, ?, ?, ?)"
    ).bind(docId, JSON.stringify(parsed), env.GEMINI_MODEL || 'gemini-2.5-flash', processingTimeMs).run();

    // Extract and store individual fields
    const fields = parsed.fields || parsed;
    const fieldEntries: Record<string, { value: string; confidence: number }> = {};

    for (const [key, val] of Object.entries(fields)) {
      if (key === 'document_type' || key === 'confidence') continue;
      if (val && typeof val === 'object' && 'value' in (val as any)) {
        fieldEntries[key] = {
          value: String((val as any).value),
          confidence: (val as any).confidence ?? 0.9,
        };
      } else {
        fieldEntries[key] = { value: String(val), confidence: 0.85 };
      }
    }

    // Batch insert fields
    if (Object.keys(fieldEntries).length > 0) {
      const stmt = env.DB.prepare(
        "INSERT INTO extracted_fields (id, document_id, field_name, field_value, confidence) VALUES (?, ?, ?, ?, ?)"
      );
      const batch = Object.entries(fieldEntries).map(([name, data]) =>
        stmt.bind(crypto.randomUUID(), docId, name, data.value, data.confidence)
      );
      await env.DB.batch(batch);
    }

    // Update doc status
    const updateTime = new Date().toISOString();
    await env.DB.prepare(
      "UPDATE documents SET status = 'extracted', document_type = ?, updated_at = ? WHERE id = ?"
    ).bind(parsed.document_type || docType, updateTime, docId).run();

    // Return processed result
    const extractedFields = await getExtractedFields(env, docId);

    return jsonResponse({
      success: true,
      data: {
        document_id: docId,
        document_type: parsed.document_type || docType,
        processing_time_ms: processingTimeMs,
        total_time_ms: Date.now() - startTime,
        fields: extractedFields.map(f => ({
          name: f.field_name,
          value: f.field_value,
          confidence: f.confidence,
        })),
      },
    });
  } catch (err: any) {
    if (err instanceof AuthError) return errorResponse(err.message, 401);
    console.error('[Extract Error]', err.message, err.stack);
    // Update status to error
    try {
      await env.DB.prepare(
        "UPDATE documents SET status = 'error', error_message = ?, updated_at = ? WHERE id = ?"
      ).bind(err.message, new Date().toISOString(), docId).run();
    } catch {}
    return errorResponse(`Extraction failed: ${err.message}`, 500);
  }
}
