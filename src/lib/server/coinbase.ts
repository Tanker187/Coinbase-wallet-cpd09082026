/**
 * @file coinbase.ts
 * @author Shannon Joy Fletcher
 * @description I designed and implemented this codebase. This file represents my authoritative architecture for the CDP wallet manager.
 * All rights reserved.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as CoinbaseSDK from "@coinbase/coinbase-sdk";

export const Coinbase = (CoinbaseSDK as any).Coinbase || (CoinbaseSDK as any).default?.Coinbase;
export const Wallet = (CoinbaseSDK as any).Wallet || (CoinbaseSDK as any).default?.Wallet;
export const WalletAddress = (CoinbaseSDK as any).WalletAddress || (CoinbaseSDK as any).default?.WalletAddress;

/**
 * I implemented formatCdpError to handle the core logic for this module.
 */
export function formatCdpError(error: any): string {
  if (!error) return 'Unknown error occurred.';
  if (typeof error === 'string') return sanitizeSecrets(error);

  // Extract explicit message fields
  let message =
    error.apiMessage ||
    error.apiError?.message ||
    error.error?.message ||
    error.message ||
    error.errorMessage ||
    error.apiError?.error_message ||
    error.apiError?.detail ||
    error.detail ||
    error.cause?.message ||
    (error.response?.data ? (typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data)) : null);

  const code =
    error.apiCode ||
    error.apiError?.code ||
    error.code ||
    error.httpCode ||
    error.statusCode ||
    error.status ||
    error.response?.status;

  if (message && typeof message === 'string' && message.trim().length > 0 && message !== 'APIError') {
    const cleanMsg = sanitizeSecrets(message);
    return code ? `[${code}] ${cleanMsg}` : cleanMsg;
  }

  if (error.cause) {
    const causeMsg = formatCdpError(error.cause);
    if (causeMsg && !causeMsg.includes('APIError') && causeMsg !== 'Unknown error occurred.') {
      return sanitizeSecrets(causeMsg);
    }
  }

  // Check if it's an APIError with null httpCode/apiMessage (Authentication / Signing failure)
  if (error.name === 'APIError' || error.isAxiosError) {
    if (error.code) {
      return `Coinbase SDK Network/Auth Error (${error.code}). Please check your CDP API Key Name and Key Secret formatting.`;
    }
    return 'Invalid Coinbase API credentials or key signature. Please verify that your CDP_API_KEY_NAME and CDP_API_KEY_SECRET (or Key Settings) match your Coinbase Developer Platform API key.';
  }

  return 'Coinbase API authentication failed. Please verify that your CDP API Key Name and Key Secret are active and correctly entered.';
}

function sanitizeSecrets(str: string): string {
  if (!str) return str;
  return str
    .replace(/-----BEGIN[^-]+-----[\s\S]*?-----END[^-]+-----/g, '[REDACTED_PRIVATE_KEY]')
    .replace(/(apiKeySecret|privateKey|secret|key_secret)=["']?[^"'&\s]+["']?/gi, '$1=[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9-_=.]+/gi, 'Bearer [REDACTED_TOKEN]');
}

/**
 * I implemented configureCoinbase to handle the core logic for this module.
 */
export function configureCoinbase(req?: Request): boolean {
  let apiKeyName = process.env.CDP_API_KEY_NAME || process.env.CDP_API_KEY_ID || process.env.API_KEY_NAME || '';
  let apiKeySecret = process.env.CDP_API_KEY_SECRET || process.env.CDP_WALLET_SECRET || process.env.API_KEY_SECRET || '';

  if (req) {
    let headerName = req.headers.get('x-cdp-key-name');
    let headerSecret = req.headers.get('x-cdp-key-secret');

    if (headerName) {
      try {
        headerName = decodeURIComponent(headerName);
      } catch {
        // use raw headerName
      }
    }
    if (headerSecret) {
      try {
        headerSecret = decodeURIComponent(headerSecret);
      } catch {
        // use raw headerSecret
      }
    }

    if (headerName && headerName.trim() && headerName !== 'undefined' && headerName !== 'null') {
      apiKeyName = headerName;
    }
    if (headerSecret && headerSecret.trim() && headerSecret !== 'undefined' && headerSecret !== 'null') {
      apiKeySecret = headerSecret;
    }
  }

  apiKeyName = apiKeyName.trim();
  apiKeySecret = apiKeySecret.trim();

  if (apiKeyName === 'undefined' || apiKeyName === 'null') apiKeyName = '';
  if (apiKeySecret === 'undefined' || apiKeySecret === 'null') apiKeySecret = '';

  if (!apiKeyName || !apiKeySecret) {
    return false;
  }

  try {
    let nameStr = apiKeyName.trim();
    let secretStr = apiKeySecret.trim();

    // Strip wrapping quotes if user pasted quoted strings
    if ((nameStr.startsWith('"') && nameStr.endsWith('"')) || (nameStr.startsWith("'") && nameStr.endsWith("'"))) {
      nameStr = nameStr.slice(1, -1).trim();
    }
    if ((secretStr.startsWith('"') && secretStr.endsWith('"')) || (secretStr.startsWith("'") && secretStr.endsWith("'"))) {
      secretStr = secretStr.slice(1, -1).trim();
    }

    // Try parsing apiKeySecret as JSON in case user pasted downloaded cdp_api_key.json
    try {
      const parsed = JSON.parse(secretStr);
      if (parsed.name && parsed.privateKey) {
        nameStr = parsed.name;
        secretStr = parsed.privateKey;
      } else if (parsed.apiKeyName && parsed.privateKey) {
        nameStr = parsed.apiKeyName;
        secretStr = parsed.privateKey;
      }
    } catch {
      // Not JSON
    }

    // Try parsing apiKeyName as JSON in case user pasted downloaded cdp_api_key.json into key name
    try {
      const parsed = JSON.parse(nameStr);
      if (parsed.name && parsed.privateKey) {
        nameStr = parsed.name;
        secretStr = parsed.privateKey;
      }
    } catch {
      // Not JSON
    }

    let formattedSecret = secretStr.replaceAll("\\n", "\n").trim();

    if (Coinbase && typeof Coinbase.configure === 'function') {
      Coinbase.configure({
        apiKeyName: nameStr.trim(),
        privateKey: formattedSecret,
      });
      return true;
    } else {
      console.warn("[CDP SDK] Coinbase object or Coinbase.configure is unavailable.");
      return false;
    }
  } catch (err) {
    console.warn("[CDP SDK] Failed to configure Coinbase SDK:", err);
    return false;
  }
}


