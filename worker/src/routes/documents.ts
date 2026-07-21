import type { Env } from '../types';
import { jsonResponse, errorResponse } from '../middleware/cors';
import { insertDocument, getDocument, listDocuments, updateDocumentStatus } from '../db/queries';
import { requireAuth } from '../middleware/auth';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

// POST /documents/upload — Upload a document for processing
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
    const maxSize = (parseInt(env.MAX_IMAGE_SIZE_MB as string) || 10) * 1024 * 1024;
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

    // Store metadata in D1
    await insertDocument(env, {
      id: docId,
      filename: file.name,
      r2Key,
      mime_type: file.type,
      file_size: file.size,
      user_id: auth.uid,
    });

    return jsonResponse({
      success: true,
      data: {
        id: docId,
        filename: file.name,
        status: 'uploaded',
        message: 'Document uploaded successfully. Use POST /documents/:id/extract to process.',
      },
    }, 201);
  } catch (err: any) {
    if (err.name === 'AuthError') return errorResponse(err.message, 401);
    throw err;
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
    throw err;
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
    throw err;
  }
}

function getExtension(filename: string): string {
  const lower = filename.toLowerCase();
  for (const ext of ALLOWED_EXTENSIONS) {
    if (lower.endsWith(ext)) return ext;
  }
  return '.bin';
}

// Re-export for use in getDocumentById
import { getExtractedFields } from '../db/queries';
