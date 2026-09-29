const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const target = path.join(root, '.deploy', 'site');
if (fs.existsSync(target)) throw new Error('Build output already exists. Use a clean checkout or remove .deploy/site before building.');
const wallet = path.join(target, 'BDKoin_Wallet');
fs.mkdirSync(wallet, { recursive: true });
for (const file of fs.readdirSync(path.join(root, 'BDKoin_Wallet/pwa'))) {
  if (!/\.(html|css|js|webmanifest)$/.test(file) || file === 'server.js') continue;
  fs.copyFileSync(path.join(root, 'BDKoin_Wallet/pwa', file), path.join(wallet, file));
}
for (const dir of ['icons', 'images', 'vendor']) fs.cpSync(path.join(root, 'BDKoin_Wallet/pwa', dir), path.join(wallet, dir), { recursive: true });
fs.cpSync(path.join(root, 'BDKoin_Game'), path.join(target, 'BDKoin_Game'), { recursive: true });
fs.writeFileSync(path.join(target, '.nojekyll'), '');
console.log('Built GitHub Pages artifact at .deploy/site');
