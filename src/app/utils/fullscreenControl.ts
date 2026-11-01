/**
 * Fullscreen mode controller with standard + WebKit Fullscreen API support
 * and graceful dataset state fallback for restricted iframe/headless environments.
 */

export interface FullscreenElementLike {
  requestFullscreen?: (options?: FullscreenOptions) => Promise<void>;
  webkitRequestFullscreen?: () => Promise<void> | void;
  dataset?: DOMStringMap;
}

export interface FullscreenDocumentLike {
  fullscreenElement?: Element | null;
  webkitFullscreenElement?: Element | null;
  documentElement?: FullscreenElementLike | null;
  exitFullscreen?: () => Promise<void>;
  webkitExitFullscreen?: () => Promise<void> | void;
}

export function isDocumentFullscreen(
  doc: FullscreenDocumentLike | undefined = typeof document !== 'undefined'
    ? (document as unknown as FullscreenDocumentLike)
    : undefined
): boolean {
  if (!doc) return false;
  if (doc.fullscreenElement || doc.webkitFullscreenElement) {
    return true;
  }
  return doc.documentElement?.dataset?.fullscreen === 'true';
}

export function syncFullscreenAttribute(
  active: boolean,
  doc: FullscreenDocumentLike | undefined = typeof document !== 'undefined'
    ? (document as unknown as FullscreenDocumentLike)
    : undefined
): void {
  if (doc?.documentElement?.dataset) {
    doc.documentElement.dataset.fullscreen = active ? 'true' : 'false';
  }
}

export async function toggleDocumentFullscreen(
  targetEl?: FullscreenElementLike | null,
  doc: FullscreenDocumentLike | undefined = typeof document !== 'undefined'
    ? (document as unknown as FullscreenDocumentLike)
    : undefined
): Promise<boolean> {
  if (!doc) return false;

  const currentlyFullscreen = isDocumentFullscreen(doc);
  const el = targetEl ?? doc.documentElement;

  if (currentlyFullscreen) {
    syncFullscreenAttribute(false, doc);
    try {
      if (doc.fullscreenElement && typeof doc.exitFullscreen === 'function') {
        await doc.exitFullscreen();
      } else if (doc.webkitFullscreenElement && typeof doc.webkitExitFullscreen === 'function') {
        await doc.webkitExitFullscreen();
      }
    } catch {
      // Ignore exit errors in restricted iframe contexts
    }
    return false;
  }

  syncFullscreenAttribute(true, doc);
  if (el) {
    try {
      if (typeof el.requestFullscreen === 'function') {
        await el.requestFullscreen({ navigationUI: 'hide' });
      } else if (typeof el.webkitRequestFullscreen === 'function') {
        await el.webkitRequestFullscreen();
      }
    } catch {
      // Keep dataset fallback active if browser/iframe blocks native Fullscreen API
    }
  }
  return true;
}
