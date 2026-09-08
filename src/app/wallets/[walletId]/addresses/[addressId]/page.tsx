'use client';
/**
 * @file page.tsx
 * @author Shannon Joy Fletcher
 * @description I designed and implemented this codebase. This file represents my authoritative architecture for the CDP wallet manager.
 * All rights reserved.
 */


import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, Coins } from "lucide-react";
import { Card, CardBody, Button, Spinner } from "@nextui-org/react";
import type { AddressResponse } from '@/types/wallet';
import CustomInput from '@/app/components/CustomInput';
import { getStoredCdpHeaders } from "@/utils/cdpHeaders";

/**
 * I implemented AddressDetailPage to handle the core logic for this module.
 */
export default function AddressDetailPage({ params }: { params: { walletId: string; addressId: string } }) {
  const [address, setAddress] = useState<AddressResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFauceting, setIsFauceting] = useState(false);
  const [destAddress, setDestAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('eth');
  const [isTransferring, setIsTransferring] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const fetchAddressDetails = async () => {
    try {
      const res = await fetch(`/api/wallets/${params.walletId}/addresses/${params.addressId}`, {
        headers: getStoredCdpHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setAddress(data);
      }
    } catch (err) {
      console.error('Failed to fetch address details', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddressDetails();
  }, [params.walletId, params.addressId]);

  const handleRequestFaucet = async () => {
    setIsFauceting(true);
    setStatusMsg('');
    try {
      const res = await fetch(`/api/wallets/${params.walletId}/addresses/${params.addressId}`, {
        method: 'POST',
        headers: getStoredCdpHeaders(),
      });
      if (res.ok) {
        setStatusMsg('Faucet request successful! Refreshing balances...');
        await fetchAddressDetails();
      } else {
        const err = await res.json();
        setStatusMsg(`Faucet failed: ${err.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Faucet request error', err);
      setStatusMsg('Faucet request failed.');
    } finally {
      setIsFauceting(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destAddress || !amount) return;
    setIsTransferring(true);
    setStatusMsg('');
    try {
      const res = await fetch(`/api/wallets/${params.walletId}/addresses/${params.addressId}/transfers`, {
        method: 'POST',
        headers: getStoredCdpHeaders(),
        body: JSON.stringify({
          destination_address: destAddress,
          amount,
          asset: selectedAsset,
        }),
      });
      if (res.ok) {
        setStatusMsg('Transfer submitted successfully!');
        setDestAddress('');
        setAmount('');
        await fetchAddressDetails();
      } else {
        const err = await res.json();
        setStatusMsg(`Transfer failed: ${err.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Transfer error', err);
      setStatusMsg('Transfer failed.');
    } finally {
      setIsTransferring(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner color="primary" label="Loading address details..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Link href={`/wallets/${params.walletId}`} className="inline-flex items-center text-xs text-zinc-400 hover:text-zinc-200 gap-1">
        <ArrowLeft className="w-4 h-4" /> Back to Wallet
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-500" />
            Address Details
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-1 select-all">{params.addressId}</p>
        </div>

        <Button
          color="secondary"
          variant="flat"
          className="bg-purple-950 text-purple-300 border border-purple-800 text-xs"
          isLoading={isFauceting}
          onClick={handleRequestFaucet}
          startContent={!isFauceting && <Coins className="w-4 h-4" />}
        >
          Request Faucet Funds
        </Button>
      </div>

      {statusMsg && (
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200">
          {statusMsg}
        </div>
      )}

      {/* Balances */}
      <Card className="bg-zinc-900 border border-zinc-800">
        <CardBody className="p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-200">Balances</h2>
          {address && address.balances && Object.keys(address.balances).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(address.balances).map(([asset, amountVal]) => (
                <div key={asset} className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                  <div className="text-xs text-zinc-400 uppercase break-all">
                    {asset.length > 20 ? `${asset.slice(0, 8)}...${asset.slice(-6)}` : asset}
                  </div>
                  <div className="text-sm font-mono font-semibold text-zinc-100 mt-1">{amountVal}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">No balances found on this address.</p>
          )}
        </CardBody>
      </Card>

      {/* Transfer Form */}
      <Card className="bg-zinc-900 border border-zinc-800">
        <CardBody className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-200">Transfer Assets</h2>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div className="flex flex-col gap-1 w-full">
              <label className="text-xs font-medium text-blue-400">Asset</label>
              <select
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
              >
                {address && address.balances ? (
                  Object.keys(address.balances).map((asset) => (
                    <option key={asset} value={asset}>
                      {asset.length > 10 ? `${asset.slice(0,6)}...${asset.slice(-4)}` : asset.toUpperCase()}
                    </option>
                  ))
                ) : (
                  <option value="eth">ETH</option>
                )}
              </select>
            </div>
            <CustomInput
              label="Destination Address"
              placeholder="0x..."
              value={destAddress}
              onChange={(e) => setDestAddress(e.target.value)}
            />
            <CustomInput
              label={`Amount (${selectedAsset.length > 10 ? 'Custom Token' : selectedAsset.toUpperCase()})`}
              placeholder="0.01"
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button
              type="submit"
              color="primary"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs py-2"
              isLoading={isTransferring}
            >
              Send Transfer
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
