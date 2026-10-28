/**
 * Script Loader Utility
 * Asynchronously injects third-party SDK scripts on demand with caching,
 * deduplication, and safety timeouts.
 */

const loadedScripts = new Map<string, Promise<boolean>>();

export interface ScriptLoadOptions {
  id?: string;
  async?: boolean;
  defer?: boolean;
  timeoutMs?: number;
  attributes?: Record<string, string>;
}

export function loadExternalScript(
  src: string,
  options: ScriptLoadOptions = {}
): Promise<boolean> {
  if (typeof document === 'undefined') {
    return Promise.resolve(false);
  }

  const scriptId = options.id || src;
  const existing = loadedScripts.get(scriptId);
  if (existing) {
    return existing;
  }

  // Check if script tag already exists in DOM
  const existingElement =
    (options.id ? document.getElementById(options.id) : null) ||
    document.querySelector(`script[src="${src}"]`);

  if (existingElement) {
    const p = Promise.resolve(true);
    loadedScripts.set(scriptId, p);
    return p;
  }

  const promise = new Promise<boolean>((resolve) => {
    const timeout = setTimeout(() => {
      console.warn(`[ScriptLoader] Timed out waiting for script: ${src}`);
      resolve(false);
    }, options.timeoutMs ?? 8000);

    const script = document.createElement('script');
    script.src = src;
    if (options.id) script.id = options.id;
    script.async = options.async ?? true;
    if (options.defer) script.defer = true;

    if (options.attributes) {
      for (const [key, val] of Object.entries(options.attributes)) {
        if (val !== undefined && val !== null) {
          script.setAttribute(key, val);
        }
      }
    }

    script.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };

    script.onerror = (err) => {
      clearTimeout(timeout);
      console.warn(`[ScriptLoader] Failed to load script: ${src}`, err);
      resolve(false);
    };

    document.head.appendChild(script);
  });

  loadedScripts.set(scriptId, promise);
  return promise;
}
