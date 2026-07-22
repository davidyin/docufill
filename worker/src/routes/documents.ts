import type { Env } from '../types';
import { jsonResponse, errorResponse } from '../middleware/cors';
import { insertDocument, getDocument, listDocuments, updateDocumentStatus, getExtractedFields } from '../db/queries';
import { requireAuth } from '../middleware/auth';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

// POST /documents — Upload a document for processing
export async function uploadDocument(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await requireAuth(request, env);
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('Missing required field: file', 400);
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return errorResponse(`Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`, 400);
    }

    // Validate file size
    const maxSize = (parseInt(env.MAX_FILE_SIZE_MB as string) || 10) * 1024 * 1024;
    if (file.size > maxSize) {
      return errorResponse(`File too large. Maximum: ${maxSize / 1024 / 1024}MB`, 400);
    }

    // Generate ID and R2 key
    const docId = crypto.randomUUID();
    const ext = getExtension(file.name);
    const r2Key = `documents/${auth.uid}/${docId}${ext}`;

    // Upload to R2
    const fileBuffer = await file.arrayBuffer();
    await env.DOCUMENTS.put(r2Key, fileBuffer, {
      httpMetadata: { contentType: file.type },
    });

    // Store metadata in D1 (with timestamp)
    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO documents (id, user_id, filename, r2_key, mime_type, file_size, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'uploaded', ?, ?)`
    ).bind(docId, auth.uid, file.name, r2Key, file.type, file.size, now, now).run();

    return jsonResponse({
      success: true,
      data: {
        id: docId,
        filename: file.name,
        status: 'uploaded',
        message: 'Document uploaded. POST to /documents/:id/extract to process.',
      },
    }, 201);
  } catch (err: any) {
    if (err.name === 'AuthError') return errorResponse(err.message, 401);
    console.error('[Upload Error]', err.message, err.stack);
    return errorResponse(`Upload failed: ${err.message}`, 500);
  }
}

// GET /documents — List user's documents
export async function listUserDocuments(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await requireAuth(request, env);
    const docs = await listDocuments(env, auth.uid);
    return jsonResponse({ success: true, data: docs });
  } catch (err: any) {
    if (err.name === 'AuthError') return errorResponse(err.message, 401);
    console.error('[List Error]', err.message);
    return errorResponse(`Failed to list documents: ${err.message}`, 500);
  }
}

// GET /documents/:id — Get document details + extracted fields
export async function getDocumentById(request: Request, env: Env, docId: string): Promise<Response> {
  try {
    const auth = await requireAuth(request, env);
    const doc = await getDocument(env, docId);
    if (!doc) return errorResponse('Document not found', 404);

    // In production, ownership check
    if (env.ENVIRONMENT === 'production' && doc.user_id !== auth.uid) {
      return errorResponse('Not authorized', 403);
    }

    const fields = await getExtractedFields(env, docId);
    return jsonResponse({ success: true, data: { ...doc, extracted_fields: fields } });
  } catch (err: any) {
    if (err.name === 'AuthError') return errorResponse(err.message, 401);
    console.error('[Get Error]', err.message);
    return errorResponse(`Failed to get document: ${err.message}`, 500);
  }
}

function getExtension(filename: string): string {
  const lower = filename.toLowerCase();
  for (const ext of ALLOWED_EXTENSIONS) {
    if (lower.endsWith(ext)) return ext;
  }
  return '.bin';
}

// GET /documents/:id/image — Serve original document image from R2
export async function getDocumentImage(request: Request, env: Env, docId: string): Promise<Response> {
  try {
    const auth = await requireAuth(request, env);
    const doc = await getDocument(env, docId);
    if (!doc) return errorResponse('Document not found', 404);

    if (env.ENVIRONMENT === 'production' && doc.user_id !== auth.uid) {
      return errorResponse('Not authorized', 403);
    }

    const r2Object = await env.DOCUMENTS.get(doc.r2_key);
    if (!r2Object) return errorResponse('File not found in storage', 404);

    const headers = new Headers();
    headers.set('Content-Type', doc.mime_type || 'application/octet-stream');
    headers.set('Cache-Control', 'private, max-age=3600');
    headers.set('Content-Disposition', `inline; filename="${doc.filename}"`);
    r2Object.writeHttpMetadata(headers);

    return addCorsHeaders(new Response(r2Object.body, { headers }));
  } catch (err: any) {
    if (err.name === 'AuthError') return errorResponse(err.message, 401);
    console.error('[Image Error]', err.message);
    return errorResponse(`Failed to get image: ${err.message}`, 500);
  }
}
