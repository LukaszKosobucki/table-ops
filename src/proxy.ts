import type { NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);

  // Option A: Ensure every visitor/device has a unique anonymous guest ID
  const existingGuestId = request.cookies.get('tableops_guest_id')?.value;
  if (!existingGuestId) {
    const guestId = `guest_${crypto.randomUUID()}`;
    response.cookies.set('tableops_guest_id', guestId, {
      path: '/',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60, // 1 year
      httpOnly: false, // allow client-side access for storage sync
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
