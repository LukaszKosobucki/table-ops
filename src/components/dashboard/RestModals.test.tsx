import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AddNoteModal } from './AddNoteModal';
import { LongRestModal } from './LongRestModal';
import { ShortRestModal } from './ShortRestModal';
import type { DashboardCharacter } from './types';

const mockHeroes: DashboardCharacter[] = [
  {
    id: 'hero-1',
    name: 'Valeros',
    type: 'HERO',
    currentHp: 5,
    maxHp: 25,
    ac: 16,
    passivePerception: 12,
    spells: {
      slots: {
        1: { max: 4, used: 3 },
      },
    },
  },
  {
    id: 'hero-2',
    name: 'Seoni',
    type: 'HERO',
    currentHp: 2,
    maxHp: 16,
    ac: 12,
    passivePerception: 14,
    spells: {
      slots: {
        1: { max: 4, used: 4 },
        2: { max: 2, used: 2 },
      },
    },
  },
];

describe('Rest & Timeline Modals (Chunk 7.2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('LongRestModal', () => {
    it('renders hero list with current vs max HP and spell slot status', () => {
      render(
        <LongRestModal
          isOpen={true}
          onClose={vi.fn()}
          sessionId="sess-1"
          heroes={mockHeroes}
          onRestComplete={vi.fn()}
        />
      );

      expect(screen.getByRole('heading', { name: /Długi Odpoczynek/i })).toBeInTheDocument();
      expect(screen.getByText('Valeros')).toBeInTheDocument();
      expect(screen.getByText('Seoni')).toBeInTheDocument();
      expect(screen.getByText(/5 \/ 25 HP/i)).toBeInTheDocument();
      expect(screen.getByText(/2 \/ 16 HP/i)).toBeInTheDocument();
    });

    it('submits long rest request to API and updates parent state', async () => {
      const mockOnRestComplete = vi.fn();
      const mockOnClose = vi.fn();

      const mockResponse = {
        success: true,
        log: {
          id: 'log-long-rest',
          sessionId: 'sess-1',
          logType: 'REST_LONG',
          description: 'Drużyna ukończyła Długi Odpoczynek (8h).',
          createdAt: new Date().toISOString(),
        },
        updatedCharacters: [
          { ...mockHeroes[0], currentHp: 25 },
          { ...mockHeroes[1], currentHp: 16 },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      render(
        <LongRestModal
          isOpen={true}
          onClose={mockOnClose}
          sessionId="sess-1"
          heroes={mockHeroes}
          onRestComplete={mockOnRestComplete}
        />
      );

      const confirmBtn = screen.getByTestId('confirm-long-rest-btn');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/sessions/sess-1/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logType: 'REST_LONG' }),
        });
        expect(mockOnRestComplete).toHaveBeenCalledWith(
          mockResponse.updatedCharacters,
          mockResponse.log
        );
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('ShortRestModal', () => {
    it('allows entering healed HP and submits to API', async () => {
      const mockOnRestComplete = vi.fn();
      const mockOnClose = vi.fn();

      const mockResponse = {
        success: true,
        log: {
          id: 'log-short-rest',
          sessionId: 'sess-1',
          logType: 'REST_SHORT',
          description: 'Krótki Odpoczynek (1h).',
          createdAt: new Date().toISOString(),
        },
        updatedCharacters: [{ ...mockHeroes[0], currentHp: 15 }],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      render(
        <ShortRestModal
          isOpen={true}
          onClose={mockOnClose}
          sessionId="sess-1"
          heroes={mockHeroes}
          onRestComplete={mockOnRestComplete}
        />
      );

      expect(screen.getByRole('heading', { name: /Krótki Odpoczynek/i })).toBeInTheDocument();

      const input = screen.getByTestId('heal-input-hero-1');
      fireEvent.change(input, { target: { value: '10' } });

      const confirmBtn = screen.getByTestId('confirm-short-rest-btn');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/sessions/sess-1/logs',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"hpHealed":10'),
          })
        );
        expect(mockOnRestComplete).toHaveBeenCalledWith(
          mockResponse.updatedCharacters,
          mockResponse.log
        );
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('AddNoteModal', () => {
    it('submits a narrative note to the session timeline', async () => {
      const mockOnNoteAdded = vi.fn();
      const mockOnClose = vi.fn();

      const mockResponse = {
        success: true,
        log: {
          id: 'log-note-1',
          sessionId: 'sess-1',
          logType: 'CUSTOM_NOTE',
          description: 'Drużyna znalazła tajemniczą mapę.',
          createdAt: new Date().toISOString(),
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      render(
        <AddNoteModal
          isOpen={true}
          onClose={mockOnClose}
          sessionId="sess-1"
          onNoteAdded={mockOnNoteAdded}
        />
      );

      const textarea = screen.getByTestId('note-description-input');
      fireEvent.change(textarea, { target: { value: 'Drużyna znalazła tajemniczą mapę.' } });

      const saveBtn = screen.getByTestId('save-note-btn');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/sessions/sess-1/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logType: 'CUSTOM_NOTE',
            description: 'Drużyna znalazła tajemniczą mapę.',
          }),
        });
        expect(mockOnNoteAdded).toHaveBeenCalledWith(mockResponse.log);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });
});
