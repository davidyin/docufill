import type { Env } from '../types';

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

/**
 * Dev mode: allows anonymous access with generated user ID
 * Production: requires Firebase Bearer token
 */
export async function requireAuth(request: Request, env: Env): Promise<AuthResult> {
  if (env.ENVIRONMENT === 'production') {
    return verifyFirebaseToken(request, env);
  }
  // Dev mode: extract user ID from header or generate one
  const userId = request.headers.get('X-User-ID');
  if (userId) {
    return { uid: userId, name: 'Dev User' };
  }
  // Anonymous dev access — user ID embedded in random UUID
  return { uid: 'dev_' + crypto.randomUUID().slice(0, 8), name: 'Guest' };
}

async function verifyFirebaseToken(request: Request, env: Env): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('Missing or invalid Authorization header');
  }
  const token = authHeader.slice(7);

  try {
    // Verify with Google's token info endpoint
    const resp = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${token}`
    );
    if (!resp.ok) throw new AuthError('Invalid token');
    const data = await resp.json() as any;
    return {
      uid: data.sub || data.user_id,
      email: data.email,
      name: data.name,
    };
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw new AuthError('Token verification failed');
  }
}
