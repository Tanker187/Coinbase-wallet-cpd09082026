/**
 * @file coinbase.ts
 * Server-only Coinbase CDP configuration.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as CoinbaseSDK from "@coinbase/coinbase-sdk";

export const Coinbase = (CoinbaseSDK as any).Coinbase || (CoinbaseSDK as any).default?.Coinbase;
export const Wallet = (CoinbaseSDK as any).Wallet || (CoinbaseSDK as any).default?.Wallet;
export const WalletAddress = (CoinbaseSDK as any).WalletAddress || (CoinbaseSDK as any).default?.WalletAddress;

export function formatCdpError(error: any): string {
  if (!error) return 'Unknown error occurred.';
  if (typeof error === 'string') return sanitizeSecrets(error);

  const message =
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

  if (error.name === 'APIError' || error.isAxiosError) {
    return error.code
      ? `Coinbase SDK Network/Auth Error (${error.code}). Check the server CDP configuration.`
      : 'Invalid Coinbase API credentials or key signature. Check the server CDP configuration.';
  }

  return 'Coinbase API authentication failed. Check the server CDP configuration.';
}

function sanitizeSecrets(str: string): string {
  if (!str) return str;
  return str
    .replace(/-----BEGIN[^-]+-----[\s\S]*?-----END[^-]+-----/g, '[REDACTED_PRIVATE_KEY]')
    .replace(/(apiKeySecret|privateKey|secret|key_secret)=["']?[^"'&\s]+["']?/gi, '$1=[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9-_=.]+/gi, 'Bearer [REDACTED_TOKEN]');
}

/**
 * Configure Coinbase from server environment variables only.
 * Client/request headers are intentionally ignored so CDP credentials
 * can never be supplied by the browser.
 */
export function configureCoinbase(): boolean {
  let apiKeyName = process.env.CDP_API_KEY_NAME || process.env.CDP_API_KEY_ID || process.env.API_KEY_NAME || '';
  let apiKeySecret = process.env.CDP_API_KEY_SECRET || process.env.CDP_WALLET_SECRET || process.env.API_KEY_SECRET || '';

  apiKeyName = apiKeyName.trim();
  apiKeySecret = apiKeySecret.trim();

  if (apiKeyName === 'undefined' || apiKeyName === 'null') apiKeyName = '';
  if (apiKeySecret === 'undefined' || apiKeySecret === 'null') apiKeySecret = '';

  if (!apiKeyName || !apiKeySecret) return false;

  try {
    let nameStr = apiKeyName;
    let secretStr = apiKeySecret;

    if ((nameStr.startsWith('"') && nameStr.endsWith('"')) || (nameStr.startsWith("'") && nameStr.endsWith("'"))) {
      nameStr = nameStr.slice(1, -1).trim();
    }
    if ((secretStr.startsWith('"') && secretStr.endsWith('"')) || (secretStr.startsWith("'") && secretStr.endsWith("'"))) {
      secretStr = secretStr.slice(1, -1).trim();
    }

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
      // Not JSON.
    }

    try {
      const parsed = JSON.parse(nameStr);
      if (parsed.name && parsed.privateKey) {
        nameStr = parsed.name;
        secretStr = parsed.privateKey;
      }
    } catch {
      // Not JSON.
    }

    const formattedSecret = secretStr.replaceAll("\\n", "\n").trim();

    if (Coinbase && typeof Coinbase.configure === 'function') {
      Coinbase.configure({
        apiKeyName: nameStr.trim(),
        privateKey: formattedSecret,
      });
      return true;
    }

    console.warn('[CDP SDK] Coinbase.configure is unavailable.');
    return false;
  } catch (err) {
    console.warn('[CDP SDK] Failed to configure Coinbase SDK:', sanitizeSecrets(String(err)));
    return false;
  }
}
