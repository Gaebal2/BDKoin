# BDKoin mainnet deployment

Verified on 2026-09-29 against https://main.saseul.net and https://sub.saseul.net.

| Field | Value |
| --- | --- |
| Network | SASEUL mainnet |
| Name / symbol | BDKoin / BDK |
| Total supply | 2,491,000,000 BDK |
| Decimals | 18 |
| Base-unit supply | 2491000000000000000000000000 |
| Space | BDKOIN_PEACE_NETWORK |
| Issuer and initial holder | b3709416c74988580a04f7c993adaa344cca212cacd7 |
| CID | fbc5db686a22233f7b2130e73fc48b8bd5eae368098ce0cf7a6d4caecbc7f4a0 |
| Mint transaction | 065c958f2ee2a8521efe9086885875461fc92f651aa9972ce2e94204181bb98b930b04915f009e |

All eight methods (Mint, GetInfo, Send, GetBalance, Deposit, Approve, Cancel, GetOrder) and the mint transaction were confirmed. Both nodes returned the configured token information and the full supply as the issuer balance.

Initial native balance: 17,000 SL. Final native balance: 189.999984696 SL. Balance decrease across deployment and mint: 16,810.000015304 SL.

Configuration: `bdkoin.mainnet.json`. Full public transaction records and verification results: `bdkoin.mainnet.deployment.json`.

Read-only verification:

```powershell
node tools/bdkoin-mainnet.js verify
```

The current Mint method permits issuance only once. Methods use version 1 and remain upgradeable by the issuer; this is not an immutable supply guarantee against future contract upgrades.

The issuer private key is in the Git-ignored local `keypair.json`. Keep a secure backup and never place this file in a PWA bundle or public repository. The older sample scripts still use their original sample space and network configuration; use the dedicated mainnet script and configuration for BDKoin.
