import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { RollResult } from '@/lib/dice/types';
import { DiceTokensTray } from './DiceTokensTray';
import { PolyhedralDieToken } from './PolyhedralDieToken';

describe('DiceTokensTray & PolyhedralDieToken Components', () => {
  const mockRollResult: RollResult = {
    id: 'roll-test-1',
    requestId: 'req-1',
    timestamp: new Date().toISOString(),
    diceResults: [
      { id: 'd20-0', type: 'd20', value: 18, ignored: false },
      { id: 'd6-0', type: 'd6', value: 5, ignored: false },
    ],
    modifier: 3,
    total: 26,
    formula: '1d20 + 1d6 + 3',
    isSecret: false,
    actorName: 'Mistrz Gry',
  };

  it('renders empty placeholder when rollResult is null', () => {
    render(<DiceTokensTray rollResult={null} />);
    expect(screen.getByTestId('dice-tray-empty-placeholder')).toBeInTheDocument();
  });

  it('renders dice tokens tray with geometric shapes and rolled values', () => {
    render(<DiceTokensTray rollResult={mockRollResult} />);
    expect(screen.getByTestId('dice-tokens-tray')).toBeInTheDocument();

    const d20Token = screen.getByTestId('die-token-d20');
    const d6Token = screen.getByTestId('die-token-d6');

    expect(d20Token).toBeInTheDocument();
    expect(d6Token).toBeInTheDocument();

    // Contains rolled number values
    expect(d20Token).toHaveTextContent('18');
    expect(d6Token).toHaveTextContent('5');

    // Does NOT contain text labels like "k20" or "k6"
    expect(screen.queryByText('k20')).not.toBeInTheDocument();
    expect(screen.queryByText('k6')).not.toBeInTheDocument();
  });

  it('renders distinct SVG shapes for d4, d6, d8, d10, d12, d20', () => {
    const { container: c4 } = render(<PolyhedralDieToken type="d4" value={3} />);
    expect(c4.querySelector('polygon')).toBeInTheDocument();
    expect(c4).toHaveTextContent('3');

    const { container: c6 } = render(<PolyhedralDieToken type="d6" value={4} />);
    expect(c6.querySelector('rect')).toBeInTheDocument();
    expect(c6).toHaveTextContent('4');

    const { container: c8 } = render(<PolyhedralDieToken type="d8" value={7} />);
    expect(c8.querySelector('polygon')).toBeInTheDocument();
    expect(c8).toHaveTextContent('7');

    const { container: c10 } = render(<PolyhedralDieToken type="d10" value={9} />);
    expect(c10.querySelector('polygon')).toBeInTheDocument();
    expect(c10).toHaveTextContent('9');

    const { container: c12 } = render(<PolyhedralDieToken type="d12" value={11} />);
    expect(c12.querySelector('polygon')).toBeInTheDocument();
    expect(c12).toHaveTextContent('11');

    const { container: c20 } = render(<PolyhedralDieToken type="d20" value={15} />);
    expect(c20.querySelector('polygon')).toBeInTheDocument();
    expect(c20).toHaveTextContent('15');
  });

  it('marks Critical Success (Natural 20 on d20) with gold radiance and sparkle indicator', () => {
    render(<PolyhedralDieToken type="d20" value={20} />);
    expect(screen.getByTestId('crit-success-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('die-token-d20')).toHaveTextContent('20');
  });

  it('marks Critical Failure (Natural 1 on d20) with crimson flame indicator', () => {
    render(<PolyhedralDieToken type="d20" value={1} />);
    expect(screen.getByTestId('crit-failure-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('die-token-d20')).toHaveTextContent('1');
  });

  it('renders ignored die with strikethrough line', () => {
    const { container } = render(<PolyhedralDieToken type="d20" value={7} ignored={true} />);
    expect(screen.getByTestId('die-token-d20')).toBeInTheDocument();
    // Strikethrough line exists
    expect(container.querySelector('line[stroke="#ef4444"]')).toBeInTheDocument();
  });
});
