/**
 * Filename sanitization and session collision handling for diagram export.
 */

export interface SanitizeOptions {
  maxLength?: number;
  fallbackTitle?: string;
}

const RESERVED_CHARS_REGEX = /[/\:*?"<>|]/g;
const CONTROL_CHARS_REGEX = /[\x00-\x1f\x80-\x9f]/g;

/**
 * Sanitizes a diagram title to create a safe, clean file name with extension.
 */
export function sanitizeFilename(
  title: string | undefined | null,
  extension: string,
  options: SanitizeOptions = {}
): string {
  const maxLength = options.maxLength ?? 80;
  const fallback = options.fallbackTitle ?? 'Untitled';

  let ext = extension.startsWith('.') ? extension : `.${extension}`;

  let clean = (title || '')
    .replace(CONTROL_CHARS_REGEX, '')
    .replace(RESERVED_CHARS_REGEX, '_')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip leading/trailing dots, underscores, or spaces
  clean = clean.replace(/^[._\s]+|[._\s]+$/g, '');

  if (!clean || clean.replace(/[_\s]/g, '') === '') {
    clean = fallback;
  }

  // Cap length before extension
  if (clean.length > maxLength) {
    clean = clean.slice(0, maxLength).trim();
  }

  return `${clean}${ext}`;
}

/**
 * Tracks filenames exported within the active session to avoid silent overwrites.
 * Appends a counter or short hash on collision.
 */
export class FilenameCollisionTracker {
  private usedNames = new Set<string>();

  public getUniqueFilename(filename: string): string {
    if (!this.usedNames.has(filename)) {
      this.usedNames.add(filename);
      return filename;
    }

    // Split base and extension
    const dotIndex = filename.lastIndexOf('.');
    const base = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
    const ext = dotIndex > 0 ? filename.slice(dotIndex) : '';

    let counter = 2;
    while (this.usedNames.has(`${base}-${counter}${ext}`)) {
      counter++;
    }

    const uniqueName = `${base}-${counter}${ext}`;
    this.usedNames.add(uniqueName);
    return uniqueName;
  }

  public reset(): void {
    this.usedNames.clear();
  }
}

export const defaultFilenameCollisionTracker = new FilenameCollisionTracker();
