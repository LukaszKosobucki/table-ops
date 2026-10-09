import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ActionEconomyBar } from './ActionEconomyBar';
import type { CombatantTurnResources } from './types';

describe('ActionEconomyBar Component (Chunk 11.1)', () => {
  const baseResources: CombatantTurnResources = {
    actionUsed: false,
    bonusActionUsed: false,
    reactionUsed: false,
    extraActions: 0,
    extraActionsUsed: 0,
    totalAttacks: 3,
    attacksRemaining: 3,
    attacks: [
      { id: 'atk-1', name: 'Ugryzienie', used: false },
      { id: 'atk-2', name: 'Pazur 1', used: false },
      { id: 'atk-3', name: 'Pazur 2', used: false },
    ],
  };

  it('renders Action, Bonus Action, Reaction pips and multiattack bar', () => {
    render(
      <ActionEconomyBar
        combatantId="comb-1"
        resources={baseResources}
        onToggleAction={vi.fn()}
        onAddExtraAction={vi.fn()}
        onToggleAttackSegment={vi.fn()}
      />
    );

    expect(screen.getByText(/ZASOBY TURY/i)).toBeInTheDocument();
    expect(screen.getByTestId('pip-action')).toHaveTextContent(/Akcja/i);
    expect(screen.getByTestId('pip-bonus-action')).toHaveTextContent(/Bonus Action/i);
    expect(screen.getByTestId('pip-reaction')).toHaveTextContent(/Reakcja/i);

    expect(screen.getByText(/MULTIATTACK/i)).toBeInTheDocument();
    expect(screen.getByText('Ugryzienie')).toBeInTheDocument();
    expect(screen.getByText('Pazur 1')).toBeInTheDocument();
    expect(screen.getByText('Pazur 2')).toBeInTheDocument();
    expect(screen.getByTestId('multiattack-remaining')).toHaveTextContent('(Pozostało: 3/3)');
  });

  it('displays used state with line-through and strikethrough styling', () => {
    const usedResources: CombatantTurnResources = {
      ...baseResources,
      actionUsed: true,
      bonusActionUsed: true,
      reactionUsed: true,
    };

    render(
      <ActionEconomyBar
        combatantId="comb-1"
        resources={usedResources}
        onToggleAction={vi.fn()}
        onAddExtraAction={vi.fn()}
      />
    );

    const actionPip = screen.getByTestId('pip-action');
    expect(actionPip).toHaveTextContent(/Zużyta/i);
    expect(actionPip.className).toContain('line-through');

    const bonusPip = screen.getByTestId('pip-bonus-action');
    expect(bonusPip).toHaveTextContent(/Zużyta/i);
    expect(bonusPip.className).toContain('line-through');

    const reactionPip = screen.getByTestId('pip-reaction');
    expect(reactionPip).toHaveTextContent(/Zużyta/i);
    expect(reactionPip.className).toContain('line-through');
  });

  it('triggers onToggleAction when clicking action pips', () => {
    const handleToggle = vi.fn();
    render(
      <ActionEconomyBar
        combatantId="comb-1"
        resources={baseResources}
        onToggleAction={handleToggle}
        onAddExtraAction={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('pip-action'));
    expect(handleToggle).toHaveBeenCalledWith('action');

    fireEvent.click(screen.getByTestId('pip-bonus-action'));
    expect(handleToggle).toHaveBeenCalledWith('bonus_action');

    fireEvent.click(screen.getByTestId('pip-reaction'));
    expect(handleToggle).toHaveBeenCalledWith('reaction');
  });

  it('triggers onAddExtraAction when clicking "+ Dodaj akcję"', () => {
    const handleAdd = vi.fn();
    render(
      <ActionEconomyBar
        combatantId="comb-1"
        resources={baseResources}
        onToggleAction={vi.fn()}
        onAddExtraAction={handleAdd}
      />
    );

    const addBtn = screen.getByTestId('add-extra-action-btn');
    fireEvent.click(addBtn);
    expect(handleAdd).toHaveBeenCalledTimes(1);
  });

  it('renders extra action pip when extraActions > 0 and allows toggling it', () => {
    const handleToggle = vi.fn();
    const withExtra: CombatantTurnResources = {
      ...baseResources,
      extraActions: 1,
      extraActionsUsed: 0,
    };

    render(
      <ActionEconomyBar
        combatantId="comb-1"
        resources={withExtra}
        onToggleAction={handleToggle}
        onAddExtraAction={vi.fn()}
      />
    );

    const extraPip = screen.getByTestId('pip-extra-action-0');
    expect(extraPip).toBeInTheDocument();
    expect(extraPip).toHaveTextContent(/Dodatkowa Akcja/i);

    fireEvent.click(extraPip);
    expect(handleToggle).toHaveBeenCalledWith('extra_action', 0);
  });

  it('triggers onToggleAttackSegment when clicking a multiattack item', () => {
    const handleToggleSegment = vi.fn();
    render(
      <ActionEconomyBar
        combatantId="comb-1"
        resources={baseResources}
        onToggleAction={vi.fn()}
        onAddExtraAction={vi.fn()}
        onToggleAttackSegment={handleToggleSegment}
      />
    );

    const biteBtn = screen.getByTestId('attack-segment-atk-1');
    fireEvent.click(biteBtn);
    expect(handleToggleSegment).toHaveBeenCalledWith('atk-1');
  });

  it('reflects checked attacks with remaining counter updated', () => {
    const partialUsed: CombatantTurnResources = {
      ...baseResources,
      attacksRemaining: 2,
      attacks: [
        { id: 'atk-1', name: 'Ugryzienie', used: true },
        { id: 'atk-2', name: 'Pazur 1', used: false },
        { id: 'atk-3', name: 'Pazur 2', used: false },
      ],
    };

    render(
      <ActionEconomyBar
        combatantId="comb-1"
        resources={partialUsed}
        onToggleAction={vi.fn()}
        onAddExtraAction={vi.fn()}
      />
    );

    const biteBtn = screen.getByTestId('attack-segment-atk-1');
    expect(biteBtn.className).toContain('line-through');
    expect(screen.getByTestId('multiattack-remaining')).toHaveTextContent('(Pozostało: 2/3)');
  });
});
