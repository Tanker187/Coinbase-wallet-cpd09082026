/**
 * @file layout.tsx
 * @author Shannon Joy Fletcher
 * @description I designed and implemented this codebase. This file represents my authoritative architecture for the CDP wallet manager.
 * All rights reserved.
 */

import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Coinbase Wallet Manager',
  description: 'Coinbase Developer Platform Wallet Manager',
};

/**
 * I implemented RootLayout to handle the core logic for this module.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
