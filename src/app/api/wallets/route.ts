/**
 * @file route.ts
 * @author Shannon Joy Fletcher
 * @description I designed and implemented this codebase. This file represents my authoritative architecture for the CDP wallet manager.
 * All rights reserved.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { Wallet, configureCoinbase, formatCdpError } from '@/lib/server/coinbase';

const MAINNET_DISABLED = process.env.MAINNET_DISABLED === 'true';

/**
 * I implemented GET to handle the core logic for this module.
 */
export async function GET(request: Request) {
  try {
    const isConfigured = configureCoinbase(request);
    if (!isConfigured) {
      return NextResponse.json({
        wallets: [],
        error: 'CDP API keys are missing or incomplete. Please set CDP_API_KEY_NAME and CDP_API_KEY_SECRET in Settings / Environment Variables or via the Key Settings drawer.',
      });
    }

    if (!Wallet || typeof Wallet.listWallets !== 'function') {
      return NextResponse.json({
        wallets: [],
        error: 'Coinbase SDK Wallet module is unavailable.',
      });
    }

    let allWallets: any[] = [];
    try {
      allWallets = await Wallet.listWallets();
    } catch (apiError: any) {
      const msg = formatCdpError(apiError);
      console.warn('[CDP SDK] listWallets warning:', msg);
      return NextResponse.json({
        wallets: [],
        error: `Coinbase API error: ${msg}`,
      });
    }

    const wallets = await Promise.all(
      (allWallets || []).map(async (wallet: any) => {
        try {
          await wallet.getDefaultAddress();
          return wallet;
        } catch {
          return null;
        }
      })
    );
    const filteredWallets = wallets.filter((w): w is any => w !== null);
    const walletListResponse = filteredWallets.map((wallet: any) => ({
      id: wallet.getId(),
      name: wallet.getId().substring(0, 8),
      network: wallet.getNetworkId ? wallet.getNetworkId() : 'base-sepolia',
    }));
    return NextResponse.json({ wallets: walletListResponse });
  } catch (error: any) {
    const msg = formatCdpError(error);
    console.warn('[CDP SDK] Error fetching wallets:', msg);
    return NextResponse.json({ wallets: [], error: msg });
  }
}

/**
 * I implemented POST to handle the core logic for this module.
 */
export async function POST(request: Request) {
  try {
    const isConfigured = configureCoinbase(request);
    if (!isConfigured) {
      return NextResponse.json({
        error: 'Coinbase API keys are not configured. Please set CDP_API_KEY_NAME and CDP_API_KEY_SECRET in Settings or via the Key Settings drawer.'
      }, { status: 400 });
    }

    if (!Wallet || typeof Wallet.create !== 'function') {
      return NextResponse.json({ error: 'Coinbase SDK Wallet module is unavailable.' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const networkId = body.networkId || 'base-sepolia';

    if (MAINNET_DISABLED && networkId.includes('mainnet')) {
      return NextResponse.json({ error: 'Mainnet creation is disabled.' }, { status: 400 });
    }

    const wallet = await Wallet.create({ networkId });
    const defaultAddress = await wallet.getDefaultAddress();
    const addresses = await wallet.listAddresses();
    const addressIds = addresses.map((addr: any) => addr.getId());

    const balances = await wallet.listBalances();
    const formattedBalances: Record<string, number> = {};
    if (balances && typeof balances.forEach === 'function') {
      balances.forEach((balance: any, currency: string) => {
        formattedBalances[currency] = parseFloat(balance.toString());
      });
    }

    return NextResponse.json({
      id: wallet.getId(),
      network: networkId,
      addresses: addressIds,
      defaultAddress: defaultAddress ? defaultAddress.getId() : null,
      balances: formattedBalances,
    });
  } catch (error: any) {
    const msg = formatCdpError(error);
    console.warn('[CDP SDK] Error creating wallet:', msg);
    return NextResponse.json({ error: `Wallet creation error: ${msg}` }, { status: 500 });
  }
}


