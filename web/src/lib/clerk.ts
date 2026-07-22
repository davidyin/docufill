/**
 * DocuFill — Clerk Auth Manager
 *
 * Handles Clerk initialization, JWT token retrieval, and auth state.
 * Dev mode: skips Clerk entirely, uses X-User-ID header
 * Production: requires Clerk JWT for all API calls
 */

import { writable, derived, type Readable } from 'svelte/store';
import { browser } from '$app/environment';

// ─── Configuration ───

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

export const isClerkEnabled = !!CLERK_PUBLISHABLE_KEY;

// ─── Stores ───

export const clerkInstance = writable<any>(null);
export const clerkLoaded = writable(false);
export const isSignedIn = writable(false);
export const clerkUser = writable<any>(null);

// Derived: ready for API calls (either Clerk loaded or dev mode)
export const authReady: Readable<boolean> = derived(
  [clerkLoaded, isSignedIn],
  ([$loaded, $signedIn]) => {
    if (!isClerkEnabled) return true; // Dev mode — always ready
    return $loaded && $signedIn;
  }
);

// ─── Clerk Initialization ───

let initPromise: Promise<any> | null = null;

export async function initClerk(): Promise<any> {
  if (!isClerkEnabled) return null;
  if (!browser) return null;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const { Clerk } = await import('@clerk/clerk-js');
      const clerk = new Clerk(CLERK_PUBLISHABLE_KEY);
      await clerk.load();

      // Sync initial state
      clerkInstance.set(clerk);
      clerkLoaded.set(true);
      isSignedIn.set(!!clerk.user);
      clerkUser.set(clerk.user || null);

      // Listen for auth changes
      clerk.addListener((event: any) => {
        isSignedIn.set(!!event.user);
        clerkUser.set(event.user || null);
      });

      return clerk;
    } catch (err) {
      console.error('[Clerk] Init failed:', err);
      clerkLoaded.set(true); // Mark as "loaded" to stop loading screen
      return null;
    }
  })();

  return initPromise;
}

// ─── Token Retrieval ───

/**
 * Get a fresh JWT token from Clerk session.
 * Returns null in dev mode (caller should use X-User-ID header).
 */
export async function getAuthToken(): Promise<string | null> {
  if (!isClerkEnabled) return null;
  if (!browser) return null;

  const clerk = await initClerk();
  if (!clerk?.session) return null;

  try {
    return await clerk.session.getToken();
  } catch (err) {
    console.error('[Clerk] getToken failed:', err);
    return null;
  }
}

// ─── Sign In / Out ───

export function redirectToSignIn() {
  // Clerk's hosted sign-in or component-based
  // We use ClerkProvider component approach in layout
}

export async function signOut() {
  const clerk = await initClerk();
  if (clerk) {
    await clerk.signOut();
  }
}
