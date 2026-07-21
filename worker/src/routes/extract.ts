import type { Env } from '../types';
import { jsonResponse, errorResponse } from '../middleware/cors';
import { getDocument, updateDocumentStatus, insertExtractedFields, insertExtractionResult, getExtractedFields } from '../db/queries';
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
    await updateDocumentStatus(env, docId, 'processing');

    // Fetch image from R2
    const r2Object = await env.DOCUMENTS.get(doc.r2_key);
    if (!r2Object) {
      await updateDocumentStatus(env, docId, 'error', { error_message: 'File not found in storage' });
      return errorResponse('Document file not found in storage', 500);
    }

    const imageBuffer = await r2Object.arrayBuffer();

    // Call Gemini for extraction
    const { text, processingTimeMs } = await extractFromImage(
      env,
      imageBuffer,
      doc.mime_type,
      prompt
    );

    // Parse JSON response
    let parsed: any;
    try {
      // Try to find JSON block in response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch (parseErr) {
      await updateDocumentStatus(env, docId, 'error', { error_message: 'Failed to parse AI response' });
      return errorResponse('AI returned non-structured output', 500);
    }

    // Store raw result
    await insertExtractionResult(env, {
      document_id: docId,
      raw_json: JSON.stringify(parsed),
      model_used: env.GEMINI_MODEL || 'gemini-2.0-flash',
      processing_time_ms: processingTimeMs,
    });

    // Extract and store individual fields
    const fields = parsed.fields || parsed;
    const fieldEntries: Record<string, { value: string; confidence: number }> = {};

    // Handle both nested {field: {value, confidence}} and flat {field: value} formats
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

    await insertExtractedFields(env, docId, fieldEntries);

    // Update doc status and type
    await updateDocumentStatus(env, docId, 'extracted', {
      document_type: parsed.document_type || docType,
    });

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
        raw: parsed,
      },
    });
  } catch (err: any) {
    if (err instanceof AuthError) return errorResponse(err.message, 401);
    // Update status to error
    try { await updateDocumentStatus(env, docId, 'error', { error_message: err.message }); } catch {}
    throw err;
  }
}
