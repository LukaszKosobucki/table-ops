import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { EquipmentItem } from '@/lib/inventory';
import { InventoryManager } from './InventoryManager';

describe('InventoryManager Component (Chunk 11.3)', () => {
  const mockItems: EquipmentItem[] = [
    {
      id: 'item-1',
      name: 'Długi Miecz',
      category: 'Weapon',
      weight: 3,
      cost: '15 gp',
      isEquipped: true,
      isAttuned: false,
      requiresAttunement: false,
      weaponDetails: {
        damageDice: '1d8',
        damageType: 'Slashing',
        isFinesse: false,
        isRanged: false,
      },
      isCustom: false,
    },
    {
      id: 'item-2',
      name: 'Pierścień Ochrony',
      category: 'Ring',
      weight: 0,
      cost: 'Zmienna',
      isEquipped: true,
      isAttuned: true,
      requiresAttunement: true,
      isCustom: false,
    },
  ];

  it('renders inventory items, total weight, carrying capacity and attunement counter', () => {
    render(
      <InventoryManager
        items={mockItems}
        strengthScore={14} // 14 * 15 = 210 lbs capacity
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Długi Miecz')).toBeInTheDocument();
    expect(screen.getByText('Pierścień Ochrony')).toBeInTheDocument();
    expect(screen.getByText(/3 \/ 210 lbs/i)).toBeInTheDocument();
    expect(screen.getByText(/Dostrojone: 1\/3/i)).toBeInTheDocument();
  });

  it('toggles equipped status when clicking equip button', () => {
    const handleChange = vi.fn();
    render(<InventoryManager items={mockItems} strengthScore={10} onChange={handleChange} />);

    const equipBtn = screen.getByTestId('toggle-equipped-item-1');
    fireEvent.click(equipBtn);

    expect(handleChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'item-1',
          isEquipped: false,
        }),
      ])
    );
  });

  it('toggles attuned status when clicking attune button', () => {
    const handleChange = vi.fn();
    render(<InventoryManager items={mockItems} strengthScore={10} onChange={handleChange} />);

    const attuneBtn = screen.getByTestId('toggle-attuned-item-2');
    fireEvent.click(attuneBtn);

    expect(handleChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'item-2',
          isAttuned: false,
        }),
      ])
    );
  });

  it('removes item when clicking remove button', () => {
    const handleChange = vi.fn();
    render(<InventoryManager items={mockItems} strengthScore={10} onChange={handleChange} />);

    const removeBtn = screen.getByTestId('remove-item-item-1');
    fireEvent.click(removeBtn);

    expect(handleChange).toHaveBeenCalledWith(
      expect.not.arrayContaining([expect.objectContaining({ id: 'item-1' })])
    );
  });
});
