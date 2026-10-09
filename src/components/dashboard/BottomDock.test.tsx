import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BottomDock } from './BottomDock';

describe('BottomDock (Chunk 9.2 & Phase 10)', () => {
  it('renders bottom dock with default state', () => {
    render(
      <BottomDock
        isNotesOpen={false}
        isNotesMinimized={false}
        onRestoreNotes={vi.fn()}
        onToggleNotes={vi.fn()}
        hasNotesUrl={false}
      />
    );

    expect(screen.getByTestId('bottom-dock')).toBeInTheDocument();
    expect(screen.getByTestId('dock-notes-btn')).toBeInTheDocument();
    expect(screen.getByTestId('dock-dice-btn')).toBeInTheDocument();
  });

  it('renders minimized notes button with pulsing indicator when notes window is minimized', () => {
    const handleRestoreNotes = vi.fn();
    render(
      <BottomDock
        isNotesOpen={true}
        isNotesMinimized={true}
        onRestoreNotes={handleRestoreNotes}
        onToggleNotes={vi.fn()}
        hasNotesUrl={true}
      />
    );

    const minBtn = screen.getByTestId('dock-minimized-notes-btn');
    expect(minBtn).toBeInTheDocument();
    expect(minBtn).toHaveTextContent('Zewnętrzne Notatki');

    fireEvent.click(minBtn);
    expect(handleRestoreNotes).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleNotes or onRestoreNotes when regular dock notes button is clicked', () => {
    const handleToggleNotes = vi.fn();
    render(
      <BottomDock
        isNotesOpen={false}
        isNotesMinimized={false}
        onRestoreNotes={vi.fn()}
        onToggleNotes={handleToggleNotes}
        hasNotesUrl={false}
      />
    );

    const notesBtn = screen.getByTestId('dock-notes-btn');
    fireEvent.click(notesBtn);
    expect(handleToggleNotes).toHaveBeenCalledTimes(1);
  });

  it('renders minimized dice button when dice tray is minimized and restores on click', () => {
    const handleRestoreDice = vi.fn();
    render(
      <BottomDock
        isNotesOpen={false}
        isNotesMinimized={false}
        onRestoreNotes={vi.fn()}
        onToggleNotes={vi.fn()}
        hasNotesUrl={false}
        isDiceOpen={true}
        isDiceMinimized={true}
        onRestoreDice={handleRestoreDice}
      />
    );

    const minDiceBtn = screen.getByTestId('dock-minimized-dice-btn');
    expect(minDiceBtn).toBeInTheDocument();
    expect(minDiceBtn).toHaveTextContent('Rzutnik Kości');

    fireEvent.click(minDiceBtn);
    expect(handleRestoreDice).toHaveBeenCalledTimes(1);
  });
});
