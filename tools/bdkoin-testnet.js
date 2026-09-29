const fs = require('node:fs');
const path = require('node:path');
const S = require('saseul');
const token = require('../example/token/all');
const config = require('../bdkoin.testnet.json');
const root = path.resolve(__dirname, '..');
const keyFile = path.join(root, 'keypair.json');
const recordFile = path.join(root, 'bdkoin.testnet.deployment.json');
const mode = process.argv[2] || 'verify';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  if (!['prepare', 'deploy', 'verify', 'inspect', 'retry-missing'].includes(mode)) throw new Error('Invalid mode');
  if (config.endpoint !== 'https://test.saseul.net') throw new Error('Only the testnet endpoint is allowed');
  if (!fs.existsSync(keyFile)) {
    if (mode !== 'prepare') throw new Error('Run prepare first');
    fs.writeFileSync(keyFile, JSON.stringify(S.Sign.keyPair(), null, 2), { flag: 'wx', mode: 0o600 });
  }
  const key = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
  if (S.Sign.address(S.Sign.publicKey(key.private_key)) !== key.address) throw new Error('Invalid keypair');
  const cid = S.Enc.cid(key.address, config.space);
  const amount = (BigInt(config.supply) * 10n ** BigInt(config.decimals)).toString();
  const record = fs.existsSync(recordFile) ? JSON.parse(fs.readFileSync(recordFile, 'utf8')) : {
    network: 'testnet', endpoint: config.endpoint, address: key.address, cid,
    space: config.space, name: config.name, symbol: config.symbol,
    supply: config.supply, decimals: config.decimals, baseUnits: amount, transactions: []
  };
  if (record.cid !== cid || record.baseUnits !== amount) throw new Error('Deployment configuration mismatch');
  const save = () => fs.writeFileSync(recordFile, JSON.stringify(record, null, 2) + '\n');
  const contract = new S.SmartContract.Contract(key.address, config.space);
  for (const name of ['mint', 'getInfo', 'send', 'getBalance', 'deposit', 'approve', 'cancel', 'getOrder']) {
    contract.addMethod(token[name](key.address, config.space));
  }
  save();
  console.log(JSON.stringify({ address: key.address, cid, amount, mode }));
  if (mode === 'prepare') return;
  S.Rpc.endpoint(config.endpoint);
  S.Rpc.timeout(15000);
  const request = item => S.Rpc.request(S.Rpc.signedRequest(item, key.private_key));
  if (mode === 'inspect') {
    const node = await S.Rpc.get('info', {});
    console.log('Node', JSON.stringify(node));
    const method = contract.method('Mint');
    const codeResult = await request({ type: 'GetCode', ctype: method.type(), target: method.mid() });
    console.log('Code', JSON.stringify(codeResult));
    console.log('Peers', JSON.stringify(await S.Rpc.get('peer', {})));
    const codes = await request({ type: 'ListCode', count: 100 });
    for (const code of Object.values(codes.data?.contracts || {})) {
      const parsed = JSON.parse(code);
      if (parsed.n === 'Publish') console.log('Publish system code', code);
    }
    console.log('Weight', JSON.stringify(await S.Rpc.post('weight', S.Rpc.signedTransaction({ type: 'Publish', code: method.compile() }, key.private_key))));
    for (const tx of record.transactions) {
      const result = await request({ type: 'GetTransaction', target: tx.hash });
      tx.chainLookup = result;
      if (result.code === 200 && result.data?.transaction) tx.status = 'confirmed';
      console.log(tx.label, JSON.stringify(result));
    }
    record.lastInspection = { at: new Date().toISOString(), node, mintCode: codeResult };
    save();
    return;
  }
  const waitFor = async (label, check) => {
    for (let i = 0; i < 30; i++) {
      if (await check()) return;
      await sleep(2000);
    }
    throw new Error('Confirmation timeout: ' + label + '. Inspect chain state before retrying.');
  };
  const send = async (label, item) => {
    const prior = record.transactions.filter(tx => tx.label === label);
    if (prior.length) {
      if (mode !== 'retry-missing') throw new Error('Prior submission exists for ' + label + '; inspect before resubmitting');
      for (const tx of prior) {
        const lookup = await request({ type: 'GetTransaction', target: tx.hash });
        if (lookup.code !== 200 || !Array.isArray(lookup.data) || lookup.data.length) throw new Error('Cannot establish transaction is absent');
      }
    }
    const signed = S.Rpc.signedTransaction(item, key.private_key);
    const entry = { label, hash: S.Enc.txHash(signed.transaction), submittedAt: new Date().toISOString(), status: 'submitting' };
    record.transactions.push(entry);
    save();
    const result = await S.Rpc.broadcastTransaction(signed);
    entry.response = result;
    entry.status = result.code === 200 ? 'accepted' : 'rejected';
    save();
    console.log(label, JSON.stringify(result));
    if (result.code !== 200) throw new Error('Transaction rejected: ' + label);
  };
  if (mode === 'deploy' || mode === 'retry-missing') {
    const nativeBalance = () => request({ type: 'GetBalance', address: key.address });
    let balance = await nativeBalance();
    console.log('Native balance', JSON.stringify(balance));
    if (balance.code !== 200) throw new Error('Cannot query native balance');
    if (BigInt(balance.data.balance) === 0n) {
      await send('Faucet', { type: 'Faucet' });
      await waitFor('Faucet', async () => { const r = await nativeBalance(); return r.code === 200 && BigInt(r.data.balance) > 0n; });
    }
    for (const name of Object.keys(contract.methods())) {
      const method = contract.method(name);
      const hasCode = async () => {
        const r = await request({ type: 'GetCode', ctype: method.type(), target: method.mid() });
        return r.code === 200 && r.data && Object.values(r.data).some(value => value !== null);
      };
      if (!await hasCode()) {
        await send('Publish:' + name, { type: 'Publish', code: method.compile() });
        await waitFor(name, hasCode);
      }
      console.log('Confirmed method', name);
    }
    const info = await request({ cid, type: 'GetInfo' });
    if (info.code !== 200) {
      await send('Mint', { cid, type: 'Mint', name: config.name, symbol: config.symbol, amount, decimal: config.decimals });
      await waitFor('Mint', async () => (await request({ cid, type: 'GetInfo' })).code === 200);
    }
  }
  const info = await request({ cid, type: 'GetInfo' });
  const balance = await request({ cid, type: 'GetBalance', address: key.address });
  console.log('Token info', JSON.stringify(info));
  console.log('Token balance', JSON.stringify(balance));
  if (info.code !== 200 || info.data.name !== config.name || info.data.symbol !== config.symbol ||
      String(info.data.total_supply) !== amount || Number(info.data.decimal) !== config.decimals ||
      balance.code !== 200 || String(balance.data.balance) !== amount) throw new Error('On-chain verification failed');
  record.verifiedAt = new Date().toISOString();
  record.info = info.data;
  record.balance = balance.data.balance;
  save();
  console.log('VERIFIED');
}
main().catch(error => { console.error(error.message || 'RPC failed'); process.exitCode = 1; });
