export interface WalletListResponse {
  id: string;
  name: string;
  network: string;
}

export interface WalletResponse {
  id: string;
  name?: string;
  network: string;
  addresses: string[];
  defaultAddress: string | null;
  balances: Record<string, number>;
}

export interface AddressResponse {
  id: string;
  network: string;
  address: string;
  walletId: string;
  balances: Record<string, number>;
}
