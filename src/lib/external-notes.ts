export interface ExternalNotesUrlValidationSuccess {
  valid: true;
  url: string | null;
}

export interface ExternalNotesUrlValidationError {
  valid: false;
  error: string;
}

export type ExternalNotesUrlValidationResult =
  | ExternalNotesUrlValidationSuccess
  | ExternalNotesUrlValidationError;

/**
 * Validates external notes URL (e.g. Google Docs / Drive / Sheets / web notes):
 * - If null, undefined, or empty/whitespace string => valid with null (clearing the URL)
 * - Must be a valid URL with http or https protocol
 */
export function validateExternalNotesUrl(url: unknown): ExternalNotesUrlValidationResult {
  if (url === null || url === undefined || url === '') {
    return { valid: true, url: null };
  }

  if (typeof url !== 'string') {
    return { valid: false, error: 'External notes URL must be a string' };
  }

  const trimmed = url.trim();
  if (trimmed === '') {
    return { valid: true, url: null };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'URL must use http or https protocol' };
    }
    return { valid: true, url: parsed.toString() };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Transforms an external notes URL into an embeddable format for iframe if applicable.
 * For Google Docs, Sheets, Slides: converts /edit... to /preview to avoid iframe header blocking.
 */
export function toEmbeddableNotesUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    // Google Docs / Sheets / Slides: https://docs.google.com/document/d/{ID}/edit... -> .../preview
    if (parsed.hostname === 'docs.google.com') {
      const pathname = parsed.pathname;

      // Google Docs "Opublikuj w internecie" (/pub or /pub?embedded=true)
      if (pathname.includes('/pub')) {
        parsed.searchParams.set('embedded', 'true');
        return parsed.toString();
      }

      if (pathname.includes('/edit')) {
        parsed.pathname = pathname.replace(/\/edit.*$/, '/preview');
        parsed.search = '';
        parsed.hash = '';
        return parsed.toString();
      }
      if (
        !pathname.endsWith('/preview') &&
        (pathname.includes('/document/d/') ||
          pathname.includes('/spreadsheets/d/') ||
          pathname.includes('/presentation/d/'))
      ) {
        parsed.pathname = `${pathname.replace(/\/+$/, '')}/preview`;
        parsed.search = '';
        parsed.hash = '';
        return parsed.toString();
      }
    }

    // Google Drive files & folders
    if (parsed.hostname === 'drive.google.com') {
      const pathname = parsed.pathname;

      // Google Drive folder: /drive/folders/{id} or /drive/u/0/folders/{id}
      const folderMatch = pathname.match(/\/folders\/([a-zA-Z0-9_-]+)/);
      if (folderMatch) {
        const folderId = folderMatch[1];
        return `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`;
      }

      if (pathname.includes('/view')) {
        parsed.pathname = pathname.replace(/\/view.*$/, '/preview');
        parsed.search = '';
        parsed.hash = '';
        return parsed.toString();
      }
      if (pathname.includes('/file/d/') && !pathname.endsWith('/preview')) {
        parsed.pathname = `${pathname.replace(/\/+$/, '')}/preview`;
        parsed.search = '';
        parsed.hash = '';
        return parsed.toString();
      }
    }

    return url;
  } catch {
    return url;
  }
}
