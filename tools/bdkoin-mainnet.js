const fs = require('node:fs');
const path = require('node:path');
const S = require('saseul');
const token = require('../example/token/all');
const config = require('../bdkoin.mainnet.json');
const root = path.resolve(__dirname, '..');
const reportFile = path.join(root, 'bdkoin.mainnet.preflight.json');

async function main() {
  const mode = process.argv[2] || 'preflight';
  if (!['preflight', 'deploy', 'verify'].includes(mode)) throw new Error('Invalid mode');
  if (config.endpoint !== 'https://main.saseul.net') throw new Error('Unexpected endpoint');
  const key = JSON.parse(fs.readFileSync(path.join(root, 'keypair.json'), 'utf8'));
  if (S.Sign.address(S.Sign.publicKey(key.private_key)) !== config.address || key.address !== config.address) throw new Error('Issuer mismatch');
  S.Rpc.endpoint(config.endpoint);
  S.Rpc.timeout(15000);
  const request = item => S.Rpc.request(S.Rpc.signedRequest(item, key.private_key));
  const cid = S.Enc.cid(config.address, config.space);
  const amount = (BigInt(config.supply) * 10n ** BigInt(config.decimals)).toString();
  const report = { at: new Date().toISOString(), network: 'mainnet', config, cid, amount, methods: [] };
  const save = () => { if (mode !== 'verify') fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n'); };
  report.node = await S.Rpc.get('info', {});
  report.balance = await request({ type: 'GetBalance', address: config.address });
  console.log('Node', JSON.stringify(report.node));
  console.log('Balance', JSON.stringify(report.balance));
  save();
  const contract = new S.SmartContract.Contract(config.address, config.space);
  for (const name of ['mint', 'getInfo', 'send', 'getBalance', 'deposit', 'approve', 'cancel', 'getOrder']) {
    contract.addMethod(token[name](config.address, config.space));
  }
  const deploymentFile = path.join(root, 'bdkoin.mainnet.deployment.json');
  const deployment = fs.existsSync(deploymentFile) ? JSON.parse(fs.readFileSync(deploymentFile, 'utf8')) : {
    network: 'mainnet', config, cid, amount, transactions: []
  };
  if (JSON.stringify(deployment.config) !== JSON.stringify(config) || deployment.cid !== cid || deployment.amount !== amount) throw new Error('Deployment configuration mismatch');
  const saveDeployment = () => fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2) + '\n');
  const expectedInfo = info => info?.name === config.name && info?.symbol === config.symbol &&
    String(info.total_supply) === amount && Number(info.decimal) === config.decimals;
  const verify = async () => {
    const info = await request({ cid, type: 'GetInfo' });
    const balance = await request({ cid, type: 'GetBalance', address: config.address });
    console.log('Token info', JSON.stringify(info));
    console.log('Token balance', JSON.stringify(balance));
    if (info.code !== 200 || !expectedInfo(info.data) || balance.code !== 200 || String(balance.data.balance) !== amount) throw new Error('Token verification failed');
    S.Rpc.endpoint('https://sub.saseul.net');
    try {
      const secondaryInfo = await request({ cid, type: 'GetInfo' });
      const secondaryBalance = await request({ cid, type: 'GetBalance', address: config.address });
      if (secondaryInfo.code !== 200 || !expectedInfo(secondaryInfo.data) || secondaryBalance.code !== 200 || String(secondaryBalance.data.balance) !== amount) throw new Error('Secondary node verification failed');
      deployment.secondaryVerification = { endpoint: 'https://sub.saseul.net', at: new Date().toISOString(), info: secondaryInfo.data, balance: secondaryBalance.data.balance };
    } finally { S.Rpc.endpoint(config.endpoint); }
    deployment.verifiedAt = new Date().toISOString();
    deployment.info = info.data;
    deployment.balance = balance.data.balance;
    deployment.nativeBalance = await request({ type: 'GetBalance', address: config.address });
    saveDeployment();
    console.log('VERIFIED', cid);
  };
  if (mode === 'verify') { await verify(); return; }
  let totalFee = 0n;
  for (const name of Object.keys(contract.methods())) {
    const method = contract.method(name);
    const code = await request({ type: 'GetCode', ctype: method.type(), target: method.mid() });
    const signed = S.Rpc.signedTransaction({ type: 'Publish', code: method.compile() }, key.private_key);
    const weight = await S.Rpc.post('weight', signed);
    let fee = null;
    if (weight.code === 200 && /^\d+$/.test(String(weight.data))) {
      const length = BigInt(JSON.stringify(signed).length);
      const value = BigInt(weight.data);
      fee = ((value === length ? length + 336n : value) * 1000000000n).toString();
      totalFee += BigInt(fee);
    }
    const entry = { name, mid: method.mid(), code, weight, estimatedFeeBaseUnits: fee };
    report.methods.push(entry);
    console.log('Method', JSON.stringify(entry));
    save();
  }
  report.estimatedPublishFeeBaseUnits = totalFee.toString();
  report.tokenInfo = await request({ cid, type: 'GetInfo' });
  report.sufficientForPublish = report.balance.code === 200 && BigInt(report.balance.data.balance) >= totalFee && report.methods.every(m => m.estimatedFeeBaseUnits !== null);
  save();
  console.log('Summary', JSON.stringify({ cid, totalFee: totalFee.toString(), sufficientForPublish: report.sufficientForPublish, tokenInfo: report.tokenInfo }));
  if (mode === 'preflight') return;
  if (!report.sufficientForPublish && !deployment.transactions.length) throw new Error('Insufficient balance for deployment');
  const containsCode = (value, expected) => {
    if (typeof value === 'string') {
      try { return JSON.stringify(JSON.parse(value)) === JSON.stringify(JSON.parse(expected)); } catch { return false; }
    }
    if (value && typeof value === 'object') {
      if (JSON.stringify(value) === JSON.stringify(JSON.parse(expected))) return true;
      return Object.values(value).some(v => containsCode(v, expected));
    }
    return false;
  };
  const confirmedCode = async method => {
    const result = await request({ type: 'GetCode', ctype: method.type(), target: method.mid() });
    if (result.code !== 200) {
      if (result.code === 999 && result.msg === '') return false;
      throw new Error('Unexpected code lookup: ' + JSON.stringify(result));
    }
    if (containsCode(result.data, method.compile())) return true;
    throw new Error('Existing method does not match expected code: ' + method.name());
  };
  const submit = async (label, item, check) => {
    let entry = deployment.transactions.find(tx => tx.label === label);
    if (!entry) {
      const signed = S.Rpc.signedTransaction(item, key.private_key);
      const weight = await S.Rpc.post('weight', signed);
      if (weight.code !== 200 || !/^\d+$/.test(String(weight.data))) throw new Error('Fee validation failed: ' + JSON.stringify(weight));
      const length = BigInt(JSON.stringify(signed).length);
      const value = BigInt(weight.data);
      const fee = (value === length ? length + 336n : value) * 1000000000n;
      const balance = await request({ type: 'GetBalance', address: config.address });
      if (balance.code !== 200 || BigInt(balance.data.balance) < fee) throw new Error('Insufficient balance for ' + label + ', estimated base-unit fee: ' + fee);
      entry = { label, hash: S.Enc.txHash(signed.transaction), signed, estimatedFeeBaseUnits: fee.toString(), status: 'submitting', submittedAt: new Date().toISOString() };
      deployment.transactions.push(entry);
      saveDeployment();
      entry.response = await S.Rpc.sendTransaction(signed);
      entry.status = entry.response.code === 200 ? 'accepted' : 'rejected';
      saveDeployment();
      console.log(label, JSON.stringify(entry.response));
      if (entry.response.code !== 200) throw new Error('Rejected transaction: ' + label);
    }
    for (let attempt = 0; attempt < 60; attempt++) {
      const lookup = await request({ type: 'GetTransaction', target: entry.hash });
      if (lookup.code === 200 && lookup.data?.transaction && S.Enc.txHash(lookup.data.transaction) === entry.hash && await check()) {
        entry.status = 'confirmed';
        entry.confirmedAt = new Date().toISOString();
        saveDeployment();
        console.log('Confirmed', label, entry.hash);
        return;
      }
      if (attempt % 10 === 0) console.log('Waiting for confirmation', label);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error('Confirmation timeout for ' + label + '; saved submission will not be automatically repeated');
  };
  for (const name of Object.keys(contract.methods())) {
    const method = contract.method(name);
    if (!await confirmedCode(method)) await submit('Publish:' + name, { type: 'Publish', code: method.compile() }, () => confirmedCode(method));
  }
  const current = await request({ cid, type: 'GetInfo' });
  if (current.code === 200) {
    if (!expectedInfo(current.data)) throw new Error('Existing token does not match configuration');
  } else {
    if (current.code !== 999 || current.msg !== 'The token has not been issued yet.') throw new Error('Unexpected token lookup: ' + JSON.stringify(current));
    await submit('Mint', { cid, type: 'Mint', name: config.name, symbol: config.symbol, amount, decimal: config.decimals }, async () => {
      const info = await request({ cid, type: 'GetInfo' });
      return info.code === 200 && expectedInfo(info.data);
    });
  }
  await verify();
}
main().catch(error => { console.error(error.message || error.msg || 'RPC failed'); process.exitCode = 1; });
