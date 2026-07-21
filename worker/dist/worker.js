// src/middleware/cors.ts
function handleOptions(request) {
  const headers = request.headers;
  if (headers.get("Origin") !== null && headers.get("Access-Control-Request-Method") !== null && headers.get("Access-Control-Request-Headers") !== null) {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400"
      }
    });
  }
  return new Response(null, { headers: { "Allow": "GET, POST, PUT, DELETE, OPTIONS" } });
}
function addCorsHeaders(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}
function jsonResponse(data, status = 200) {
  return addCorsHeaders(
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" }
    })
  );
}
function errorResponse(message, status = 400) {
  return jsonResponse({ success: false, error: message }, status);
}

// src/db/queries.ts
async function insertDocument(env, doc) {
  await env.DB.prepare(
    `INSERT INTO documents (id, user_id, filename, r2_key, mime_type, file_size)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(doc.id, doc.user_id || "anonymous", doc.filename, doc.r2_key, doc.mime_type, doc.file_size).run();
}
async function getDocument(env, id) {
  const result = await env.DB.prepare(
    `SELECT * FROM documents WHERE id = ?`
  ).bind(id).first();
  return result;
}
async function listDocuments(env, userId, limit = 50) {
  const result = await env.DB.prepare(
    `SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`
  ).bind(userId, limit).all();
  return result.results || [];
}
async function updateDocumentStatus(env, id, status, extra) {
  const clauses = ["status = ?", "updated_at = datetime('now')"];
  const params = [status];
  if (extra?.document_type) {
    clauses.push("document_type = ?");
    params.push(extra.document_type);
  }
  if (extra?.error_message) {
    clauses.push("error_message = ?");
    params.push(extra.error_message);
  }
  params.push(id);
  await env.DB.prepare(
    `UPDATE documents SET ${clauses.join(", ")} WHERE id = ?`
  ).bind(...params).run();
}
async function insertExtractedFields(env, documentId, fields) {
  const stmt = env.DB.prepare(
    `INSERT INTO extracted_fields (id, document_id, field_name, field_value, confidence)
     VALUES (?, ?, ?, ?, ?)`
  );
  const batch = Object.entries(fields).map(
    ([name, data]) => stmt.bind(crypto.randomUUID(), documentId, name, data.value, data.confidence)
  );
  if (batch.length > 0) {
    await env.DB.batch(batch);
  }
}
async function getExtractedFields(env, documentId) {
  const result = await env.DB.prepare(
    `SELECT * FROM extracted_fields WHERE document_id = ? ORDER BY field_name`
  ).bind(documentId).all();
  return result.results || [];
}
async function insertExtractionResult(env, result) {
  await env.DB.prepare(
    `INSERT INTO extraction_results (document_id, raw_json, model_used, processing_time_ms)
     VALUES (?, ?, ?, ?)`
  ).bind(result.document_id, result.raw_json, result.model_used, result.processing_time_ms).run();
}
async function getFormTemplates(env, category) {
  const query = category ? `SELECT * FROM form_templates WHERE is_active = 1 AND category = ? ORDER BY name` : `SELECT * FROM form_templates WHERE is_active = 1 ORDER BY name`;
  const result = category ? await env.DB.prepare(query).bind(category).all() : await env.DB.prepare(query).all();
  return (result.results || []).map((t) => ({
    ...t,
    fields_schema: JSON.parse(t.fields_schema)
  }));
}
async function getFormTemplate(env, id) {
  const result = await env.DB.prepare(
    `SELECT * FROM form_templates WHERE id = ? AND is_active = 1`
  ).bind(id).first();
  if (!result)
    return null;
  return {
    ...result,
    fields_schema: JSON.parse(result.fields_schema)
  };
}

// src/middleware/auth.ts
var AuthError = class extends Error {
  name = "AuthError";
  constructor(message) {
    super(message);
  }
};
async function requireAuth(request, env) {
  if (env.ENVIRONMENT === "production") {
    return verifyFirebaseToken(request, env);
  }
  const userId = request.headers.get("X-User-ID");
  if (userId) {
    return { uid: userId, name: "Dev User" };
  }
  return { uid: "dev_" + crypto.randomUUID().slice(0, 8), name: "Guest" };
}
async function verifyFirebaseToken(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Missing or invalid Authorization header");
  }
  const token = authHeader.slice(7);
  try {
    const resp = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${token}`
    );
    if (!resp.ok)
      throw new AuthError("Invalid token");
    const data = await resp.json();
    return {
      uid: data.sub || data.user_id,
      email: data.email,
      name: data.name
    };
  } catch (err) {
    if (err instanceof AuthError)
      throw err;
    throw new AuthError("Token verification failed");
  }
}

