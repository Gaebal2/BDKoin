# BDKoin testnet

Configuration: `bdkoin.testnet.json`.

- Name: BDKoin
- Symbol: BDK
- Supply: 2,491,000,000 BDK
- Decimals: 18
- Base units: 2491000000000000000000000000
- Space: BDKOIN_PEACE_NETWORK

The issuer key is stored in `keypair.json`, excluded from Git. Back up this file securely; do not share or commit it. The generated account is for testnet use.

Public account identifiers, transaction submissions and verification results are in `bdkoin.testnet.deployment.json`. An accepted submission is not proof of confirmation. Only `verifiedAt` with matching token information and issuer balance indicates successful issuance.

```powershell
node tools/bdkoin-testnet.js inspect
node tools/bdkoin-testnet.js deploy
node tools/bdkoin-testnet.js verify
```

The script checks existing methods before publishing and checks token information before minting. If a prior submission is still missing, normal deployment stops. After inspecting the chain, `retry-missing` explicitly allows a fresh submission only when previous transaction lookups return no transaction. Pending submissions can still be included later; contract version and one-time mint checks prevent duplicate successful issuance.

The initial Faucet transaction was confirmed. Publish submissions were accepted but were not yet found in chain lookups during execution. Token minting has not been performed. Recheck the recorded transactions before resuming.
