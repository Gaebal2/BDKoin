const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../pwa/app.js'), 'utf8');
const context = vm.createContext({ Intl });
for (const name of ['formatUnits', 'formatDisplayUnits', 'parseUnits', 'parseTokenUnits', 'isInvalidBdkTransferAmount', 'verifiedBdkInfo']) {
  const start = source.indexOf(`  function ${name}(`);
  assert(start >= 0);
  const end = source.indexOf('\n  }', start) + 4;
  vm.runInContext(source.slice(start, end), context);
}
const supply = '2491000000000000000000000000';
assert.equal(context.parseTokenUnits(supply, 18), supply, 'RPC base units must never be scaled a second time');
assert.equal(context.formatDisplayUnits(supply, 18), '2,491,000,000');
assert.equal(context.parseUnits('2,491.194', 18), '2491194000000000000000');
assert.equal(context.formatDisplayUnits('2491194000000000000000', 18), '2,491.194');
assert.equal(context.parseUnits('0.000000000000000001', 18), '1');
assert.equal(context.parseUnits('2,491,000,000', 18), supply);
for (const value of ['0', '-1', 'NaN', '1e18', '0.0000000000000000001', '1.1234567890123456789']) assert(context.isInvalidBdkTransferAmount(value), value);
for (const value of ['0.000000000000000001', '0.5', '1', '2,491.194', '2491000000']) assert.equal(context.isInvalidBdkTransferAmount(value), false, value);
assert.throws(() => context.parseTokenUnits('1.5', 18));
assert.throws(() => context.verifiedBdkInfo({ name: 'PSL', symbol: 'PSL', decimal: 18 }));
assert.throws(() => context.verifiedBdkInfo({ name: 'BDKoin', symbol: 'BDK', decimal: 0 }));
assert.equal(context.verifiedBdkInfo({ name: 'BDKoin', symbol: 'BDK', decimal: 18 }).decimal, 18);
assert(source.includes('const transactionAmount = amount;'), 'Send must retain base units');
assert(!source.includes("formatUnits(rawBalance, token.decimal).split('.')[0]"), 'Max must retain fractional balances');
console.log('✓ BDK supply, 18-decimal amounts, minimum unit, full balance, and contract identity verified');
