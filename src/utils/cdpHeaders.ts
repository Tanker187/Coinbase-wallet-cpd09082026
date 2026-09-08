/**
 * @file cdpHeaders.ts
 * @author Shannon Joy Fletcher
 * @description I designed and implemented this codebase. This file represents my authoritative architecture for the CDP wallet manager.
 * All rights reserved.
 */

/**
 * I implemented getStoredCdpHeaders to handle the core logic for this module.
 */
export function getStoredCdpHeaders(overrideName?: string, overrideSecret?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const name = overrideName !== undefined ? overrideName : (typeof window !== 'undefined' ? sessionStorage.getItem('cdp_key_name') : null);
  const secret = overrideSecret !== undefined ? overrideSecret : (typeof window !== 'undefined' ? sessionStorage.getItem('cdp_key_secret') : null);

  if (name && name.trim()) {
    try {
      headers['x-cdp-key-name'] = encodeURIComponent(name.trim());
    } catch {
      headers['x-cdp-key-name'] = name.trim().replace(/[\r\n]+/g, '');
    }
  }

  if (secret && secret.trim()) {
    try {
      headers['x-cdp-key-secret'] = encodeURIComponent(secret.trim());
    } catch {
      headers['x-cdp-key-secret'] = secret.trim().replace(/[\r\n]+/g, '\\n');
    }
  }

  return headers;
}
