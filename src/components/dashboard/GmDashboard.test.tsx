import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GmDashboard } from './GmDashboard';

describe('GmDashboard Component (Chunk 2.2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        characters: [
          {
            id: 'c-1',
            name: 'Valerius (Paladyn)',
            type: 'HERO',
            class: 'Paladyn',
            level: 3,
            currentHp: 28,
            maxHp: 28,
            ac: 18,
            passivePerception: 13,
            stats: { str: 16, dex: 10, con: 14, int: 8, wis: 12, cha: 16 },
          },
        ],
        sessionLogs: [
          {
            id: 'log-1',
            sessionId: 'ses-1',
            logType: 'COMBAT_ACTION',
            description: 'Valerius zadał 14 obrażeń z Divine Smite.',
            createdAt: new Date().toISOString(),
          },
        ],
      }),
    });
  });

  it('renders all three columns on desktop view', async () => {
    render(<GmDashboard sessionId="ses-1" sessionName="Wrota Baldura" initialMonsters={[]} />);

    expect(screen.getByText('Wrota Baldura')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-party-column')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-workspace-column')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-timeline-column')).toBeInTheDocument();

    await waitFor(() => {
      const partyColumn = screen.getByTestId('dashboard-party-column');
      expect(within(partyColumn).getByText('Valerius (Paladyn)')).toBeInTheDocument();
    });
  });

  it('switches center workspace to character inspection card on character click and allows returning', async () => {
    const user = userEvent.setup();
    render(<GmDashboard sessionId="ses-1" sessionName="Wrota Baldura" initialMonsters={[]} />);

    const partyColumn = screen.getByTestId('dashboard-party-column');
    await waitFor(() => {
      expect(within(partyColumn).getByText('Valerius (Paladyn)')).toBeInTheDocument();
    });

    const partyCard = within(partyColumn).getByText('Valerius (Paladyn)').closest('button');
    expect(partyCard).not.toBeNull();
    if (partyCard) {
      await user.click(partyCard);
    }

    // Inspection card should be visible with attributes and back button
    expect(screen.getByText(/Atrybuty D&D 5e/i)).toBeInTheDocument();
    expect(screen.getByText('Powrót do Walki / Tracker Inicjatywy')).toBeInTheDocument();

    // Click back button
    await user.click(screen.getByText('Powrót do Walki / Tracker Inicjatywy'));

    // Should return to initiative tracker
    expect(screen.getByText('Kolejność Inicjatywy (4)')).toBeInTheDocument();
  });

  it('switches center workspace to log inspection card on timeline log click and allows returning', async () => {
    const user = userEvent.setup();
    render(<GmDashboard sessionId="ses-1" sessionName="Wrota Baldura" initialMonsters={[]} />);

    const logText = await screen.findByText('Valerius zadał 14 obrażeń z Divine Smite.');
    const logCard = logText.closest('button');
    expect(logCard).not.toBeNull();
    if (logCard) {
      await user.click(logCard);
    }

    // Log inspection card should show details and return button
    expect(screen.getByText('Wydarzenie Taktyczne w Walce')).toBeInTheDocument();
    expect(screen.getByText('Zapis w Kronice Sesji')).toBeInTheDocument();

    // Click back button
    await user.click(screen.getByText('Powrót do Walki / Tracker Inicjatywy'));
    expect(screen.getByText('Kolejność Inicjatywy (4)')).toBeInTheDocument();
  });

  it('allows mobile tab switching between party, workspace, and timeline', async () => {
    const user = userEvent.setup();
    render(<GmDashboard sessionId="ses-1" sessionName="Wrota Baldura" initialMonsters={[]} />);

    // Switch to Party tab on mobile
    const partyTabBtn = screen.getByTestId('mobile-tab-party');
    await user.click(partyTabBtn);

    // Verify party column is active
    expect(screen.getByTestId('dashboard-party-column')).not.toHaveClass('hidden');

    // Switch to Timeline tab on mobile
    const timelineTabBtn = screen.getByTestId('mobile-tab-timeline');
    await user.click(timelineTabBtn);

    expect(screen.getByTestId('dashboard-timeline-column')).not.toHaveClass('hidden');
  });
});
