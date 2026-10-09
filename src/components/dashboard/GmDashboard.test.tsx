import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
    expect(screen.getByText(/Kolejność Inicjatywy/i)).toBeInTheDocument();
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
    expect(screen.getByText(/Kolejność Inicjatywy/i)).toBeInTheDocument();
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

  it('switches center workspace to encounter builder on tab click and allows returning', async () => {
    const user = userEvent.setup();
    render(<GmDashboard sessionId="ses-1" sessionName="Wrota Baldura" initialMonsters={[]} />);

    // Click "Kreator Potyczek" tab in workspace column
    const encounterTabBtn = screen.getByTestId('tab-encounter-builder');
    await user.click(encounterTabBtn);

    // Verify encounter builder header is visible
    expect(screen.getByText(/Kreator Potyczek \(Encounter Builder\)/i)).toBeInTheDocument();

    // Click back button
    const backBtn = screen.getByTitle('Powrót do walki');
    await user.click(backBtn);

    // Verify returned to combat initiative tracker
    expect(screen.getByText(/Kolejność Inicjatywy/i)).toBeInTheDocument();
  });

  it('allows loading entire party into combat via "Załaduj Drużynę do Walki"', async () => {
    const user = userEvent.setup();
    render(<GmDashboard sessionId="ses-1" sessionName="Wrota Baldura" initialMonsters={[]} />);

    // Wait for characters to load
    await waitFor(() => {
      expect(screen.getByText('Valerius (Paladyn)')).toBeInTheDocument();
    });

    const addPartyBtn = screen.getByTestId('add-party-to-combat-btn');
    expect(addPartyBtn).toBeInTheDocument();
    await user.click(addPartyBtn);

    // Verify Valerius is now in the initiative tracker as a combatant card
    await waitFor(() => {
      expect(screen.getByTestId('combatant-card-c-1')).toBeInTheDocument();
    });
  });

  it('allows adding a single character to combat via "Do walki" button', async () => {
    const user = userEvent.setup();
    render(<GmDashboard sessionId="ses-1" sessionName="Wrota Baldura" initialMonsters={[]} />);

    // Wait for characters to load
    await waitFor(() => {
      expect(screen.getByText('Valerius (Paladyn)')).toBeInTheDocument();
    });

    const addCharBtn = screen.getByTestId('add-to-combat-c-1');
    expect(addCharBtn).toBeInTheDocument();
    await user.click(addCharBtn);

    // Verify character is added to combat
    await waitFor(() => {
      expect(screen.getByTestId('combatant-card-c-1')).toBeInTheDocument();
      expect(screen.getByTestId('in-combat-badge-c-1')).toBeInTheDocument();
    });
  });

  it('allows performing a long rest from timeline and updates characters in party column', async () => {
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (typeof url === 'string' && url.includes('/logs') && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            log: {
              id: 'log-rest-1',
              sessionId: 'ses-1',
              logType: 'REST_LONG',
              description:
                'Drużyna ukończyła Długi Odpoczynek (8h). Wszyscy bohaterowie odzyskali pełnię sił.',
              createdAt: new Date().toISOString(),
            },
            updatedCharacters: [
              {
                id: 'c-1',
                name: 'Valerius (Paladyn)',
                type: 'HERO',
                currentHp: 28,
                maxHp: 28,
              },
            ],
          }),
        });
      }

      return Promise.resolve({
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
              currentHp: 10,
              maxHp: 28,
              ac: 18,
              passivePerception: 13,
            },
          ],
          sessionLogs: [],
        }),
      });
    });

    render(<GmDashboard sessionId="ses-1" sessionName="Wrota Baldura" initialMonsters={[]} />);

    await waitFor(() => {
      expect(screen.getByText('Valerius (Paladyn)')).toBeInTheDocument();
    });

    // Open long rest modal
    const longRestTrigger = screen.getByTestId('open-long-rest-btn');
    fireEvent.click(longRestTrigger);

    // Confirm long rest
    const confirmBtn = await screen.findByTestId('confirm-long-rest-btn');
    fireEvent.click(confirmBtn);

    // Verify timeline received the new log
    await waitFor(() => {
      expect(screen.getByText(/Drużyna ukończyła Długi Odpoczynek \(8h\)/i)).toBeInTheDocument();
    });
  });

  it('records spell cast from character card into timeline and combat logs', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((input: string | URL | Request) => {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes('/api/compendium/spells')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            spells: [
              {
                index: 'fire-bolt',
                name: 'Ognisty Pocisk',
                level: 0,
                school: 'Evocation',
                classes: ['Paladyn'],
              },
            ],
          }),
        } as unknown as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          session: { id: 'ses-1', name: 'Wrota Baldura' },
          characters: [
            {
              id: 'char-1',
              name: 'Valerius (Paladyn)',
              type: 'HERO',
              class: 'Paladyn',
              level: 3,
              currentHp: 20,
              maxHp: 28,
              ac: 18,
              passivePerception: 13,
              spells: {
                slots: { 1: { max: 3, used: 0 } },
                known: ['Ognisty Pocisk'],
              },
            },
          ],
          sessionLogs: [],
        }),
      } as unknown as Response);
    });

    render(<GmDashboard sessionId="ses-1" sessionName="Wrota Baldura" initialMonsters={[]} />);

    await waitFor(() => {
      expect(screen.getByText('Valerius (Paladyn)')).toBeInTheDocument();
    });

    // Inspect character
    fireEvent.click(screen.getByText('Valerius (Paladyn)'));

    // Wait for inspect card to mount and compendium spell to load
    await waitFor(() => {
      expect(screen.getByTestId('cast-spell-Ognisty Pocisk')).toBeInTheDocument();
    });

    // Cast the cantrip
    fireEvent.click(screen.getByTestId('cast-spell-Ognisty Pocisk'));

    // Should appear in timeline
    await waitFor(() => {
      expect(
        screen.getByText(/Valerius \(Paladyn\) rzuca sztuczkę \(cantrip\): Ognisty Pocisk/i)
      ).toBeInTheDocument();
    });
  });

  it('records custom combat action from tactics panel into combat and session timeline', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          session: { id: 'ses-1', name: 'Wrota Baldura' },
          characters: [
            {
              id: 'char-1',
              name: 'Valerius (Paladyn)',
              type: 'HERO',
              currentHp: 20,
              maxHp: 28,
              ac: 18,
              initiative: 15,
            },
          ],
          sessionLogs: [],
        }),
      } as unknown as Response)
    );

    render(<GmDashboard sessionId="ses-1" sessionName="Wrota Baldura" initialMonsters={[]} />);

    await waitFor(() => {
      expect(screen.getByText('Valerius (Paladyn)')).toBeInTheDocument();
    });

    // Switch to tactics tab in right column
    const tacticsTab = screen.getByTestId('sidebar-tab-tactics');
    fireEvent.click(tacticsTab);

    // Fill in custom action
    const actionInput = await screen.findByTestId('custom-action-input');
    fireEvent.change(actionInput, { target: { value: 'Zasłania wejście do krypty' } });
    fireEvent.click(screen.getByTestId('submit-custom-action-btn'));

    // Check combat log entry appeared
    await waitFor(() => {
      expect(screen.getByText(/wykonuje akcję: Zasłania wejście do krypty/i)).toBeInTheDocument();
    });
  });

  it('clears combatants queue completely when combat ends, enabling loading party for next combat', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          session: { id: 'ses-1', name: 'Wrota Baldura' },
          characters: [
            {
              id: 'char-1',
              name: 'Valerius (Paladyn)',
              type: 'HERO',
              currentHp: 20,
              maxHp: 28,
              ac: 18,
              initiative: 15,
            },
          ],
          sessionLogs: [],
        }),
      } as unknown as Response)
    );

    render(<GmDashboard sessionId="ses-1" sessionName="Wrota Baldura" initialMonsters={[]} />);

    await waitFor(() => {
      expect(screen.getByText('Valerius (Paladyn)')).toBeInTheDocument();
    });

    // 1. Load party into combat
    const addPartyBtn = screen.getByTestId('add-party-to-combat-btn');
    fireEvent.click(addPartyBtn);

    // Character is now in combat queue
    await waitFor(() => {
      expect(screen.getByTestId('combatant-card-char-1')).toBeInTheDocument();
    });

    // 2. Start combat
    const startCombatBtn = screen.getByTestId('start-combat-btn');
    fireEvent.click(startCombatBtn);

    // 3. End combat
    const endCombatBtn = await screen.findByTestId('end-combat-btn');
    fireEvent.click(endCombatBtn);

    // Check if warning modal appears (only if alive monsters; here no monsters, so ends immediately)
    const confirmBtn = screen.queryByTestId('confirm-end-combat-btn');
    if (confirmBtn) {
      fireEvent.click(confirmBtn);
    }

    // 4. Center tracker should show empty state: "Brak postaci w walce"
    await waitFor(() => {
      expect(screen.getByText(/Brak postaci w walce/i)).toBeInTheDocument();
      expect(screen.queryByTestId('combatant-card-char-1')).not.toBeInTheDocument();
    });

    // 5. In PartySidebar, character does NOT have "W walce" badge anymore
    expect(screen.queryByTestId('in-combat-badge-char-1')).not.toBeInTheDocument();

    // 6. "Załaduj Drużynę do Walki" is enabled and clickable again
    expect(screen.getByTestId('add-party-to-combat-btn')).toBeEnabled();

    // 7. Click to load party again for the next encounter
    fireEvent.click(screen.getByTestId('add-party-to-combat-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('combatant-card-char-1')).toBeInTheDocument();
    });
  });

  it('renders External Notes button in title bar, opens window, minimizes to dock, and restores', async () => {
    const user = userEvent.setup();
    render(<GmDashboard sessionId="ses-1" sessionName="Wrota Baldura" initialMonsters={[]} />);

    // 1. Check title bar button
    const notesBtn = screen.getByTestId('external-notes-btn');
    expect(notesBtn).toBeInTheDocument();
    expect(notesBtn).toHaveTextContent('Zewnętrzne notatki');

    // Window initially closed
    expect(screen.queryByTestId('draggable-notes-window')).not.toBeInTheDocument();

    // 2. Click button to open window
    await user.click(notesBtn);
    expect(screen.getByTestId('draggable-notes-window')).toBeInTheDocument();

    // 3. Click minimize button
    const minBtn = screen.getByTestId('notes-minimize-btn');
    await user.click(minBtn);

    // Window is hidden
    expect(screen.queryByTestId('draggable-notes-window')).not.toBeInTheDocument();

    // 4. Minimized pill is present in BottomDock
    const dockRestoreBtn = screen.getByTestId('dock-minimized-notes-btn');
    expect(dockRestoreBtn).toBeInTheDocument();
    expect(dockRestoreBtn).toHaveTextContent('Zewnętrzne Notatki');

    // 5. Click dock pill to restore window
    await user.click(dockRestoreBtn);
    expect(screen.getByTestId('draggable-notes-window')).toBeInTheDocument();

    // 6. Click close button
    const closeBtn = screen.getByTestId('notes-close-btn');
    await user.click(closeBtn);
    expect(screen.queryByTestId('draggable-notes-window')).not.toBeInTheDocument();
  });

  it('renders Dice Roller button in title bar, opens window, minimizes to dock, and restores', async () => {
    const user = userEvent.setup();
    render(<GmDashboard sessionId="ses-1" sessionName="Wrota Baldura" initialMonsters={[]} />);

    // 1. Check title bar dice button
    const diceBtn = screen.getByTestId('header-dice-btn');
    expect(diceBtn).toBeInTheDocument();
    expect(diceBtn).toHaveTextContent('Rzutnik kości');

    // Window initially closed
    expect(screen.queryByTestId('dice-tray-window')).not.toBeInTheDocument();

    // 2. Click button to open window
    await user.click(diceBtn);
    expect(screen.getByTestId('dice-tray-window')).toBeInTheDocument();

    // 3. Click minimize button
    const minBtn = screen.getByTestId('minimize-dice-tray-btn');
    await user.click(minBtn);

    // Window is hidden
    expect(screen.queryByTestId('dice-tray-window')).not.toBeInTheDocument();

    // 4. Minimized pill is present in BottomDock
    const dockRestoreBtn = screen.getByTestId('dock-minimized-dice-btn');
    expect(dockRestoreBtn).toBeInTheDocument();
    expect(dockRestoreBtn).toHaveTextContent('Rzutnik Kości');

    // 5. Click dock pill to restore window
    await user.click(dockRestoreBtn);
    expect(screen.getByTestId('dice-tray-window')).toBeInTheDocument();

    // 6. Click close button
    const closeBtn = screen.getByTestId('close-dice-tray-btn');
    await user.click(closeBtn);
    expect(screen.queryByTestId('dice-tray-window')).not.toBeInTheDocument();
  });

  it('toggles Dice Roller window with "D" keyboard shortcut', async () => {
    render(<GmDashboard sessionId="ses-1" sessionName="Wrota Baldura" initialMonsters={[]} />);

    expect(screen.queryByTestId('dice-tray-window')).not.toBeInTheDocument();

    // Press 'd'
    await act(async () => {
      fireEvent.keyDown(window, { key: 'd' });
    });
    expect(screen.getByTestId('dice-tray-window')).toBeInTheDocument();

    // Press 'd' again to close
    await act(async () => {
      fireEvent.keyDown(window, { key: 'd' });
    });
    expect(screen.queryByTestId('dice-tray-window')).not.toBeInTheDocument();
  });
});
