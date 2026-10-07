import { beforeEach, describe, expect, it } from 'vitest';
import { getClientGuestId } from './guest';

describe('Client Guest Helper', () => {
  beforeEach(() => {
    localStorage.clear();
    // Clear cookies
    document.cookie.split(';').forEach((c) => {
      // biome-ignore lint/suspicious/noDocumentCookie: test environment cookie cleanup
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });
  });

  it('generates and persists a new guest ID when none exists', () => {
    const id = getClientGuestId();
    expect(id).toMatch(/^guest_[0-9a-f-]+/);
    expect(localStorage.getItem('tableops_guest_id')).toBe(id);
    expect(document.cookie).toContain(`tableops_guest_id=${id}`);
  });

  it('retrieves existing guest ID from cookie and syncs to localStorage', () => {
    // biome-ignore lint/suspicious/noDocumentCookie: test setup
    document.cookie = 'tableops_guest_id=guest_existing_cookie; path=/';
    const id = getClientGuestId();
    expect(id).toBe('guest_existing_cookie');
    expect(localStorage.getItem('tableops_guest_id')).toBe('guest_existing_cookie');
  });

  it('retrieves existing guest ID from localStorage and syncs to cookie', () => {
    localStorage.setItem('tableops_guest_id', 'guest_existing_storage');
    const id = getClientGuestId();
    expect(id).toBe('guest_existing_storage');
    expect(document.cookie).toContain('tableops_guest_id=guest_existing_storage');
  });
});
