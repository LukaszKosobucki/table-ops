import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DraggableDiceTray } from './DraggableDiceTray';

describe('DraggableDiceTray Component', () => {
  const defaultProps = {
    isOpen: true,
    isMinimized: false,
    onClose: vi.fn(),
    onMinimize: vi.fn(),
    onRoll: vi.fn(),
    actorName: 'Mistrz Gry',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<DraggableDiceTray {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders floating window when isOpen is true', () => {
    render(<DraggableDiceTray {...defaultProps} />);
    expect(screen.getByTestId('dice-tray-window')).toBeInTheDocument();
    expect(screen.getByText('Podręczny Rzutnik Kości')).toBeInTheDocument();
    expect(screen.getByTestId('roll-dice-btn')).toBeInTheDocument();
  });

  it('increments dice pool count when clicking dice buttons', async () => {
    render(<DraggableDiceTray {...defaultProps} />);

    // Click d6 twice
    const d6Btn = screen.getByTestId('die-btn-d6');
    fireEvent.click(d6Btn);
    fireEvent.click(d6Btn);

    // Click d20 once
    const d20Btn = screen.getByTestId('die-btn-d20');
    fireEvent.click(d20Btn);

    // Formula summary should reflect 2d6 + 1d20
    expect(screen.getByTestId('dice-pool-formula')).toHaveTextContent('2d6 + 1d20');
  });

  it('adjusts numeric modifier stepper', () => {
    render(<DraggableDiceTray {...defaultProps} />);

    const incModBtn = screen.getByTestId('modifier-plus-btn');
    const decModBtn = screen.getByTestId('modifier-minus-btn');

    fireEvent.click(incModBtn);
    fireEvent.click(incModBtn);
    expect(screen.getByTestId('modifier-input')).toHaveValue(2);

    fireEvent.click(decModBtn);
    fireEvent.click(decModBtn);
    fireEvent.click(decModBtn);
    expect(screen.getByTestId('modifier-input')).toHaveValue(-1);
  });

  it('clears dice pool when clicking Clear button', () => {
    render(<DraggableDiceTray {...defaultProps} />);

    // Add some dice and modifier
    fireEvent.click(screen.getByTestId('die-btn-d8'));
    fireEvent.click(screen.getByTestId('modifier-plus-btn'));

    expect(screen.getByTestId('dice-pool-formula')).toHaveTextContent('1d8 + 1');

    // Click Clear
    fireEvent.click(screen.getByTestId('clear-pool-btn'));

    expect(screen.getByTestId('modifier-input')).toHaveValue(0);
    expect(screen.getByTestId('dice-pool-formula')).toHaveTextContent('0');
  });

  it('switches advantage and disadvantage modes for d20', () => {
    render(<DraggableDiceTray {...defaultProps} />);

    fireEvent.click(screen.getByTestId('die-btn-d20'));

    const advBtn = screen.getByTestId('adv-mode-advantage');
    fireEvent.click(advBtn);
    expect(screen.getByTestId('dice-pool-formula')).toHaveTextContent('1d20 (Advantage)');

    const disadvBtn = screen.getByTestId('adv-mode-disadvantage');
    fireEvent.click(disadvBtn);
    expect(screen.getByTestId('dice-pool-formula')).toHaveTextContent('1d20 (Disadvantage)');

    const standardBtn = screen.getByTestId('adv-mode-none');
    fireEvent.click(standardBtn);
    expect(screen.getByTestId('dice-pool-formula')).toHaveTextContent('1d20');
  });

  it('executes roll when clicking Roll button and invokes onRoll callback', () => {
    const onRoll = vi.fn();
    render(<DraggableDiceTray {...defaultProps} onRoll={onRoll} />);

    // Add 2d6 + 3
    fireEvent.click(screen.getByTestId('die-btn-d6'));
    fireEvent.click(screen.getByTestId('die-btn-d6'));
    fireEvent.click(screen.getByTestId('modifier-plus-btn'));
    fireEvent.click(screen.getByTestId('modifier-plus-btn'));
    fireEvent.click(screen.getByTestId('modifier-plus-btn'));

    fireEvent.click(screen.getByTestId('roll-dice-btn'));

    // onRoll callback called
    expect(onRoll).toHaveBeenCalledTimes(1);
    const result = onRoll.mock.calls[0][0];
    expect(result.diceResults).toHaveLength(2);
    expect(result.modifier).toBe(3);
    expect(result.total).toBeGreaterThanOrEqual(5);
    expect(result.total).toBeLessThanOrEqual(15);

    // Result card appears
    expect(screen.getByTestId('dice-result-card')).toBeInTheDocument();
    expect(screen.getByTestId('dice-result-total')).toHaveTextContent(String(result.total));
  });

  it('renders quick polyhedral dice tokens tray when rolling', () => {
    render(<DraggableDiceTray {...defaultProps} />);

    // Initially placeholder is present
    expect(screen.getByTestId('dice-tray-empty-placeholder')).toBeInTheDocument();

    // Roll 1d20
    fireEvent.click(screen.getByTestId('die-btn-d20'));
    fireEvent.click(screen.getByTestId('roll-dice-btn'));

    // Dice tokens tray should now display the d20 token
    expect(screen.getByTestId('dice-tokens-tray')).toBeInTheDocument();
    expect(screen.getByTestId('die-token-d20')).toBeInTheDocument();
  });

  it('calls onMinimize when clicking minimize button', () => {
    const onMinimize = vi.fn();
    render(<DraggableDiceTray {...defaultProps} onMinimize={onMinimize} />);

    fireEvent.click(screen.getByTestId('minimize-dice-tray-btn'));
    expect(onMinimize).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking close button', () => {
    const onClose = vi.fn();
    render(<DraggableDiceTray {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('close-dice-tray-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('responds to keyboard shortcuts (Enter to roll, Esc to close, C to clear)', async () => {
    const onClose = vi.fn();
    const onRoll = vi.fn();
    render(<DraggableDiceTray {...defaultProps} onClose={onClose} onRoll={onRoll} />);

    // Add die
    fireEvent.click(screen.getByTestId('die-btn-d10'));

    // Press 'c' to clear
    fireEvent.keyDown(window, { key: 'c' });
    expect(screen.getByTestId('dice-pool-formula')).toHaveTextContent('0');

    // Add die back
    fireEvent.click(screen.getByTestId('die-btn-d10'));

    // Press Enter to roll
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onRoll).toHaveBeenCalledTimes(1);

    // Press Escape to close
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('records roll in history and allows rerolling past pool', () => {
    render(<DraggableDiceTray {...defaultProps} />);

    // Roll 1d12 + 2
    fireEvent.click(screen.getByTestId('die-btn-d12'));
    fireEvent.click(screen.getByTestId('modifier-plus-btn'));
    fireEvent.click(screen.getByTestId('modifier-plus-btn'));
    fireEvent.click(screen.getByTestId('roll-dice-btn'));

    // Open history drawer
    fireEvent.click(screen.getByTestId('toggle-history-btn'));

    // History item should be visible
    const historyItem = screen.getByTestId('roll-history-item-0');
    expect(historyItem).toBeInTheDocument();
    expect(historyItem).toHaveTextContent('1d12 + 2');

    // Click Reroll button on history item
    const rerollBtn = screen.getByTestId('reroll-btn-0');
    fireEvent.click(rerollBtn);

    // Formula is restored to 1d12 + 2
    expect(screen.getByTestId('dice-pool-formula')).toHaveTextContent('1d12 + 2');
  });
});
