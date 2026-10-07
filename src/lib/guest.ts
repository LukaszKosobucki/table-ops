const GUEST_ID_STORAGE_KEY = 'tableops_guest_id';

/**
 * Retrieves the client's guest ID, synchronizing between cookies and localStorage.
 * Ensures consistent device-level isolation for unauthenticated users.
 */
export function getClientGuestId(): string {
  if (typeof window === 'undefined') return '';

  // 1. Try reading from cookie
  const match = document.cookie.match(/tableops_guest_id=([^;]+)/);
  if (match) {
    const cookieVal = decodeURIComponent(match[1].trim());
    try {
      localStorage.setItem(GUEST_ID_STORAGE_KEY, cookieVal);
    } catch {
      // Ignore localStorage errors (e.g. private mode quota)
    }
    return cookieVal;
  }

  // 2. Try reading from localStorage
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(GUEST_ID_STORAGE_KEY);
  } catch {
    // Ignore localStorage errors
  }

  if (saved) {
    // biome-ignore lint/suspicious/noDocumentCookie: client cookie sync for guest isolation
    document.cookie = `tableops_guest_id=${encodeURIComponent(saved)}; path=/; max-age=31536000; SameSite=Lax`;
    return saved;
  }

  // 3. Generate new fallback guest ID
  const newId = `guest_${crypto.randomUUID()}`;
  try {
    localStorage.setItem(GUEST_ID_STORAGE_KEY, newId);
  } catch {
    // Ignore localStorage errors
  }
  // biome-ignore lint/suspicious/noDocumentCookie: client cookie sync for guest isolation
  document.cookie = `tableops_guest_id=${encodeURIComponent(newId)}; path=/; max-age=31536000; SameSite=Lax`;
  return newId;
}
