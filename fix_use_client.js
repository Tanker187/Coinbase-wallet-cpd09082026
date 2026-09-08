const fs = require('fs');

const files = [
  'src/app/page.tsx',
  'src/app/wallets/[walletId]/page.tsx',
  'src/app/wallets/[walletId]/addresses/[addressId]/page.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes("'use client';")) {
       content = content.replace("'use client';\n", "");
       content = content.replace("'use client';", "");
       content = "'use client';\n" + content;
       fs.writeFileSync(file, content, 'utf8');
    }
  }
});
