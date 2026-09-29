const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../pwa/app.js'), 'utf8');
function extract(name) {
  const start = source.search(new RegExp('  (?:async )?function '+name+'\\('));
  assert(start >= 0, name);
  return source.slice(start, source.indexOf('\n  }', start) + 4);
}
function installHarness(agent, standalone = false) {
  const elements = {};
  const events = {};
  const storage = new Map();
  const context = vm.createContext({
    navigator: { userAgent: agent, maxTouchPoints: 5 },
    URL, location: { href: 'https://wallet.example/pwa/' },
    window: { navigator: {}, matchMedia: () => ({ matches: standalone }), addEventListener: (name, fn) => events[name] = fn },
    document: { querySelector: () => null, addEventListener() {} },
    sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    installedThisSession: false, deferredInstallPrompt: null,
    setTimeout: fn => fn(), toast() {},
    $: id => elements[id] ||= { open: false, classList: { toggle() {}, remove() {} }, showModal() { this.open = true; }, close() { this.open = false; }, addEventListener(name, fn) { this[name] = fn; } }
  });
  vm.runInContext(source.slice(source.indexOf('  function isStandalone()'), source.indexOf("  document.querySelectorAll('[data-password-toggle]')")), context);
  return { context, elements, events };
}
(async () => {
  for (const agent of ['iPhone', 'iPad', 'Macintosh', 'Android']) {
    const h = installHarness(agent);
    await h.context.showInstallDialog();
    assert(h.elements.installDialog.open, agent + ' gets startup guidance without an install event');
    h.elements.installLaterBtn.onclick();
    await h.context.showInstallDialog();
    assert(!h.elements.installDialog.open, 'Dismissal lasts for this session');
  }
  const installed = installHarness('iPhone', true);
  await installed.context.showInstallDialog();
  assert(!installed.elements.installDialog.open);
  const desktop = installHarness('Windows');
  await desktop.context.showInstallDialog();
  assert(!desktop.elements.installDialog.open);
  const related = installHarness('Android');
  related.context.navigator.getInstalledRelatedApps = async () => [{platform:'webapp',url:'./manifest.webmanifest'}];
  await related.context.showInstallDialog();
  assert(!related.elements.installDialog.open, 'Installed PWA detected from a browser tab');
  related.context.navigator.getInstalledRelatedApps = async () => {throw Error('unsupported');};
  await related.context.showInstallDialog();
  assert(related.elements.installDialog.open, 'Detection failure still allows guidance');
  const android = installHarness('Android');
  let prompts = 0;
  android.events.beforeinstallprompt({ preventDefault() {}, prompt: async () => prompts++, userChoice: Promise.resolve({ outcome: 'accepted' }) });
  await android.elements.installBtn.onclick();
  assert.equal(prompts, 1);
  assert(!android.elements.installDialog.open);
  const c = vm.createContext({});
  vm.runInContext(extract('verifiedBdkInfo'), c);
  assert.equal(c.verifiedBdkInfo({symbol:'PSL', decimal:18}, 'PSL').symbol, 'PSL');
  assert.equal(c.verifiedBdkInfo({symbol:'PSL', decimal:6}, 'PSL').decimal, 6);
  assert.throws(() => c.verifiedBdkInfo({symbol:'BDK', decimal:18}, 'PSL'));
  assert.throws(() => c.verifiedBdkInfo({symbol:'PSL', decimal:-1}, 'PSL'));
  const elements = {};
  let saved, refreshes = 0;
  const switcher = vm.createContext({
    TOKEN_CIDS: {BDK:'bdk', PSL:'psl'}, config:{cid:'bdk'}, token:{symbol:'BDK',decimal:18},
    tokenRevision:0, transferInFlight:false, walletBalances:new Map([['wallet', {bdk:'123'}]]),
    historyRequestId:0, historyLoading:true, historyPage:2, activeWalletId:'wallet', privateKey:'test', CONFIG_KEY:'config',
    localStorage:{setItem:(key,value)=>saved=JSON.parse(value)},
    $:id=>elements[id] ||= {replaceChildren(){}, open:false},
    selectAsset(){}, applyConfig(){}, updateActiveBalances(){}, balanceState(){return {};}, renderWalletList(){}, refresh(){refreshes++;}, toast(){}
  });
  vm.runInContext(extract('selectToken'), switcher);
  switcher.selectToken('PSL');
  assert.equal(saved.cid, 'psl');
  assert.equal(switcher.token.symbol, 'PSL');
  assert.equal(switcher.walletBalances.size, 0);
  assert.equal(switcher.historyRequestId, 1);
  assert.equal(refreshes, 1);
  switcher.transferInFlight = true;
  switcher.selectToken('BDK');
  assert.equal(switcher.config.cid, 'psl', 'Token cannot change during transfer approval or submission');
  const stale = vm.createContext({
    tokenRevision:0, token:{symbol:'BDK',decimal:18}, walletAddress:()=> 'address', contractId:()=> 'bdk',
    SASEUL:{Rpc:{signedRequest:x=>x}},
    walletBalances:new Map()
  });
  vm.runInContext(extract('fetchWalletBalance'), stale);
  // Use one deferred RPC promise for all requests.
  let resolveRpc;
  const rpc = new Promise(resolve => resolveRpc=resolve);
  stale.SASEUL.Rpc.request=()=>rpc;
  const pending=stale.fetchWalletBalance({id:'wallet'});
  stale.tokenRevision++;
  resolveRpc({code:200,data:{balance:'123',symbol:'BDK',decimal:18}});
  assert.equal(await pending, false);
  assert.equal(stale.walletBalances.size,0,'Old CID responses cannot populate new token balances');
  function settingsHarness() {
    const elements = {};
    const events = {};
    const alerts = [];
    let backCount = 0;
    const settings = vm.createContext({
      config: {cid:'bdk',endpoint:'https://example.com'}, token:{symbol:'BDK'},
      history: {state:null, pushState(state) { this.state=state; }, back() { backCount++; this.state=null; events.popstate(); }},
      window:{addEventListener:(name,fn)=>events[name]=fn},
      $:id=>elements[id] ||= {open:false,showModal(){this.open=true;},close(){this.open=false;},addEventListener(name,fn){this[name]=fn;}},
      showAlert:message=>alerts.push(message)
    });
    vm.runInContext(source.slice(source.indexOf('  let settingsEntryCid = null;'),source.indexOf("  $('uninstallGuideBtn').onclick")),settings);
    return {settings,elements,events,alerts,get backCount(){return backCount;}};
  }
  for(const method of ['x','back','cancel']) {
    const h=settingsHarness();
    h.elements.settingsBtn.onclick();
    h.settings.config.cid='psl'; h.settings.token.symbol='PSL';
    if(method==='x') h.elements.settingsClose.onclick();
    if(method==='back') h.settings.history.back();
    if(method==='cancel') h.elements.settingsDialog.cancel({preventDefault(){}});
    assert.deepEqual(h.alerts,['PSL토큰 지갑 모드입니다.'],method+' shows the selected mode exactly once');
    assert.equal(h.elements.settingsDialog.open,false);
    assert.equal(h.backCount,1);
  }
  const unchanged=settingsHarness();
  unchanged.elements.settingsBtn.onclick();
  unchanged.elements.settingsClose.onclick();
  assert.equal(unchanged.alerts.length,0,'Closing unchanged settings is silent');
  const returned=settingsHarness();
  returned.elements.settingsBtn.onclick();
  returned.settings.config.cid='psl'; returned.settings.config.cid='bdk';
  returned.elements.settingsClose.onclick();
  assert.equal(returned.alerts.length,0,'Returning to the original token is silent');
  vm.runInContext(extract('historyTokenIcon'),c);
  for (const symbol of ['BDK','PSL','SL']) assert(fs.existsSync(require('node:path').join(__dirname,'../pwa',c.historyTokenIcon(symbol))));
  const html=fs.readFileSync(require.resolve('../pwa/index.html'),'utf8');
  assert(!html.includes('bdk-history-icon.png'),'New BDK image is limited to dynamically rendered history');
  console.log('✓ Mobile install guidance, native install, token selection, metadata and stale-response isolation passed');
  console.log('✓ Settings X, back and cancel mode notices, unchanged selection, and token icon assets passed');
})().catch(error => {console.error(error);process.exitCode=1;});
