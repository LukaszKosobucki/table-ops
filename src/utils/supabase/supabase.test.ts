import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient as createBrowserClient } from './client';
import { createClient as createServerClient } from './server';

describe('Supabase Client Helpers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_key_123',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('creates browser client with valid environment variables', () => {
    const client = createBrowserClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  it('throws an error if browser environment variables are missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(() => createBrowserClient()).toThrow('Missing Supabase environment variables');
  });

  it('creates server client with mock cookie store', async () => {
    const mockCookieStore = {
      getAll: vi.fn().mockReturnValue([{ name: 'sb-test', value: 'token123' }]),
      set: vi.fn(),
    };

    const serverClient = await createServerClient(
      mockCookieStore as unknown as Parameters<typeof createServerClient>[0]
    );
    expect(serverClient).toBeDefined();
    expect(serverClient.auth).toBeDefined();
  });
});