// src/routes/documents.ts
var ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
var ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
async function uploadDocument(request, env) {
  try {
    const auth = await requireAuth(request, env);
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) {
      return errorResponse("Missing required field: file", 400);
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return errorResponse(`Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`, 400);
    }
    const maxSize = (parseInt(env.MAX_IMAGE_SIZE_MB) || 10) * 1024 * 1024;
    if (file.size > maxSize) {
      return errorResponse(`File too large. Maximum: ${maxSize / 1024 / 1024}MB`, 400);
    }
    const docId = crypto.randomUUID();
    const ext = getExtension(file.name);
    const r2Key = `documents/${auth.uid}/${docId}${ext}`;
    const fileBuffer = await file.arrayBuffer();
    await env.DOCUMENTS.put(r2Key, fileBuffer, {
      httpMetadata: { contentType: file.type }
    });
    await insertDocument(env, {
      id: docId,
      filename: file.name,
      r2Key,
      mime_type: file.type,
      file_size: file.size,
      user_id: auth.uid
    });
    return jsonResponse({
      success: true,
      data: {
        id: docId,
        filename: file.name,
        status: "uploaded",
        message: "Document uploaded successfully. Use POST /documents/:id/extract to process."
      }
    }, 201);
  } catch (err) {
    if (err.name === "AuthError")
      return errorResponse(err.message, 401);
    throw err;
  }
}
async function listUserDocuments(request, env) {
  try {
    const auth = await requireAuth(request, env);
    const docs = await listDocuments(env, auth.uid);
    return jsonResponse({ success: true, data: docs });
  } catch (err) {
    if (err.name === "AuthError")
      return errorResponse(err.message, 401);
    throw err;
  }
}
async function getDocumentById(request, env, docId) {
  try {
    const auth = await requireAuth(request, env);
    const doc = await getDocument(env, docId);
    if (!doc)
      return errorResponse("Document not found", 404);
    if (env.ENVIRONMENT === "production" && doc.user_id !== auth.uid) {
      return errorResponse("Not authorized", 403);
    }
    const fields = await getExtractedFields(env, docId);
    return jsonResponse({ success: true, data: { ...doc, extracted_fields: fields } });
  } catch (err) {
    if (err.name === "AuthError")
      return errorResponse(err.message, 401);
    throw err;
  }
}
function getExtension(filename) {
  const lower = filename.toLowerCase();
  for (const ext of ALLOWED_EXTENSIONS) {
    if (lower.endsWith(ext))
      return ext;
  }
  return ".bin";
}

