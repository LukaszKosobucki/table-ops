import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SessionItem } from '../sessions/types';
import { Navbar } from './Navbar';

describe('Navbar Routing & Access Guard', () => {
  const mockActiveSession: SessionItem = {
    id: 's-1',
    name: 'Klątwa Strahda',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('locks other tabs when no session is active', async () => {
    const handleSetActiveTab = vi.fn();
    const user = userEvent.setup();

    render(
      <Navbar
        activeTab="sessions"
        setActiveTab={handleSetActiveTab}
        activeSession={null}
        sessions={[]}
      />
    );

    // Sessions tab should be enabled
    const sessionsBtn = screen.getByRole('button', { name: /sesje/i });
    expect(sessionsBtn).toBeEnabled();

    // Other tabs should be disabled
    const dashboardBtn = screen.getByRole('button', { name: /ekran prowadzenia/i });
    const bestiaryBtn = screen.getByRole('button', { name: /bestiariusz/i });
    const charactersBtn = screen.getByRole('button', { name: /kreator i karty postaci/i });
    const diceBtn = screen.getByRole('button', { name: /kości i real-time/i });

    expect(dashboardBtn).toBeDisabled();
    expect(bestiaryBtn).toBeDisabled();
    expect(charactersBtn).toBeDisabled();
    expect(diceBtn).toBeDisabled();

    // Clicking disabled tab should NOT trigger setActiveTab
    await user.click(dashboardBtn);
    expect(handleSetActiveTab).not.toHaveBeenCalled();
  });

  it('unlocks all tabs when a session is active', async () => {
    const handleSetActiveTab = vi.fn();
    const user = userEvent.setup();

    render(
      <Navbar
        activeTab="dashboard"
        setActiveTab={handleSetActiveTab}
        activeSession={mockActiveSession}
        sessions={[mockActiveSession]}
      />
    );

    const dashboardBtn = screen.getByRole('button', { name: /ekran prowadzenia/i });
    const bestiaryBtn = screen.getByRole('button', { name: /bestiariusz/i });

    expect(dashboardBtn).toBeEnabled();
    expect(bestiaryBtn).toBeEnabled();

    await user.click(bestiaryBtn);
    expect(handleSetActiveTab).toHaveBeenCalledWith('bestiary');
  });
});
