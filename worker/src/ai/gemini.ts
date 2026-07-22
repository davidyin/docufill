import type { Env } from '../types';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

export interface GeminiRequest {
  contents: Array<{ role: string; parts: GeminiPart[] }>;
  generation_config?: {
    temperature?: number;
    max_output_tokens?: number;
    response_mime_type?: string;
    response_schema?: any;
  };
}

/**
 * Call Gemini API with multimodal content (image + text prompt)
 */
export async function callGemini(env: Env, request: GeminiRequest): Promise<{ text: string; usage: any }> {
  const model = (env.GEMINI_MODEL as string) || 'gemini-2.0-flash';
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gemini API error ${resp.status}: ${errText}`);
  }

  const data = await resp.json() as any;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const usage = data.usageMetadata || {};
  return { text, usage };
}

/**
 * Extract structured data from a document image using Gemini Vision
 */
export async function extractFromImage(
  env: Env,
  imageBuffer: ArrayBuffer,
  mimeType: string,
  prompt: string,
  schema?: any
): Promise<{ text: string; processingTimeMs: number }> {
  const startTime = Date.now();
  const base64 = arrayBufferToBase64(imageBuffer);

  const parts: GeminiPart[] = [
    { text: prompt },
    { inline_data: { mime_type: mimeType, data: base64 } },
  ];

  const request: GeminiRequest = {
    contents: [{ role: 'user', parts }],
    generation_config: {
      temperature: 0.1,
      max_output_tokens: 8192,
      ...(schema ? { response_mime_type: 'application/json', response_schema: schema } : {}),
    },
  };

  const { text } = await callGemini(env, request);
  return { text, processingTimeMs: Date.now() - startTime };
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
