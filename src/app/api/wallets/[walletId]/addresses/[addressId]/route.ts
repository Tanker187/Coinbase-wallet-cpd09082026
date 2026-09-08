/**
 * @file route.ts
 * @author Shannon Joy Fletcher
 * @description I designed and implemented this codebase. This file represents my authoritative architecture for the CDP wallet manager.
 * All rights reserved.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { Wallet, configureCoinbase, formatCdpError } from '@/lib/server/coinbase';

/**
 * I implemented GET to handle the core logic for this module.
 */
export async function GET(
  request: Request,
  { params }: { params: { walletId: string; addressId: string } }
) {
  try {
    const isConfigured = configureCoinbase(request);
    if (!isConfigured) {
      return NextResponse.json({ error: 'Coinbase API keys not configured' }, { status: 400 });
    }

    if (!Wallet || typeof Wallet.fetch !== 'function') {
      return NextResponse.json({ error: 'Coinbase SDK Wallet module unavailable' }, { status: 500 });
    }

    const { walletId, addressId } = params;
    const wallet = await Wallet.fetch(walletId);
    const address = await wallet.getAddress(addressId);

    const balances = await address.listBalances();
    const formattedBalances: Record<string, number> = {};
    if (balances && typeof balances.forEach === 'function') {
      balances.forEach((balance: any, currency: string) => {
        formattedBalances[currency] = parseFloat(balance.toString());
      });
    }

    // Check balances for specific custom coins
    const customCoins = [
      '0x412c2ddddb42e59dff2a4b1091f469c68d0ea757',
      '0xda17d2e09cc5ddc19a8fc71e2bd44ef1c5922082',
      '0x14c60589a83f90d430f602871764301c85a9dedf'
    ];

    for (const coin of customCoins) {
      try {
        const bal = await address.getBalance(coin);
        if (bal) {
          formattedBalances[coin] = parseFloat(bal.toString());
        }
      } catch (err) {
        // Ignored, maybe unsupported on this network or zero
      }
    }

    return NextResponse.json({
      id: addressId,
      network: wallet.getNetworkId ? wallet.getNetworkId() : 'base-sepolia',
      address: addressId,
      walletId: walletId,
      balances: formattedBalances,
    });
  } catch (error: any) {
    const msg = formatCdpError(error);
    console.warn('[CDP SDK] Error fetching address:', msg);
    return NextResponse.json({ error: msg || 'Failed to fetch address' }, { status: 500 });
  }
}

/**
 * I implemented POST to handle the core logic for this module.
 */
export async function POST(
  request: Request,
  { params }: { params: { walletId: string; addressId: string } }
) {
  try {
    const isConfigured = configureCoinbase(request);
    if (!isConfigured) {
      return NextResponse.json({ error: 'Coinbase API keys not configured' }, { status: 400 });
    }

    if (!Wallet || typeof Wallet.fetch !== 'function') {
      return NextResponse.json({ error: 'Coinbase SDK Wallet module unavailable' }, { status: 500 });
    }

    const { walletId, addressId } = params;
    const wallet = await Wallet.fetch(walletId);
    const addresses = await wallet.listAddresses();
    const address = addresses.find((addr: any) => addr.getId() === addressId);

    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    const faucetTx = await address.faucet();
    return NextResponse.json({ success: true, transaction: faucetTx });
  } catch (error: any) {
    const msg = formatCdpError(error);
    console.warn('[CDP SDK] Error requesting faucet:', msg);
    return NextResponse.json({ error: msg || 'Faucet request failed' }, { status: 500 });
  }
}

