/**
 * DocuFill API — Cloudflare Worker
 * AI-powered document extraction & form autofill
 */

import type { Env } from './types';
import { handleOptions, addCorsHeaders } from './middleware/cors';
import { uploadDocument, listUserDocuments, getDocumentById } from './routes/documents';
import { extractDocument } from './routes/extract';
import { getFormTemplates, getFormTemplate } from './db/queries';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    // Global rate limiting (simple IP-based)
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimit = checkRateLimit(ip, { windowMs: 60_000, maxRequests: 30 });
    if (!rateLimit.allowed) {
      const resp = addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        )
      );
      resp.headers.set('X-RateLimit-Remaining', '0');
      return resp;
    }

    try {
      const resp = await route(request, env);
      resp.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
      return resp;
    } catch (err) {
      console.error('[Worker] Unhandled error:', (err as Error).message);
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Internal server error' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }
  },
};

// Simple in-memory rate limiting (per Worker instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string, opts: { windowMs: number; maxRequests: number }) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true, remaining: opts.maxRequests - 1 };
  }
  entry.count++;
  return { allowed: entry.count <= opts.maxRequests, remaining: Math.max(0, opts.maxRequests - entry.count) };
}

// ─── Router ───

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, '');
  const method = request.method;

  // Health check
  if (path === '/health' || path === '') {
    return addCorsHeaders(
      new Response(
        JSON.stringify({
          success: true,
          data: { status: 'ok', service: 'docufill-api', version: '0.1.0' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
  }

  // ─── Documents ───
  if (path === '/documents' && method === 'POST') {
    return uploadDocument(request, env);
  }
  if (path === '/documents' && method === 'GET') {
    return listUserDocuments(request, env);
  }

  const docMatch = path.match(/^\/documents\/([a-zA-Z0-9_-]+)$/);
  if (docMatch && method === 'GET') {
    return getDocumentById(request, env, docMatch[1]);
  }

  // ─── Extraction ───
  if (docMatch && method === 'POST' && path.endsWith('/extract')) {
    return extractDocument(request, env, docMatch[1]);
  }

  // ─── Form Templates ───
  if (path === '/forms/templates' && method === 'GET') {
    const category = url.searchParams.get('category') || undefined;
    const templates = await getFormTemplates(env, category);
    return addCorsHeaders(
      new Response(
        JSON.stringify({ success: true, data: templates }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
  }

  const tmplMatch = path.match(/^\/forms\/templates\/([a-zA-Z0-9_-]+)$/);
  if (tmplMatch && method === 'GET') {
    const template = await getFormTemplate(env, tmplMatch[1]);
    if (!template) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Template not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }
    return addCorsHeaders(
      new Response(
        JSON.stringify({ success: true, data: template }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
  }

  // ─── 404 ───
  return addCorsHeaders(
    new Response(
      JSON.stringify({
        success: false,
        error: 'Not found',
        message: `${method} ${path} is not a valid endpoint`,
      }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
  );
}
