import type { Env } from '../types';
import { jwtVerify, createRemoteJWKSet, type JWTVerifyResult } from 'jose';

export class AuthError extends Error {
  name = 'AuthError';
  constructor(message: string) {
    super(message);
  }
}

interface AuthResult {
  uid: string;
  email?: string;
  name?: string;
}

// Clerk JWKS cache (per Worker instance)
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;
let jwksUrl: string | null = null;

/**
 * Auth middleware — Clerk JWT verification (production) / dev bypass
 *
 * Production flow:
 * 1. Extract Bearer token from Authorization header
 * 2. Fetch Clerk's JWKS keys (cached per Worker instance)
 * 3. Verify JWT signature + issuer using `jose` (pure JS, no Node deps)
 * 4. Extract user ID (sub) and claims from JWT
 *
 * Dev mode: passes through with a generated dev user ID
 */
export async function requireAuth(request: Request, env: Env): Promise<AuthResult> {
  if (env.ENVIRONMENT !== 'production') {
    return devAuth(request);
  }

  // ─── Clerk JWT Verification ───
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('Missing or invalid Authorization header. Expected: Bearer <JWT>');
  }
  const token = authHeader.slice(7);

  if (!env.CLERK_JWT_ISSUER) {
    throw new AuthError('CLERK_JWT_ISSUER not configured');
  }

  try {
    const payload = await verifyClerkToken(token, env.CLERK_JWT_ISSUER);

    // Clerk puts user ID in `sub`, email in standard `email` claim
    const emailClaim = env.CLERK_JWT_ISSUER + '/email';
    return {
      uid: payload.sub || '',
      email: (payload as any)?.[emailClaim]
        || (payload as any)?.email
        || payload?.email
        || undefined,
      name: (payload as any)?.[env.CLERK_JWT_ISSUER + '/name']
        || (payload as any)?.name
        || undefined,
    };
  } catch (err: any) {
    console.error('[Clerk Auth]', err.message);
    throw new AuthError(`Authentication failed: ${err.message}`);
  }
}

async function verifyClerkToken(token: string, issuer: string): Promise<JWTVerifyResult['payload']> {
  // Derive JWKS URL from issuer
  const url = new URL('/.well-known/jwks.json', issuer).toString();

  // Reuse cached JWKS set if same URL
  if (!jwksCache || jwksUrl !== url) {
    jwksCache = createRemoteJWKSet(new URL(url), {
      cacheMaxAge: 86_400_000, // Cache JWKS for 24h
    });
    jwksUrl = url;
  }

  const { payload } = await jwtVerify(token, jwksCache, {
    issuer,
    algorithms: ['RS256'],
  });

  return payload;
}

/**
 * Dev mode: extract user ID from header or use anonymous
 */
function devAuth(request: Request): AuthResult {
  const userId = request.headers.get('X-User-ID');
  if (userId) {
    return { uid: userId, name: 'Dev User' };
  }
  return { uid: 'dev_' + crypto.randomUUID().slice(0, 8), name: 'Guest' };
}
