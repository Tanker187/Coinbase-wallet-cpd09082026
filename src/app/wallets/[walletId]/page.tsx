'use client';
/**
 * @file page.tsx
 * @author Shannon Joy Fletcher
 * @description I designed and implemented this codebase. This file represents my authoritative architecture for the CDP wallet manager.
 * All rights reserved.
 */


import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardBody, Button, Spinner } from "@nextui-org/react";
import { ArrowLeft, Wallet, Shield } from "lucide-react";
import type { WalletResponse } from "@/types/wallet";
import { formatNetworkId } from "@/utils/stringUtils";
import { getStoredCdpHeaders } from "@/utils/cdpHeaders";

/**
 * I implemented WalletDetailPage to handle the core logic for this module.
 */
export default function WalletDetailPage({ params }: { params: { walletId: string } }) {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await fetch(`/api/wallets/${params.walletId}`, {
          headers: getStoredCdpHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setWallet(data);
        }
      } catch (err) {
        console.error('Failed to fetch wallet', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWallet();
  }, [params.walletId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner color="primary" label="Loading wallet details..." />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <p className="text-zinc-400">Wallet not found.</p>
        <Link href="/">
          <Button variant="flat" className="bg-zinc-800 text-zinc-200">
            Back to Wallets
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Link href="/" className="inline-flex items-center text-xs text-zinc-400 hover:text-zinc-200 gap-1">
        <ArrowLeft className="w-4 h-4" /> Back to Wallets
      </Link>

      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-500" />
            Wallet Details
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-1">{wallet.id}</p>
        </div>
        <span className="px-2.5 py-1 text-xs font-medium bg-blue-950 text-blue-400 border border-blue-800 rounded-full">
          {formatNetworkId(wallet.network)}
        </span>
      </div>

      {/* Addresses */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-300">Addresses</h2>
        <div className="space-y-2">
          {wallet.addresses.map((address) => (
            <Link key={address} href={`/wallets/${wallet.id}/addresses/${address}`}>
              <Card className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
                <CardBody className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-mono text-zinc-200">{address}</span>
                    {address === wallet.defaultAddress && (
                      <span className="ml-2 px-2 py-0.5 text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <Shield className="w-4 h-4 text-zinc-500" />
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
