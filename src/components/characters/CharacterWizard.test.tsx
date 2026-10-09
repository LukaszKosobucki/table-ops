import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CharacterWizard, DEFAULT_CHARACTERS } from './CharacterWizard';

describe('CharacterWizard Component (Chunk 3.2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders provided initial characters on mount without blink', () => {
    render(<CharacterWizard sessionId="test" initialCharacters={DEFAULT_CHARACTERS} />);
    expect(screen.getByText('Valerius z Ostrej Bieli')).toBeInTheDocument();
    expect(screen.getByText('Eldrin Srebrny Liść')).toBeInTheDocument();
  });

  it('shows skeleton while loading and renders fetched characters from API', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        characters: [
          {
            id: 'c-test-1',
            sessionId: 'test',
            name: 'Legolas Zielony Liść',
            type: 'HERO',
            race: 'Elf (Elf)',
            class: 'Tropiciel (Ranger)',
            level: 3,
            currentHp: 24,
            maxHp: 24,
            ac: 15,
            passivePerception: 14,
          },
        ],
      }),
    } as Response);

    render(<CharacterWizard sessionId="test" />);
    await waitFor(() => {
      expect(screen.getByText('Legolas Zielony Liść')).toBeInTheDocument();
    });
  });

  it('navigates through all wizard steps and creates a character with Standard Array and D&D math', async () => {
    const mockCreatedChar = {
      id: 'char-new-123',
      sessionId: 'test',
      name: 'Gimli Syn Gloina',
      type: 'HERO',
      race: 'Krasnolud (Dwarf)',
      class: 'Wojownik (Fighter)',
      level: 3,
      currentHp: 31,
      maxHp: 31,
      ac: 12,
      passivePerception: 10,
      stats: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
    };

    // Mock global fetch for POST /api/characters and GET /api/sessions/test/characters
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      if (typeof url === 'string' && url.includes('/api/characters') && init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({ success: true, character: mockCreatedChar }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({ success: true, characters: [] }),
      } as Response;
    });

    const onCreated = vi.fn();
    render(<CharacterWizard sessionId="test" onCharacterCreated={onCreated} />);

    // --- KROK 1: Wybór Rasy i Klasy ---
    expect(screen.getByText(/Krok 1: Wybierz Rasę i Klasę/i)).toBeInTheDocument();

    // Wybieramy Krasnoluda i Wojownika
    fireEvent.click(screen.getByText('Krasnolud (Dwarf)'));
    fireEvent.click(screen.getByText('Wojownik (Fighter)'));

    // Dalej: Przypisanie Atrybutów
    fireEvent.click(screen.getByText(/Dalej: Przypisanie Atrybutów/i));

    // --- KROK 2: Statystyki ---
    expect(screen.getByText(/Krok 2: Statystyki i Cechy Bazowe/i)).toBeInTheDocument();

    // Zastosuj Standard Array
    const standardArrayBtn = screen.getByText(/Standard Array/i);
    fireEvent.click(standardArrayBtn);

    // Przejście do Kroku 3
    fireEvent.click(screen.getByText(/Dalej: Nazwa i Poziom/i));

    // --- KROK 3: Tożsamość ---
    expect(screen.getByText(/Krok 3: Tożsamość i Poziom/i)).toBeInTheDocument();

    // Wpisanie imienia i poziomu 3
    const nameInput = screen.getByPlaceholderText('np. Thorin Dębowa Tarcza');
    fireEvent.change(nameInput, { target: { value: 'Gimli Syn Gloina' } });

    // Zmiana poziomu na 3
    const levelInputs = screen.getAllByRole('spinbutton');
    const levelInput = levelInputs[0];
    fireEvent.change(levelInput, { target: { value: '3' } });

    // Przejście do Kroku 4: Ekwipunek i Zaklęcia
    fireEvent.click(screen.getByText(/Dalej: Ekwipunek i Zaklęcia/i));

    // --- KROK 4: Ekwipunek Początkowy i Zaklęcia ---
    expect(screen.getByText(/Krok 4: Ekwipunek Początkowy i Zaklęcia/i)).toBeInTheDocument();
    // Krasnolud Wojownik ma domyślny ekwipunek
    expect(screen.getByText(/Długi miecz/i)).toBeInTheDocument();

    // Dodanie dodatkowego przedmiotu
    const itemInput = screen.getByTestId('wizard-new-item-input');
    fireEvent.change(itemInput, { target: { value: 'Mithrilowy Hełm' } });
    fireEvent.click(screen.getByTestId('wizard-add-item-btn'));
    expect(screen.getByText('Mithrilowy Hełm')).toBeInTheDocument();

    // Przejście do Kroku 5: Podsumowanie
    fireEvent.click(screen.getByTestId('wizard-to-summary-btn'));

    // --- KROK 5: Podsumowanie ---
    expect(screen.getByText(/Krok 5: Podsumowanie/i)).toBeInTheDocument();
    expect(screen.getByText('Gimli Syn Gloina')).toBeInTheDocument();
    expect(screen.getByText(/Poziom 3 • Krasnolud/i)).toBeInTheDocument();
    expect(screen.getByText('Mithrilowy Hełm')).toBeInTheDocument();

    // Zapis karty postaci
    const saveBtn = screen.getByText(/Zapisz Kartę Postaci/i);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/characters',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Gimli Syn Gloina'),
        })
      );
    });

    // Weryfikacja powrotu do widoku listy postaci i pojawienia się nowej karty postaci
    await waitFor(() => {
      expect(screen.getByText('Gimli Syn Gloina')).toBeInTheDocument();
      expect(screen.getByTestId('open-create-character-btn')).toBeInTheDocument();
      expect(onCreated).toHaveBeenCalledWith(expect.objectContaining({ name: 'Gimli Syn Gloina' }));
    });
  });

  it('renders spell slots preview on summary step for spellcaster classes', () => {
    render(<CharacterWizard sessionId="test" />);

    // Wybieramy Czarodzieja
    fireEvent.click(screen.getByText('Czarodziej (Wizard)'));
    fireEvent.click(screen.getByText(/Dalej: Przypisanie Atrybutów/i));

    // Krok 2 -> Krok 3
    fireEvent.click(screen.getByText(/Dalej: Nazwa i Poziom/i));

    // Wpisujemy imię
    const nameInput = screen.getByPlaceholderText('np. Thorin Dębowa Tarcza');
    fireEvent.change(nameInput, { target: { value: 'Raistlin' } });

    // Krok 3 -> Krok 4
    fireEvent.click(screen.getByText(/Dalej: Ekwipunek i Zaklęcia/i));

    // Krok 4 -> Krok 5
    fireEvent.click(screen.getByTestId('wizard-to-summary-btn'));

    // Weryfikacja sekcji slotów czarów
    expect(screen.getByText(/Dostępne Komórki Czarów/i)).toBeInTheDocument();
  });

  it('allows customizing equipment and spells in step 4', () => {
    render(<CharacterWizard sessionId="test" />);

    // Wybieramy Czarodzieja
    fireEvent.click(screen.getByText('Czarodziej (Wizard)'));
    fireEvent.click(screen.getByText(/Dalej: Przypisanie Atrybutów/i));
    fireEvent.click(screen.getByText(/Dalej: Nazwa i Poziom/i));

    const nameInput = screen.getByPlaceholderText('np. Thorin Dębowa Tarcza');
    fireEvent.change(nameInput, { target: { value: 'Galdor' } });

    fireEvent.click(screen.getByText(/Dalej: Ekwipunek i Zaklęcia/i));
    expect(screen.getByText(/Krok 4: Ekwipunek Początkowy i Zaklęcia/i)).toBeInTheDocument();

    // Dodanie własnego zaklęcia przez pole tekstowe
    const spellInput = screen.getByTestId('wizard-custom-spell-input');
    fireEvent.change(spellInput, { target: { value: 'Ognista Kula' } });
    const form = spellInput.closest('form');
    expect(form).not.toBeNull();
    if (form) fireEvent.submit(form);

    expect(screen.getByText('Ognista Kula')).toBeInTheDocument();

    // Przejście do kroku 5 i sprawdzenie czy zaklęcie jest w podsumowaniu
    fireEvent.click(screen.getByTestId('wizard-to-summary-btn'));
    expect(screen.getByText(/Krok 5: Podsumowanie/i)).toBeInTheDocument();
    expect(screen.getByText('Ognista Kula')).toBeInTheDocument();
  });

  it('opens CharacterInspectionCard when clicking a character card and returns to list when clicking back', () => {
    render(<CharacterWizard sessionId="test" initialCharacters={DEFAULT_CHARACTERS} />);

    // Click first character card
    const card = screen.getByTestId('character-card-c-1');
    fireEvent.click(card);

    // Verify detailed inspection card is opened
    expect(screen.getByText('Powrót do Walki / Tracker Inicjatywy')).toBeInTheDocument();
    expect(screen.getByText('Valerius z Ostrej Bieli')).toBeInTheDocument();
    expect(screen.getByText('Pancerz')).toBeInTheDocument();

    // Click back button
    fireEvent.click(screen.getByText('Powrót do Walki / Tracker Inicjatywy'));

    // Verify return to list
    expect(screen.getByText('Eldrin Srebrny Liść')).toBeInTheDocument();
    expect(screen.getByTestId('open-create-character-btn')).toBeInTheDocument();
  });
});
