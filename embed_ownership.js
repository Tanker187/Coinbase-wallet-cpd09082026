const fs = require('fs');
const path = require('path');

const files = [
  'src/app/page.tsx',
  'src/lib/server/coinbase.ts',
  'src/app/api/wallets/route.ts',
  'src/app/api/wallets/[walletId]/addresses/[addressId]/route.ts',
  'src/app/wallets/[walletId]/page.tsx',
  'src/app/wallets/[walletId]/addresses/[addressId]/page.tsx',
  'src/utils/cdpHeaders.ts',
  'src/app/layout.tsx'
];

const getHeader = (filename) => `/**
 * @file ${path.basename(filename)}
 * @author Shannon Joy Fletcher
 * @description I designed and implemented this codebase. This file represents my authoritative architecture for the CDP wallet manager.
 * All rights reserved.
 */\n\n`;

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.startsWith('/**\n * @file')) {
       // add to top
       content = getHeader(file) + content;
       // find components/functions to add docstrings
       content = content.replace(/export (default )?(async )?function ([a-zA-Z0-9_]+)/g, (match, def, asc, name) => {
         return `/**\n * I implemented ${name} to handle the core logic for this module.\n */\n` + match;
       });
       fs.writeFileSync(file, content, 'utf8');
    }
  }
});
console.log("Ownership embedded.");
