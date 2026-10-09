'use client';

import {
  ExternalLink,
  FileText,
  GripHorizontal,
  Info,
  Link2,
  Minus,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toEmbeddableNotesUrl, validateExternalNotesUrl } from '@/lib/external-notes';

interface DraggableNotesWindowProps {
  isOpen: boolean;
  isMinimized: boolean;
  onClose: () => void;
  onMinimize: () => void;
  googleDocUrl: string | null;
  onSaveUrl: (url: string | null) => Promise<void> | void;
}

export function DraggableNotesWindow({
  isOpen,
  isMinimized,
  onClose,
  onMinimize,
  googleDocUrl,
  onSaveUrl,
}: DraggableNotesWindowProps) {
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 80, y: 70 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const [isEditingUrl, setIsEditingUrl] = useState(!googleDocUrl);
  const [inputUrl, setInputUrl] = useState(googleDocUrl || '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync inputUrl when googleDocUrl changes from external sources
  useEffect(() => {
    if (googleDocUrl) {
      setInputUrl(googleDocUrl);
      setIsEditingUrl(false);
    } else {
      setInputUrl('');
      setIsEditingUrl(true);
    }
  }, [googleDocUrl]);

  // Center window on initial mount if on desktop
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const defaultWidth = Math.min(800, window.innerWidth - 40);
      const initialX = Math.max(20, Math.round((window.innerWidth - defaultWidth) / 2));
      const initialY = Math.max(40, Math.round((window.innerHeight - 580) / 3));
      setPosition({ x: initialX, y: initialY });
    }
  }, []);

  // Pointer drag handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag with primary mouse button / touch
    if (e.button !== 0) return;
    setIsDragging(true);
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging) return;
      const newX = e.clientX - dragOffsetRef.current.x;
      const newY = e.clientY - dragOffsetRef.current.y;

      const windowWidth = windowRef.current?.offsetWidth || 760;
      const windowHeight = windowRef.current?.offsetHeight || 560;

      const maxX = Math.max(0, window.innerWidth - windowWidth - 10);
      const maxY = Math.max(0, window.innerHeight - windowHeight - 40);

      setPosition({
        x: Math.min(Math.max(10, newX), maxX),
        y: Math.min(Math.max(10, newY), maxY),
      });
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setValidationError(null);

    const validation = validateExternalNotesUrl(inputUrl);
    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }

    setIsSaving(true);
    try {
      await onSaveUrl(validation.url);
      setIsEditingUrl(false);
    } catch (err) {
      setValidationError('Wystąpił błąd podczas zapisywania linku.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearUrl = async () => {
    setIsSaving(true);
    try {
      await onSaveUrl(null);
      setInputUrl('');
      setIsEditingUrl(true);
    } catch (err) {
      setValidationError('Wystąpił błąd podczas usuwania linku.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || isMinimized) {
    return null;
  }

  const embedUrl = toEmbeddableNotesUrl(googleDocUrl);

  return (
    <div
      ref={windowRef}
      data-testid="draggable-notes-window"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      className="fixed z-50 w-[780px] max-w-[95vw] h-[580px] max-h-[85vh] flex flex-col rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl shadow-black/80 overflow-hidden transition-shadow select-none animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Draggable Title Bar */}
      <div
        data-testid="draggable-notes-header"
        onPointerDown={handlePointerDown}
        className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-slate-500" />
          <FileText className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
            Zewnętrzne Notatki GM-a
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/60 hidden sm:inline-block">
            Google Docs / Web
          </span>
        </div>

        {/* Window controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {googleDocUrl && !isEditingUrl && (
            <>
              <button
                type="button"
                data-testid="notes-edit-url-btn"
                onClick={() => setIsEditingUrl(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                title="Zmień adres URL notatek"
              >
                <Link2 className="w-3.5 h-3.5" />
              </button>
              <a
                href={googleDocUrl ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="notes-external-link-btn"
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
                title="Otwórz w nowej karcie przeglądarki"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </>
          )}

          <button
            type="button"
            data-testid="notes-minimize-btn"
            onClick={onMinimize}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition cursor-pointer"
            title="Minimalizuj do paska zadań na dole"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            data-testid="notes-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
            title="Zamknij okno"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Window Body */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/60 select-auto">
        {isEditingUrl ? (
          /* URL Configuration Form */
          <div className="flex-1 p-6 flex flex-col justify-center items-center text-center overflow-y-auto">
            <div className="max-w-md w-full space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto shadow-inner">
                <FileText className="w-6 h-6 text-amber-400" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Podłącz Zewnętrzne Notatki Sesji
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Wklej bezpośredni link do dokumentu Google Docs, folderu Google Drive lub dowolnej
                  strony z notatkami (np. Notion, Obsidian Publish).
                </p>
              </div>

              <form noValidate onSubmit={handleSave} className="space-y-3 text-left">
                <div>
                  <label
                    htmlFor="google-doc-url-input"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    Adres URL dokumentu:
                  </label>
                  <input
                    id="google-doc-url-input"
                    data-testid="notes-url-input"
                    type="url"
                    value={inputUrl}
                    onChange={(e) => {
                      setInputUrl(e.target.value);
                      setValidationError(null);
                    }}
                    placeholder="https://docs.google.com/document/d/.../edit"
                    className="w-full text-xs font-mono p-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:outline-none text-slate-200 placeholder-slate-500"
                  />
                  {validationError && (
                    <p className="text-xs text-rose-400 mt-1 font-medium">{validationError}</p>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5 text-left">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 leading-relaxed">
                    <p className="font-semibold text-slate-200">
                      Wskazówka Google Docs (Jak uniknąć błędu 403):
                    </p>
                    <p>
                      Google celowo blokuje logowanie do kont wewnątrz ramek. Aby podgląd działał w
                      oknie bez autoryzacji:
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-300 pl-0.5">
                      <li>
                        W dokumencie kliknij:{' '}
                        <em>Udostępnij ➔ Ogólny dostęp: „Każda osoba mająca link”</em>{' '}
                        (Przeglądający), LUB
                      </li>
                      <li>
                        Wybierz: <em>Plik ➔ Udostępnij ➔ Opublikuj w internecie ➔ Opublikuj</em>.
                      </li>
                    </ul>
                    <p className="text-[10px] text-indigo-300 pt-0.5">
                      Prywatne notatki możesz zawsze błyskawicznie otworzyć w nowej karcie z pełnymi
                      uprawnieniami konta za pomocą przycisku <em>„Otwórz w Google Docs ↗”</em>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    data-testid="notes-save-url-btn"
                    disabled={isSaving}
                    className="flex-1 py-2 px-4 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'Zapisywanie...' : 'Zapisz i Wyświetl Notatki'}
                  </button>

                  {googleDocUrl && (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditingUrl(false)}
                        className="py-2 px-3 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                      >
                        Anuluj
                      </button>
                      <button
                        type="button"
                        onClick={handleClearUrl}
                        className="p-2 rounded-xl text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 border border-rose-900/40 transition cursor-pointer"
                        title="Usuń powiązany link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Smart Embed View */
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Info Bar */}
            <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate max-w-[420px] font-mono text-slate-400">
                {googleDocUrl}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingUrl(true)}
                  className="hover:text-slate-200 transition underline underline-offset-2 cursor-pointer"
                >
                  Zmień link
                </button>
                <a
                  href={googleDocUrl ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                >
                  <span>Otwórz w Google Docs</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Google Docs 403 / Access Tip Banner */}
            <div className="px-3 py-1.5 bg-amber-950/40 border-b border-amber-500/20 text-[11px] text-amber-200/90 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 truncate">
                <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">
                  Widzisz błąd 403? W Google Docs wybierz:{' '}
                  <strong>Udostępnij ➔ Każda osoba mająca link</strong> lub:
                </span>
              </div>
              <a
                href={googleDocUrl ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-[10px] flex items-center gap-1 transition"
                title="Otwórz dokument bezpośrednio z zalogowanym kontem Google"
              >
                <span>Otwórz z kontem Google ↗</span>
              </a>
            </div>

            {/* Smart Embed Iframe */}
            <div className="flex-1 relative bg-white overflow-hidden">
              {embedUrl ? (
                <iframe
                  data-testid="notes-iframe"
                  src={embedUrl}
                  title="Podgląd notatek sesji"
                  className="w-full h-full border-0"
                  allow="clipboard-write"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                  Brak poprawnego adresu URL podglądu.
                </div>
              )}
            </div>

            {/* Bottom Status Tip */}
            <div className="px-3 py-1 bg-slate-950 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-900">
              <span>Smart Embed: tryb podglądu dokumentu</span>
              <span className="hidden sm:inline">
                Google celowo blokuje logowanie w ramkach iframe (ochrona clickjacking).
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
