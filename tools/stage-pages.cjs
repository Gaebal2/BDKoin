const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const target = path.resolve(process.argv[2] || '');
if (!process.argv[2] || !fs.existsSync(path.join(target, '.git'))) throw new Error('Pass the local gaebal2.github.io checkout path');
const wallet = path.join(target, 'BDKoin_Wallet');
fs.mkdirSync(wallet, { recursive: true });
for (const file of fs.readdirSync(path.join(root, 'BDKoin_Wallet/pwa'))) {
  if (!/\.(html|css|js|webmanifest)$/.test(file) || file === 'server.js') continue;
  fs.copyFileSync(path.join(root, 'BDKoin_Wallet/pwa', file), path.join(wallet, file));
}
for (const dir of ['icons', 'images', 'vendor']) fs.cpSync(path.join(root, 'BDKoin_Wallet/pwa', dir), path.join(wallet, dir), { recursive: true });
fs.cpSync(path.join(root, 'BDKoin_Game'), path.join(target, 'BDKoin_Game'), { recursive: true });
console.log('Staged wallet and game. Review, commit and push the Pages checkout. Existing root files preserved.');
