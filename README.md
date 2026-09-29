# BDKoin 통합 프로젝트

SASEUL 메인넷의 BDK 토큰, BDK 전용 PWA 지갑, BDK 연동 게임을 하나의 저장소에서 관리합니다.

| 구성 | 소스 폴더 | 서비스 주소 |
| --- | --- | --- |
| BDKoin 지갑 | [BDKoin_Wallet](./BDKoin_Wallet/) | https://gaebal2.github.io/BDKoin_Wallet/ |
| BDKoin 게임 | [BDKoin_Game](./BDKoin_Game/) | https://gaebal2.github.io/BDKoin_Game/ |

게임은 현재 준비 중 페이지이며, 이후 같은 `BDKoin_Game/` 폴더에서 개발합니다.

두 서비스의 원본 소스는 모두 **이 저장소**에 있습니다. `Gaebal2/gaebal2.github.io`는 요청한 서비스 주소를 제공하는 정적 파일 배포용 저장소입니다. 개발 프로젝트를 나눈 것이 아닙니다. 배포 절차는 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참고하세요.

토큰 발행 정보는 [BDKOIN-MAINNET.md](./BDKOIN-MAINNET.md), 지갑 실행 및 테스트 방법은 [지갑 README](./BDKoin_Wallet/README.md)에 있습니다.

## 기반 SASEUL 샘플 계약 안내

아래는 프로젝트의 기반이 된 SASEUL 샘플 계약 사용 설명입니다.

Here is a sample contract that can be used on the SASEUL Network.

This sample contract utilizes [SASEUL JS](https://www.npmjs.com/package/saseul).

With SASEUL JS, you can broadcast transactions to the network without installing a SASEUL node.

For more information on SASEUL JS, please refer to the [Documentation](https://docs.saseul.com/)!

Alternatively, if you wish to install a SASEUL node, follow the installation instructions for [SASEUL Docker](https://hub.docker.com/r/artifriends/saseul-network).

## Overview

The following is the process for deploying a contract on the SASEUL Network:

1. Write the contract according to the established rules.
2. Generate a Publish transaction with the written code.
3. Broadcast the Publish transaction.

The [Publish](https://github.com/saseul/sample-contracts/blob/master/system/main-net/publish.js) method for deploying contracts is also written as a contract.

## Tools

Understanding the process of deploying contracts on the SASEUL Network can be facilitated with the help of some tools.

[Node.js](https://nodejs.org/) must be installed for these tools to run.

Please follow the installation guide on the official [Node.js](https://nodejs.org/) website.

The execution results of the scripts can be verified on the [Test-net block explorer](https://explorer.saseul.com/test-net.html).

### Usage

```shell
$ npm install

$ node ./tools/generate-keypair
$ node ./tools/faucet

$ node ./tools/publish-token-contracts
$ node ./tools/token-mint

Please enter the token name.
<token name>
Please enter the token symbol.
<token symbol>
Please enter the amount of tokens to be issued.
<amount>
Please enter the number of decimal places for the token.
<decimal (If no decimals, enter 0.)>
```

You can check the issued contract on the [test-net block explorer.](https://explorer.saseul.com/test-net.html?ic=ct&ia=list)

If fewer than 8 methods have been deployed, please run 'publish-token-contracts' again.

To check your balance after running the faucet, use the 'get-balance' script.

```shell
$ node ./tools/get-balance
```

To check the information and balance of issued tokens, use the 'token-get-info' and 'token-get-balance' scripts.

```shell
$ node ./tools/token-get-info
$ node ./tools/token-get-balance
```

If you want to send tokens to another person, use the 'token-send' script.

```shell
$ node ./tools/token-send

Please enter the address to send the token to.
<to address>
How much would you like to send?
<amount>

$ node ./tools/token-get-balance
```

You can import a previously used key pair using the 'import-keypair' script.

Additionally, you can view information about the currently set key pair using the 'display-keypair' script.

```shell
$ node ./tools/import-keypair

Please enter the private key to import. 
<private_key>

$ node ./tools/display-keypair
```

You can view information of other token issuance contracts using the 'cid-token-get-info' script.

```shell
$ node ./tools/cid-token-get-info

Please enter the cid.
<cid>
```

Each script refers to the saseul.ini file, and the default setting is saseul.ini-test.
