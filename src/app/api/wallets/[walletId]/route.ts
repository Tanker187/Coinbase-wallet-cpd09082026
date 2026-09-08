/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { Wallet, configureCoinbase, formatCdpError } from '@/lib/server/coinbase';

export async function GET(request: Request, { params }: { params: { walletId: string } }) {
  try {
    const isConfigured = configureCoinbase(request);
    if (!isConfigured) {
      return NextResponse.json({ error: 'Coinbase API keys not configured' }, { status: 400 });
    }

    if (!Wallet || typeof Wallet.fetch !== 'function') {
      return NextResponse.json({ error: 'Coinbase SDK Wallet module unavailable' }, { status: 500 });
    }

    const wallet = await Wallet.fetch(params.walletId);
    const addresses = await wallet.listAddresses();
    const addressIds = addresses.map((addr: any) => addr.getId());
    const defaultAddress = await wallet.getDefaultAddress();

    const balances = await wallet.listBalances();
    const formattedBalances: Record<string, number> = {};
    if (balances && typeof balances.forEach === 'function') {
      balances.forEach((balance: any, currency: string) => {
        formattedBalances[currency] = parseFloat(balance.toString());
      });
    }

    return NextResponse.json({
      id: wallet.getId(),
      network: wallet.getNetworkId ? wallet.getNetworkId() : 'base-sepolia',
      addresses: addressIds,
      defaultAddress: defaultAddress ? defaultAddress.getId() : null,
      balances: formattedBalances,
    });
  } catch (error: any) {
    const msg = formatCdpError(error);
    console.warn('[CDP SDK] Error fetching wallet:', msg);
    return NextResponse.json({ error: msg || 'Failed to fetch wallet' }, { status: 500 });
  }
}
