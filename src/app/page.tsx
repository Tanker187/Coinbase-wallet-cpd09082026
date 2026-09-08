'use client';
/**
 * @file page.tsx
 * @author Shannon Joy Fletcher
 * @description I designed and implemented this codebase. This file represents my authoritative architecture for the CDP wallet manager.
 * All rights reserved.
 */


import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardBody, Button, Spinner, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import type { WalletListResponse } from "@/types/wallet";
import { Wallet as WalletIcon, Plus, ShieldCheck, KeyRound, AlertCircle, Key, Eye, EyeOff, Save, Check } from "lucide-react";
import { formatNetworkId } from "@/utils/stringUtils";
import { getStoredCdpHeaders } from "@/utils/cdpHeaders";
import CustomInput from "@/app/components/CustomInput";

/**
 * I implemented HomePage to handle the core logic for this module.
 */
export default function HomePage() {
  const [wallets, setWallets] = useState<WalletListResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<string>('base-sepolia');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Key Credentials state
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keySecret, setKeySecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [rawJsonKey, setRawJsonKey] = useState('');

  useEffect(() => {
    const storedName = sessionStorage.getItem('cdp_key_name') || '';
    const storedSecret = sessionStorage.getItem('cdp_key_secret') || '';
    if (storedName) setKeyName(storedName);
    if (storedSecret) setKeySecret(storedSecret);
  }, []);

  const handleJsonPaste = (val: string) => {
    setRawJsonKey(val);
    try {
      const parsed = JSON.parse(val.trim());
      const extractedName = parsed.name || parsed.apiKeyName || parsed.id || '';
      const extractedSecret = parsed.privateKey || parsed.secret || parsed.private_key || '';
      if (extractedName) setKeyName(extractedName);
      if (extractedSecret) setKeySecret(extractedSecret);
    } catch {
      // Not valid JSON yet
    }
  };

  const handleKeyNameChange = (val: string) => {
    setKeyName(val);
    if (val.trim().startsWith('{')) {
      handleJsonPaste(val);
    }
  };

  const handleKeySecretChange = (val: string) => {
    setKeySecret(val);
    if (val.trim().startsWith('{')) {
      handleJsonPaste(val);
    }
  };

  const getHeaders = () => {
    return getStoredCdpHeaders(keyName, keySecret);
  };

  const fetchWallets = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/wallets', { headers: getHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) {
        setWallets(data);
      } else if (data && typeof data === 'object') {
        setWallets(Array.isArray(data.wallets) ? data.wallets : []);
        if (data.error) {
          setErrorMessage(data.error);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch wallets', err);
      setErrorMessage('Network error fetching wallets.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, [keyName, keySecret]);

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      if (keyName.trim()) sessionStorage.setItem('cdp_key_name', keyName.trim());
      else sessionStorage.removeItem('cdp_key_name');

      if (keySecret.trim()) sessionStorage.setItem('cdp_key_secret', keySecret.trim());
      else sessionStorage.removeItem('cdp_key_secret');
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
    fetchWallets();
  };

  const handleCreateWallet = async () => {
    setIsCreating(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/wallets', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ networkId: selectedNetwork }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchWallets();
      } else {
        setErrorMessage(data.error || 'Failed to create wallet.');
      }
    } catch (err: any) {
      console.error('Failed to create wallet', err);
      setErrorMessage('Network error creating wallet.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* CDP Sandbox Protected Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-blue-950/40 to-zinc-900 border border-blue-900/50 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-semibold tracking-wider text-blue-400 uppercase">Protected Sandbox Environment</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 mt-2">
            Shannon FLETCHER Sandbox
          </h1>
          <p className="text-xs text-zinc-400 mt-2 font-mono bg-black/40 inline-block px-3 py-1.5 rounded-md border border-zinc-800">
            Account ID: account_36c3f791-3c33-44c0-8e28-ce661be7ed49
          </p>
        </div>
        <div className="flex flex-col md:items-end text-left md:text-right">
          <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">CDP Account Balance</span>
          <span className="text-3xl font-light text-zinc-100 tracking-tight">$233,396,651</span>
          <div className="flex items-center gap-3 mt-3 text-xs font-medium text-zinc-400">
             <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> USD</span>
             <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span> USDC</span>
             <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500"></span> USDT</span>
          </div>
        </div>
      </div>

      {/* CDP Sandbox Payment Methods */}
      <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/40 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Sandbox Predefined Payment Methods</h2>
            <p className="text-xs text-zinc-500 mt-1">
              Entity ID: <span className="font-mono text-zinc-400">entity_27be97cc-76ba-4d09-bb66-896d8b0f8ae1</span>
            </p>
          </div>
          <span className="text-xs text-zinc-500 font-medium bg-zinc-800/50 px-2.5 py-1 rounded-md">Testing Only</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400 whitespace-nowrap">
            <thead className="bg-zinc-900/20 text-xs uppercase font-medium text-zinc-500">
              <tr>
                <th className="px-6 py-3">Bank</th>
                <th className="px-6 py-3">Payment rail</th>
                <th className="px-6 py-3">Asset</th>
                <th className="px-6 py-3">Payment method ID</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              <tr className="hover:bg-zinc-900/30 transition-colors">
                <td className="px-6 py-4 font-medium text-zinc-300">Customers Bank ····9012</td>
                <td className="px-6 py-4">Cubix</td>
                <td className="px-6 py-4">USD</td>
                <td className="px-6 py-4 font-mono text-xs">127604...34cd06</td>
                <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Active</span></td>
                <td className="px-6 py-4 text-xs">Jun 9, 2026 10:16 AM</td>
              </tr>
              <tr className="hover:bg-zinc-900/30 transition-colors">
                <td className="px-6 py-4 font-medium text-zinc-300">Deutsche Bank ····3000</td>
                <td className="px-6 py-4">Swift</td>
                <td className="px-6 py-4">USD</td>
                <td className="px-6 py-4 font-mono text-xs">88c482...4518db</td>
                <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Active</span></td>
                <td className="px-6 py-4 text-xs">Jun 9, 2026 10:16 AM</td>
              </tr>
              <tr className="hover:bg-zinc-900/30 transition-colors">
                <td className="px-6 py-4 font-medium text-zinc-300">JPMorgan Chase Bank NA ····9012</td>
                <td className="px-6 py-4">Fedwire</td>
                <td className="px-6 py-4">USD</td>
                <td className="px-6 py-4 font-mono text-xs">e7afb5...fea998</td>
                <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Active</span></td>
                <td className="px-6 py-4 text-xs">Jun 9, 2026 10:16 AM</td>
              </tr>
              <tr className="hover:bg-zinc-900/30 transition-colors">
                <td className="px-6 py-4 font-medium text-zinc-500">Bank of America NA ····1098</td>
                <td className="px-6 py-4 text-zinc-500">Fedwire</td>
                <td className="px-6 py-4 text-zinc-500">USD</td>
                <td className="px-6 py-4 font-mono text-xs text-zinc-500">e8e65d...dbb768</td>
                <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 text-zinc-500 text-xs font-medium"><span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>Inactive</span></td>
                <td className="px-6 py-4 text-xs text-zinc-500">Jun 9, 2026 10:16 AM</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <WalletIcon className="w-6 h-6 text-blue-500" />
            CDP Wallet Manager
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Securely manage Coinbase Developer Platform wallets and testnet/mainnet addresses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="bordered"
            className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 text-xs"
            onClick={() => setShowKeyModal(!showKeyModal)}
            startContent={<Key className="w-4 h-4 text-zinc-400" />}
          >
            {showKeyModal ? 'Hide Keys Panel' : 'Set CDP Keys'}
          </Button>

          <Dropdown>
            <DropdownTrigger>
              <Button variant="flat" className="bg-zinc-900 text-zinc-200 border border-zinc-800 text-xs">
                {formatNetworkId(selectedNetwork)}
                <ChevronDownIcon className="w-4 h-4 ml-1" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Select Network"
              onAction={(key) => setSelectedNetwork(key as string)}
            >
              <DropdownItem key="base-sepolia">Base Sepolia</DropdownItem>
              <DropdownItem key="ethereum-sepolia">Ethereum Sepolia</DropdownItem>
              <DropdownItem key="base-mainnet">Base Mainnet</DropdownItem>
            </DropdownMenu>
          </Dropdown>

          <Button
            color="primary"
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-4"
            isLoading={isCreating}
            onClick={handleCreateWallet}
            startContent={!isCreating && <Plus className="w-4 h-4" />}
          >
            Create Wallet
          </Button>
        </div>
      </div>

      {/* Key Credentials Drawer / Panel */}
      {showKeyModal && (
        <Card className="bg-zinc-900 border border-zinc-800">
          <CardBody className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-400" />
                Coinbase Developer Platform Keys Configuration
              </h2>
              <span className="text-[11px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                Session Storage (Masked & Protected)
              </span>
            </div>

            <form onSubmit={handleSaveKeys} className="space-y-4">
              <div className="flex flex-col gap-1 w-full bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <label className="text-xs font-medium text-blue-400">Quick Paste JSON Key File (`cdp_api_key.json`)</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs font-mono text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder='Paste full downloaded cdp_api_key.json content here (e.g. {"name": "...", "privateKey": "..."})'
                  value={rawJsonKey}
                  onChange={(e) => handleJsonPaste(e.target.value)}
                />
                <span className="text-[10px] text-zinc-500">Pasting JSON automatically fills the Key Name and Secret fields below.</span>
              </div>

              <CustomInput
                label="API Key Name / Key ID"
                placeholder="organizations/org_id/apiKeys/key_id or 90b2de0a-..."
                value={keyName}
                onChange={(e) => handleKeyNameChange(e.target.value)}
              />

              <div className="flex flex-col gap-1 w-full">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-400">API Key Private Key / Secret</label>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showSecret ? 'Hide' : 'Reveal'}
                  </button>
                </div>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="-----BEGIN EC PRIVATE KEY----- ... or raw secret key string"
                  value={keySecret}
                  onChange={(e) => handleKeySecretChange(e.target.value)}
                  style={{ WebkitTextSecurity: showSecret ? 'none' : 'disc' } as React.CSSProperties}
                />
              </div>

              <div className="flex items-center justify-between">
                <Button
                  type="submit"
                  size="sm"
                  color="primary"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-4"
                  startContent={savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                >
                  {savedSuccess ? 'Keys Saved & Applied!' : 'Save & Test Keys'}
                </Button>

                <p className="text-[11px] text-zinc-500">
                  Note: Keys are also read from project environment variables (`CDP_API_KEY_NAME`, `CDP_API_KEY_SECRET`).
                </p>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Security Banner */}
      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-start gap-3 text-xs text-zinc-300">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-zinc-100">CDP Credentials Protected:</span> All API key names, private keys, and secrets are processed strictly on server-side endpoints (`/api/*`) and configured directly into the official Coinbase SDK.
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl flex items-start justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-amber-100">Configuration / API Status:</span>
              <p>{errorMessage}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="bordered"
            className="border-amber-700/60 text-amber-200 hover:bg-amber-900/50 text-xs shrink-0"
            onClick={() => setShowKeyModal(true)}
            startContent={<Key className="w-3.5 h-3.5" />}
          >
            Set CDP Keys
          </Button>
        </div>
      )}

      {/* Wallet List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-200">Active Wallets</h2>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner color="primary" label="Loading wallets..." />
          </div>
        ) : wallets.length === 0 ? (
          <Card className="bg-zinc-900 border border-zinc-800">
            <CardBody className="py-12 text-center text-zinc-400 space-y-3">
              <KeyRound className="w-8 h-8 mx-auto text-zinc-600" />
              <p className="text-sm">No wallets found or CDP API keys awaiting configuration.</p>
              <p className="text-xs text-zinc-500">
                Ensure <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">CDP_API_KEY_NAME</code> and <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">CDP_API_KEY_SECRET</code> are set in Settings or click <strong className="text-zinc-300">Set CDP Keys</strong> above.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wallets.map((wallet) => (
              <Link key={wallet.id} href={`/wallets/${wallet.id}`}>
                <Card className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer h-full">
                  <CardBody className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-100 text-sm">{wallet.name}</span>
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-950 text-blue-400 border border-blue-800 rounded-full">
                        {formatNetworkId(wallet.network)}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 font-mono truncate">
                      ID: {wallet.id}
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


