/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { Wallet, configureCoinbase, formatCdpError } from '@/lib/server/coinbase';

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

    const body = await request.json();
    const { destination_address, amount, asset } = body;

    if (!destination_address || !amount) {
      return NextResponse.json({ error: 'Destination address and amount are required' }, { status: 400 });
    }

    const wallet = await Wallet.fetch(params.walletId);
    const transfer = await wallet.createTransfer({
      amount: parseFloat(amount),
      assetId: asset || 'eth',
      destination: destination_address,
    });

    await transfer.wait();

    return NextResponse.json({
      success: true,
      transferId: transfer.getId ? transfer.getId() : undefined,
      status: transfer.getStatus ? transfer.getStatus() : 'complete',
    });
  } catch (error: any) {
    const msg = formatCdpError(error);
    console.warn('[CDP SDK] Error initiating transfer:', msg);
    return NextResponse.json({ error: msg || 'Transfer failed' }, { status: 500 });
  }
}
