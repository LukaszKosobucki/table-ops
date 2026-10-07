import type { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';

export interface AuthClient {
  auth: {
    getUser: (token?: string) => Promise<{
      data: { user: User | null };
      error: unknown;
    }>;
  };
}

/**
 * Extracts the authenticated Supabase user from the request.
 * Checks for:
 * 1. Bearer token in the `Authorization` header
 * 2. Supabase SSR session cookies via createClient()
 * Returns null if no user is authenticated or an error occurs.
 */
export async function getUserFromRequest(
  request?: Request,
  customClient?: AuthClient
): Promise<User | null> {
  try {
    const authHeader =
      request?.headers.get('Authorization') ?? request?.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7).trim()
      : undefined;

    const supabase = customClient ?? (await createClient());

    const { data, error } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();

    if (error || !data?.user) {
      return null;
    }

    return data.user;
  } catch {
    return null;
  }
}

/**
 * Extracts anonymous guest ID from request (via x-guest-id header or tableops_guest_id cookie).
 */
export function getGuestIdFromRequest(request?: Request): string | null {
  if (!request) return null;

  const headerGuestId = request.headers.get('x-guest-id') ?? request.headers.get('X-Guest-Id');
  if (headerGuestId) {
    const trimmed = headerGuestId.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  const cookieHeader = request.headers.get('cookie') ?? request.headers.get('Cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/tableops_guest_id=([^;]+)/);
    if (match) {
      const val = decodeURIComponent(match[1].trim());
      return val.length > 0 ? val : null;
    }
  }

  return null;
}

/**
 * Returns the userId string if authenticated, or the anonymous guestId if unauthenticated guest,
 * or null if neither exists.
 */
export async function getUserIdFromRequest(
  request?: Request,
  customClient?: AuthClient
): Promise<string | null> {
  const user = await getUserFromRequest(request, customClient);
  if (user?.id) {
    return user.id;
  }
  return getGuestIdFromRequest(request);
}
