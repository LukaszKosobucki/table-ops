import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MainDashboard } from './MainDashboard';

describe('MainDashboard Access & Routing Guard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('strictly blocks access to other tabs when no session is active', async () => {
    // Mock /api/sessions returning empty list
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, sessions: [] }),
    } as Response);

    render(<MainDashboard initialMonsters={[]} />);

    // Initially loads and shows Session Selection
    await waitFor(() => {
      expect(screen.getByText(/brak aktywnych sesji/i)).toBeInTheDocument();
    });

    // The other tabs in the Navbar must be disabled
    const dashboardBtn = screen.getByRole('button', { name: /ekran prowadzenia/i });
    const bestiaryBtn = screen.getByRole('button', { name: /bestiariusz/i });

    expect(dashboardBtn).toBeDisabled();
    expect(bestiaryBtn).toBeDisabled();

    // Combat tracker, bestiary or other modules must NOT be rendered
    expect(screen.queryByText(/kolejka inicjatywy/i)).not.toBeInTheDocument();
  });

  it('unlocks GM tools once a session is created or selected', async () => {
    const user = userEvent.setup();
    const mockSession = {
      id: 'ses-100',
      name: 'Wyprawa do Podmroku',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { characters: 3, sessionLogs: 5 },
    };

    // Mock API returning 1 session
    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (typeof url === 'string' && url.includes('/api/sessions')) {
        if (options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, session: mockSession }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, sessions: [mockSession] }),
        } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    });

    render(<MainDashboard initialMonsters={[]} />);

    // Session card appears
    await waitFor(() => {
      expect(screen.getByText('Wyprawa do Podmroku')).toBeInTheDocument();
    });

    // Click "Wejdź do sesji"
    const enterBtn = screen.getByRole('button', { name: /wejdź do sesji/i });
    await user.click(enterBtn);

    // After entering, all tabs should be unlocked
    await waitFor(() => {
      const dashboardBtn = screen.getByRole('button', { name: /ekran prowadzenia/i });
      const bestiaryBtn = screen.getByRole('button', { name: /bestiariusz/i });
      expect(dashboardBtn).toBeEnabled();
      expect(bestiaryBtn).toBeEnabled();
    });

    // Verify localStorage has active session saved
    expect(localStorage.getItem('tableops_active_session_id')).toBe('ses-100');
  });
});
