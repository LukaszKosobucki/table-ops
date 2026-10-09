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

    // Session selector should be enabled in header
    const sessionsBtns = screen.getAllByRole('button', { name: /wybierz sesję/i });
    expect(sessionsBtns[0]).toBeEnabled();
    expect(screen.queryByRole('button', { name: /^sesje$/i })).not.toBeInTheDocument();

    // Other tabs should be disabled
    const dashboardBtn = screen.getByRole('button', { name: /ekran prowadzenia/i });
    const bestiaryBtn = screen.getByRole('button', { name: /bestiariusz/i });
    const charactersBtn = screen.getByRole('button', { name: /kreator i karty postaci/i });

    expect(dashboardBtn).toBeDisabled();
    expect(bestiaryBtn).toBeDisabled();
    expect(charactersBtn).toBeDisabled();
    expect(screen.queryByRole('button', { name: /kości i real-time/i })).not.toBeInTheDocument();

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

  describe('Auth Profile & Indicators (Chunk 6.2)', () => {
    it('renders login link when user is not logged in', () => {
      render(
        <Navbar activeTab="sessions" setActiveTab={vi.fn()} activeSession={null} user={null} />
      );

      const loginBtn = screen.getByTestId('login-link-btn');
      expect(loginBtn).toBeInTheDocument();
      expect(loginBtn).toHaveAttribute('href', '/login');
      expect(screen.queryByTestId('user-profile-badge')).not.toBeInTheDocument();
    });

    it('renders user avatar initial and triggers onSignOut when logged in', async () => {
      const handleSignOut = vi.fn();
      const user = userEvent.setup();

      render(
        <Navbar
          activeTab="sessions"
          setActiveTab={vi.fn()}
          activeSession={null}
          user={{
            email: 'strahd@barovia.com',
            user_metadata: { name: 'Hrabia Strahd' },
          }}
          onSignOut={handleSignOut}
        />
      );

      expect(screen.getByTestId('user-profile-badge')).toBeInTheDocument();
      expect(screen.getByText('S')).toBeInTheDocument();
      expect(screen.getByText('Hrabia Strahd')).toBeInTheDocument();
      expect(screen.queryByTestId('login-link-btn')).not.toBeInTheDocument();

      const logoutBtn = screen.getByTestId('logout-btn');
      await user.click(logoutBtn);
      expect(handleSignOut).toHaveBeenCalled();
    });
  });
});
