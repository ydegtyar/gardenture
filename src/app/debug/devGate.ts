/**
 * Development-mode gate for lazy-loaded debug features.
 * Ensures all debug tools, sandbox spawners, and dev stubs are only active
 * during the development process (`import.meta.env.DEV`) and stripped in production.
 */

export function isDevelopmentProcess(explicitEnvDev?: boolean): boolean {
  if (typeof explicitEnvDev === 'boolean') {
    return explicitEnvDev;
  }
  try {
    const metaEnv = (import.meta as unknown as { env?: { DEV?: boolean; MODE?: string } }).env;
    if (metaEnv && typeof metaEnv.DEV === 'boolean') {
      return metaEnv.DEV;
    }
    if (metaEnv && typeof metaEnv.MODE === 'string') {
      return metaEnv.MODE === 'development';
    }
  } catch {
    // Fallback for non-Vite Node test runners
  }
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) {
    return process.env.NODE_ENV !== 'production';
  }
  return false;
}

export const IS_DEV: boolean = isDevelopmentProcess();
