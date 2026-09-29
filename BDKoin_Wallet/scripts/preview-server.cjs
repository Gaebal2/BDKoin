/* Isolated UI test fixture. Never included in the PWA or production server.
 * Every RPC is stubbed; the disposable key below must never hold real funds. */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '../pwa');
const fixture = `
  // Fixture-only: deterministic disposable key and simulated balances.
  SASEUL.Rpc.request = async ({request:r}) => {
    if (r.type === 'GetInfo') return {code:200,data:{name:'BDKoin',symbol:'BDK',decimal:18}};
    if (r.type === 'GetBalance') {
      const scenario = new URLSearchParams(location.search).get('scenario');
      if (scenario === 'offline' && r.cid) return {code:503,msg:'Simulated RPC outage'};
      const balance = scenario === 'supply' ? '2491000000000000000000000000' : scenario === 'dust' ? '1' : '2491194000000000000000';
      return {code:200,data:{balance:r.cid ? balance : '189999984696000000000'}};
    }
    return {code:200,data:{}};
  };
  SASEUL.Rpc.estimatedFee = async () => '600000000000';
  SASEUL.Rpc.sendTransaction = async signed => { window.__qaTransaction = signed.transaction; throw Error('QA fixture: broadcast disabled'); };
  SASEUL.Rpc.broadcastTransaction = async () => { throw Error('QA fixture: broadcast disabled'); };
  window.fetch = async () => ({ok:true,json:async()=>({code:200,data:{}})});
  async function startPreview() {
    applyConfig();
    wallets = [makeWallet('11'.repeat(32), '테스트 지갑', true)];
    activeWalletId = wallets[0].id;
    showWallet();
    if (new URLSearchParams(location.search).get('scenario') === 'unlock') {
      document.getElementById('wallet').classList.add('hidden');
      document.getElementById('onboarding').classList.add('hidden');
      document.getElementById('unlock').classList.remove('hidden');
      document.getElementById('lockBtn').classList.add('hidden');
    }
    document.querySelector('.brand strong').textContent = 'UI TEST · 가상 잔액';
  }
  startPreview();
`;
http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  if (pathname === '/sw.js') { res.writeHead(404).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    if (pathname === '/app.js') {
      let source = data.toString('utf8');
      source = source.slice(0, source.indexOf('  start();')) + fixture + '\n})();';
      data = Buffer.from(source);
    }
    const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
    res.writeHead(200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store'});
    res.end(data);
  });
}).listen(4175, '127.0.0.1', () => console.log('Isolated UI fixture (simulated balances, no broadcast): http://localhost:4175'));