// src/ai/gemini.ts
var GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
async function callGemini(env, request) {
  const model = env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gemini API error ${resp.status}: ${errText}`);
  }
  const data = await resp.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const usage = data.usageMetadata || {};
  return { text, usage };
}
async function extractFromImage(env, imageBuffer, mimeType, prompt, schema) {
  const startTime = Date.now();
  const base64 = arrayBufferToBase64(imageBuffer);
  const parts = [
    { text: prompt },
    { inline_data: { mime_type: mimeType, data: base64 } }
  ];
  const request = {
    contents: [{ role: "user", parts }],
    generation_config: {
      temperature: 0.1,
      max_output_tokens: 4096,
      ...schema ? { response_mime_type: "application/json", response_schema: schema } : {}
    }
  };
  const { text } = await callGemini(env, request);
  return { text, processingTimeMs: Date.now() - startTime };
}
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// src/ai/prompts.ts
var EXTRACTION_SYSTEM_PROMPT = `You are DocuFill's document analysis engine. You extract structured data from document images (receipts, invoices, tax forms) with high precision.

RULES:
1. Output ONLY valid JSON, no additional text or markdown
2. For date fields, use ISO format: YYYY-MM-DD
3. For monetary values, return numbers only (no currency symbols)
4. If a field is not visible or not applicable, set it to null
5. For line items, return an array of objects
6. Include a "document_type" field at top level indicating what you detected
7. Include a "confidence" field (0-1) for each value, or an overall confidence score

OUTPUT FORMAT:
{
  "document_type": "receipt|invoice|t4|t5|t3|generic",
  "confidence": 0.0-1.0,
  "fields": {
    "field_name": {"value": "...", "confidence": 0.95},
    ...
  }
}`;
var RECEIPT_PROMPT = `${EXTRACTION_SYSTEM_PROMPT}

Analyze this receipt/invoice and extract:
- vendor_name (string): Store/business name
- date (string YYYY-MM-DD): Transaction date
- total_amount (number): Final total
- tax_amount (number): Tax amount (HST/GST/PST)
- currency (string): Currency code (default CAD)
- payment_method (string): cash, credit, debit, etc.
- line_items (array of {description, quantity, unit_price, total}): Individual items
- category (string): Food, Transport, Office, Medical, etc.`;
var T4_PROMPT = `${EXTRACTION_SYSTEM_PROMPT}

Analyze this Canadian T4 slip and extract ALL boxes, especially:
- employer_name: Employer's legal name
- tax_year: Year on the form
- box_14: Employment income
- box_16: Employee's CPP contributions
- box_18: Employee's EI premiums
- box_22: Income tax deducted
- box_44: Union dues
- box_52: Pension adjustment
- box_85: Employee premiums (if present)`;
var T5_PROMPT = `${EXTRACTION_SYSTEM_PROMPT}

Analyze this Canadian T5 slip and extract:
- issuer_name: Name of the paying corporation
- tax_year: Year on the form
- box_13: Taxable amount of dividends
- box_14: Capital gains dividends
- box_15: Return of capital
- box_16: Other income
- box_25: Foreign income
- box_26: Foreign tax paid`;
var GENERIC_PROMPT = `${EXTRACTION_SYSTEM_PROMPT}

Analyze this document and extract all structured data you can find. Look for:
- Document title/type
- Dates (issue date, due date, etc.)
- Names and addresses
- Amounts and totals
- Reference numbers
- Any structured fields visible

Be thorough \u2014extract every piece of identifiable information.`;
function getPromptForDocType(docType) {
  switch (docType) {
    case "receipt":
    case "invoice":
      return RECEIPT_PROMPT;
    case "t4":
      return T4_PROMPT;
    case "t5":
    case "t3":
      return T5_PROMPT;
    default:
      return GENERIC_PROMPT;
  }
}

// src/routes/extract.ts
async function extractDocument(request, env, docId) {
  const startTime = Date.now();
  try {
    const auth = await requireAuth(request, env);
    const doc = await getDocument(env, docId);
    if (!doc)
      return errorResponse("Document not found", 404);
    if (env.ENVIRONMENT === "production" && doc.user_id !== auth.uid) {
      return errorResponse("Not authorized", 403);
    }
    const body = request.body ? await request.json().catch(() => ({})) : {};
    const docType = body.document_type || doc.document_type || "generic";
    const prompt = getPromptForDocType(docType);
    await updateDocumentStatus(env, docId, "processing");
    const r2Object = await env.DOCUMENTS.get(doc.r2_key);
    if (!r2Object) {
      await updateDocumentStatus(env, docId, "error", { error_message: "File not found in storage" });
      return errorResponse("Document file not found in storage", 500);
    }
    const imageBuffer = await r2Object.arrayBuffer();
    const { text, processingTimeMs } = await extractFromImage(
      env,
      imageBuffer,
      doc.mime_type,
      prompt
    );
    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch (parseErr) {
      await updateDocumentStatus(env, docId, "error", { error_message: "Failed to parse AI response" });
      return errorResponse("AI returned non-structured output", 500);
    }
    await insertExtractionResult(env, {
      document_id: docId,
      raw_json: JSON.stringify(parsed),
      model_used: env.GEMINI_MODEL || "gemini-2.0-flash",
      processing_time_ms: processingTimeMs
    });
    const fields = parsed.fields || parsed;
    const fieldEntries = {};
    for (const [key, val] of Object.entries(fields)) {
      if (key === "document_type" || key === "confidence")
        continue;
      if (val && typeof val === "object" && "value" in val) {
        fieldEntries[key] = {
          value: String(val.value),
          confidence: val.confidence ?? 0.9
        };
      } else {
        fieldEntries[key] = { value: String(val), confidence: 0.85 };
      }
    }
    await insertExtractedFields(env, docId, fieldEntries);
    await updateDocumentStatus(env, docId, "extracted", {
      document_type: parsed.document_type || docType
    });
    const extractedFields = await getExtractedFields(env, docId);
    return jsonResponse({
      success: true,
      data: {
        document_id: docId,
        document_type: parsed.document_type || docType,
        processing_time_ms: processingTimeMs,
        total_time_ms: Date.now() - startTime,
        fields: extractedFields.map((f) => ({
          name: f.field_name,
          value: f.field_value,
          confidence: f.confidence
        })),
        raw: parsed
      }
    });
  } catch (err) {
    if (err instanceof AuthError)
      return errorResponse(err.message, 401);
    try {
      await updateDocumentStatus(env, docId, "error", { error_message: err.message });
    } catch {
    }
    throw err;
  }
}

// src/index.ts
var src_default = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return handleOptions(request);
    }
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const rateLimit = checkRateLimit(ip, { windowMs: 6e4, maxRequests: 30 });
    if (!rateLimit.allowed) {
      const resp = addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded" }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        )
      );
      resp.headers.set("X-RateLimit-Remaining", "0");
      return resp;
    }
    try {
      const resp = await route(request, env);
      resp.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
      return resp;
    } catch (err) {
      console.error("[Worker] Unhandled error:", err.message);
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: "Internal server error" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        )
      );
    }
  }
};
var rateLimitMap = /* @__PURE__ */ new Map();
function checkRateLimit(ip, opts) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true, remaining: opts.maxRequests - 1 };
  }
  entry.count++;
  return { allowed: entry.count <= opts.maxRequests, remaining: Math.max(0, opts.maxRequests - entry.count) };
}
async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "");
  const method = request.method;
  if (path === "/health" || path === "") {
    return addCorsHeaders(
      new Response(
        JSON.stringify({
          success: true,
          data: { status: "ok", service: "docufill-api", version: "0.1.0" }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
  }
  if (path === "/documents" && method === "POST") {
    return uploadDocument(request, env);
  }
  if (path === "/documents" && method === "GET") {
    return listUserDocuments(request, env);
  }
  const docMatch = path.match(/^\/documents\/([a-zA-Z0-9_-]+)$/);
  if (docMatch && method === "GET") {
    return getDocumentById(request, env, docMatch[1]);
  }
  if (docMatch && method === "POST" && path.endsWith("/extract")) {
    return extractDocument(request, env, docMatch[1]);
  }
  if (path === "/forms/templates" && method === "GET") {
    const category = url.searchParams.get("category") || void 0;
    const templates = await getFormTemplates(env, category);
    return addCorsHeaders(
      new Response(
        JSON.stringify({ success: true, data: templates }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
  }
  const tmplMatch = path.match(/^\/forms\/templates\/([a-zA-Z0-9_-]+)$/);
  if (tmplMatch && method === "GET") {
    const template = await getFormTemplate(env, tmplMatch[1]);
    if (!template) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: "Template not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        )
      );
    }
    return addCorsHeaders(
      new Response(
        JSON.stringify({ success: true, data: template }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
  }
  return addCorsHeaders(
    new Response(
      JSON.stringify({
        success: false,
        error: "Not found",
        message: `${method} ${path} is not a valid endpoint`
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    )
  );
}
export {
  src_default as default
};
