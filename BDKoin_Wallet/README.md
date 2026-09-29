# BDKoin Wallet

SASEUL 메인넷 **BDKoin (BDK)** 전용 PWA 지갑입니다. `C:\workspace\PSL_Wallet`의 소스와 기능을 복사한 뒤 BDK 컨트랙트, 검정·골드 디자인, 하단 탭 UX를 적용했습니다. PSL 원본은 수정하지 않았습니다.

## 실행

```powershell
cd C:\workspace\BDKoin\BDKoin_Wallet
npm.cmd start
```

**http://localhost:4174** — 원본 PSL 지갑의 4173 포트와 분리했습니다. 빌드 없이 실행되며 브라우저 라이브러리는 `pwa/vendor/`에 포함되어 있습니다. Node.js 24에서 검증했습니다.

## 토큰

| 항목 | 값 |
| --- | --- |
| 네트워크 / RPC | SASEUL 메인넷 / https://main.saseul.net |
| 토큰 / 소수점 | BDKoin / BDK / 18자리 |
| 총발행량 | 2,491,000,000 BDK |
| 스페이스 | BDKOIN_PEACE_NETWORK |
| 발행자 | b3709416c74988580a04f7c993adaa344cca212cacd7 |
| CID | fbc5db686a22233f7b2130e73fc48b8bd5eae368098ce0cf7a6d4caecbc7f4a0 |

발행자 개인키는 앱에 포함하지 않았습니다. 새 지갑 생성 또는 개인키/암호화 백업 가져오기로 사용자의 지갑을 연결합니다. 홈 화면 금액은 선택한 지갑을 조회한 결과입니다.

## 기능

- **자산**: 정확한 BDK 잔액, 다중 지갑 선택·추가·이름 변경·삭제, 당겨서 새로고침.
- **전송**: 소수점 18자리, 최대 금액, 주소·잔액·SL 수수료 검증, 전송 확인, 중복 방지와 동일 해시 재전파.
- **수신**: 주소, QR 코드, 주소 복사.
- **거래**: BDK·SL 송수신 내역, 페이지 이동, 수수료 및 탐색기 링크.
- **설정**: HTTPS RPC 설정, 고정 BDK CID, 앱 제거·저장소 안내.
- **수수료 자산 관리**: SL 잔액과 SL 송수신을 접이식 영역에서 제공.
- **보관**: PBKDF2-SHA256 310,000회 + AES-256-GCM, localStorage/IndexedDB 암호화 저장, 5분 자동 잠금.
- **백업**: 암호화 파일 저장·검증·복원·업데이트, 기존 PSL 백업 호환. 원본의 백업 확인 후 사용 절차 유지.
- **PWA**: 설치, 오프라인 앱 셸, 작업 중 업데이트 보류, 한·영 전환.

BDK 계약의 잔액·전송 수량은 정수 최소 단위입니다. `0.194 BDK`는 트랜잭션에서 `194000000000000000`으로 변환합니다. 원본 PSL의 정수 전용 송금 제약과 표시 단위 전송 방식을 변경했습니다.

## 검증

```powershell
npm.cmd test
node scripts/check-mainnet.cjs
```

파일·참조·CSP, 최소 단위·총발행량·소수점, 백업 암호화·변조·잘못된 비밀번호·구형 형식, 번역, PWA 업데이트를 검증합니다. `check-mainnet.cjs`는 개인키 없이 메인넷 정보를 읽습니다.

브라우저에서 모바일 320px/390px와 데스크톱, 최대 금액, 전송 검토, QR 수신, 지갑 관리, 거래·설정 탭, 한·영 전환을 확인했습니다. 실제 자금 전송은 테스트하지 않았습니다.

### 격리된 UI 테스트

```powershell
node scripts/preview-server.cjs
```

`http://localhost:4175`는 가상 잔액과 일회용 테스트 키를 사용하며 트랜잭션 전파가 차단됩니다. `?scenario=supply`, `?scenario=dust`, `?scenario=offline`으로 큰 잔액·최소 단위·조회 실패를 확인할 수 있습니다. 실제 PWA에 포함되지 않는 개발용 서버입니다.

## 배포

운영 주소는 **https://gaebal2.github.io/BDKoin/BDKoin_Wallet/** 입니다. 소스와 배포 설정은 모두 `Gaebal2/BDKoin`에서 관리합니다. 상위 폴더의 `DEPLOYMENT.md`를 참고하세요. `pwa/server.js`와 개인키는 사이트에 포함하지 않습니다. 실제 배포 설정은 루트 `.github/workflows/deploy-pages.yml`입니다.

로고 재현·설치 아이콘과 생성 프롬프트는 [BRAND-ASSETS.md](BRAND-ASSETS.md)에 기록했습니다. 테마는 `pwa/bdk-theme.css`입니다. 기존 샘플 컨트랙트와 CLI 도구는 복사본으로 보존했으며 지갑 UI와 별개입니다.
