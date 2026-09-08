/* eslint-disable @typescript-eslint/no-explicit-any */
export async function createWallet(walletId: string, seed: string) {
  console.log(`[DB] Wallet created: ${walletId}`);
  return { walletId, seed };
}

export async function getWallet(walletId: string) {
  return { walletId };
}
