import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DraggableNotesWindow } from './DraggableNotesWindow';

describe('DraggableNotesWindow (Chunk 9.2)', () => {
  it('does not render when isOpen is false or isMinimized is true', () => {
    const { rerender } = render(
      <DraggableNotesWindow
        isOpen={false}
        isMinimized={false}
        onClose={vi.fn()}
        onMinimize={vi.fn()}
        googleDocUrl={null}
        onSaveUrl={vi.fn()}
      />
    );

    expect(screen.queryByTestId('draggable-notes-window')).not.toBeInTheDocument();

    rerender(
      <DraggableNotesWindow
        isOpen={true}
        isMinimized={true}
        onClose={vi.fn()}
        onMinimize={vi.fn()}
        googleDocUrl={null}
        onSaveUrl={vi.fn()}
      />
    );

    expect(screen.queryByTestId('draggable-notes-window')).not.toBeInTheDocument();
  });

  it('renders URL setup form when no googleDocUrl is provided', () => {
    render(
      <DraggableNotesWindow
        isOpen={true}
        isMinimized={false}
        onClose={vi.fn()}
        onMinimize={vi.fn()}
        googleDocUrl={null}
        onSaveUrl={vi.fn()}
      />
    );

    expect(screen.getByTestId('draggable-notes-window')).toBeInTheDocument();
    expect(screen.getByTestId('notes-url-input')).toBeInTheDocument();
    expect(screen.getByTestId('notes-save-url-btn')).toBeInTheDocument();
    expect(screen.getByText('Podłącz Zewnętrzne Notatki Sesji')).toBeInTheDocument();
  });

  it('validates URL and calls onSaveUrl on valid submission', async () => {
    const onSaveUrl = vi.fn().mockResolvedValue(undefined);

    render(
      <DraggableNotesWindow
        isOpen={true}
        isMinimized={false}
        onClose={vi.fn()}
        onMinimize={vi.fn()}
        googleDocUrl={null}
        onSaveUrl={onSaveUrl}
      />
    );

    const input = screen.getByTestId('notes-url-input');
    const saveBtn = screen.getByTestId('notes-save-url-btn');

    // Invalid URL
    fireEvent.change(input, { target: { value: 'invalid-url' } });
    fireEvent.click(saveBtn);
    expect(screen.getByText('Invalid URL format')).toBeInTheDocument();
    expect(onSaveUrl).not.toHaveBeenCalled();

    // Valid Google Docs URL
    fireEvent.change(input, {
      target: {
        value: 'https://docs.google.com/document/d/12345/edit',
      },
    });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onSaveUrl).toHaveBeenCalledWith('https://docs.google.com/document/d/12345/edit');
    });
  });

  it('renders iframe when googleDocUrl is provided and converted to preview', () => {
    render(
      <DraggableNotesWindow
        isOpen={true}
        isMinimized={false}
        onClose={vi.fn()}
        onMinimize={vi.fn()}
        googleDocUrl="https://docs.google.com/document/d/12345/edit"
        onSaveUrl={vi.fn()}
      />
    );

    const iframe = screen.getByTestId('notes-iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', 'https://docs.google.com/document/d/12345/preview');

    // Check external link button
    const externalLink = screen.getByTestId('notes-external-link-btn');
    expect(externalLink).toHaveAttribute('href', 'https://docs.google.com/document/d/12345/edit');
  });

  it('calls onMinimize when minimize button is clicked', () => {
    const onMinimize = vi.fn();
    render(
      <DraggableNotesWindow
        isOpen={true}
        isMinimized={false}
        onClose={vi.fn()}
        onMinimize={onMinimize}
        googleDocUrl="https://docs.google.com/document/d/12345/preview"
        onSaveUrl={vi.fn()}
      />
    );

    const minBtn = screen.getByTestId('notes-minimize-btn');
    fireEvent.click(minBtn);
    expect(onMinimize).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <DraggableNotesWindow
        isOpen={true}
        isMinimized={false}
        onClose={onClose}
        onMinimize={vi.fn()}
        googleDocUrl="https://docs.google.com/document/d/12345/preview"
        onSaveUrl={vi.fn()}
      />
    );

    const closeBtn = screen.getByTestId('notes-close-btn');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('allows switching to edit mode and clearing the URL', async () => {
    const onSaveUrl = vi.fn().mockResolvedValue(undefined);
    render(
      <DraggableNotesWindow
        isOpen={true}
        isMinimized={false}
        onClose={vi.fn()}
        onMinimize={vi.fn()}
        googleDocUrl="https://docs.google.com/document/d/12345/preview"
        onSaveUrl={onSaveUrl}
      />
    );

    // Click edit URL in header
    const editBtn = screen.getByTestId('notes-edit-url-btn');
    fireEvent.click(editBtn);

    // Form is now visible with input containing existing URL
    const input = screen.getByTestId('notes-url-input');
    expect(input).toHaveValue('https://docs.google.com/document/d/12345/preview');

    // Click delete link
    const deleteBtn = screen.getByTitle('Usuń powiązany link');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(onSaveUrl).toHaveBeenCalledWith(null);
    });
  });
});
