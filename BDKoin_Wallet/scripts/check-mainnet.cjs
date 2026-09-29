// Read-only integration check. No private keys or signed transactions are used.
const assert = require('node:assert/strict');
const cid = 'fbc5db686a22233f7b2130e73fc48b8bd5eae368098ce0cf7a6d4caecbc7f4a0';
const issuer = 'b3709416c74988580a04f7c993adaa344cca212cacd7';
(async () => {
  const call = async request => {
    const url = new URL('https://main.saseul.net/request');
    url.searchParams.set('request', JSON.stringify(request));
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    assert(response.ok);
    return response.json();
  };
  const [info, balance] = await Promise.all([call({cid,type:'GetInfo'}),call({cid,type:'GetBalance',address:issuer})]);
  assert.equal(info.code,200);assert.equal(info.data.name,'BDKoin');assert.equal(info.data.symbol,'BDK');assert.equal(Number(info.data.decimal),18);
  assert.equal(info.data.total_supply,'2491000000000000000000000000');
  assert.equal(balance.code,200);assert(/^\d+$/.test(balance.data.balance));
  console.log(JSON.stringify({network:'SASEUL mainnet',cid,info:info.data,issuerBalanceBaseUnits:balance.data.balance,readOnly:true},null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
