import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CharacterSkillsList } from './CharacterSkillsList';

describe('CharacterSkillsList Component', () => {
  const defaultStats = {
    str: 16, // +3
    dex: 14, // +2
    con: 12, // +1
    int: 10, // 0
    wis: 8, // -1
    cha: 15, // +2
  };

  it('renders all 18 skills and displays the correct proficiency bonus', () => {
    render(
      <CharacterSkillsList
        stats={defaultStats}
        level={5} // PB = +3
        skills={{}}
      />
    );

    // Header with PB
    expect(screen.getByText(/PB: \+3/i)).toBeInTheDocument();

    // Check presence of several key skills
    expect(screen.getByText('Atletyka')).toBeInTheDocument();
    expect(screen.getByText('Akrobatyka')).toBeInTheDocument();
    expect(screen.getByText('Wiedza tajemna')).toBeInTheDocument();
    expect(screen.getByText('Percepcja')).toBeInTheDocument();
    expect(screen.getByText('Perswazja')).toBeInTheDocument();
  });

  it('correctly calculates modifiers for none, proficient, and expertise', () => {
    // Level 1: PB = +2
    // STR: 16 (+3). Athletics none: +3, proficient: +5, expertise: +7
    // DEX: 14 (+2). Stealth proficient (+4)
    // WIS: 8 (-1). Perception expertise (-1 + 2*2 = +3)
    render(
      <CharacterSkillsList
        stats={defaultStats}
        level={1}
        skills={{
          athletics: 'none',
          stealth: 'proficient',
          perception: 'expertise',
        }}
      />
    );

    // Athletics (+3)
    const athleticsRow = screen.getByTestId('skill-row-athletics');
    expect(athleticsRow).toHaveTextContent('+3');

    // Stealth (+4)
    const stealthRow = screen.getByTestId('skill-row-stealth');
    expect(stealthRow).toHaveTextContent('+4');

    // Perception (+3)
    const perceptionRow = screen.getByTestId('skill-row-perception');
    expect(perceptionRow).toHaveTextContent('+3');
  });

  it('calls onSkillToggle when clicking the toggle button', () => {
    const handleToggle = vi.fn();
    render(
      <CharacterSkillsList
        stats={defaultStats}
        level={1}
        skills={{ athletics: 'none' }}
        onSkillToggle={handleToggle}
      />
    );

    const toggleBtn = screen.getByTestId('skill-toggle-athletics');
    fireEvent.click(toggleBtn);

    expect(handleToggle).toHaveBeenCalledWith('athletics');
  });

  it('calls onRollSkill when clicking the roll button', () => {
    const handleRoll = vi.fn();
    render(
      <CharacterSkillsList
        stats={defaultStats}
        level={1} // PB = +2
        skills={{ athletics: 'proficient' }} // 16 STR (+3) + 2 = +5
        onRollSkill={handleRoll}
      />
    );

    const rollBtn = screen.getByTestId('skill-roll-athletics');
    fireEvent.click(rollBtn);

    expect(handleRoll).toHaveBeenCalledWith('athletics', 'Atletyka', 5);
  });
});
